import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { cartRouter } from "./routes/cart";
import { categoriesRouter } from "./routes/categories";
import { couponsRouter } from "./routes/coupons";
import { newsletterRouter } from "./routes/newsletter";
import { ordersRouter } from "./routes/orders";
import { paymentsRouter } from "./routes/payments";
import { productsRouter } from "./routes/products";
import { uploadRouter } from "./routes/upload";
import { usersRouter } from "./routes/users";
import { wishlistRouter } from "./routes/wishlist";
import { sendSuccess } from "./utils/response";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  return sendSuccess(res, { status: "healthy" }, "Grid Stores API is running");
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/users", usersRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);
