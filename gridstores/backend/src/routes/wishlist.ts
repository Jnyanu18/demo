import { Router } from "express";
import { param } from "express-validator";
import { verifyToken } from "../middleware/auth";
import { validateRequest } from "../middleware/errorHandler";
import { User } from "../models/User";
import { sendSuccess } from "../utils/response";

export const wishlistRouter = Router();

wishlistRouter.get("/", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).populate("wishlist");
    return sendSuccess(res, user?.wishlist ?? [], "Wishlist fetched");
  } catch (error) {
    return next(error);
  }
});

wishlistRouter.post("/:productId", verifyToken, [param("productId").isMongoId()], validateRequest, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user?.id, { $addToSet: { wishlist: req.params.productId } }, { new: true }).populate("wishlist");
    return sendSuccess(res, user?.wishlist ?? [], "Added to wishlist");
  } catch (error) {
    return next(error);
  }
});

wishlistRouter.delete("/:productId", verifyToken, [param("productId").isMongoId()], validateRequest, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user?.id, { $pull: { wishlist: req.params.productId } }, { new: true }).populate("wishlist");
    return sendSuccess(res, user?.wishlist ?? [], "Removed from wishlist");
  } catch (error) {
    return next(error);
  }
});
