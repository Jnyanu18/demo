"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, Edit2, Search, Loader2, X, Check,
  Package, ToggleLeft, ToggleRight, Image as ImageIcon,
} from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import { Product } from "@/types";
import toast from "react-hot-toast";

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");

const CATEGORIES = [
  "sarees",
  "kurta-fabrics",
  "dress-materials",
  "blouse-pieces",
  "cotton-fabrics",
  "electronics",
  "home",
  "beauty",
  "sports",
  "grocery",
  "offers",
];
const FABRICS = [
  "Pure Silk",
  "Chanderi Cotton",
  "Kanjivaram Silk",
  "Block-Print Cotton",
  "Tussar Silk",
  "Linen Cotton",
  "Georgette",
  "Handloom Silk",
  "Mobile",
  "Audio",
  "Smart Watch",
  "Accessory",
  "Decor",
  "Kitchen",
  "Storage",
  "Lighting",
  "Skincare",
  "Makeup",
  "Haircare",
  "Fragrance",
  "Fitness",
  "Outdoor",
  "Footwear",
  "Organic",
  "Staples",
  "Snacks",
  "Beverage",
  "Clearance",
  "Combo",
  "Festive Deal",
  "Limited Deal",
];

type ProductForm = {
  name: string;
  description: string;
  fabric: string;
  category: string;
  price: string;
  mrp: string;
  stock: string;
  colors: string;
  care_instructions: string;
  occasion: string;
  isFeatured: boolean;
};

const EMPTY_FORM: ProductForm = {
  name: "", description: "", fabric: "", category: "", price: "", mrp: "",
  stock: "", colors: "", care_instructions: "", occasion: "", isFeatured: false,
};

