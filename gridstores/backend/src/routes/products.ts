import { Router } from "express";
import { body, param, query } from "express-validator";
import multer from "multer";
import slugify from "slugify";
import { isAdmin } from "../middleware/isAdmin";
import { optionalAuth, verifyToken } from "../middleware/auth";
import { validateRequest } from "../middleware/errorHandler";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { cloudinary } from "../utils/cloudinary";
import { sendError, sendSuccess } from "../utils/response";
import { env } from "../config/env";

export const productsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const productValidators = [
  body("name").trim().notEmpty(),
  body("description").trim().notEmpty(),
  body("fabric").trim().notEmpty(),
  body("category").trim().notEmpty(),
  body("price").isFloat({ min: 0 }),
  body("mrp").isFloat({ min: 0 }),
  body("stock").isInt({ min: 0 }),
  body("care_instructions").trim().notEmpty()
];

const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
};

const fallbackImage = (name: string) => ({
  url: `https://placehold.co/700x900/6B1F2A/FAF3E0?text=${encodeURIComponent(name)}`,
  publicId: `generated/${slugify(name, { lower: true, strict: true })}`
});

const categoryAliases: Record<string, string[]> = {
  fashion: ["sarees", "kurta-fabrics", "dress-materials", "blouse-pieces", "cotton-fabrics"],
  textile: ["sarees", "kurta-fabrics", "dress-materials", "blouse-pieces", "cotton-fabrics"],
  textiles: ["sarees", "kurta-fabrics", "dress-materials", "blouse-pieces", "cotton-fabrics"],
  "home-decor": ["home"]
};

const uploadImages = async (files: Express.Multer.File[] | undefined) => {
  if (!files?.length) return [];
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return [];
  }
  return Promise.all(
    files.map(
      (file) =>
        new Promise<{ url: string; publicId: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: "gridstores/products" }, (error, result) => {
            if (error || !result) return reject(error);
            return resolve({ url: result.secure_url, publicId: result.public_id });
          });
          stream.end(file.buffer);
        })
    )
  );
};

productsRouter.get(
  "/",
  optionalAuth,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 })
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 12);
      const filter: Record<string, unknown> = { isActive: true };
      if (req.user?.role === "admin" && (req.query.includeInactive === "true" || req.query.admin === "true")) {
        delete filter.isActive;
      }
      if (req.query.category) {
        const category = String(req.query.category).toLowerCase();
        const categories = categoryAliases[category];
        filter.category = categories ? { $in: categories } : category;
      }
      if (req.query.fabric) filter.fabric = String(req.query.fabric);
      if (req.query.color) filter.colors = String(req.query.color);
      if (req.query.isFeatured !== undefined) filter.isFeatured = req.query.isFeatured === "true";
      if (req.query.minRating) filter["ratings.average"] = { $gte: Number(req.query.minRating) };
      if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {
          ...(req.query.minPrice ? { $gte: Number(req.query.minPrice) } : {}),
          ...(req.query.maxPrice ? { $lte: Number(req.query.maxPrice) } : {})
        };
      }
      if (req.query.search) filter.$text = { $search: String(req.query.search) };
      const sortMap: Record<string, Record<string, 1 | -1>> = {
        newest: { createdAt: -1 },
        price_asc: { price: 1 },
        "price-asc": { price: 1 },
        price_desc: { price: -1 },
        "price-desc": { price: -1 },
        popular: { soldCount: -1 },
        popularity: { soldCount: -1 },
        discount: { mrp: -1 }
      };
      const sort = sortMap[String(req.query.sort ?? "newest")] ?? sortMap.newest;
      const [items, total] = await Promise.all([
        Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
        Product.countDocuments(filter)
      ]);
      return sendSuccess(res, { items, total, page, pages: Math.ceil(total / limit) }, "Products fetched");
    } catch (error) {
      return next(error);
    }
  }
);

productsRouter.get("/filters", async (_req, res, next) => {
  try {
    const [categories, fabrics, colors] = await Promise.all([
      Product.distinct("category", { isActive: true }),
      Product.distinct("fabric", { isActive: true }),
      Product.distinct("colors", { isActive: true })
    ]);
    return sendSuccess(res, { categories, fabrics, colors }, "Filters fetched");
  } catch (error) {
    return next(error);
  }
});

