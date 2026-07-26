"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import type { VaultTrustedSource } from "@/lib/supabase";
import { VAULT_CATEGORIES } from "@/lib/vault-data";

// Same two-state active/inactive toggle as TopicLanes.tsx's LaneActiveToggle
// — kept as a separate copy rather than a shared export since these are two
// different admin-editable lists with independent evolution paths, matching
// how this file otherwise mirrors TopicLanes.tsx's structure rather than
// importing from it.
function SourceActiveToggle({
  active,
  onChange,
  disabled,
}: {
  active: boolean;
  onChange: (next: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="inline-flex gap-1 p-1 rounded-lg bg-klo-dark/50 border border-white/5">
      {[true, false].map((option) => {
        const isActive = active === option;
        return (
          <button
            key={String(option)}
            onClick={() => {
              if (!disabled && !isActive) onChange(option);
            }}
            disabled={disabled}
            className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium transition-all min-h-[32px] ${
              isActive
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 border"
                : "text-klo-muted border border-transparent"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {option ? "Active" : "Inactive"}
          </button>
        );
      })}
    </div>
  );
}

export default function TrustedSources() {
  const { toast } = useToast();
  const [sources, setSources] = useState<VaultTrustedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content-automation/trusted-sources");
      if (!res.ok) throw new Error("Failed to load trusted sources");
      const json = await res.json();
      setSources((json.data ?? []) as VaultTrustedSource[]);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to load trusted sources");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleToggle = async (source: VaultTrustedSource, next: boolean) => {
    setTogglingId(source.id);
    try {
      const res = await fetch("/api/admin/content-automation/trusted-sources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, active: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to update trusted source");
      setSources((prev) => prev.map((s) => (s.id === source.id ? (json.data as VaultTrustedSource) : s)));
      toast("success", `${source.name} is now ${next ? "active" : "inactive"}.`);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to update trusted source");
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !domain.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/content-automation/trusted-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim(),
          category: category || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to add trusted source");
      setSources((prev) =>
        [...prev, json.data as VaultTrustedSource].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName("");
      setDomain("");
      setCategory("");
      toast("success", "Trusted source added.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to add trusted source");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-klo-muted">
          {sources.length} trusted source{sources.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={24} className="animate-spin text-klo-muted" />
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-12 text-klo-muted text-sm glass rounded-2xl border border-white/5">
          No trusted sources yet. Add one below to start restricting research to approved domains.
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className={`flex items-center justify-between gap-3 p-4 rounded-xl bg-klo-dark/30 border border-white/5 ${
                !source.active ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-klo-text">{source.name}</p>
                  {source.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-klo-accent/10 text-klo-accent">
                      {source.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-klo-muted mt-0.5">{source.domain}</p>
              </div>
              <SourceActiveToggle
                active={source.active}
                disabled={togglingId === source.id}
                onChange={(next) => handleToggle(source, next)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add-source inline form */}
      <div className="p-4 rounded-xl bg-klo-dark/30 border border-white/5 space-y-3">
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MIT Technology Review"
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm placeholder:text-klo-muted focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Domain</span>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. technologyreview.com"
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm placeholder:text-klo-muted focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Category (optional)</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px] focus:outline-none focus:border-klo-accent/50"
          >
            <option value="">No category</option>
            {VAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={handleCreate}
          disabled={creating || !name.trim() || !domain.trim()}
          className="bg-klo-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] disabled:opacity-50"
        >
          {creating ? "Adding..." : "Add Source"}
        </button>
      </div>
    </div>
  );
}
