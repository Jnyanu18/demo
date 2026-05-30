"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Star, Heart, ShoppingCart, Zap, Shield, RotateCcw,
  Truck, Tag, Share2, CheckCircle2, ChevronDown, Plus, Minus,
  ThumbsUp, BadgeCheck, Loader2, ZoomIn,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { api, ApiResponse } from "@/lib/api";
import { Product } from "@/types";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");
const disc = (price: number, mrp: number) => Math.round(((mrp - price) / mrp) * 100);

type Review = {
  _id: string;
  user: { name: string };
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  likes: number;
  verified: boolean;
};

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(3, "Title required"),
  body: z.string().min(10, "Review too short"),
});
type ReviewForm = z.infer<typeof reviewSchema>;

function StarBar({ rating, max = 5, size = "sm" }: { rating: number; max?: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`${cls} ${i < Math.round(rating) ? "text-[#C9A84C] fill-[#C9A84C]" : "text-[#E8DCC8] fill-[#E8DCC8]"}`} />
      ))}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 animate-pulse">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-[3/4] bg-[#E8DCC8] rounded-xl" />
        <div className="space-y-4">
          <div className="h-6 bg-[#E8DCC8] rounded w-1/4" />
          <div className="h-8 bg-[#E8DCC8] rounded w-3/4" />
          <div className="h-5 bg-[#E8DCC8] rounded w-1/3" />
          <div className="h-10 bg-[#E8DCC8] rounded w-1/2" />
          <div className="h-12 bg-[#E8DCC8] rounded" />
          <div className="h-12 bg-[#E8DCC8] rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.ids.includes(id));
  const user = useAuthStore((s) => s.user);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [qty, setQty] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeMsg, setPincodeMsg] = useState("");
  const [openSpec, setOpenSpec] = useState(false);
  const [adding, setAdding] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0 },
  });
  const watchRating = watch("rating");

  useEffect(() => {
    setLoadingProduct(true);
    api.get<ApiResponse<Product>>(`/products/${id}`)
      .then((res) => {
        if (res.data.success) {
          setProduct(res.data.data);
          setSelectedColor(res.data.data.colors[0] ?? "");
          api.get<ApiResponse<{ items: Product[] }>>(`/products?category=${res.data.data.category}&limit=6`)
            .then((r) => { if (r.data.success) setRelated(r.data.data.items.filter((p) => p._id !== id)); });
        }
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoadingProduct(false));

    api.get<ApiResponse<Review[]>>(`/products/${id}/reviews`)
      .then((res) => { if (res.data.success) setReviews(res.data.data); })
      .catch(() => {});
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    setAdding(true);
    addItem(product, qty, selectedColor);
    toast.success(`${product.name} added to cart!`);
    setTimeout(() => setAdding(false), 700);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, qty, selectedColor);
    router.push("/checkout");
  };

  const handlePincodeCheck = () => {
    if (pincode.length !== 6) { setPincodeMsg("Enter a valid 6-digit pincode"); return; }
    const n = Number(pincode);
    if (n >= 400001 && n <= 400099) setPincodeMsg("✓ Delivered by tomorrow (Mumbai)");
    else if (n >= 110001 && n <= 110099) setPincodeMsg("✓ Delivered in 2 days (Delhi)");
    else if (n >= 560001 && n <= 560099) setPincodeMsg("✓ Delivered in 3 days (Bengaluru)");
    else setPincodeMsg("✓ Delivered in 4–6 business days");
  };

  const submitReview = async (data: ReviewForm) => {
    if (!user) { toast.error("Please login to post a review"); return; }
    try {
      await api.post(`/products/${id}/reviews`, data);
      toast.success("Review posted!");
      reset({ rating: 0, title: "", body: "" });
      setShowReviewForm(false);
      const res = await api.get<ApiResponse<Review[]>>(`/products/${id}/reviews`);
      if (res.data.success) setReviews(res.data.data);
    } catch {
      toast.error("Failed to post review");
    }
  };

  if (loadingProduct) return <ProductSkeleton />;
  if (!product) return (
    <div className="text-center py-24 bg-[#FAF3E0]">
      <p className="text-[#6B6B6B] text-lg mb-4">Product not found</p>
      <Link href="/shop" className="text-[#6B1F2A] font-semibold hover:underline">← Back to shop</Link>
    </div>
  );

  const discount = disc(product.price, product.mrp);
  const images = product.images.length > 0 ? product.images : [{ url: "/images/banarasi.png", publicId: "fallback" }];

  return (
    <div className="bg-[#FAF3E0] min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mb-6">
          <Link href="/" className="hover:text-[#6B1F2A]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop" className="hover:text-[#6B1F2A]">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/shop?category=${product.category}`} className="hover:text-[#6B1F2A] capitalize">{product.category.replace(/-/g, " ")}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-[#1A1A1A] line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[3/4] bg-white rounded-xl overflow-hidden border border-[#E8DCC8] group">
              <Image
                src={images[activeImg]?.url ?? "/images/banarasi.png"}
                alt={product.name}
                fill
                className="object-contain p-4"
                sizes="(max-width:768px) 100vw, 50vw"
                priority
              />
              <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4 text-[#6B1F2A]" />
              </button>
              {discount > 0 && (
                <span className="absolute top-3 left-3 bg-[#6B1F2A] text-white text-xs font-bold px-2 py-0.5 rounded">{discount}% OFF</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`relative shrink-0 w-16 h-20 rounded-lg border-2 overflow-hidden transition-all ${i === activeImg ? "border-[#6B1F2A]" : "border-[#E8DCC8] hover:border-[#6B1F2A]/50"}`}>
                    <Image src={img.url} alt={`view ${i + 1}`} fill className="object-contain p-1" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            <div>
              <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-1">{product.fabric}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] font-serif leading-snug">{product.name}</h1>
            </div>

            {product.ratings.count > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-bold px-2.5 py-1 rounded">
                  <span>{product.ratings.average.toFixed(1)}</span>
                  <Star className="w-3.5 h-3.5 fill-white" />
                </div>
                <span className="text-sm text-[#6B6B6B]">{product.ratings.count} ratings · {reviews.length} reviews</span>
              </div>
            )}

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#1A1A1A]">{rupee(product.price)}</span>
              <span className="text-base text-[#999] line-through">{rupee(product.mrp)}</span>
              {discount > 0 && <span className="text-base font-bold text-green-600">{discount}% off</span>}
            </div>

            <div className="bg-white rounded-xl border border-[#E8DCC8] p-4 space-y-2">
              <p className="text-sm font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5"><Tag className="w-4 h-4 text-[#C9A84C]" /> Available Offers</p>
              {["Bank Offer: 10% off on HDFC Cards. Max ₹1,500.", "5% Cashback with Grid Stores Wallet.", "Free shipping on orders above ₹999."].map((o, i) => (
                <p key={i} className="text-xs text-[#444] flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> {o}
                </p>
              ))}
            </div>

            {product.colors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A] mb-2">Color: <span className="text-[#6B1F2A]">{selectedColor}</span></p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button key={c} onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${selectedColor === c ? "border-[#6B1F2A] bg-[#6B1F2A] text-white" : "border-[#E8DCC8] text-[#444] hover:border-[#6B1F2A] bg-white"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#E8DCC8] rounded-lg overflow-hidden bg-white">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-[#FAF3E0] transition-colors"><Minus className="w-4 h-4 text-[#6B1F2A]" /></button>
                <span className="px-4 py-2 font-semibold text-[#1A1A1A] min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-[#FAF3E0] transition-colors"><Plus className="w-4 h-4 text-[#6B1F2A]" /></button>
              </div>
              <span className={`text-sm font-medium ${product.stock === 0 ? "text-red-500" : product.stock < 5 ? "text-amber-500" : "text-green-600"}`}>
                {product.stock === 0 ? "Out of Stock" : product.stock < 5 ? `Only ${product.stock} left!` : "In Stock"}
              </span>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${product.stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : adding ? "bg-green-600 text-white" : "bg-[#6B1F2A]/10 text-[#6B1F2A] hover:bg-[#6B1F2A] hover:text-white border border-[#6B1F2A]"}`}>
                {adding ? <><CheckCircle2 className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
              </button>
              <button onClick={handleBuyNow} disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-[#6B1F2A] text-white hover:bg-[#5a1a23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Zap className="w-4 h-4" /> Buy Now
              </button>
              <button onClick={() => { toggle(product._id); toast.success(wished ? "Removed from wishlist" : "Added to wishlist!"); }}
                className={`p-3 rounded-xl border transition-all ${wished ? "bg-[#6B1F2A] text-white border-[#6B1F2A]" : "bg-white border-[#E8DCC8] text-[#6B6B6B] hover:border-[#6B1F2A] hover:text-[#6B1F2A]"}`}>
                <Heart className={`w-5 h-5 ${wished ? "fill-white" : ""}`} />
              </button>
              <button className="p-3 rounded-xl border border-[#E8DCC8] bg-white text-[#6B6B6B] hover:border-[#6B1F2A] hover:text-[#6B1F2A] transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white rounded-xl border border-[#E8DCC8] p-4">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-2 flex items-center gap-1.5"><Truck className="w-4 h-4 text-[#6B1F2A]" /> Check Delivery</p>
              <div className="flex gap-2">
                <input type="text" value={pincode} onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "").slice(0, 6)); setPincodeMsg(""); }}
                  placeholder="Enter 6-digit pincode" className="flex-1 border border-[#E8DCC8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6B1F2A]" maxLength={6} />
                <button onClick={handlePincodeCheck} className="px-4 py-2 bg-[#6B1F2A] text-white text-sm font-semibold rounded-lg hover:bg-[#5a1a23] transition-colors">Check</button>
              </div>
              {pincodeMsg && <p className="text-xs mt-2 text-green-600">{pincodeMsg}</p>}
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-[#6B6B6B]">
              {[{ icon: RotateCcw, label: "7-Day Returns" }, { icon: Shield, label: "Authentic Fabric" }, { icon: BadgeCheck, label: "Quality Assured" }].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5"><Icon className="w-4 h-4 text-[#C9A84C]" /> {label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Description & Details */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E8DCC8] p-6">
            <h2 className="font-bold text-[#1A1A1A] text-lg font-serif mb-3">Description</h2>
            <p className="text-sm text-[#444] leading-relaxed">{product.description}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8DCC8] p-6">
            <button onClick={() => setOpenSpec(!openSpec)} className="flex items-center justify-between w-full font-bold text-[#1A1A1A] text-lg font-serif">
              Product Details <ChevronDown className={`w-5 h-5 transition-transform ${openSpec ? "rotate-180" : ""}`} />
            </button>
            {openSpec && (
              <div className="mt-4 space-y-2">
                {[["Fabric", product.fabric], ["Category", product.category.replace(/-/g, " ")], ...(product.occasion ? [["Occasion", product.occasion]] : []), ["Care", product.care_instructions], ...(product.colors.length > 0 ? [["Colors", product.colors.join(", ")]] : [])].map(([label, value]) => (
                  <div key={label} className="flex gap-4 text-sm border-b border-[#FAF3E0] pb-2">
                    <span className="w-28 shrink-0 text-[#6B6B6B] font-medium">{label}</span>
                    <span className="text-[#1A1A1A] capitalize">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12 bg-white rounded-xl border border-[#E8DCC8] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-[#1A1A1A] text-xl font-serif">Customer Reviews</h2>
            {user && !showReviewForm ? (
              <button onClick={() => setShowReviewForm(true)} className="px-4 py-2 bg-[#6B1F2A] text-white text-sm font-semibold rounded-lg hover:bg-[#5a1a23] transition-colors">Write a Review</button>
            ) : !user ? (
              <Link href="/login" className="text-sm text-[#6B1F2A] font-semibold hover:underline">Login to review</Link>
            ) : null}
          </div>

          {showReviewForm && (
            <form onSubmit={handleSubmit(submitReview)} className="mb-8 p-5 border border-[#E8DCC8] rounded-xl bg-[#FAF3E0] space-y-4">
              <h3 className="font-semibold text-[#1A1A1A]">Your Review</h3>
              <div>
                <p className="text-sm text-[#6B6B6B] mb-2">Rating *</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} type="button" onClick={() => setValue("rating", v)}>
                      <Star className={`w-6 h-6 transition-colors ${watchRating >= v ? "text-[#C9A84C] fill-[#C9A84C]" : "text-[#E8DCC8] hover:text-[#C9A84C]"}`} />
                    </button>
                  ))}
                </div>
                {errors.rating && <p className="text-xs text-red-500 mt-1">Please select a rating</p>}
              </div>
              <input {...register("title")} placeholder="Review title" className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6B1F2A] bg-white" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              <textarea {...register("body")} rows={3} placeholder="Share your experience…" className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6B1F2A] bg-white resize-none" />
              {errors.body && <p className="text-xs text-red-500">{errors.body.message}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 bg-[#6B1F2A] text-white text-sm font-semibold rounded-lg hover:bg-[#5a1a23] transition-colors disabled:opacity-60">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
                </button>
                <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 border border-[#E8DCC8] text-sm text-[#444] rounded-lg hover:border-[#6B1F2A] transition-colors">Cancel</button>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-10"><p className="text-[#6B6B6B]">No reviews yet. Be the first to review!</p></div>
          ) : (
            <div className="space-y-5">
              {reviews.map((r) => (
                <div key={r._id} className="border-b border-[#FAF3E0] pb-5 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#6B1F2A] flex items-center justify-center text-white font-bold text-sm shrink-0">{r.user.name[0]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#1A1A1A]">{r.user.name}</span>
                        {r.verified && <span className="flex items-center gap-0.5 text-green-600 text-[11px]"><BadgeCheck className="w-3 h-3" /> Verified</span>}
                        <span className="text-[#999] text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <StarBar rating={r.rating} />
                      <p className="font-semibold text-sm text-[#1A1A1A] mt-1">{r.title}</p>
                      <p className="text-sm text-[#444] mt-1 leading-relaxed">{r.body}</p>
                      <button className="mt-2 flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#6B1F2A] transition-colors">
                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({r.likes})
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-bold text-[#1A1A1A] text-xl font-serif mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {related.slice(0, 6).map((p) => {
                const img = p.images[0]?.url ?? "/images/banarasi.png";
                return (
                  <Link key={p._id} href={`/product/${p._id}`} className="group bg-white rounded-xl overflow-hidden border border-[#E8DCC8] hover:shadow-md transition-all">
                    <div className="relative aspect-[3/4] bg-[#FAF3E0]">
                      <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 50vw, 16vw" />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-[#1A1A1A] line-clamp-2 leading-snug">{p.name}</p>
                      <p className="text-sm font-bold text-[#1A1A1A] mt-1">{rupee(p.price)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
