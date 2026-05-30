import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import { verifyToken } from "../middleware/auth";
import { isAdmin } from "../middleware/isAdmin";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { sendSuccess } from "../utils/response";

export const adminRouter = Router();
adminRouter.use(verifyToken, isAdmin);

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const { start, end } = todayRange();
    const [ordersToday, revenue, newCustomers, lowStock, recentOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Order.aggregate([{ $match: { createdAt: { $gte: start, $lt: end }, paymentStatus: { $in: ["paid", "pending"] } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      User.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Product.find({ stock: { $lte: 5 }, isActive: true }).limit(10),
      Order.find().populate("user", "name email").sort({ createdAt: -1 }).limit(8)
    ]);
    return sendSuccess(res, { ordersToday, revenueToday: revenue[0]?.total ?? 0, liveCount: 0, newCustomers, lowStock, recentOrders }, "Dashboard fetched");
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/revenue", async (req, res, next) => {
  try {
    const days = String(req.query.period ?? "30d").startsWith("7") ? 7 : 30;
    const from = new Date();
    from.setDate(from.getDate() - days);
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    return sendSuccess(res, data.map((row) => ({ date: row._id, revenue: row.revenue, orders: row.orders })), "Revenue fetched");
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/top-products", async (_req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ soldCount: -1 }).limit(10);
    return sendSuccess(res, products, "Top products fetched");
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/orders", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.search) filter.orderNumber = new RegExp(String(req.query.search), "i");
    const [items, total] = await Promise.all([
      Order.find(filter).populate("user", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
    ]);
    return sendSuccess(res, { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) }, "Admin orders fetched");
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/customers", async (_req, res, next) => {
  try {
    const customers = await User.find({ role: "customer" }).select("-password").sort({ createdAt: -1 }).limit(100);
    return sendSuccess(res, customers, "Customers fetched");
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/reports/export", async (_req, res, next) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    const csv = stringify(
      orders.map((order) => ({
        orderNumber: order.orderNumber,
        customer: (order.user as unknown as { email?: string }).email ?? "",
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt
      })),
      { header: true }
    );
    res.header("Content-Type", "text/csv");
    res.attachment("gridstores-orders.csv");
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
});
