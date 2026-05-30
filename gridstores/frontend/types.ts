export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  fabric: string;
  category: string;
  subcategory?: string;
  images: { url: string; publicId: string }[];
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
};

export type CartItem = {
  product: Product;
  quantity: number;
  color?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

export type Order = {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  items: { name: string; quantity: number; price: number; image: string }[];
  statusHistory: { status: string; date: string; note?: string }[];
  createdAt: string;
};
