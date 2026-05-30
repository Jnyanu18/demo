import { Document, Schema, model } from "mongoose";

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  fabric: string;
  category: string;
  subcategory?: string;
  images: ProductImage[];
  price: number;
  mrp: number;
  stock: number;
  colors: string[];
  care_instructions: string;
  occasion?: string;
  ratings: { average: number; count: number };
  soldCount: number;
  isFeatured: boolean;
  isActive: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    fabric: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, lowercase: true },
    subcategory: String,
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true }
      }
    ],
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    colors: [{ type: String, trim: true }],
    care_instructions: { type: String, required: true },
    occasion: String,
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 }
    },
    soldCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: "text", description: "text", fabric: "text" });

export const Product = model<IProduct>("Product", productSchema);
