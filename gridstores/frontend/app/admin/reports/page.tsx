"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { api, ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

type RevenueRow = { date: string; revenue: number; orders: number };
const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function ReportsPage() {
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [period, setPeriod] = useState<"7d" | "30d">("30d");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  const load = () => {
    setLoading(true);
    api.get<ApiResponse<RevenueRow[]>>(`/admin/revenue?period=${period}`)
      .then((res) => { if (res.data.success) setRevenue(res.data.data); })
      .catch(() => toast.error("Failed to load report data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async () => {
    setExporting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
      const res = await fetch(`${base}/admin/reports/export`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken ?? ""}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gridstores-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } catch {
      toast.error("Export failed — make sure you are logged in as admin");
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = revenue.reduce((s, r) => s + r.orders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Reports</h1>
          <p className="text-white/40 text-sm mt-1">Revenue &amp; order analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-lg text-sm transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#1A1A1A] font-bold rounded-lg hover:bg-[#b8943e] transition-colors text-sm disabled:opacity-60">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1 w-fit">
        {(["7d", "30d"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-sm font-semibold rounded transition-all ${period === p ? "bg-[#C9A84C] text-[#1A1A1A]" : "text-white/50 hover:text-white"}`}>
            {p === "7d" ? "Last 7 Days" : "Last 30 Days"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: rupee(totalRevenue), color: "text-[#C9A84C]" },
          { label: "Total Orders", value: String(totalOrders), color: "text-blue-400" },
          { label: "Avg Order Value", value: rupee(avgOrderValue), color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-white/50 text-sm mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="font-bold text-white font-serif mb-5">Revenue Over Time</h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : revenue.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-white/30 text-sm">No data for this period yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1e0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} formatter={(v: unknown) => [rupee(Number(v)), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#rg)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="font-bold text-white font-serif mb-5">Orders Per Day</h2>
        {loading ? (
          <div className="h-48 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : revenue.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-white/30 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#1e0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} formatter={(v: unknown) => [Number(v), "Orders"]} />
              <Bar dataKey="orders" fill="#6B1F2A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {!loading && revenue.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-right px-5 py-3">Orders</th>
                <th className="text-right px-5 py-3">Revenue</th>
                <th className="text-right px-5 py-3">Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {[...revenue].reverse().map((row) => (
                <tr key={row.date} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3 text-white/70">{row.date}</td>
                  <td className="px-5 py-3 text-right text-white">{row.orders}</td>
                  <td className="px-5 py-3 text-right text-[#C9A84C] font-semibold">{rupee(row.revenue)}</td>
                  <td className="px-5 py-3 text-right text-white/60">{row.orders > 0 ? rupee(Math.round(row.revenue / row.orders)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
