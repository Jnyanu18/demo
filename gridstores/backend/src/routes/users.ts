import { Router } from "express";
import { body } from "express-validator";
import { verifyToken } from "../middleware/auth";
import { validateRequest } from "../middleware/errorHandler";
import { User } from "../models/User";
import { sendError, sendSuccess } from "../utils/response";

export const usersRouter = Router();

const toFrontendAddress = (a: {
  _id?: unknown;
  label?: string;
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) => ({
  _id: String(a._id ?? ""),
  name: a.fullName ?? "",
  phone: a.phone ?? "",
  line: [a.line1, a.line2].filter(Boolean).join(", "),
  city: a.city ?? "",
  state: a.state ?? "",
  pin: a.pincode ?? "",
  type: a.label ?? "Home",
});

// GET /users/me — profile (used by account page + checkout)
usersRouter.get("/me", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).select("-password").lean();
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, { ...user, addresses: (user.addresses ?? []).map(toFrontendAddress) }, "Profile fetched");
  } catch (error) {
    return next(error);
  }
});

// PUT /users/me — update name / phone
usersRouter.put(
  "/me",
  verifyToken,
  [
    body("name").optional().trim().isLength({ min: 2 }),
    body("phone").optional().trim().isLength({ min: 8 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const update: Record<string, unknown> = {};
      if (req.body.name) update.name = req.body.name;
      if (req.body.phone) update.phone = req.body.phone;
      const user = await User.findByIdAndUpdate(req.user?.id, update, { new: true }).select("-password");
      return sendSuccess(res, user, "Profile updated");
    } catch (error) {
      return next(error);
    }
  }
);

// GET /users/me/addresses
usersRouter.get("/me/addresses", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).select("addresses").lean();
    return sendSuccess(res, { addresses: (user?.addresses ?? []).map(toFrontendAddress) }, "Addresses fetched");
  } catch (error) {
    return next(error);
  }
});

// POST /users/me/addresses — save a new address from checkout
usersRouter.post(
  "/me/addresses",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name required"),
    body("phone").notEmpty().withMessage("Phone required"),
    body("line").notEmpty().withMessage("Address line required"),
    body("city").notEmpty().withMessage("City required"),
    body("state").notEmpty().withMessage("State required"),
    body("pin").notEmpty().withMessage("Pincode required"),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const addrEntry = {
        label: req.body.type ?? "Home",
        fullName: req.body.name,
        phone: req.body.phone,
        line1: req.body.line,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pin,
        country: "India",
        isDefault: false,
      };
      const user = await User.findByIdAndUpdate(
        req.user?.id,
        { $push: { addresses: addrEntry } },
        { new: true }
      ).select("addresses");

      const addresses = (user?.addresses ?? []).map(toFrontendAddress);
      return sendSuccess(res, { addresses }, "Address saved", 201);
    } catch (error) {
      return next(error);
    }
  }
);

// Legacy aliases kept for any old callers
usersRouter.get("/addresses", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id).select("addresses");
    return sendSuccess(res, user?.addresses ?? [], "Addresses fetched");
  } catch (error) {
    return next(error);
  }
});

usersRouter.put(
  "/profile",
  verifyToken,
  [body("name").optional().trim().isLength({ min: 2 }), body("phone").optional().trim().isLength({ min: 8 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.user?.id,
        { name: req.body.name, phone: req.body.phone },
        { new: true }
      ).select("-password");
      return sendSuccess(res, user, "Profile updated");
    } catch (error) {
      return next(error);
    }
  }
);
