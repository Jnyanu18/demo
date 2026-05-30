"use client";

import { useEffect, useState } from "react";
import { Search, Users, Mail, Phone, Loader2, ChevronDown } from "lucide-react";
import { api, ApiResponse } from "@/lib/api";

type Customer = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  role: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<ApiResponse<Customer[]>>("/admin/customers")
      .then((res) => { if (res.data.success) setCustomers(res.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Customers</h1>
          <p className="text-white/40 text-sm mt-1">{customers.length} registered customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 focus-within:border-[#C9A84C]/40 transition-all max-w-sm">
        <Search className="w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone…"
          className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-semibold">Customer</th>
              <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Email</th>
              <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Phone</th>
              <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Joined</th>
              <th className="text-left px-5 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={5} className="px-5 py-4">
                    <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-white/30">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No customers found
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6B1F2A] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {c.name[0]}
                      </div>
                      <span className="font-semibold text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="flex items-center gap-1.5 text-white/60">
                      <Mail className="w-3.5 h-3.5" /> {c.email}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="flex items-center gap-1.5 text-white/60">
                      <Phone className="w-3.5 h-3.5" /> {c.phone}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-white/50 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${c.role === "admin" ? "bg-[#C9A84C]/20 text-[#C9A84C]" : "bg-white/10 text-white/60"}`}>
                      {c.role}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
