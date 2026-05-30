"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, Users, ShoppingCart, IndianRupee, AlertTriangle,
  RefreshCw, Loader2, Package,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { api, ApiResponse } from "@/lib/api";
import toast from "react-hot-toast";

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");

type DashboardData = {
  ordersToday: number;
  revenueToday: number;
  liveCount: number;
  newCustomers: number;
  lowStock: { _id: string; name: string; stock: number; images: { url: string }[] }[];
  recentOrders: {
    _id: string;
    orderNumber: string;
    user?: { name: string; email: string };
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }[];
};

type RevenueRow = { date: string; revenue: number; orders: number };

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-900/40 text-yellow-300",
  confirmed: "bg-blue-900/40 text-blue-300",
  processing: "bg-amber-900/40 text-amber-300",
  shipped: "bg-indigo-900/40 text-indigo-300",
  delivered: "bg-green-900/40 text-green-300",
  cancelled: "bg-red-900/40 text-red-300",
  returned: "bg-gray-700/40 text-gray-300",
};

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-all">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/60 text-sm font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse h-28" />;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [period, setPeriod] = useState<"7d" | "30d">("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true); else setRefreshing(true);
    try {
      const [dash, rev] = await Promise.all([
        api.get<ApiResponse<DashboardData>>("/admin/dashboard"),
        api.get<ApiResponse<RevenueRow[]>>(`/admin/revenue?period=${period}`),
      ]);
      if (dash.data.success) setData(dash.data.data);
      if (rev.data.success) setRevenue(rev.data.data);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">Today&apos;s overview — Grid Stores</p>
        </div>
        <button
          onClick={() => load(false)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/8 border border-white/10 text-white/70 hover:text-white rounded-lg text-sm transition-all hover:bg-white/12"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard label="Orders Today" value={data?.ordersToday ?? 0} sub="vs yesterday" icon={ShoppingCart} color="bg-blue-500/20 text-blue-400" />
            <KpiCard label="Revenue Today" value={rupee(data?.revenueToday ?? 0)} sub="Paid + COD pending" icon={IndianRupee} color="bg-[#C9A84C]/20 text-[#C9A84C]" />
            <KpiCard label="New Customers" value={data?.newCustomers ?? 0} sub="Registered today" icon={Users} color="bg-green-500/20 text-green-400" />
            <KpiCard label="Low Stock Items" value={data?.lowStock?.length ?? 0} sub="Need restocking" icon={AlertTriangle} color="bg-red-500/20 text-red-400" />
          </>
        )}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-white font-serif">Revenue Overview</h2>
            <p className="text-white/40 text-xs mt-0.5">Daily revenue for the selected period</p>
          </div>
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["7d", "30d"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-semibold rounded transition-all ${period === p ? "bg-[#C9A84C] text-[#1A1A1A]" : "text-white/50 hover:text-white"}`}>
                {p === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>
        {loading || revenue.length === 0 ? (
          <div className="h-56 flex items-center justify-center">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-white/30" /> : <p className="text-white/30 text-sm">No revenue data yet</p>}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                formatter={(v: unknown) => [rupee(Number(v)), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white font-serif">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs text-[#C9A84C] hover:underline">View all →</a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : (data?.recentOrders?.length ?? 0) === 0 ? (
            <div className="text-center py-10 text-white/30 text-sm">No orders yet</div>
          ) : (
            <div className="space-y-2">
              {data?.recentOrders?.slice(0, 7).map((order) => (
                <div key={order._id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">#{order.orderNumber}</p>
                    <p className="text-xs text-white/40 truncate">{order.user?.name ?? "Guest"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-[#C9A84C]">{rupee(order.total)}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize ${STATUS_COLOR[order.status] ?? "bg-white/10 text-white"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-white font-serif flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Low Stock Alerts
            </h2>
            <a href="/admin/products" className="text-xs text-[#C9A84C] hover:underline">Manage →</a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : (data?.lowStock?.length ?? 0) === 0 ? (
            <div className="text-center py-10 text-white/30 text-sm">All products are well-stocked ✓</div>
          ) : (
            <div className="space-y-2">
              {data?.lowStock?.map((p) => (
                <div key={p._id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden border border-white/10 shrink-0">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-white/30 m-2.5" />
                    )}
                  </div>
                  <p className="flex-1 text-sm text-white/80 truncate">{p.name}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${p.stock === 0 ? "bg-red-900/50 text-red-300" : p.stock <= 2 ? "bg-red-900/30 text-red-400" : "bg-amber-900/30 text-amber-400"}`}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
