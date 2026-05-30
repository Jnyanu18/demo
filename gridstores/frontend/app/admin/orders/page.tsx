"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Loader2, ChevronDown, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import { Order } from "@/types";
import toast from "react-hot-toast";

const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-yellow-900/40 text-yellow-300 border-yellow-800/40",
  confirmed:  "bg-blue-900/40 text-blue-300 border-blue-800/40",
  processing: "bg-amber-900/40 text-amber-300 border-amber-800/40",
  shipped:    "bg-indigo-900/40 text-indigo-300 border-indigo-800/40",
  delivered:  "bg-green-900/40 text-green-300 border-green-800/40",
  cancelled:  "bg-red-900/40 text-red-300 border-red-800/40",
  returned:   "bg-gray-700/40 text-gray-300 border-gray-600/40",
};

type AdminOrder = Order & {
  user?: { name: string; email: string };
  paymentMethod?: string;
  items: { name: string; quantity: number; price: number; image: string }[];
};

type OrdersResponse = {
  items: AdminOrder[];
  total: number;
  page: number;
  pages: number;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await api.get<ApiResponse<OrdersResponse>>(`/admin/orders?${params}`);
      if (res.data.success) {
        setOrders(res.data.data.items);
        setTotal(res.data.data.total);
        setPages(res.data.data.pages);
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => { setPage(1); load(); }, 500);
    return () => clearTimeout(id);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Status updated to "${status}"`);
      load();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Orders</h1>
          <p className="text-white/40 text-sm mt-1">{total} total orders</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-lg text-sm transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-[#C9A84C]/40 transition-all flex-1 min-w-48">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number…"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white/5 border border-white/10 text-sm text-white/70 rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C]/40 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[#1e0a0f] capitalize">{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 w-8" />
              <th className="text-left px-5 py-3">Order</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Customer</th>
              <th className="text-left px-5 py-3 hidden lg:table-cell">Date</th>
              <th className="text-right px-5 py-3">Total</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Update</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-white/30">
                  No orders found
                  {(search || statusFilter) && (
                    <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="ml-2 text-[#C9A84C] hover:underline">
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <>
                  <tr
                    key={order._id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                  >
                    {/* Expand toggle */}
                    <td className="px-5 py-3.5">
                      <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded === order._id ? "rotate-180" : ""}`} />
                    </td>

                    {/* Order number */}
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-semibold text-white text-xs">#{order.orderNumber}</p>
                      <p className="text-white/40 text-[11px] mt-0.5">{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}</p>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {order.user ? (
                        <div>
                          <p className="text-white/80 text-sm font-medium">{order.user.name}</p>
                          <p className="text-white/40 text-xs">{order.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-white/30 text-xs">Guest</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 hidden lg:table-cell text-white/50 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>

                    {/* Total */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-bold text-[#C9A84C]">{rupee(order.total)}</span>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border capitalize ${STATUS_COLOR[order.status] ?? "bg-white/10 text-white"}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Status update select */}
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={order.status}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          disabled={updating === order._id}
                          className="bg-white/8 border border-white/10 text-white/70 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#C9A84C]/40 cursor-pointer capitalize disabled:opacity-50"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-[#1e0a0f] capitalize">{s}</option>
                          ))}
                        </select>
                        {updating === order._id && (
                          <Loader2 className="w-3.5 h-3.5 text-[#C9A84C] animate-spin shrink-0" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row — order items */}
                  {expanded === order._id && (
                    <tr key={`${order._id}-exp`} className="bg-white/3 border-b border-white/5">
                      <td colSpan={7} className="px-8 py-4">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Order Items</p>
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              {item.image && (
                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/80 truncate">{item.name}</p>
                                <p className="text-xs text-white/40">Qty: {item.quantity} × {rupee(item.price)}</p>
                              </div>
                              <p className="text-sm font-semibold text-[#C9A84C]">{rupee(item.price * item.quantity)}</p>
                            </div>
                          ))}
                          <div className="flex justify-between pt-3 mt-2 border-t border-white/10 text-sm font-bold text-white">
                            <span>Order Total</span>
                            <span className="text-[#C9A84C]">{rupee(order.total)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">
            Page {page} of {pages} · {total} orders
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${pg === page ? "bg-[#C9A84C] text-[#1A1A1A]" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"}`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages || loading}
              className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