productsRouter.get("/:id", [param("id").notEmpty()], validateRequest, async (req, res, next) => {
  try {
    const product = await Product.findOne({ $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : undefined }, { slug: req.params.id }] });
    if (!product || !product.isActive) return sendError(res, "Product not found", 404);
    return sendSuccess(res, product, "Product fetched");
  } catch (error) {
    return next(error);
  }
});

productsRouter.post("/", verifyToken, isAdmin, upload.array("images", 8), productValidators, validateRequest, async (req, res, next) => {
  try {
    const images = await uploadImages(req.files as Express.Multer.File[] | undefined);
    const product = await Product.create({
      ...req.body,
      slug: slugify(req.body.slug || req.body.name, { lower: true, strict: true }),
      category: String(req.body.category).toLowerCase(),
      colors: parseList(req.body.colors),
      images: images.length
        ? images
        : parseList(req.body.imageUrls).map((url) => ({ url, publicId: url })).concat([]).slice(0, 8),
      isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true
    });
    if (product.images.length === 0) {
      product.images = [fallbackImage(product.name)];
      await product.save();
    }
    return sendSuccess(res, product, "Product created", 201);
  } catch (error) {
    return next(error);
  }
});

productsRouter.put("/:id", verifyToken, isAdmin, upload.array("images", 8), productValidators, validateRequest, async (req, res, next) => {
  try {
    const images = await uploadImages(req.files as Express.Multer.File[] | undefined);
    const update = {
      ...req.body,
      slug: slugify(req.body.slug || req.body.name, { lower: true, strict: true }),
      category: String(req.body.category).toLowerCase(),
      colors: parseList(req.body.colors)
    };
    if (images.length) Object.assign(update, { images });
    if (!images.length && req.body.imageUrls) {
      Object.assign(update, { images: parseList(req.body.imageUrls).map((url) => ({ url, publicId: url })) });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return sendError(res, "Product not found", 404);
    return sendSuccess(res, product, "Product updated");
  } catch (error) {
    return next(error);
  }
});

productsRouter.patch("/:id", verifyToken, isAdmin, [param("id").isMongoId()], validateRequest, async (req, res, next) => {
  try {
    const allowed = ["isActive", "isFeatured", "stock", "price", "mrp"] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return sendError(res, "Product not found", 404);
    return sendSuccess(res, product, "Product updated");
  } catch (error) {
    return next(error);
  }
});

productsRouter.delete("/:id", verifyToken, isAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return sendError(res, "Product not found", 404);
    return sendSuccess(res, product, "Product deleted");
  } catch (error) {
    return next(error);
  }
});

productsRouter.get("/:id/reviews", async (req, res, next) => {
  try {
    const product = await Product.findOne({ $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : undefined }, { slug: req.params.id }] }).select("_id");
    if (!product) return sendError(res, "Product not found", 404);
    const reviews = await Review.find({ product: product._id }).populate("user", "name").sort({ createdAt: -1 });
    const shaped = reviews.map((review) => ({
      _id: review._id,
      user: review.user,
      rating: review.rating,
      title: review.title ?? "",
      body: review.comment,
      createdAt: review.createdAt,
      likes: 0,
      verified: true
    }));
    return sendSuccess(res, shaped, "Reviews fetched");
  } catch (error) {
    return next(error);
  }
});

productsRouter.post(
  "/:id/reviews",
  verifyToken,
  [
    body("rating").isInt({ min: 1, max: 5 }),
    body().custom((value) => {
      if (!value.comment && !value.body) throw new Error("Review body is required");
      return true;
    })
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const product = await Product.findOne({ $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : undefined }, { slug: req.params.id }] }).select("_id");
      if (!product) return sendError(res, "Product not found", 404);
      const review = await Review.findOneAndUpdate(
        { product: product._id, user: req.user?.id },
        { rating: req.body.rating, title: req.body.title, comment: req.body.comment ?? req.body.body, product: product._id, user: req.user?.id },
        { upsert: true, new: true, runValidators: true }
      );
      const aggregate = await Review.aggregate([
        { $match: { product: product._id } },
        { $group: { _id: "$product", average: { $avg: "$rating" }, count: { $sum: 1 } } }
      ]);
      await Product.findByIdAndUpdate(product._id, { ratings: aggregate[0] ? { average: aggregate[0].average, count: aggregate[0].count } : { average: 0, count: 0 } });
      return sendSuccess(res, review, "Review saved", 201);
    } catch (error) {
      return next(error);
    }
  }
);
