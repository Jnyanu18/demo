"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2, Heart, Plus, Minus, ShoppingBag, Shield, Tag,
  ChevronRight, Truck, TicketPercent, ArrowRight, Loader2, X,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { api, ApiResponse } from "@/lib/api";
import toast from "react-hot-toast";

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");
const disc = (p: number, m: number) => Math.round(((m - p) / m) * 100);

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const toggle = useWishlistStore((s) => s.toggle);

  const [couponInput, setCouponInput] = useState(coupon?.code ?? "");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const mrpTotal = items.reduce((s, i) => s + i.product.mrp * i.quantity, 0);
  const productDiscount = mrpTotal - subtotal;
  const couponDiscount = coupon?.discount ?? 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal - couponDiscount + shipping;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await api.post<ApiResponse<{ discount: number; message: string }>>("/coupons/apply", {
        code: couponInput.trim().toUpperCase(),
        orderTotal: subtotal,
      });
      if (res.data.success) {
        setCoupon({ code: couponInput.trim().toUpperCase(), discount: res.data.data.discount });
        toast.success(res.data.message ?? "Coupon applied!");
      } else {
        toast.error(res.data.error ?? "Invalid coupon");
      }
    } catch {
      toast.error("Coupon not valid or expired");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(undefined);
    setCouponInput("");
    toast.success("Coupon removed");
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#FAF3E0] min-h-screen flex flex-col items-center justify-center gap-5 px-4">
        <div className="w-20 h-20 rounded-full bg-[#6B1F2A]/10 flex items-center justify-center">
          <ShoppingBag className="w-9 h-9 text-[#6B1F2A]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-1">Your cart is empty</h2>
          <p className="text-sm text-[#6B6B6B]">Add some beautiful textiles to get started</p>
        </div>
        <Link href="/shop" className="flex items-center gap-2 px-6 py-3 bg-[#6B1F2A] text-white font-semibold rounded-xl hover:bg-[#5a1a23] transition-colors">
          <ShoppingBag className="w-4 h-4" /> Browse Shop <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF3E0] min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A] font-serif">Your Cart</h1>
          <span className="bg-[#6B1F2A] text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const img = item.product.images[0]?.url ?? "/images/banarasi.png";
              return (
                <div key={`${item.product._id}-${item.color}`} className="bg-white rounded-xl border border-[#E8DCC8] p-4">
                  <div className="flex gap-4">
                    <Link href={`/product/${item.product._id}`} className="relative shrink-0 w-24 h-32 rounded-lg overflow-hidden bg-[#FAF3E0] border border-[#E8DCC8]">
                      <Image src={img} alt={item.product.name} fill className="object-cover" sizes="96px" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider">{item.product.fabric}</p>
                      <Link href={`/product/${item.product._id}`} className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 hover:text-[#6B1F2A] transition-colors">{item.product.name}</Link>
                      {item.color && <p className="text-xs text-[#6B6B6B] mt-0.5">Color: {item.color}</p>}
                      <p className="text-xs text-[#6B6B6B]">Sold by: Grid Stores Official</p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-base font-bold text-[#1A1A1A]">{rupee(item.product.price)}</span>
                        <span className="text-xs text-[#999] line-through">{rupee(item.product.mrp)}</span>
                        <span className="text-xs font-semibold text-green-600">{disc(item.product.price, item.product.mrp)}% off</span>
                      </div>

                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <div className="flex items-center border border-[#E8DCC8] rounded-lg overflow-hidden">
                          <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-[#FAF3E0] transition-colors">
                            <Minus className="w-3.5 h-3.5 text-[#6B1F2A]" />
                          </button>
                          <span className="px-3 py-1.5 font-semibold text-sm text-[#1A1A1A] min-w-[2.5rem] text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} disabled={item.quantity >= item.product.stock}
                            className="px-2.5 py-1.5 hover:bg-[#FAF3E0] transition-colors disabled:opacity-40">
                            <Plus className="w-3.5 h-3.5 text-[#6B1F2A]" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button onClick={() => { toggle(item.product._id); toast.success("Saved to wishlist"); }}
                            className="flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#6B1F2A] transition-colors px-2 py-1.5 border border-[#E8DCC8] rounded-lg bg-white">
                            <Heart className="w-3.5 h-3.5" /> Save
                          </button>
                          <button onClick={() => { removeItem(item.product._id); toast.success("Removed from cart"); }}
                            className="flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-red-500 transition-colors px-2 py-1.5 border border-[#E8DCC8] rounded-lg bg-white">
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Delivery info */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
              <Truck className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">
                {subtotal >= 999 ? "🎉 You qualify for FREE delivery!" : `Add ${rupee(999 - subtotal)} more to get FREE delivery`}
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-xl border border-[#E8DCC8] p-4">
              <p className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-1.5"><TicketPercent className="w-4 h-4 text-[#C9A84C]" /> Apply Coupon</p>
              {coupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-bold text-green-700 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {coupon.code} — {rupee(coupon.discount)} off</span>
                  <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-[#E8DCC8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6B1F2A] uppercase"
                  />
                  <button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-[#6B1F2A] text-white text-sm font-semibold rounded-lg hover:bg-[#5a1a23] transition-colors disabled:opacity-50 flex items-center gap-1">
                    {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-xl border border-[#E8DCC8] p-4 space-y-3">
              <h3 className="font-bold text-[#1A1A1A] text-sm">Price Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#444]">
                  <span>MRP ({items.length} item{items.length > 1 ? "s" : ""})</span>
                  <span>{rupee(mrpTotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Product Discount</span>
                  <span>− {rupee(productDiscount)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>− {rupee(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#444]">
                  <span>Delivery</span>
                  <span className={shipping === 0 ? "text-green-600 font-semibold" : ""}>{shipping === 0 ? "FREE" : rupee(shipping)}</span>
                </div>
              </div>
              <div className="border-t border-[#E8DCC8] pt-3 flex justify-between font-bold text-[#1A1A1A] text-base">
                <span>Total Amount</span>
                <span>{rupee(total)}</span>
              </div>
              {(productDiscount + couponDiscount) > 0 && (
                <p className="text-xs text-green-600 font-semibold text-center">🎉 You save {rupee(productDiscount + couponDiscount)} on this order!</p>
              )}
            </div>

            <Link href="/checkout"
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#6B1F2A] text-white font-bold rounded-xl hover:bg-[#5a1a23] transition-colors text-sm">
              Proceed to Checkout <ChevronRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-4 text-xs text-[#6B6B6B]">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-[#C9A84C]" /> Secure Checkout</span>
              <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-[#C9A84C]" /> Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
