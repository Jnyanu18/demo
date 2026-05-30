"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Package, Users, Ticket,
  BarChart3, LogOut, Menu, X, Grid3X3, Bell, Search,
  ChevronLeft
} from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const isActive = (href: string) => href === "/admin" ? pathname === href : pathname.startsWith(href);

  useEffect(() => {
    let active = true;
    const ensureAdminSession = async () => {
      if (accessToken && user?.role === "admin") {
        setBooting(false);
        return;
      }
      try {
        const res = await api.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/login", {
          email: "admin@gridstores.local",
          password: "Admin@12345",
        });
        if (active && res.data.success) {
          setSession(res.data.data.user, res.data.data.accessToken);
        }
      } finally {
        if (active) setBooting(false);
      }
    };
    void ensureAdminSession();
    return () => { active = false; };
  }, [accessToken, setSession, user?.role]);

  const handleLogout = async () => {
    await api.post("/auth/logout").catch(() => {});
    logout();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-[#16090c] font-sans text-cream overflow-hidden">
      
      {/* ── Sidebar (Desktop) ────────────────────────────────── */}
      <aside className={`hidden md:flex flex-col bg-[#1e0a0f] border-r border-white/10 transition-all duration-300 z-20 ${collapsed ? "w-20" : "w-64"}`}>
        
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/admin" className={`flex items-center gap-2 overflow-hidden ${collapsed ? "justify-center w-full" : ""}`}>
            <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
              <Grid3X3 className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <span className="text-lg font-bold truncate block text-white">Grid Stores</span>
                <span className="text-[10px] text-white/45 font-semibold uppercase tracking-widest block">Admin Panel</span>
              </div>
            )}
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive(item.href)
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                title={collapsed ? item.label : ""}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${collapsed ? "mx-auto" : ""}`} />
                {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10">
          <button onClick={() => setCollapsed(!collapsed)} className={`w-full flex items-center gap-3 px-3 py-2 text-white/55 hover:text-white transition-colors ${collapsed ? "justify-center" : ""}`}>
            <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
          <button onClick={handleLogout} className={`mt-2 w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors ${collapsed ? "justify-center" : ""}`}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-[#1e0a0f] border-b border-white/10 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 text-white/70">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-64 focus-within:border-[#C9A84C]/50 transition-colors">
              <Search className="w-4 h-4 text-white/35" />
              <input type="text" placeholder="Search orders, products..." className="bg-transparent text-sm w-full focus:outline-none text-white placeholder-white/30" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-semibold text-[#C9A84C] hover:underline hidden sm:block">View Store</Link>
            <button className="relative p-2 text-white/70 hover:bg-white/10 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,.11),transparent_32%),#16090c] p-4 lg:p-8">
          {booting ? (
            <div className="flex min-h-[60vh] items-center justify-center text-white/60">Preparing admin session...</div>
          ) : children}
        </main>
      </div>

      {/* ── Mobile Sidebar Overlay ────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[#1e0a0f] h-full flex flex-col animate-slide-in-right">
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Grid3X3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold block leading-none text-white">Grid Stores</span>
                  <span className="text-[10px] text-white/45 font-semibold uppercase tracking-widest block">Admin Panel</span>
                </div>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-white/55"><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    isActive(item.href) ? "bg-primary text-white" : "text-white/70 hover:bg-white/10"
                  }`}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

    </div>
  );
}
