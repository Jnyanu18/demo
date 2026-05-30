import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth";
import { sendError } from "../utils/response";

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return sendError(res, "Admin access required", 403);
  }
  return next();
};
