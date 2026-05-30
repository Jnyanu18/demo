"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Star, ShoppingCart, Heart,
  Truck, RotateCcw, Shield, Headphones, ArrowRight, Eye, Tag,
  Sparkles, Loader2,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { api, ApiResponse } from "@/lib/api";
import { Product } from "@/types";
import toast from "react-hot-toast";

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");
const disc = (price: number, mrp: number) => Math.round(((mrp - price) / mrp) * 100);

// ─── Static hero slides (brand-themed) ──────────────────────────────────────
const HERO_SLIDES = [
  {
    id: 1,
    eyebrow: "NEW SEASON ARRIVALS",
    headline: "Drape Yourself\nin Pure Silk",
    sub: "Handcrafted Banarasi, Kanjivaram & Chanderi sarees — curated for every occasion.",
    cta: "Explore Sarees",
    href: "/shop?category=sarees",
    badge: "✨ Bestsellers",
    accent: "#6B1F2A",
    img: "/images/banarasi.png",
  },
  {
    id: 2,
    eyebrow: "FESTIVE COLLECTION",
    headline: "Kurta Fabrics\nFor Every Mood",
    sub: "Chanderi, Linen, Cotton — choose your fabric, stitch your story.",
    cta: "Shop Fabrics",
    href: "/shop?category=kurta-fabrics",
    badge: "🎉 Festive Sale",
    accent: "#6B1F2A",
    img: "/images/chanderi.png",
  },
  {
    id: 3,
    eyebrow: "HANDLOOM HERITAGE",
    headline: "Dress Materials\nFrom Craft Hubs",
    sub: "Block-printed Jaipuri, Maheshwari handloom & more — straight from the weaver.",
    cta: "Shop Now",
    href: "/shop?category=dress-materials",
    badge: "🌿 Handcrafted",
    accent: "#6B1F2A",
    img: "/images/jaipuri.png",
  },
];

