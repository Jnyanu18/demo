import { Router } from "express";
import { body } from "express-validator";
import { validateRequest } from "../middleware/errorHandler";
import { Newsletter } from "../models/Newsletter";
import { sendSuccess } from "../utils/response";

export const newsletterRouter = Router();

newsletterRouter.post("/", [body("email").isEmail().normalizeEmail()], validateRequest, async (req, res, next) => {
  try {
    await Newsletter.findOneAndUpdate({ email: req.body.email }, { email: req.body.email }, { upsert: true });
    return sendSuccess(res, {}, "Subscribed");
  } catch (error) {
    return next(error);
  }
});
