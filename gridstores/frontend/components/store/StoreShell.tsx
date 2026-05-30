"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Heart, ShoppingCart, User, Search, MapPin, ChevronDown, Menu, X,
  Grid3X3, Zap, Home, Sparkles, Dumbbell, ShoppingBag, Tag,
  Phone, Mail, Facebook, Instagram, Twitter, Youtube,
  Shield, RotateCcw, Truck, Headphones, CreditCard, Smartphone,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

const CATEGORIES = [
  { label: "Fashion", icon: Sparkles, href: "/shop?category=fashion", color: "text-pink-500" },
  { label: "Electronics", icon: Zap, href: "/shop?category=electronics", color: "text-blue-500" },
  { label: "Home", icon: Home, href: "/shop?category=home", color: "text-amber-500" },
  { label: "Beauty", icon: Heart, href: "/shop?category=beauty", color: "text-rose-500" },
  { label: "Sports", icon: Dumbbell, href: "/shop?category=sports", color: "text-green-500" },
  { label: "Grocery", icon: ShoppingBag, href: "/shop?category=grocery", color: "text-emerald-500" },
  { label: "Offers", icon: Tag, href: "/shop?category=offers", color: "text-secondary" },
];

const SEARCH_CATEGORIES = ["All Categories", "Fashion", "Electronics", "Home & Living", "Beauty", "Sports", "Grocery"];

