"use client";

import Link from "next/link";
import { Check, Package, Truck, Home, Loader2, ChevronRight } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiResponse } from "@/lib/api";
import { Order } from "@/types";

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");

const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"];

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    api.get<ApiResponse<Order>>(`/orders/number/${orderNumber}`)
      .then((res) => { if (res.data.success) setOrder(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF3E0]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B1F2A]" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF3E0] min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#E8DCC8] overflow-hidden shadow-lg">
        {/* Success Header */}
        <div className="bg-[#6B1F2A] p-8 text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-8 h-8 text-[#6B1F2A]" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-serif">Order Placed!</h1>
          <p className="text-white/70 text-sm">Thank you for shopping with Grid Stores.</p>
          {order && (
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl mt-4">
              <Package className="w-4 h-4" /> Order #{order.orderNumber}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Order Status Timeline */}
          {order && (
            <div>
              <h2 className="font-bold text-[#1A1A1A] mb-4 font-serif">Order Status</h2>
              <div className="flex items-center justify-between relative">
                <div className="absolute inset-x-0 top-4 h-0.5 bg-[#E8DCC8] z-0" />
                {STATUS_STEPS.map((step, i) => {
                  const currentIdx = STATUS_STEPS.indexOf(order.status);
                  const done = i <= currentIdx;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-[#6B1F2A] text-white" : "bg-[#E8DCC8] text-[#6B6B6B]"}`}>
                        {done ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className="text-[10px] font-semibold text-[#6B6B6B] capitalize hidden sm:block">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order Items */}
          {order && order.items.length > 0 && (
            <div>
              <h2 className="font-bold text-[#1A1A1A] mb-3 font-serif">Items Ordered</h2>
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#FAF3E0] rounded-xl">
                    {item.image && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-[#E8DCC8] shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A] line-clamp-1">{item.name}</p>
                      <p className="text-xs text-[#6B6B6B]">Qty: {item.quantity} × {rupee(item.price)}</p>
                    </div>
                    <p className="text-sm font-bold text-[#1A1A1A]">{rupee(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-[#1A1A1A] mt-3 pt-3 border-t border-[#E8DCC8]">
                <span>Total</span><span>{rupee(order.total)}</span>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-[#FAF3E0] rounded-xl">
              <div className="w-9 h-9 bg-[#6B1F2A]/10 rounded-full flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-[#6B1F2A]" />
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Estimated Delivery</p>
                <p className="text-sm font-bold text-[#1A1A1A]">5–7 Business Days</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#FAF3E0] rounded-xl">
              <div className="w-9 h-9 bg-[#6B1F2A]/10 rounded-full flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-[#6B1F2A]" />
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Confirmation sent to</p>
                <p className="text-sm font-bold text-[#1A1A1A]">Your registered email</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/account" className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#6B1F2A] text-white font-semibold rounded-xl hover:bg-[#5a1a23] transition-colors text-sm">
              <Package className="w-4 h-4" /> Track Order
            </Link>
            <Link href="/" className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#E8DCC8] bg-white text-[#1A1A1A] font-semibold rounded-xl hover:border-[#6B1F2A] transition-colors text-sm">
              <Home className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#FAF3E0]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B1F2A]" />
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
