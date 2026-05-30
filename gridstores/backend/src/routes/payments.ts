import crypto from "crypto";
import { Router } from "express";
import { body } from "express-validator";
import { env } from "../config/env";
import { verifyToken } from "../middleware/auth";
import { validateRequest } from "../middleware/errorHandler";
import { Order } from "../models/Order";
import { razorpay } from "../utils/razorpay";
import { sendError, sendSuccess } from "../utils/response";

export const paymentsRouter = Router();

paymentsRouter.post("/create-order", verifyToken, [body("amount").isFloat({ min: 1 }), body("receipt").optional().isString()], validateRequest, async (req, res, next) => {
  try {
    if (!razorpay) return sendError(res, "Razorpay is not configured", 503);
    const order = await razorpay.orders.create({ amount: Math.round(Number(req.body.amount) * 100), currency: "INR", receipt: req.body.receipt });
    return sendSuccess(res, order, "Razorpay order created", 201);
  } catch (error) {
    return next(error);
  }
});

paymentsRouter.post(
  "/verify",
  verifyToken,
  [body("razorpay_order_id").notEmpty(), body("razorpay_payment_id").notEmpty(), body("razorpay_signature").notEmpty(), body("orderId").isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const expected = crypto.createHmac("sha256", env.razorpayKeySecret).update(`${req.body.razorpay_order_id}|${req.body.razorpay_payment_id}`).digest("hex");
      if (expected !== req.body.razorpay_signature) return sendError(res, "Payment signature mismatch", 400);
      const order = await Order.findByIdAndUpdate(req.body.orderId, { paymentStatus: "paid", paymentId: req.body.razorpay_payment_id, razorpayOrderId: req.body.razorpay_order_id, status: "confirmed" }, { new: true });
      return sendSuccess(res, order, "Payment verified");
    } catch (error) {
      return next(error);
    }
  }
);

paymentsRouter.post("/webhook", async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    if (env.razorpayWebhookSecret && signature) {
      const expected = crypto.createHmac("sha256", env.razorpayWebhookSecret).update(JSON.stringify(req.body)).digest("hex");
      if (expected !== signature) return sendError(res, "Invalid webhook signature", 400);
    }
    const payment = req.body.payload?.payment?.entity;
    if (req.body.event === "payment.captured" && payment?.order_id) {
      await Order.findOneAndUpdate({ razorpayOrderId: payment.order_id }, { paymentStatus: "paid", paymentId: payment.id, status: "confirmed" });
    }
    return sendSuccess(res, {}, "Webhook processed");
  } catch (error) {
    return next(error);
  }
});