export function StoreShell({ children }: { children: React.ReactNode }) {
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.ids.length);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("All Categories");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchCatOpen, setSearchCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchCatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchCatRef.current && !searchCatRef.current.contains(e.target as Node)) setSearchCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col">
      {/* Top Announcement Bar */}
      <div className="bg-primary text-white text-xs text-center py-1.5 px-4 font-medium tracking-wide">
        <span className="hidden sm:inline">🚀 Free delivery on orders above ₹499 &nbsp;|&nbsp; Use code <strong>FIRST10</strong> for 10% off your first order &nbsp;|&nbsp; </span>
        <span>📱 Download the App</span>
      </div>

      {/* Main Navbar */}
      <header className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${scrolled ? "shadow-navbar" : "border-b border-gray-100"}`}>
        {/* Primary Nav Row */}
        <div className="mx-auto max-w-[1400px] px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Grid3X3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1A2E] hidden sm:block">
              Grid<span className="text-primary">Stores</span>
            </span>
          </Link>

          {/* Location */}
          <button className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors shrink-0">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <div className="text-left leading-tight">
              <div className="text-[10px] text-gray-400">Deliver to</div>
              <div className="font-semibold text-[#1A1A2E] text-xs">Mumbai 400001</div>
            </div>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 flex items-center max-w-2xl mx-auto">
            <div className="flex w-full rounded-xl border border-gray-200 bg-[#F8F9FC] hover:border-primary/40 focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(108,99,255,0.12)] transition-all overflow-hidden">
              {/* Category Selector */}
              <div ref={searchCatRef} className="relative hidden md:flex">
                <button
                  onClick={() => setSearchCatOpen(!searchCatOpen)}
                  className="flex items-center gap-1 px-3 py-2.5 text-xs font-medium text-gray-600 border-r border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  {searchCategory.length > 12 ? searchCategory.slice(0, 12) + "…" : searchCategory}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {searchCatOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                    {SEARCH_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSearchCategory(cat); setSearchCatOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 hover:text-primary transition-colors ${cat === searchCategory ? "text-primary font-semibold bg-primary/5" : "text-gray-700"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more…"
                className="flex-1 px-4 py-2.5 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
              />
              {/* Search Button */}
              <button className="flex items-center justify-center w-12 bg-primary hover:bg-primary-dark text-white transition-colors shrink-0">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Wishlist */}
            <Link href="/account" aria-label="Wishlist" className="relative flex flex-col items-center px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="relative">
                <Heart className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-500 group-hover:text-primary hidden sm:block">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link href="/cart" aria-label="Cart" className="relative flex flex-col items-center px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-500 group-hover:text-primary hidden sm:block">Cart</span>
            </Link>

            {/* Account */}
            <Link href="/account" aria-label="Account" className="flex flex-col items-center px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group">
              <User className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
              <span className="text-[10px] text-gray-500 group-hover:text-primary hidden sm:block">Account</span>
            </Link>

            {/* Mobile menu */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-50 lg:hidden" aria-label="Menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Category Strip */}
        <div className="border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:text-primary whitespace-nowrap rounded-lg hover:bg-primary/5 transition-colors group"
                  >
                    <Icon className={`w-3.5 h-3.5 ${cat.color} group-hover:scale-110 transition-transform`} />
                    {cat.label}
                  </Link>
                );
              })}
              <div className="ml-auto hidden lg:flex items-center gap-1 pl-4 border-l border-gray-100">
                <Link href="/admin" className="text-xs font-semibold text-primary hover:text-primary-dark px-3 py-2 rounded-lg hover:bg-primary/5 transition-colors">
                  Admin Panel →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg animate-fade-in">
            <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-1">
              {/* Mobile search */}
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 mb-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search products…" className="flex-1 bg-transparent text-sm focus:outline-none" />
              </div>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link key={cat.label} href={cat.href} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/5 text-gray-700 hover:text-primary transition-colors">
                    <Icon className={`w-4 h-4 ${cat.color}`} />
                    <span className="font-medium text-sm">{cat.label}</span>
                  </Link>
                );
              })}
              <hr className="my-2 border-gray-100" />
              <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/5 text-gray-700">
                <User className="w-4 h-4" />
                <span className="font-medium text-sm">My Account</span>
              </Link>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/5 text-primary">
                <Grid3X3 className="w-4 h-4" />
                <span className="font-medium text-sm">Admin Panel</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#1A1A2E] text-white mt-20">
        {/* Trust Bar */}
        <div className="border-b border-white/10">
          <div className="mx-auto max-w-[1400px] px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: "Free Delivery", desc: "On orders above ₹499" },
              { icon: RotateCcw, title: "Easy Returns", desc: "7-day hassle-free returns" },
              { icon: Shield, title: "Secure Payments", desc: "256-bit SSL encryption" },
              { icon: Headphones, title: "24/7 Support", desc: "Round-the-clock help" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary-light" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{title}</div>
                  <div className="text-xs text-white/50 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Footer */}
        <div className="mx-auto max-w-[1400px] px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">Grid<span className="text-primary-light">Stores</span></span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Everything. Delivered. India's modern multi-category shopping platform with curated products across all your needs.
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-white/40">Customer Service</h3>
            <ul className="space-y-2.5">
              {["Track Your Order", "Return & Exchange", "Cancellation Policy", "Shipping Info", "FAQ", "Size Guide"].map((item) => (
                <li key={item}><Link href="#" className="text-sm text-white/60 hover:text-primary-light transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-white/40">My Account</h3>
            <ul className="space-y-2.5">
              {["Sign In / Register", "My Orders", "Wishlist", "My Addresses", "Coupons & Offers", "Refer & Earn"].map((item) => (
                <li key={item}><Link href="/account" className="text-sm text-white/60 hover:text-primary-light transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-white/40">Get In Touch</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Phone className="w-3.5 h-3.5 text-primary-light" />
                +91 98765 43210
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Mail className="w-3.5 h-3.5 text-primary-light" />
                support@gridstores.in
              </div>
            </div>
            {/* App Download */}
            <div className="space-y-2 pt-2">
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Download App</p>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs transition-colors border border-white/10">
                  <Smartphone className="w-3.5 h-3.5" />
                  <div className="text-left">
                    <div className="text-[9px] text-white/50">Get it on</div>
                    <div className="font-semibold text-[11px]">Google Play</div>
                  </div>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs transition-colors border border-white/10">
                  <Smartphone className="w-3.5 h-3.5" />
                  <div className="text-left">
                    <div className="text-[9px] text-white/50">Available on</div>
                    <div className="font-semibold text-[11px]">App Store</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-[1400px] px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/40">© 2024 Grid Stores Pvt. Ltd. All rights reserved.</p>
            <div className="flex items-center gap-3">
              {/* Payment icons */}
              {["VISA", "MC", "UPI", "GPay", "PhonePe"].map((p) => (
                <div key={p} className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-white/60">{p}</div>
              ))}
              <CreditCard className="w-4 h-4 text-white/30" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
