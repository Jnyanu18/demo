"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight, ChevronDown, ChevronUp, SlidersHorizontal, Star,
  ShoppingCart, Heart, X, Grid2X2, List, Search, Loader2,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { api, ApiResponse } from "@/lib/api";
import { Product } from "@/types";
import toast from "react-hot-toast";

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");
const disc = (p: number, m: number) => Math.round(((m - p) / m) * 100);

const CATEGORIES = ["sarees", "kurta-fabrics", "dress-materials", "blouse-pieces", "cotton-fabrics", "electronics", "beauty", "home-decor", "sports", "grocery", "offers"];
const FABRICS = ["Pure Silk", "Chanderi Cotton", "Kanjivaram Silk", "Block-Print Cotton", "Tussar Silk", "Linen Cotton", "Georgette", "Handloom Silk", "Electronics", "Skincare", "Makeup", "Ceramic", "Cotton", "Fitness", "Outdoor", "Organic", "Packaged", "Fresh", "Clearance", "Festive", "Bundle"];
const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Popular", value: "popular" },
  { label: "Highest Discount", value: "discount" },
];

function FilterSection({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#E8DCC8] pb-4">
      <button onClick={onToggle} className="flex items-center justify-between w-full py-3 text-sm font-semibold text-[#1A1A1A] hover:text-[#6B1F2A] transition-colors">
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="space-y-2 mt-1">{children}</div>}
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const wished = useWishlistStore((s) => s.ids.includes(p._id));
  const [adding, setAdding] = useState(false);
  const img = p.images[0]?.url ?? "/images/banarasi.png";

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-[#E8DCC8] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      <div className="relative aspect-[3/4] bg-[#FAF3E0] overflow-hidden">
        <Link href={`/product/${p._id}`}>
          {img.startsWith('http') ? (
            <Image unoptimized src={img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 50vw, 25vw" />
          ) : (
            <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 50vw, 25vw" />
          )}
        </Link>
        <span className="absolute top-2 left-2 bg-[#6B1F2A] text-[#FAF3E0] text-[11px] font-bold px-2 py-0.5 rounded">{disc(p.price, p.mrp)}% OFF</span>
        {p.stock < 5 && p.stock > 0 && (
          <span className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Only {p.stock} left!</span>
        )}
        {p.stock === 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Out of Stock</span></div>}
        <button
          onClick={() => { toggle(p._id); toast.success(wished ? "Removed!" : "Wishlisted!"); }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full shadow flex items-center justify-center transition-all ${wished ? "bg-[#6B1F2A] text-white" : "bg-white text-[#999] hover:text-[#6B1F2A]"}`}
        >
          <Heart className={`w-3.5 h-3.5 ${wished ? "fill-white" : ""}`} />
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider">{p.fabric}</p>
        <Link href={`/product/${p._id}`} className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 leading-snug hover:text-[#6B1F2A] transition-colors">{p.name}</Link>
        {p.ratings.count > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-green-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
              <span>{p.ratings.average.toFixed(1)}</span><Star className="w-2.5 h-2.5 fill-white" />
            </div>
            <span className="text-[11px] text-[#6B6B6B]">({p.ratings.count})</span>
          </div>
        )}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-[#1A1A1A]">{rupee(p.price)}</span>
          <span className="text-xs text-[#999] line-through">{rupee(p.mrp)}</span>
        </div>
        <button
          disabled={p.stock === 0}
          onClick={() => {
            if (p.stock === 0) return;
            setAdding(true);
            addItem(p);
            toast.success("Added to cart!");
            setTimeout(() => setAdding(false), 600);
          }}
          className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-all ${p.stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : adding ? "bg-green-600 text-white" : "bg-[#6B1F2A]/10 text-[#6B1F2A] hover:bg-[#6B1F2A] hover:text-white"}`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {p.stock === 0 ? "Out of Stock" : adding ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E8DCC8] overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-[#E8DCC8]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#E8DCC8] rounded w-1/3" />
        <div className="h-4 bg-[#E8DCC8] rounded w-4/5" />
        <div className="h-3 bg-[#E8DCC8] rounded w-1/2" />
        <div className="h-8 bg-[#E8DCC8] rounded" />
      </div>
    </div>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [openSections, setOpenSections] = useState({ category: true, fabric: true, price: true, rating: false });

  const category = searchParams.get("category") ?? "";
  const fabric = searchParams.get("fabric") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Number(searchParams.get("page") ?? "1");
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const minRating = searchParams.get("minRating") ?? "";
  const search = searchParams.get("search") ?? "";

  const PER_PAGE = 12;
  const totalPages = Math.ceil(total / PER_PAGE);

  const buildParams = useCallback(() => {
    const p: Record<string, string> = { limit: String(PER_PAGE), page: String(page), sort };
    if (category) p.category = category;
    if (fabric) p.fabric = fabric;
    if (minPrice) p.minPrice = minPrice;
    if (maxPrice) p.maxPrice = maxPrice;
    if (minRating) p.minRating = minRating;
    if (search) p.search = search;
    return new URLSearchParams(p).toString();
  }, [category, fabric, minPrice, maxPrice, minRating, search, sort, page]);

  useEffect(() => {
    setLoading(true);
    api.get<ApiResponse<{ items: Product[]; total: number }>>(`/products?${buildParams()}`)
      .then((res) => {
        if (res.data.success) {
          setProducts(res.data.data.items);
          setTotal(res.data.data.total);
        }
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, [buildParams]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) params.set("search", searchInput);
      else params.delete("search");
      params.set("page", "1");
      router.push(`/shop?${params.toString()}`);
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/shop?${params.toString()}`);
  };

  const toggleSection = (k: keyof typeof openSections) => setOpenSections((s) => ({ ...s, [k]: !s[k] }));

  const clearAll = () => router.push("/shop");
  const hasFilters = !!(category || fabric || minPrice || maxPrice || minRating || search);

  const Sidebar = () => (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-[#6B1F2A]" /> Filters
        </h3>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-[#6B1F2A] font-semibold hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Clear All
          </button>
        )}
      </div>

      <FilterSection title="Category" open={openSections.category} onToggle={() => toggleSection("category")}>
        {CATEGORIES.map((c) => (
          <label key={c} className="flex items-center gap-2 cursor-pointer group">
            <input type="radio" name="category" checked={category === c} onChange={() => setParam("category", c === category ? "" : c)} className="accent-[#6B1F2A] w-3.5 h-3.5" />
            <span className="text-sm text-[#444] group-hover:text-[#6B1F2A] transition-colors capitalize">{c.replace(/-/g, " ")}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Fabric Type" open={openSections.fabric} onToggle={() => toggleSection("fabric")}>
        {FABRICS.map((f) => (
          <label key={f} className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={fabric === f} onChange={() => setParam("fabric", fabric === f ? "" : f)} className="accent-[#6B1F2A] w-3.5 h-3.5 rounded" />
            <span className="text-sm text-[#444] group-hover:text-[#6B1F2A] transition-colors">{f}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Price Range" open={openSections.price} onToggle={() => toggleSection("price")}>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Under ₹999", min: "", max: "999" },
            { label: "₹999–₹2,999", min: "999", max: "2999" },
            { label: "₹2,999–₹5,999", min: "2999", max: "5999" },
            { label: "Above ₹5,999", min: "5999", max: "" },
          ].map((r) => (
            <button key={r.label}
              onClick={() => { setParam("minPrice", r.min); setParam("maxPrice", r.max); }}
              className={`text-xs py-1.5 px-2 rounded border transition-colors text-left ${minPrice === r.min && maxPrice === r.max ? "border-[#6B1F2A] bg-[#6B1F2A]/10 text-[#6B1F2A] font-semibold" : "border-[#E8DCC8] text-[#444] hover:border-[#6B1F2A]/50"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Rating" open={openSections.rating} onToggle={() => toggleSection("rating")}>
        {[4, 3].map((r) => (
          <label key={r} className="flex items-center gap-2 cursor-pointer group">
            <input type="radio" name="rating" checked={minRating === String(r)} onChange={() => setParam("minRating", minRating === String(r) ? "" : String(r))} className="accent-[#6B1F2A] w-3.5 h-3.5" />
            <span className="flex items-center gap-1 text-sm text-[#444] group-hover:text-[#6B1F2A] transition-colors">
              {r}★ <span className="text-[#999]">& above</span>
            </span>
          </label>
        ))}
      </FilterSection>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 bg-[#FAF3E0] min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mb-6">
        <Link href="/" className="hover:text-[#6B1F2A] transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        {category ? (
          <>
            <Link href="/shop" className="hover:text-[#6B1F2A] transition-colors">Shop</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-[#1A1A1A] capitalize">{category.replace(/-/g, " ")}</span>
          </>
        ) : (
          <span className="font-semibold text-[#1A1A1A]">All Products</span>
        )}
      </nav>

      <div className="flex gap-6">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-56 shrink-0 bg-white rounded-xl border border-[#E8DCC8] p-5 h-fit sticky top-20">
          <Sidebar />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-lg font-bold text-[#1A1A1A] font-serif capitalize">
                {category ? category.replace(/-/g, " ") : "All Products"}
              </h1>
              {!loading && (
                <p className="text-sm text-[#6B6B6B]">
                  {total > 0 ? `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} of ${total} products` : "No products found"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-[#E8DCC8] rounded-lg text-sm font-semibold text-[#444] hover:border-[#6B1F2A] hover:text-[#6B1F2A] transition-colors">
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {hasFilters && <span className="w-4 h-4 bg-[#6B1F2A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">!</span>}
              </button>
              <div className="hidden sm:flex items-center gap-1 bg-white border border-[#E8DCC8] rounded-lg p-1">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-[#6B1F2A] text-white" : "text-[#999] hover:text-[#6B1F2A]"}`}><Grid2X2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-[#6B1F2A] text-white" : "text-[#999] hover:text-[#6B1F2A]"}`}><List className="w-3.5 h-3.5" /></button>
              </div>
              <select value={sort} onChange={(e) => setParam("sort", e.target.value)}
                className="appearance-none bg-white border border-[#E8DCC8] text-sm font-medium text-[#444] pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:border-[#6B1F2A] cursor-pointer">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-[#E8DCC8] rounded-lg px-4 py-2.5 mb-5 focus-within:border-[#6B1F2A] transition-all">
            <Search className="w-4 h-4 text-[#999]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search sarees, fabrics, dress materials…"
              className="flex-1 text-sm focus:outline-none text-[#1A1A1A] placeholder-[#999] bg-transparent"
            />
            {searchInput && <button onClick={() => setSearchInput("")}><X className="w-4 h-4 text-[#999] hover:text-[#6B1F2A]" /></button>}
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {category && <span className="flex items-center gap-1 bg-[#6B1F2A]/10 text-[#6B1F2A] text-xs font-semibold px-2 py-1 rounded-full capitalize">{category.replace(/-/g, " ")} <button onClick={() => setParam("category", "")}><X className="w-2.5 h-2.5" /></button></span>}
              {fabric && <span className="flex items-center gap-1 bg-[#6B1F2A]/10 text-[#6B1F2A] text-xs font-semibold px-2 py-1 rounded-full">{fabric} <button onClick={() => setParam("fabric", "")}><X className="w-2.5 h-2.5" /></button></span>}
              {(minPrice || maxPrice) && <span className="flex items-center gap-1 bg-[#6B1F2A]/10 text-[#6B1F2A] text-xs font-semibold px-2 py-1 rounded-full">Price filter <button onClick={() => { setParam("minPrice", ""); setParam("maxPrice", ""); }}><X className="w-2.5 h-2.5" /></button></span>}
              {search && <span className="flex items-center gap-1 bg-[#6B1F2A]/10 text-[#6B1F2A] text-xs font-semibold px-2 py-1 rounded-full">"{search}" <button onClick={() => { setSearchInput(""); setParam("search", ""); }}><X className="w-2.5 h-2.5" /></button></span>}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#6B6B6B] text-lg mb-2">No products found</p>
              <button onClick={clearAll} className="text-sm text-[#6B1F2A] font-semibold hover:underline">Clear filters and try again</button>
            </div>
          ) : (
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {products.map((p) => <ProductCard key={p._id} p={p} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setParam("page", String(page - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 bg-white border border-[#E8DCC8] rounded-lg text-sm font-semibold text-[#444] hover:border-[#6B1F2A] hover:text-[#6B1F2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pg) => (
                <button key={pg}
                  onClick={() => setParam("page", String(pg))}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${pg === page ? "bg-[#6B1F2A] text-white" : "bg-white border border-[#E8DCC8] text-[#444] hover:border-[#6B1F2A] hover:text-[#6B1F2A]"}`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setParam("page", String(page + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-4 py-2 bg-white border border-[#E8DCC8] rounded-lg text-sm font-semibold text-[#444] hover:border-[#6B1F2A] hover:text-[#6B1F2A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E8DCC8] px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-[#1A1A1A]">Filters</h3>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4"><Sidebar /></div>
            <div className="sticky bottom-0 bg-white border-t border-[#E8DCC8] p-4">
              <button onClick={() => setSidebarOpen(false)} className="w-full py-3 bg-[#6B1F2A] text-white font-semibold rounded-lg hover:bg-[#5a1a23] transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#FAF3E0]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B1F2A]" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
