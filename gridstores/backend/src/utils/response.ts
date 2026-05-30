import { Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "OK",
  statusCode = 200
): Response => res.status(statusCode).json({ success: true, data, message });

export const sendError = (
  res: Response,
  error: string,
  code = 400
): Response => res.status(code).json({ success: false, error, code });
