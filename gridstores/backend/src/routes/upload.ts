import { Router } from "express";
import multer from "multer";
import { verifyToken } from "../middleware/auth";
import { isAdmin } from "../middleware/isAdmin";
import { cloudinary } from "../utils/cloudinary";
import { sendSuccess } from "../utils/response";

export const uploadRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

uploadRouter.post("/", verifyToken, isAdmin, upload.single("image"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return sendSuccess(res, null, "No file uploaded", 400);
    const result = await new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "gridstores/uploads" }, (error, data) => {
        if (error || !data) return reject(error);
        return resolve({ url: data.secure_url, publicId: data.public_id });
      });
      stream.end(file.buffer);
    });
    return sendSuccess(res, result, "Uploaded", 201);
  } catch (error) {
    return next(error);
  }
});
