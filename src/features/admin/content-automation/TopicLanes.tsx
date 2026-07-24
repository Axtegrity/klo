"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import type { VaultTopicLane } from "@/lib/supabase";

// Two-state active/inactive toggle — extends VisibilityToggle's existing
// segmented-button pattern (src/features/admin/content-manager/VisibilityToggle.tsx),
// reduced to 2 states since a topic lane is either generating drafts or dormant.
function LaneActiveToggle({
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

export default function TopicLanes() {
  const { toast } = useToast();
  const [lanes, setLanes] = useState<VaultTopicLane[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchLanes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content-automation/lanes");
      if (!res.ok) throw new Error("Failed to load topic lanes");
      const json = await res.json();
      setLanes((json.data ?? []) as VaultTopicLane[]);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to load topic lanes");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLanes();
  }, [fetchLanes]);

  const handleToggle = async (lane: VaultTopicLane, next: boolean) => {
    setTogglingId(lane.id);
    try {
      const res = await fetch("/api/admin/content-automation/lanes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lane.id, active: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to update topic lane");
      setLanes((prev) => prev.map((l) => (l.id === lane.id ? (json.data as VaultTopicLane) : l)));
      toast("success", `${lane.name} is now ${next ? "active" : "inactive"}.`);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to update topic lane");
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/content-automation/lanes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to create topic lane");
      setLanes((prev) => [...prev, json.data as VaultTopicLane].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setDescription("");
      toast("success", "Topic lane added.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to create topic lane");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-klo-muted">
          {lanes.length} topic lane{lanes.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw size={24} className="animate-spin text-klo-muted" />
        </div>
      ) : lanes.length === 0 ? (
        <div className="text-center py-12 text-klo-muted text-sm glass rounded-2xl border border-white/5">
          No topic lanes yet. Add one below to start generating drafts for it.
        </div>
      ) : (
        <div className="space-y-2">
          {lanes.map((lane) => (
            <div
              key={lane.id}
              className={`flex items-center justify-between p-4 rounded-xl bg-klo-dark/30 border border-white/5 ${
                !lane.active ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-klo-text">{lane.name}</p>
                {lane.description && (
                  <p className="text-xs text-klo-muted mt-0.5">{lane.description}</p>
                )}
              </div>
              <LaneActiveToggle
                active={lane.active}
                disabled={togglingId === lane.id}
                onChange={(next) => handleToggle(lane, next)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add-lane inline form */}
      <div className="p-4 rounded-xl bg-klo-dark/30 border border-white/5 space-y-3">
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AI & Ethics"
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px] placeholder:text-klo-muted focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <label className="block">
          <span className="text-xs text-klo-muted mb-1 block">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What this lane covers — helps guide what gets generated"
            className="w-full px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm resize-none placeholder:text-klo-muted focus:outline-none focus:border-klo-accent/50"
          />
        </label>
        <button
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          className="bg-klo-accent text-white px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] disabled:opacity-50"
        >
          {creating ? "Adding..." : "Add Lane"}
        </button>
      </div>
    </div>
  );
}
