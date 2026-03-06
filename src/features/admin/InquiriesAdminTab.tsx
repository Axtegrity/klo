"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import type { AdminInquiry } from "@/types";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  reviewed: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  contacted: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const TYPE_COLORS: Record<string, string> = {
  booking: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  consultation: "bg-klo-accent/20 text-klo-gold border-klo-accent/30",
};

export default function InquiriesAdminTab() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        type: typeFilter,
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/inquiries?${params}`);
      if (!res.ok) throw new Error("Failed to load inquiries");
      const data = await res.json();
      setInquiries(data.inquiries);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, search]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      // Update local state
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: status as AdminInquiry["status"] } : inq))
      );
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev) => prev ? { ...prev, status: status as AdminInquiry["status"] } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-klo-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-accent/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text text-sm focus:outline-none focus:border-klo-accent/50"
        >
          <option value="all">All Types</option>
          <option value="booking">Booking</option>
          <option value="consultation">Consultation</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text text-sm focus:outline-none focus:border-klo-accent/50"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="contacted">Contacted</option>
          <option value="archived">Archived</option>
        </select>
        <button
          onClick={fetchInquiries}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-klo-slate border border-white/10 text-klo-muted hover:text-klo-text transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      {/* Results summary */}
      <motion.div variants={fadeUp} custom={3}>
        <p className="text-sm text-klo-muted">
          {total} {total === 1 ? "inquiry" : "inquiries"} found
        </p>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} custom={4} className="glass rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-klo-gold animate-spin" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16 text-klo-muted">No inquiries found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-klo-muted font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-klo-muted font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-klo-muted font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-klo-muted font-medium hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-klo-muted font-medium hidden md:table-cell">Detail</th>
                  <th className="text-left px-4 py-3 text-klo-muted font-medium hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-klo-muted font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedInquiry(inq)}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${TYPE_COLORS[inq.type]}`}>
                        {inq.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_COLORS[inq.status]}`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-klo-text font-medium">{inq.name}</td>
                    <td className="px-4 py-3 text-klo-muted hidden sm:table-cell">{inq.email}</td>
                    <td className="px-4 py-3 text-klo-muted hidden md:table-cell">
                      {inq.type === "booking" ? inq.event_name : inq.area_of_interest}
                    </td>
                    <td className="px-4 py-3 text-klo-muted hidden lg:table-cell whitespace-nowrap">
                      {formatDate(inq.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedInquiry(inq); }}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-klo-muted hover:text-klo-text transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={fadeUp} custom={5} className="flex items-center justify-between">
          <p className="text-sm text-klo-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-klo-slate border border-white/10 text-klo-muted hover:text-klo-text transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-klo-slate border border-white/10 text-klo-muted hover:text-klo-text transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedInquiry(null)}>
          <div
            className="glass rounded-2xl border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-klo-text font-display">{selectedInquiry.name}</h2>
                <p className="text-klo-muted text-sm mt-1">{selectedInquiry.email}</p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-klo-muted hover:text-klo-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex gap-2 mb-6">
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${TYPE_COLORS[selectedInquiry.type]}`}>
                {selectedInquiry.type}
              </span>
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${STATUS_COLORS[selectedInquiry.status]}`}>
                {selectedInquiry.status}
              </span>
            </div>

            {/* Status update */}
            <div className="mb-6">
              <label className="block text-sm text-klo-muted mb-1.5">Update Status</label>
              <select
                value={selectedInquiry.status}
                onChange={(e) => updateStatus(selectedInquiry.id, e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text text-sm focus:outline-none focus:border-klo-accent/50"
              >
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="contacted">Contacted</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Details grid */}
            <div className="space-y-3">
              {selectedInquiry.phone && <DetailRow label="Phone" value={selectedInquiry.phone} />}
              {selectedInquiry.organization && <DetailRow label="Organization" value={selectedInquiry.organization} />}
              {selectedInquiry.event_name && <DetailRow label="Event Name" value={selectedInquiry.event_name} />}
              {selectedInquiry.event_date && <DetailRow label="Event Date" value={selectedInquiry.event_date} />}
              {selectedInquiry.event_type && <DetailRow label="Event Type" value={selectedInquiry.event_type} />}
              {selectedInquiry.budget_range && <DetailRow label="Budget Range" value={selectedInquiry.budget_range} />}
              {selectedInquiry.audience_size && <DetailRow label="Audience Size" value={selectedInquiry.audience_size} />}
              {selectedInquiry.industry && <DetailRow label="Industry" value={selectedInquiry.industry} />}
              {selectedInquiry.location && <DetailRow label="Location" value={selectedInquiry.location} />}
              {selectedInquiry.area_of_interest && <DetailRow label="Area of Interest" value={selectedInquiry.area_of_interest} />}
              {selectedInquiry.organization_size && <DetailRow label="Organization Size" value={selectedInquiry.organization_size} />}
              {selectedInquiry.timeline && <DetailRow label="Timeline" value={selectedInquiry.timeline} />}
              {selectedInquiry.previous_consultant && <DetailRow label="Previous Consultant" value={selectedInquiry.previous_consultant} />}
              {selectedInquiry.message && (
                <div className="pt-2">
                  <p className="text-xs text-klo-muted mb-1">Message</p>
                  <p className="text-sm text-klo-text leading-relaxed bg-klo-dark/50 rounded-xl p-4 border border-white/5">{selectedInquiry.message}</p>
                </div>
              )}
              {selectedInquiry.current_challenge && (
                <div className="pt-2">
                  <p className="text-xs text-klo-muted mb-1">Current Challenge</p>
                  <p className="text-sm text-klo-text leading-relaxed bg-klo-dark/50 rounded-xl p-4 border border-white/5">{selectedInquiry.current_challenge}</p>
                </div>
              )}
              {selectedInquiry.additional_details && (
                <div className="pt-2">
                  <p className="text-xs text-klo-muted mb-1">Additional Details</p>
                  <p className="text-sm text-klo-text leading-relaxed bg-klo-dark/50 rounded-xl p-4 border border-white/5">{selectedInquiry.additional_details}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/5 text-xs text-klo-muted">
              Submitted {formatDate(selectedInquiry.created_at)}
              {selectedInquiry.ip_address && ` · IP: ${selectedInquiry.ip_address}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-xs text-klo-muted w-36 shrink-0">{label}</span>
      <span className="text-sm text-klo-text">{value}</span>
    </div>
  );
}
