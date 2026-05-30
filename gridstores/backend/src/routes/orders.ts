import { Router } from "express";
import { body, param, query } from "express-validator";
import { Types } from "mongoose";
import { verifyToken } from "../middleware/auth";
import { validateRequest } from "../middleware/errorHandler";
import { isAdmin } from "../middleware/isAdmin";
import { Coupon } from "../models/Coupon";
import { Order, OrderStatus } from "../models/Order";
import { Product } from "../models/Product";
import { sendEmail } from "../utils/email";
import { sendError, sendSuccess } from "../utils/response";
import { calculateDiscount } from "./coupons";

export const ordersRouter = Router();

const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

// POST /orders — create order (accepts both shippingAddress and address fields)
ordersRouter.post(
  "/",
  verifyToken,
  [
    body("items").isArray({ min: 1 }),
    body("items.*.product").isMongoId(),
    body("items.*.quantity").isInt({ min: 1 }),
    body("paymentMethod").isIn(["razorpay", "cod"]),
    body("couponCode").optional().isString(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const ids = req.body.items.map((item: { product: string }) => item.product);
      const products = await Product.find({ _id: { $in: ids }, isActive: true });

      const orderItems = req.body.items.map(
        (item: { product: string; quantity: number; color?: string; name?: string; price?: number; image?: string }) => {
          const product = products.find((p) => p.id === item.product);
          if (!product) throw new Error(`Product ${item.product} not found`);
          if (product.stock < item.quantity) throw new Error(`${product.name} has insufficient stock`);
          return {
            product: product._id,
            name: product.name,
            image: product.images[0]?.url ?? "",
            price: product.price,
            quantity: item.quantity,
            color: item.color,
          };
        }
      );

      const subtotal = orderItems.reduce(
        (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
        0
      );

      let discount = 0;
      let couponCode: string | undefined;
      if (req.body.couponCode) {
        const coupon = await Coupon.findOne({
          code: String(req.body.couponCode).toUpperCase(),
          isActive: true,
        });
        if (
          coupon &&
          coupon.expiresAt > new Date() &&
          coupon.usedCount < coupon.maxUses &&
          subtotal >= coupon.minOrder
        ) {
          discount = calculateDiscount(coupon, subtotal);
          couponCode = coupon.code;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }

      const shippingFee = subtotal - discount >= 999 ? 0 : 99;

      // Accept both `address` (from checkout) and `shippingAddress` (legacy)
      const rawAddr = req.body.address ?? req.body.shippingAddress ?? {};

      // Normalise into the DB schema shape
      const shippingAddress = {
        fullName: rawAddr.name ?? rawAddr.fullName ?? "",
        phone: rawAddr.phone ?? "",
        line1: rawAddr.line ?? rawAddr.line1 ?? "",
        city: rawAddr.city ?? "",
        state: rawAddr.state ?? "",
        pincode: rawAddr.pin ?? rawAddr.pincode ?? "",
        country: "India",
      };

      const order = await Order.create({
        orderNumber: `GS-${Date.now()}`,
        user: req.user?.id,
        items: orderItems,
        shippingAddress,
        subtotal,
        discount,
        shippingFee,
        total: subtotal - discount + shippingFee,
        couponCode,
        paymentMethod: req.body.paymentMethod,
        paymentStatus: "pending",
        paymentId: req.body.paymentId,
        razorpayOrderId: req.body.razorpayOrderId,
        status: req.body.paymentMethod === "razorpay" ? "pending" : "pending",
        statusHistory: [{ status: "pending", date: new Date(), note: "Order placed" }],
      });

      // Deduct stock
      await Promise.all(
        orderItems.map((item: { product: Types.ObjectId; quantity: number }) =>
          Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity, soldCount: item.quantity },
          })
        )
      );

      // Confirmation email
      const emailHtml = `
        <h2>Order Confirmed — Grid Stores</h2>
        <p>Hi, your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
        <p>Total: <strong>₹${order.total.toLocaleString("en-IN")}</strong></p>
        <p>Payment: ${req.body.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
        <p>Track your order at <a href="${process.env.CLIENT_URL}/account">My Orders</a></p>
      `;
      await sendEmail(
        req.user?.email ?? "",
        `Your Grid Stores Order #${order.orderNumber} is Confirmed`,
        emailHtml
      ).catch(() => {}); // don't block on email failure

      return sendSuccess(res, order, "Order created", 201);
    } catch (error) {
      return next(error);
    }
  }
);

// GET /orders/my — current user's orders
ordersRouter.get("/my", verifyToken, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user?.id }).sort({ createdAt: -1 });
    return sendSuccess(res, orders, "Orders fetched");
  } catch (error) {
    return next(error);
  }
});

// GET /orders/number/:orderNumber — fetch by human-readable order number (for confirmation page)
ordersRouter.get("/number/:orderNumber", verifyToken, async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) return sendError(res, "Order not found", 404);
    if (
      req.user?.role !== "admin" &&
      order.user?.toString() !== req.user?.id
    ) {
      return sendError(res, "Access denied", 403);
    }
    return sendSuccess(res, order, "Order fetched");
  } catch (error) {
    return next(error);
  }
});

// GET /orders — admin list with filters + pagination
ordersRouter.get(
  "/",
  verifyToken,
  isAdmin,
  [query("page").optional().isInt({ min: 1 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const filter: Record<string, unknown> = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.from || req.query.to) {
        filter.createdAt = {
          ...(req.query.from ? { $gte: new Date(String(req.query.from)) } : {}),
          ...(req.query.to ? { $lte: new Date(String(req.query.to)) } : {}),
        };
      }
      if (req.query.search) filter.orderNumber = new RegExp(String(req.query.search), "i");

      const [items, total] = await Promise.all([
        Order.find(filter)
          .populate("user", "name email")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Order.countDocuments(filter),
      ]);
      return sendSuccess(res, { items, total, page, pages: Math.ceil(total / limit) }, "Orders fetched");
    } catch (error) {
      return next(error);
    }
  }
);

// GET /orders/:id — single order by Mongo _id
ordersRouter.get(
  "/:id",
  verifyToken,
  [param("id").isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id).populate("user", "name email");
      if (!order) return sendError(res, "Order not found", 404);
      if (req.user?.role !== "admin" && order.user?.toString() !== req.user?.id) {
        return sendError(res, "Access denied", 403);
      }
      return sendSuccess(res, order, "Order fetched");
    } catch (error) {
      return next(error);
    }
  }
);

// PATCH /orders/:id/status — admin updates status
ordersRouter.patch(
  "/:id/status",
  verifyToken,
  isAdmin,
  [param("id").isMongoId(), body("status").isIn(statuses)],
  validateRequest,
  async (req, res, next) => {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
          $push: { statusHistory: { status: req.body.status, date: new Date(), note: req.body.note } },
        },
        { new: true }
      );
      if (!order) return sendError(res, "Order not found", 404);
      return sendSuccess(res, order, "Status updated");
    } catch (error) {
      return next(error);
    }
  }
);
