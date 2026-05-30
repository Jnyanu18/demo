import { Router } from "express";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { sendSuccess } from "../utils/response";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res, next) => {
  try {
    const stored = await Category.find({ isActive: true }).sort({ name: 1 });
    if (stored.length) return sendSuccess(res, stored, "Categories fetched");
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { name: "$_id", slug: "$_id", count: 1, _id: 0 } }
    ]);
    return sendSuccess(res, categories, "Categories fetched");
  } catch (error) {
    return next(error);
  }
});
