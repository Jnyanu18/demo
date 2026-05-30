import crypto from "crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body, param } from "express-validator";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { verifyToken } from "../middleware/auth";
import { validateRequest } from "../middleware/errorHandler";
import { User } from "../models/User";
import { sendPasswordResetEmail } from "../utils/email";
import { sendError, sendSuccess } from "../utils/response";
import { createAccessToken, createRefreshToken } from "../utils/tokens";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
});

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

authRouter.use(authLimiter);

authRouter.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("phone").trim().isLength({ min: 8 }).withMessage("Phone is required")
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const exists = await User.exists({ email: req.body.email });
      if (exists) return sendError(res, "Email is already registered", 409);

      const user = await User.create(req.body);
      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);
      res.cookie("refreshToken", refreshToken, cookieOptions);
      return sendSuccess(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken }, "Registered", 201);
    } catch (error) {
      return next(error);
    }
  }
);

authRouter.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validateRequest,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email }).select("+password");
      if (!user || !(await user.comparePassword(req.body.password))) {
        return sendError(res, "Invalid email or password", 401);
      }
      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);
      res.cookie("refreshToken", refreshToken, cookieOptions);
      return sendSuccess(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken }, "Logged in");
    } catch (error) {
      return next(error);
    }
  }
);

authRouter.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies.refreshToken as string | undefined;
    if (!token) return sendError(res, "Refresh token missing", 401);
    const decoded = jwt.verify(token, env.jwtRefreshSecret) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) return sendError(res, "User not found", 401);
    return sendSuccess(res, { accessToken: createAccessToken(user) }, "Token refreshed");
  } catch {
    return sendError(res, "Invalid refresh token", 401);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken");
  return sendSuccess(res, {}, "Logged out");
});

authRouter.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  validateRequest,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();
        await sendPasswordResetEmail(user.email, rawToken);
      }
      return sendSuccess(res, {}, "If the email exists, a reset link has been sent");
    } catch (error) {
      return next(error);
    }
  }
);

authRouter.post(
  "/reset-password/:token",
  [param("token").isLength({ min: 32 }), body("password").isLength({ min: 8 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
      const user = await User.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: new Date() }
      }).select("+password");
      if (!user) return sendError(res, "Reset token is invalid or expired", 400);
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return sendSuccess(res, {}, "Password reset complete");
    } catch (error) {
      return next(error);
    }
  }
);

authRouter.get("/me", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    return sendSuccess(res, user, "Current user");
  } catch (error) {
    return next(error);
  }
});
