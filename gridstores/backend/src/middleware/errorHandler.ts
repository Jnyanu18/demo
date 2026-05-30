import { ErrorRequestHandler, RequestHandler } from "express";
import { validationResult } from "express-validator";
import { sendError } from "../utils/response";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const validateRequest: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0]?.msg ?? "Validation failed", 422);
  }
  return next();
};

export const notFoundHandler: RequestHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof AppError ? err.statusCode : err.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;
  if (statusCode === 500) {
    console.error(err);
  }
  return sendError(res, message, statusCode);
};