function ProductFormModal({
  product, onClose, onSaved,
}: {
  product?: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductForm>(
    product
      ? {
          name: product.name,
          description: product.description,
          fabric: product.fabric,
          category: product.category,
          price: String(product.price),
          mrp: String(product.mrp),
          stock: String(product.stock),
          colors: product.colors.join(", "),
          care_instructions: product.care_instructions,
          occasion: product.occasion ?? "",
          isFeatured: product.isFeatured,
        }
      : EMPTY_FORM
  );
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof ProductForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price || !form.mrp || !form.stock) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (files) Array.from(files).forEach((f) => fd.append("images", f));

      if (product) {
        await api.put(`/products/${product._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product updated!");
      } else {
        await api.post("/products", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product created!");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#1e0a0f] border border-white/15 rounded-2xl p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-white text-lg font-serif">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Product Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Banarasi Silk Saree" className={inp} required />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Category *</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={`${inp} bg-[#1e0a0f]`} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#1e0a0f] capitalize">{c.replace(/-/g, " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Fabric *</label>
              <select value={form.fabric} onChange={(e) => set("fabric", e.target.value)} className={`${inp} bg-[#1e0a0f]`} required>
                <option value="">Select fabric</option>
                {FABRICS.map((f) => (
                  <option key={f} value={f} className="bg-[#1e0a0f]">{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Price (₹) *</label>
              <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="1499" className={inp} min={1} required />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">MRP (₹) *</label>
              <input type="number" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} placeholder="2499" className={inp} min={1} required />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Stock *</label>
              <input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="25" className={inp} min={0} required />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Occasion</label>
              <input value={form.occasion} onChange={(e) => set("occasion", e.target.value)} placeholder="Wedding, Festive, Daily…" className={inp} />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Colors (comma-separated)</label>
              <input value={form.colors} onChange={(e) => set("colors", e.target.value)} placeholder="Burgundy, Gold, Cream" className={inp} />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Care Instructions *</label>
              <input value={form.care_instructions} onChange={(e) => set("care_instructions", e.target.value)} placeholder="Dry clean recommended…" className={inp} />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Description *</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the fabric, weave, and occasion…" rows={3} className={`${inp} resize-none`} required />
            </div>

            {/* Image upload */}
            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Product Images</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 border-dashed rounded-lg text-sm text-white/50 hover:text-white hover:border-[#C9A84C]/40 transition-colors w-full justify-center"
              >
                <ImageIcon className="w-4 h-4" />
                {files && files.length > 0
                  ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                  : product
                  ? "Upload new images (replaces existing)"
                  : "Click to upload images (Cloudinary)"}
              </button>
            </div>

            {/* Featured toggle */}
            <div className="col-span-2 flex items-center gap-3">
              <button type="button" onClick={() => set("isFeatured", !form.isFeatured)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                {form.isFeatured
                  ? <ToggleRight className="w-6 h-6 text-[#C9A84C]" />
                  : <ToggleLeft className="w-6 h-6 text-white/30" />}
                Mark as Featured
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#C9A84C] text-[#1A1A1A] font-bold rounded-lg hover:bg-[#b8943e] transition-colors disabled:opacity-60 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {product ? "Save Changes" : "Create Product"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-white/10 text-white/60 hover:text-white rounded-lg text-sm transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50", page: "1", includeInactive: "true" });
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await api.get<ApiResponse<{ items: Product[]; total: number }>>(`/products?${params}`);
      if (res.data.success) {
        setProducts(res.data.data.items);
        setTotal(res.data.data.total);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setTimeout(load, 400);
    return () => clearTimeout(id);
  }, [search, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      load();
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (p: Product) => {
    setToggling(p._id);
    try {
      await api.patch(`/products/${p._id}`, { isActive: !p.isActive });
      toast.success(p.isActive ? "Product hidden" : "Product visible");
      load();
    } catch {
      toast.error("Failed to update");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Products</h1>
          <p className="text-white/40 text-sm mt-1">{total} products</p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] text-[#1A1A1A] font-bold rounded-lg hover:bg-[#b8943e] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {showForm && (
        <ProductFormModal
          product={editing}
          onClose={() => { setShowForm(false); setEditing(undefined); }}
          onSaved={load}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-[#C9A84C]/40 transition-all flex-1 min-w-48">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/30 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 text-sm text-white/70 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C]/40 cursor-pointer"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#1e0a0f] capitalize">{c.replace(/-/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="aspect-[3/4] bg-white/5 rounded-lg mb-3" />
              <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white/3 border border-white/10 rounded-xl">
          <Package className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">No products found</p>
          {(search || categoryFilter) && (
            <button onClick={() => { setSearch(""); setCategoryFilter(""); }} className="mt-2 text-sm text-[#C9A84C] hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const img = p.images[0]?.url ?? `https://placehold.co/700x900/6B1F2A/FAF3E0?text=${encodeURIComponent(p.name)}`;
            const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);

            return (
              <div key={p._id} className={`bg-white/5 border rounded-xl overflow-hidden transition-all ${p.isActive ? "border-white/10 hover:border-[#C9A84C]/30" : "border-red-900/30 opacity-60"}`}>
                {/* Image */}
                <div className="relative aspect-[3/4] bg-black/20">
                  <img src={img} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {discount > 0 && (
                      <span className="bg-[#6B1F2A] text-white text-[11px] font-bold px-2 py-0.5 rounded">{discount}% OFF</span>
                    )}
                    {p.isFeatured && (
                      <span className="bg-[#C9A84C] text-[#1A1A1A] text-[11px] font-bold px-2 py-0.5 rounded">Featured</span>
                    )}
                    {!p.isActive && (
                      <span className="bg-red-900/80 text-red-300 text-[11px] font-bold px-2 py-0.5 rounded">Hidden</span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider">{p.fabric}</p>
                    <p className="text-sm font-semibold text-white line-clamp-1">{p.name}</p>
                    <p className="text-[11px] text-white/40 capitalize">{p.category.replace(/-/g, " ")}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-white">{rupee(p.price)}</span>
                    <span className="text-xs text-white/40 line-through">{rupee(p.mrp)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Stock: <span className={p.stock < 5 ? "text-red-400 font-bold" : "text-white/70"}>{p.stock}</span></span>
                    <span>Sold: {p.soldCount}</span>
                    {p.ratings.count > 0 && <span>★ {p.ratings.average.toFixed(1)} ({p.ratings.count})</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setEditing(p); setShowForm(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-[#C9A84C]/40 rounded-lg text-xs font-medium transition-all"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={toggling === p._id}
                      className="flex items-center justify-center p-2 bg-white/5 border border-white/10 text-white/60 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 rounded-lg transition-all disabled:opacity-40"
                      title={p.isActive ? "Hide product" : "Show product"}
                    >
                      {toggling === p._id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : p.isActive
                        ? <ToggleRight className="w-3.5 h-3.5 text-green-400" />
                        : <ToggleLeft className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(p._id, p.name)}
                      disabled={deleting === p._id}
                      className="flex items-center justify-center p-2 bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/30 rounded-lg transition-all disabled:opacity-40"
                    >
                      {deleting === p._id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
