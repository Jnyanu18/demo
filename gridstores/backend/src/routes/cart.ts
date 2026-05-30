import { Router } from "express";
import { body } from "express-validator";
import { verifyToken } from "../middleware/auth";
import { validateRequest } from "../middleware/errorHandler";
import { User } from "../models/User";
import { sendSuccess } from "../utils/response";

export const cartRouter = Router();

cartRouter.post("/sync", verifyToken, [body("items").isArray()], validateRequest, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user?.id, { cart: req.body.items }, { new: true }).populate("cart.product");
    return sendSuccess(res, user?.cart ?? [], "Cart synced");
  } catch (error) {
    return next(error);
  }
});
