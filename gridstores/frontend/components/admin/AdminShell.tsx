"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, LayoutDashboard, ReceiptText, Tags, Users, Menu, X, Home, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText, exact: false },
  { href: "/admin/products", label: "Products", icon: Boxes, exact: false },
  { href: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { href: "/admin/coupons", label: "Coupons", icon: Tags, exact: false },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, exact: false },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    logout();
    router.push("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <Link href="/" className="font-serif text-2xl font-bold text-[#C9A84C] block mb-1">Grid Stores</Link>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/20"
                  : "text-white/60 hover:bg-white/8 hover:text-white/90"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-white/50 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5">
          <Home className="w-4 h-4" /> View Storefront
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-400/10">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#16090c] text-white">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/8 bg-[#1e0a0f] p-5 md:flex flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#1e0a0f] border-b border-white/8 px-4 py-3 flex items-center justify-between">
        <span className="font-serif text-lg font-bold text-[#C9A84C]">Grid Stores Admin</span>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#1e0a0f] border-r border-white/8 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-serif text-xl font-bold text-[#C9A84C]">Grid Stores</span>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,.10),transparent_40%),#16090c] pt-4 md:pt-0 md:ml-64 p-4 md:p-8 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}
