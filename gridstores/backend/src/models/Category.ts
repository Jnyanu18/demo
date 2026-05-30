import { Document, Schema, model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: String,
    image: String,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

categorySchema.index({ isActive: 1 });

export const Category = model<ICategory>("Category", categorySchema);
