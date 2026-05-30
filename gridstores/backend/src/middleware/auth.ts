import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";
import { User } from "../models/User";
import { sendError } from "../utils/response";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "customer" | "admin";
    email: string;
  };
}

type JwtPayload = {
  id: string;
  role: "customer" | "admin";
  email: string;
};

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) return sendError(res, "Authentication required", 401);

    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (!Types.ObjectId.isValid(decoded.id)) return sendError(res, "Invalid token", 401);

    const user = await User.findById(decoded.id).select("_id role email");
    if (!user) return sendError(res, "User not found", 401);

    req.user = { id: user.id, role: user.role, email: user.email };
    return next();
  } catch {
    return sendError(res, "Invalid or expired token", 401);
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
  } catch {
    // Public endpoints keep working with an invalid optional token.
  }
  return next();
};
