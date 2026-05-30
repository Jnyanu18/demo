"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, MapPin, CreditCard, Smartphone, Building2,
  Truck, Plus, Shield, Lock, Loader2, ChevronRight,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { api, ApiResponse } from "@/lib/api";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");

const STEPS = ["Cart", "Address", "Payment", "Confirmation"];

type Address = {
  _id?: string;
  name: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pin: string;
  type: "Home" | "Work" | "Other";
};

const addrSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  line: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pin: z.string().length(6, "6-digit pincode required"),
  type: z.enum(["Home", "Work", "Other"]),
});
type AddrForm = z.infer<typeof addrSchema>;

const PAYMENT_METHODS = [
  { id: "razorpay", label: "Pay Online (UPI / Card / Net Banking)", icon: CreditCard, desc: "Secure payment via Razorpay" },
  { id: "cod", label: "Cash on Delivery", icon: Truck, desc: "Pay when you receive your order" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [payMethod, setPayMethod] = useState("razorpay");
  const [placing, setPlacing] = useState(false);
  const [activeStep] = useState(1);

  const { register, handleSubmit, formState: { errors } } = useForm<AddrForm>({
    resolver: zodResolver(addrSchema),
    defaultValues: { type: "Home" },
  });

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const mrpTotal = items.reduce((s, i) => s + i.product.mrp * i.quantity, 0);
  const couponDiscount = coupon?.discount ?? 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal - couponDiscount + shipping;

  useEffect(() => {
    if (!user) { router.push("/login?next=/checkout"); return; }
    if (items.length === 0) { router.push("/cart"); return; }
    api.get<ApiResponse<{ addresses: Address[] }>>("/users/me")
      .then((res) => {
        if (res.data.success && res.data.data.addresses?.length > 0) {
          setSavedAddresses(res.data.data.addresses);
          setSelectedAddr(res.data.data.addresses[0]);
        } else {
          setShowAddrForm(true);
        }
      })
      .catch(() => setShowAddrForm(true));

    // Load Razorpay script
    if (!document.getElementById("razorpay-sdk")) {
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
    }
  }, [user, items, router]);

  const saveAddress = async (data: AddrForm) => {
    try {
      const res = await api.post<ApiResponse<{ addresses: Address[] }>>("/users/me/addresses", data);
      if (res.data.success) {
        const addrs = res.data.data.addresses;
        setSavedAddresses(addrs);
        setSelectedAddr(addrs[addrs.length - 1]);
        setShowAddrForm(false);
        toast.success("Address saved!");
      }
    } catch {
      toast.error("Failed to save address");
    }
  };

  const createOrderPayload = (paymentId?: string, razorpayOrderId?: string) => ({
    items: items.map((i) => ({
      product: i.product._id,
      name: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
      image: i.product.images[0]?.url ?? "",
      color: i.color,
    })),
    address: selectedAddr,
    couponCode: coupon?.code,
    paymentMethod: payMethod,
    paymentStatus: payMethod === "cod" ? "pending" : "paid",
    paymentId,
    razorpayOrderId,
    total,
    subtotal,
    shipping,
    couponDiscount,
  });

  const handleCOD = async () => {
    if (!selectedAddr) { toast.error("Please select a delivery address"); return; }
    setPlacing(true);
    try {
      const res = await api.post<ApiResponse<{ orderNumber: string }>>("/orders", createOrderPayload());
      if (res.data.success) {
        clearCart();
        router.push(`/order-confirmation?order=${res.data.data.orderNumber}`);
      } else {
        toast.error("Order failed. Please try again.");
      }
    } catch {
      toast.error("Order failed. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const handleRazorpay = async () => {
    if (!selectedAddr) { toast.error("Please select a delivery address"); return; }
    setPlacing(true);
    try {
      const orderRes = await api.post<ApiResponse<{ id: string; amount: number }>>("/payments/create-order", {
        amount: total,
        receipt: `gs-${Date.now()}`,
      });
      if (!orderRes.data.success) { toast.error("Payment setup failed"); setPlacing(false); return; }

      const razorpayOrder = orderRes.data.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "Grid Stores",
        description: `Order for ${items.length} item(s)`,
        order_id: razorpayOrder.id,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#6B1F2A" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            // Create order in DB
            const orderRes2 = await api.post<ApiResponse<{ _id: string; orderNumber: string }>>("/orders", createOrderPayload(response.razorpay_payment_id, response.razorpay_order_id));
            if (!orderRes2.data.success) { toast.error("Order creation failed"); return; }

            // Verify payment
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderRes2.data.data._id,
            });

            clearCart();
            router.push(`/order-confirmation?order=${orderRes2.data.data.orderNumber}`);
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        modal: { ondismiss: () => { setPlacing(false); toast("Payment cancelled"); } },
      };

      const rp = new window.Razorpay(options);
      rp.open();
    } catch {
      toast.error("Payment failed. Please try again.");
      setPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (payMethod === "cod") handleCOD();
    else handleRazorpay();
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-[#FAF3E0] min-h-screen">
      {/* Step Indicator */}
      <div className="bg-white border-b border-[#E8DCC8] shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4 py-4">
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < activeStep ? "bg-green-500 text-white" : i === activeStep ? "bg-[#6B1F2A] text-white ring-4 ring-[#6B1F2A]/20" : "bg-gray-100 text-gray-400"}`}>
                    {i < activeStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`hidden sm:block text-sm font-semibold ${i === activeStep ? "text-[#6B1F2A]" : i < activeStep ? "text-green-500" : "text-gray-400"}`}>{step}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-12 sm:w-20 h-0.5 mx-2 ${i < activeStep ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery Address */}
            <div className="bg-white rounded-xl border border-[#E8DCC8] p-6">
              <h2 className="font-bold text-[#1A1A1A] text-lg mb-4 flex items-center gap-2 font-serif">
                <MapPin className="w-5 h-5 text-[#6B1F2A]" /> Delivery Address
              </h2>

              {savedAddresses.length > 0 && !showAddrForm && (
                <div className="space-y-3 mb-4">
                  {savedAddresses.map((addr, i) => (
                    <label key={i} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddr === addr ? "border-[#6B1F2A] bg-[#6B1F2A]/5" : "border-[#E8DCC8] hover:border-[#6B1F2A]/40"}`}>
                      <input type="radio" name="address" checked={selectedAddr === addr} onChange={() => setSelectedAddr(addr)} className="mt-0.5 accent-[#6B1F2A]" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#1A1A1A]">{addr.name}</span>
                          <span className="text-[10px] font-bold bg-[#6B1F2A]/10 text-[#6B1F2A] px-2 py-0.5 rounded">{addr.type}</span>
                        </div>
                        <p className="text-sm text-[#444] mt-1">{addr.line}</p>
                        <p className="text-sm text-[#444]">{addr.city}, {addr.state} — {addr.pin}</p>
                        <p className="text-sm text-[#6B6B6B]">📞 {addr.phone}</p>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => setShowAddrForm(true)} className="flex items-center gap-2 text-sm text-[#6B1F2A] font-semibold hover:underline mt-2">
                    <Plus className="w-4 h-4" /> Add New Address
                  </button>
                </div>
              )}

              {showAddrForm && (
                <form onSubmit={handleSubmit(saveAddress)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <input {...register("name")} placeholder="Full Name *" className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B1F2A]" />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <input {...register("phone")} placeholder="Phone *" className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B1F2A]" />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                    </div>
                    <div className="col-span-2">
                      <input {...register("line")} placeholder="Address (house no., street, area) *" className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B1F2A]" />
                      {errors.line && <p className="text-xs text-red-500 mt-1">{errors.line.message}</p>}
                    </div>
                    <div>
                      <input {...register("city")} placeholder="City *" className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B1F2A]" />
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <input {...register("state")} placeholder="State *" className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B1F2A]" />
                      {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
                    </div>
                    <div>
                      <input {...register("pin")} placeholder="Pincode *" maxLength={6} className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B1F2A]" />
                      {errors.pin && <p className="text-xs text-red-500 mt-1">{errors.pin.message}</p>}
                    </div>
                    <div>
                      <select {...register("type")} className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B1F2A] bg-white">
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-5 py-2.5 bg-[#6B1F2A] text-white text-sm font-semibold rounded-lg hover:bg-[#5a1a23] transition-colors">Save Address</button>
                    {savedAddresses.length > 0 && (
                      <button type="button" onClick={() => setShowAddrForm(false)} className="px-4 py-2.5 border border-[#E8DCC8] text-sm text-[#444] rounded-lg hover:border-[#6B1F2A] transition-colors">Cancel</button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-[#E8DCC8] p-6">
              <h2 className="font-bold text-[#1A1A1A] text-lg mb-4 flex items-center gap-2 font-serif">
                <CreditCard className="w-5 h-5 text-[#6B1F2A]" /> Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${payMethod === m.id ? "border-[#6B1F2A] bg-[#6B1F2A]/5" : "border-[#E8DCC8] hover:border-[#6B1F2A]/40"}`}>
                      <input type="radio" name="payment" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} className="accent-[#6B1F2A]" />
                      <div className="w-9 h-9 rounded-lg bg-[#6B1F2A]/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[#6B1F2A]" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#1A1A1A]">{m.label}</p>
                        <p className="text-xs text-[#6B6B6B]">{m.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E8DCC8] p-5">
              <h3 className="font-bold text-[#1A1A1A] mb-4">Order Summary ({items.length} item{items.length > 1 ? "s" : ""})</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {items.map((item) => {
                  const img = item.product.images[0]?.url ?? "/images/banarasi.png";
                  return (
                    <div key={`${item.product._id}-${item.color}`} className="flex gap-3">
                      <div className="relative w-14 h-18 shrink-0 rounded-lg overflow-hidden border border-[#E8DCC8] bg-[#FAF3E0]" style={{ height: 72 }}>
                        <Image src={img} alt={item.product.name} fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1A1A1A] line-clamp-2 leading-snug">{item.product.name}</p>
                        {item.color && <p className="text-[11px] text-[#6B6B6B]">{item.color}</p>}
                        <p className="text-xs text-[#6B6B6B]">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold text-[#1A1A1A]">{rupee(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#E8DCC8] mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-[#444]">
                  <span>Subtotal</span><span>{rupee(subtotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>− {rupee(mrpTotal - subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({coupon?.code})</span><span>− {rupee(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#444]">
                  <span>Shipping</span><span className={shipping === 0 ? "text-green-600 font-semibold" : ""}>{shipping === 0 ? "FREE" : rupee(shipping)}</span>
                </div>
                <div className="border-t border-[#E8DCC8] pt-2 flex justify-between font-bold text-[#1A1A1A] text-base">
                  <span>Total</span><span>{rupee(total)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddr}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#6B1F2A] text-white font-bold rounded-xl hover:bg-[#5a1a23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {placing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : payMethod === "razorpay" ? (
                <><Lock className="w-4 h-4" /> Pay {rupee(total)}</>
              ) : (
                <><Truck className="w-4 h-4" /> Place Order (COD)</>
              )}
            </button>

            {!selectedAddr && (
              <p className="text-xs text-center text-red-500">Please add a delivery address to continue</p>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-[#6B6B6B]">
              <Shield className="w-3.5 h-3.5 text-[#C9A84C]" /> 100% Secure · SSL Encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