const STATIC_CATEGORIES = [
  { name: "Sarees", slug: "sarees", img: "/images/banarasi.png", count: "20+ varieties" },
  { name: "Kurta Fabrics", slug: "kurta-fabrics", img: "/images/chanderi.png", count: "Chanderi, Linen & more" },
  { name: "Dress Materials", slug: "dress-materials", img: "/images/jaipuri.png", count: "Block prints & handloom" },
  { name: "Blouse Pieces", slug: "blouse-pieces", img: "/images/tussar.png", count: "Silk, Brocade & more" },
  { name: "Cotton Fabrics", slug: "cotton-fabrics", img: "/images/linen.png", count: "Everyday comfort" },
  { name: "Electronics", slug: "electronics", img: "https://placehold.co/400x400/6B1F2A/FAF3E0?text=Elec", count: "Latest gadgets" },
  { name: "Beauty", slug: "beauty", img: "https://placehold.co/400x400/C9A84C/1A1A1A?text=Beauty", count: "Skincare & Makeup" },
  { name: "Home Decor", slug: "home-decor", img: "https://placehold.co/400x400/1A1A1A/FAF3E0?text=Decor", count: "Vases, Cushions & more" },
  { name: "Sports", slug: "sports", img: "https://placehold.co/400x400/6B1F2A/C9A84C?text=Sports", count: "Activewear & Gear" },
  { name: "Grocery", slug: "grocery", img: "https://placehold.co/400x400/228B22/FAF3E0?text=Grocery", count: "Daily Essentials" },
  { name: "Offers", slug: "offers", img: "https://placehold.co/400x400/FF4500/FAF3E0?text=Offers", count: "Special Deals" },
];

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 bg-green-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
        <span>{rating.toFixed(1)}</span>
        <Star className="w-2.5 h-2.5 fill-white" />
      </div>
      <span className="text-[11px] text-[#6B6B6B]">({count})</span>
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
        {p.isFeatured && (
          <span className="absolute top-2 right-10 bg-[#C9A84C] text-white text-[10px] font-bold px-2 py-0.5 rounded">Featured</span>
        )}
        <button
          onClick={() => { toggle(p._id); toast.success(wished ? "Removed from wishlist" : "Added to wishlist"); }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full shadow flex items-center justify-center transition-all ${wished ? "bg-[#6B1F2A] text-white" : "bg-white text-[#999] hover:text-[#6B1F2A]"}`}
        >
          <Heart className={`w-3.5 h-3.5 ${wished ? "fill-white" : ""}`} />
        </button>
        <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
          <Link href={`/product/${p._id}`} className="flex items-center justify-center gap-1.5 w-full bg-white/90 backdrop-blur text-[#6B1F2A] text-xs font-semibold py-2 rounded-lg hover:bg-[#6B1F2A] hover:text-white transition-colors">
            <Eye className="w-3.5 h-3.5" /> Quick View
          </Link>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider">{p.fabric}</p>
        <Link href={`/product/${p._id}`} className="text-sm font-semibold text-[#1A1A1A] line-clamp-2 leading-snug hover:text-[#6B1F2A] transition-colors">{p.name}</Link>
        {p.ratings.count > 0 && <StarRow rating={p.ratings.average} count={p.ratings.count} />}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold text-[#1A1A1A]">{rupee(p.price)}</span>
          <span className="text-xs text-[#999] line-through">{rupee(p.mrp)}</span>
        </div>
        <button
          onClick={() => {
            setAdding(true);
            addItem(p);
            toast.success("Added to cart!");
            setTimeout(() => setAdding(false), 600);
          }}
          className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-all ${adding ? "bg-green-600 text-white" : "bg-[#6B1F2A]/10 text-[#6B1F2A] hover:bg-[#6B1F2A] hover:text-white"}`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {adding ? "Added!" : "Add to Cart"}
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

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide((c) => (c + 1) % HERO_SLIDES.length), 5000);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  useEffect(() => {
    api.get<ApiResponse<{ items: Product[] }>>("/products?isFeatured=true&limit=8")
      .then((res) => { if (res.data.success) setFeatured(res.data.data.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const goTo = (i: number) => { setSlide(i); resetTimer(); };
  const prev = () => goTo((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const next = () => goTo((slide + 1) % HERO_SLIDES.length);
  const cur = HERO_SLIDES[slide];

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      await api.post("/newsletter/subscribe", { email });
      toast.success("Subscribed! Thank you.");
      setEmail("");
    } catch {
      toast.error("Already subscribed or invalid email.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-0 bg-[#FAF3E0]">
      {/* ── Hero Carousel ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#6B1F2A]" style={{ minHeight: 520 }}>
        <div className="mx-auto max-w-[1400px] px-4 py-14 md:py-20 flex items-center">
          <div className="grid md:grid-cols-2 gap-8 items-center w-full">
            <div className="text-white space-y-5" key={slide}>
              <span className="inline-block bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold px-3 py-1.5 rounded-full tracking-widest uppercase">
                {cur.badge}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight whitespace-pre-line font-serif">
                {cur.headline}
              </h1>
              <p className="text-white/80 text-base max-w-md leading-relaxed">{cur.sub}</p>
              <div className="flex gap-3 flex-wrap">
                <Link href={cur.href} className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#1A1A1A] font-bold px-7 py-3.5 rounded-lg hover:bg-[#b8943e] transition-all text-sm">
                  {cur.cta} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/shop" className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-6 py-3.5 rounded-lg hover:bg-white/10 transition-all text-sm">
                  View All
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center" key={`img-${slide}`}>
              <div className="relative w-64 h-72 lg:w-80 lg:h-96">
                <Image src={cur.img} alt={cur.headline} fill className="object-contain drop-shadow-2xl" sizes="320px" priority />
              </div>
            </div>
          </div>
        </div>
        <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors" aria-label="Previous">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors" aria-label="Next">
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className={`rounded-full transition-all ${i === slide ? "w-6 h-2 bg-[#C9A84C]" : "w-2 h-2 bg-white/50 hover:bg-white/70"}`} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* ── Trust Bar ─────────────────────────────────────── */}
      <section className="bg-[#1A1A1A] py-3">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[#FAF3E0] text-xs font-medium">
            {[
              { icon: Truck, label: "Free Delivery above ₹999" },
              { icon: RotateCcw, label: "7-Day Easy Returns" },
              { icon: Shield, label: "Secure Payments" },
              { icon: Headphones, label: "24/7 Support" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-[#C9A84C]" /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Grid ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] font-serif">Shop by Category</h2>
            <p className="text-sm text-[#6B6B6B] mt-1">Handpicked textile collections</p>
          </div>
          <Link href="/shop" className="flex items-center gap-1 text-sm font-semibold text-[#6B1F2A] hover:underline">
            All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {STATIC_CATEGORIES.map((cat) => (
            <Link key={cat.name} href={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-[#E8DCC8] bg-white hover:border-[#6B1F2A] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#FAF3E0] shadow-sm group-hover:scale-105 transition-transform">
                {cat.img.startsWith('http') ? (
                  <Image unoptimized src={cat.img} alt={cat.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <Image src={cat.img} alt={cat.name} fill className="object-cover" sizes="80px" />
                )}
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-[#1A1A1A]">{cat.name}</p>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">{cat.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────── */}
      <section className="bg-white py-14 border-y border-[#E8DCC8]">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C9A84C]" />
                <h2 className="text-2xl font-bold text-[#1A1A1A] font-serif">Featured Products</h2>
              </div>
              <p className="text-sm text-[#6B6B6B] mt-1">Our most-loved textiles this season</p>
            </div>
            <Link href="/shop?isFeatured=true" className="flex items-center gap-1 text-sm font-semibold text-[#6B1F2A] hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featured.map((p) => <ProductCard key={p._id} p={p} />)}
            </div>
          ) : (
            <p className="text-center text-[#6B6B6B] py-12">No featured products yet. <Link href="/shop" className="text-[#6B1F2A] font-semibold hover:underline">Browse all →</Link></p>
          )}
        </div>
      </section>

      {/* ── Banner Strip ──────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { title: "Banarasi Silk Sarees", sub: "Wedding & occasion wear", href: "/shop?category=sarees&fabric=silk", img: "/images/banarasi.png" },
            { title: "Festive Fabrics", sub: "Chanderi, Silk & more", href: "/shop?category=kurta-fabrics", img: "/images/chanderi.png" },
            { title: "Everyday Cotton", sub: "Light, breathable & soft", href: "/shop?category=cotton-fabrics", img: "/images/linen.png" },
          ].map((b) => (
            <Link key={b.title} href={b.href}
              className="group relative rounded-xl overflow-hidden h-44 bg-[#6B1F2A] hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <Image src={b.img} alt={b.title} fill className="object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-300" sizes="(max-width:768px) 100vw, 33vw" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <h3 className="text-white font-bold text-lg font-serif">{b.title}</h3>
                <p className="text-white/70 text-sm">{b.sub}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[#C9A84C] text-xs font-bold">
                  Shop Now <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why Shop With Us ─────────────────────────────── */}
      <section className="bg-[#1A1A1A] py-14">
        <div className="mx-auto max-w-[1400px] px-4">
          <h2 className="text-center text-2xl font-bold text-[#FAF3E0] mb-10 font-serif">Why Shop with Grid Stores?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: "Free Delivery", desc: "On orders above ₹999" },
              { icon: RotateCcw, title: "Easy Returns", desc: "7-day hassle-free returns" },
              { icon: Shield, title: "Secure Payments", desc: "100% safe transactions" },
              { icon: Headphones, title: "Expert Support", desc: "Know your fabric, always" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-white/10 hover:border-[#C9A84C]/40 transition-all">
                <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#C9A84C]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#FAF3E0]">{title}</h3>
                  <p className="text-sm text-white/50 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-[#1A1A1A] mb-10 font-serif">What Our Customers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Priya Sharma", review: "The Kanjivaram saree I ordered was absolutely stunning. The fabric quality is unmatched. Will definitely buy again!", rating: 5, location: "Mumbai" },
            { name: "Ananya Patel", review: "Ordered a Chanderi kurta fabric and it was delivered beautifully packed. The weave is so delicate and authentic.", rating: 5, location: "Ahmedabad" },
            { name: "Meera Nair", review: "Grid Stores has the best collection of Banarasi silk in India. Customer service was very helpful too!", rating: 5, location: "Kochi" },
          ].map((t) => (
            <div key={t.name} className="bg-white rounded-xl p-6 border border-[#E8DCC8] shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9A84C] text-[#C9A84C]" />
                ))}
              </div>
              <p className="text-sm text-[#444] leading-relaxed italic">"{t.review}"</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#6B1F2A] flex items-center justify-center text-white text-sm font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{t.name}</p>
                  <p className="text-xs text-[#6B6B6B]">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────── */}
      <section className="bg-[#6B1F2A] py-14">
        <div className="mx-auto max-w-[600px] px-4 text-center">
          <Tag className="w-8 h-8 text-[#C9A84C] mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white mb-2 font-serif">Get Exclusive Offers</h2>
          <p className="text-white/70 text-sm mb-6">Subscribe to be the first to know about new arrivals & festive deals.</p>
          <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#C9A84C] text-sm"
              required
            />
            <button
              type="submit"
              disabled={subscribing}
              className="flex items-center gap-2 px-5 py-3 bg-[#C9A84C] text-[#1A1A1A] font-bold rounded-lg hover:bg-[#b8943e] transition-colors text-sm disabled:opacity-60"
            >
              {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
