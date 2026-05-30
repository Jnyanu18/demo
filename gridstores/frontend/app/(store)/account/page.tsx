"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package, Heart, MapPin, LogOut, ChevronRight,
  Loader2, Check, Clock, Truck, XCircle,
  User, Edit2, Phone, Mail,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { api, ApiResponse } from "@/lib/api";
import { Order } from "@/types";
import toast from "react-hot-toast";

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    color: "bg-yellow-900/40 text-yellow-300 border-yellow-800/40", icon: Clock },
  confirmed:  { label: "Confirmed",  color: "bg-blue-900/40 text-blue-300 border-blue-800/40",      icon: Check },
  processing: { label: "Processing", color: "bg-amber-900/40 text-amber-300 border-amber-800/40",   icon: Clock },
  shipped:    { label: "Shipped",    color: "bg-indigo-100 text-indigo-700 border-indigo-200",       icon: Truck },
  delivered:  { label: "Delivered",  color: "bg-green-100 text-green-700 border-green-200",          icon: Check },
  cancelled:  { label: "Cancelled",  color: "bg-red-100 text-red-600 border-red-200",                icon: XCircle },
  returned:   { label: "Returned",   color: "bg-gray-100 text-gray-600 border-gray-200",             icon: XCircle },
};

const TIMELINE = ["confirmed", "processing", "shipped", "delivered"];

type UserProfile = { id: string; name: string; email: string; phone?: string; role: string };

const NAV_ITEMS = [
  { id: "orders",    label: "My Orders",   icon: Package },
  { id: "wishlist",  label: "Wishlist",    icon: Heart },
  { id: "addresses", label: "Addresses",   icon: MapPin },
  { id: "profile",   label: "Profile",     icon: User },
];

