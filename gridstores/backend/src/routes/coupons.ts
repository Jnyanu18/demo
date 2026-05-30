import { Router } from "express";
import { body, param } from "express-validator";
import { verifyToken } from "../middleware/auth";
import { validateRequest } from "../middleware/errorHandler";
import { isAdmin } from "../middleware/isAdmin";
import { Coupon } from "../models/Coupon";
import { sendError, sendSuccess } from "../utils/response";

export const couponsRouter = Router();

const couponValidators = [
  body("code").trim().notEmpty(),
  body("type").isIn(["flat", "percent"]),
  body("value").isFloat({ min: 0 }),
  body("minOrder").optional().isFloat({ min: 0 }),
  body("maxUses").optional().isInt({ min: 1 }),
  body("expiresAt").isISO8601(),
];

export const calculateDiscount = (coupon: { type: string; value: number }, amount: number): number => {
  const discount = coupon.type === "percent" ? (amount * coupon.value) / 100 : coupon.value;
  return Math.min(Math.round(discount), amount);
};

// POST /coupons/apply — validate and return discount
// Accepts: { code, amount } or { code, orderTotal } for flexibility
couponsRouter.post(
  "/apply",
  [body("code").trim().notEmpty()],
  validateRequest,
  async (req, res, next) => {
    try {
      const amount = Number(req.body.amount ?? req.body.orderTotal ?? 0);
      const coupon = await Coupon.findOne({
        code: String(req.body.code).toUpperCase(),
        isActive: true,
      });
      if (!coupon || coupon.expiresAt < new Date() || coupon.usedCount >= coupon.maxUses) {
        return sendError(res, "Coupon is invalid or expired", 400);
      }
      if (amount < coupon.minOrder) {
        return sendError(res, `Minimum order value for this coupon is ₹${coupon.minOrder}`, 400);
      }
      const discount = calculateDiscount(coupon, amount);
      return sendSuccess(res, { coupon, discount }, "Coupon applied");
    } catch (error) {
      return next(error);
    }
  }
);

// GET /coupons — admin list
couponsRouter.get("/", verifyToken, isAdmin, async (_req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return sendSuccess(res, coupons, "Coupons fetched");
  } catch (error) {
    return next(error);
  }
});

// POST /coupons — admin create
couponsRouter.post("/", verifyToken, isAdmin, couponValidators, validateRequest, async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, code: String(req.body.code).toUpperCase() });
    return sendSuccess(res, coupon, "Coupon created", 201);
  } catch (error) {
    return next(error);
  }
});

// PUT /coupons/:id — admin full update
couponsRouter.put(
  "/:id",
  verifyToken,
  isAdmin,
  [param("id").isMongoId(), ...couponValidators],
  validateRequest,
  async (req, res, next) => {
    try {
      const coupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        { ...req.body, code: String(req.body.code).toUpperCase() },
        { new: true, runValidators: true }
      );
      if (!coupon) return sendError(res, "Coupon not found", 404);
      return sendSuccess(res, coupon, "Coupon updated");
    } catch (error) {
      return next(error);
    }
  }
);

// PATCH /coupons/:id — admin partial update (e.g. toggle isActive)
couponsRouter.patch(
  "/:id",
  verifyToken,
  isAdmin,
  [param("id").isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const allowed: Record<string, unknown> = {};
      if (typeof req.body.isActive === "boolean") allowed.isActive = req.body.isActive;
      if (req.body.value !== undefined) allowed.value = req.body.value;
      if (req.body.maxUses !== undefined) allowed.maxUses = req.body.maxUses;
      if (req.body.expiresAt !== undefined) allowed.expiresAt = req.body.expiresAt;

      const coupon = await Coupon.findByIdAndUpdate(req.params.id, allowed, { new: true });
      if (!coupon) return sendError(res, "Coupon not found", 404);
      return sendSuccess(res, coupon, "Coupon updated");
    } catch (error) {
      return next(error);
    }
  }
);

// DELETE /coupons/:id — admin delete
couponsRouter.delete(
  "/:id",
  verifyToken,
  isAdmin,
  [param("id").isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const coupon = await Coupon.findByIdAndDelete(req.params.id);
      if (!coupon) return sendError(res, "Coupon not found", 404);
      return sendSuccess(res, coupon, "Coupon deleted");
    } catch (error) {
      return next(error);
    }
  }
);
