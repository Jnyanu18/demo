"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { Product } from "@/types";
import { useState } from "react";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function discountPct(price: number, mrp: number) {
  return Math.round(((mrp - price) / mrp) * 100);
}

export function ProductCard({ product, p }: { product?: Product; p?: Product }) {
  const item = product ?? p;
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.ids.includes(item?._id ?? ""));
  const [adding, setAdding] = useState(false);
  if (!item) return null;
  const image = item.images[0]?.url ?? `https://placehold.co/700x900/6B1F2A/FAF3E0?text=${encodeURIComponent(item.name)}`;
  const disc = discountPct(item.price, item.mrp);

  const handleAddToCart = () => {
    setAdding(true);
    addItem(item);
    toast.success("Added to cart!");
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/5] bg-[#F8F9FC] overflow-hidden">
        <Link href={`/product/${item.slug || item._id}`}>
          <Image
            src={image}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 20vw"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {disc >= 10 && (
            <span className="bg-secondary text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
              {disc}% OFF
            </span>
          )}
          {item.isFeatured && (
            <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
              ✨ FEATURED
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={() => { toggle(item._id); toast.success(wished ? "Removed from wishlist" : "Added to wishlist!"); }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all ${wished ? "bg-secondary text-white" : "bg-white text-gray-400 hover:text-secondary"}`}
          aria-label="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${wished ? "fill-white" : ""}`} />
        </button>

        {/* Quick view on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
          <Link
            href={`/product/${item.slug || item._id}`}
            className="flex items-center justify-center gap-2 w-full bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold py-2 rounded-xl hover:bg-primary hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Brand / fabric */}
        <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">{item.fabric}</p>

        {/* Name */}
        <Link href={`/product/${item.slug || item._id}`} className="line-clamp-2 text-sm font-semibold text-gray-800 leading-snug hover:text-primary transition-colors">
          {item.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 bg-green-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md">
            <span>{item.ratings.average.toFixed(1)}</span>
            <Star className="w-2.5 h-2.5 fill-white" />
          </div>
          <span className="text-[11px] text-gray-400">({item.ratings.count.toLocaleString()})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-base font-bold text-gray-900">{formatPrice(item.price)}</span>
          <span className="text-xs text-gray-400 line-through">{formatPrice(item.mrp)}</span>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all btn-press ${adding ? "bg-green-500 text-white scale-95" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"}`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {adding ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
