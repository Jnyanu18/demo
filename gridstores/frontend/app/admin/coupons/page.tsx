"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Tag, Loader2, X, Check } from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";

type Coupon = {
  _id: string;
  code: string;
  type: "flat" | "percent";
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
};

type CouponForm = {
  code: string;
  type: "flat" | "percent";
  value: number;
  minOrder: number;
  maxUses: number;
  expiresAt: string;
  isActive: boolean;
};

function CouponFormModal({ coupon, onClose, onSaved }: { coupon?: Coupon; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CouponForm>({
    defaultValues: coupon ? {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt?.slice(0, 10) ?? "",
      isActive: coupon.isActive,
    } : {
      code: "",
      type: "flat" as const,
      value: 0,
      minOrder: 0,
      maxUses: 100,
      expiresAt: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: CouponForm) => {
    try {
      if (coupon) {
        await api.put(`/coupons/${coupon._id}`, data);
        toast.success("Coupon updated!");
      } else {
        await api.post("/coupons", data);
        toast.success("Coupon created!");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save coupon");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1e0a0f] border border-white/15 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white font-serif">{coupon ? "Edit Coupon" : "Create Coupon"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Coupon Code *</label>
              <input {...register("code")} placeholder="e.g. SAVE200" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 uppercase" />
              {errors.code && <p className="text-xs text-red-400 mt-1">{errors.code.message}</p>}
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Type *</label>
              <select {...register("type")} className="w-full bg-[#1e0a0f] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40">
                <option value="flat">Flat (₹)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Value *</label>
              <input {...register("value", )} type="number" min={1} placeholder="e.g. 200" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40" />
              {errors.value && <p className="text-xs text-red-400 mt-1">{errors.value.message}</p>}
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Min Order (₹)</label>
              <input {...register("minOrder", )} type="number" min={0} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40" />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Max Uses</label>
              <input {...register("maxUses", )} type="number" min={1} placeholder="100" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40" />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Expires At *</label>
              <input {...register("expiresAt")} type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40" />
              {errors.expiresAt && <p className="text-xs text-red-400 mt-1">{errors.expiresAt.message}</p>}
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input {...register("isActive")} type="checkbox" id="isActive" className="accent-[#C9A84C] w-4 h-4" />
              <label htmlFor="isActive" className="text-sm text-white/70">Active (usable by customers)</label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C9A84C] text-[#1A1A1A] font-bold rounded-lg hover:bg-[#b8943e] transition-colors disabled:opacity-60 text-sm">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {coupon ? "Update" : "Create"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-white/10 text-white/60 hover:text-white rounded-lg text-sm transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | undefined>();

  const load = () => {
    api.get<ApiResponse<Coupon[]>>("/coupons")
      .then((res) => { if (res.data.success) setCoupons(res.data.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success("Coupon deleted");
      load();
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/coupons/${id}`, { isActive: !isActive });
      load();
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Coupons</h1>
          <p className="text-white/40 text-sm mt-1">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-[#1A1A1A] font-bold rounded-lg hover:bg-[#b8943e] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {showForm && (
        <CouponFormModal
          coupon={editing}
          onClose={() => { setShowForm(false); setEditing(undefined); }}
          onSaved={load}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-white/30" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 bg-white/3 border border-white/10 rounded-xl">
          <Tag className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">No coupons yet. Create your first one!</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Discount</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Min Order</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Usage</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Expires</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded text-xs">{c.code}</span>
                    </td>
                    <td className="px-5 py-3.5 text-white font-semibold">
                      {c.type === "flat" ? `₹${c.value} off` : `${c.value}% off`}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-white/60">₹{c.minOrder}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-white/60">{c.usedCount} / {c.maxUses}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={`text-xs ${expired ? "text-red-400" : "text-white/50"}`}>
                        {new Date(c.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {expired && " (Expired)"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleActive(c._id, c.isActive)}
                        className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${c.isActive && !expired ? "bg-green-900/40 text-green-300 hover:bg-green-900/60" : "bg-red-900/40 text-red-300 hover:bg-red-900/60"}`}>
                        {c.isActive && !expired ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditing(c); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-white/40 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteCoupon(c._id, c.code)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