export default function AccountPage() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const wishlistIds = useWishlistStore((s) => s.ids);

  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authUser) { router.push("/login?next=/account"); return; }

    api.get<ApiResponse<Order[]>>("/orders/my")
      .then((res) => { if (res.data.success) setOrders(res.data.data); })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));

    api.get<ApiResponse<UserProfile>>("/users/me")
      .then((res) => {
        if (res.data.success) {
          setProfile(res.data.data);
          setProfileForm({ name: res.data.data.name, phone: res.data.data.phone ?? "" });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [authUser, router]);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    logout();
    router.push("/");
    toast.success("Logged out");
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.put<ApiResponse<UserProfile>>("/users/me", profileForm);
      if (res.data.success) {
        setProfile(res.data.data);
        setEditingProfile(false);
        toast.success("Profile updated!");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!authUser) return null;

  return (
    <div className="bg-[#FAF3E0] min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <div className="bg-white rounded-xl border border-[#E8DCC8] overflow-hidden">
              {/* User badge */}
              <div className="p-5 border-b border-[#E8DCC8] bg-[#6B1F2A]">
                <div className="w-12 h-12 rounded-full bg-[#C9A84C] flex items-center justify-center text-[#1A1A1A] text-xl font-bold mb-2">
                  {authUser.name[0]}
                </div>
                <p className="font-bold text-white text-sm line-clamp-1">{authUser.name}</p>
                <p className="text-white/60 text-xs line-clamp-1">{authUser.email}</p>
              </div>

              <nav className="p-2 space-y-0.5">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-[#6B1F2A] text-white" : "text-[#444] hover:bg-[#FAF3E0] hover:text-[#6B1F2A]"}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                    {id === "orders" && orders.length > 0 && (
                      <span className="ml-auto text-[10px] bg-[#C9A84C] text-[#1A1A1A] font-bold px-1.5 py-0.5 rounded-full">{orders.length}</span>
                    )}
                  </button>
                ))}

                <div className="pt-2 mt-2 border-t border-[#E8DCC8]">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* ── ORDERS ───────────────────────────────── */}
            {tab === "orders" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#1A1A1A] font-serif">My Orders</h2>

                {loadingOrders ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-7 h-7 animate-spin text-[#6B1F2A]" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#E8DCC8] p-14 text-center">
                    <Package className="w-10 h-10 text-[#E8DCC8] mx-auto mb-3" />
                    <p className="text-[#6B6B6B] font-medium mb-1">No orders yet</p>
                    <Link href="/shop" className="text-sm text-[#6B1F2A] font-semibold hover:underline">Start shopping →</Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const meta = STATUS_META[order.status] ?? STATUS_META.pending;
                    const StatusIcon = meta.icon;
                    const timelineIdx = TIMELINE.indexOf(order.status);

                    return (
                      <div key={order._id} className="bg-white rounded-xl border border-[#E8DCC8] overflow-hidden">
                        {/* Order header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#FAF3E0] flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-bold text-sm text-[#1A1A1A]">Order #{order.orderNumber}</p>
                              <p className="text-xs text-[#6B6B6B]">
                                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${meta.color}`}>
                              <StatusIcon className="w-3 h-3" /> {meta.label}
                            </span>
                            <span className="font-bold text-[#1A1A1A]">{rupee(order.total)}</span>
                          </div>
                        </div>

                        {/* Items */}
                        {order.items?.length > 0 && (
                          <div className="px-5 py-3 space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                {item.image && (
                                  <div className="w-10 h-10 rounded-lg border border-[#E8DCC8] overflow-hidden shrink-0 bg-[#FAF3E0]">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#1A1A1A] line-clamp-1">{item.name}</p>
                                  <p className="text-xs text-[#6B6B6B]">Qty: {item.quantity} × {rupee(item.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tracking timeline */}
                        {!["cancelled", "returned"].includes(order.status) && (
                          <div className="px-5 py-4 border-t border-[#FAF3E0]">
                            <div className="flex items-center justify-between relative">
                              <div className="absolute inset-x-4 top-3.5 h-0.5 bg-[#E8DCC8]" />
                              <div
                                className="absolute top-3.5 h-0.5 bg-[#6B1F2A] transition-all"
                                style={{ left: "1rem", width: timelineIdx >= 0 ? `${(timelineIdx / (TIMELINE.length - 1)) * (100 - 8)}%` : "0%" }}
                              />
                              {TIMELINE.map((step, i) => {
                                const done = i <= timelineIdx;
                                return (
                                  <div key={step} className="flex flex-col items-center gap-1 z-10">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? "bg-[#6B1F2A] border-[#6B1F2A] text-white" : "bg-white border-[#E8DCC8] text-[#999]"}`}>
                                      {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                                    </div>
                                    <span className="text-[10px] text-[#6B6B6B] capitalize hidden sm:block">{step}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── WISHLIST ─────────────────────────────── */}
            {tab === "wishlist" && (
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-4">My Wishlist</h2>
                {wishlistIds.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#E8DCC8] p-14 text-center">
                    <Heart className="w-10 h-10 text-[#E8DCC8] mx-auto mb-3" />
                    <p className="text-[#6B6B6B] font-medium mb-1">Your wishlist is empty</p>
                    <Link href="/shop" className="text-sm text-[#6B1F2A] font-semibold hover:underline">Browse products →</Link>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-[#E8DCC8] p-5">
                    <p className="text-[#6B6B6B] text-sm">{wishlistIds.length} item{wishlistIds.length !== 1 ? "s" : ""} in wishlist</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {wishlistIds.map((id) => (
                        <Link key={id} href={`/product/${id}`}
                          className="text-xs bg-[#FAF3E0] border border-[#E8DCC8] text-[#6B1F2A] font-medium px-3 py-1.5 rounded-full hover:bg-[#6B1F2A] hover:text-white transition-colors">
                          View product
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ADDRESSES ────────────────────────────── */}
            {tab === "addresses" && (
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-4">My Addresses</h2>
                <div className="bg-white rounded-xl border border-[#E8DCC8] p-8 text-center">
                  <MapPin className="w-10 h-10 text-[#E8DCC8] mx-auto mb-3" />
                  <p className="text-[#6B6B6B] text-sm mb-3">Addresses are saved during checkout</p>
                  <Link href="/checkout" className="text-sm text-[#6B1F2A] font-semibold hover:underline flex items-center justify-center gap-1">
                    Go to checkout <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* ── PROFILE ──────────────────────────────── */}
            {tab === "profile" && (
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A] font-serif mb-4">My Profile</h2>
                {loadingProfile ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-7 h-7 animate-spin text-[#6B1F2A]" />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-[#E8DCC8] p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#6B1F2A] flex items-center justify-center text-white text-2xl font-bold">
                          {(profile?.name ?? authUser.name)[0]}
                        </div>
                        <div>
                          <p className="font-bold text-[#1A1A1A] text-lg">{profile?.name ?? authUser.name}</p>
                          <p className="text-sm text-[#6B6B6B]">{profile?.email ?? authUser.email}</p>
                        </div>
                      </div>
                      {!editingProfile && (
                        <button onClick={() => setEditingProfile(true)}
                          className="flex items-center gap-1.5 px-3 py-2 border border-[#E8DCC8] text-sm text-[#444] rounded-lg hover:border-[#6B1F2A] hover:text-[#6B1F2A] transition-colors">
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                    </div>

                    {editingProfile ? (
                      <div className="space-y-3 border-t border-[#FAF3E0] pt-5">
                        <div>
                          <label className="text-xs text-[#6B6B6B] mb-1 block font-medium">Full Name</label>
                          <input
                            value={profileForm.name}
                            onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B1F2A]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#6B6B6B] mb-1 block font-medium">Phone</label>
                          <input
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                            className="w-full border border-[#E8DCC8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#6B1F2A]"
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={handleSaveProfile} disabled={savingProfile}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#6B1F2A] text-white text-sm font-semibold rounded-lg hover:bg-[#5a1a23] transition-colors disabled:opacity-60">
                            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
                          </button>
                          <button onClick={() => setEditingProfile(false)}
                            className="px-4 py-2.5 border border-[#E8DCC8] text-sm text-[#444] rounded-lg hover:border-[#6B1F2A] transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-[#FAF3E0] pt-5 space-y-3">
                        {[
                          { icon: Mail, label: "Email", value: profile?.email ?? authUser.email },
                          { icon: Phone, label: "Phone", value: profile?.phone ?? "Not set" },
                          { icon: User, label: "Role", value: profile?.role ?? "customer" },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-center gap-3 text-sm">
                            <Icon className="w-4 h-4 text-[#C9A84C] shrink-0" />
                            <span className="text-[#6B6B6B] w-16 shrink-0">{label}</span>
                            <span className="text-[#1A1A1A] font-medium capitalize">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
