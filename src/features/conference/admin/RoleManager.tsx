"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import type { ConferenceUserRole } from "../types";

interface RoleManagerProps {
  eventId?: string;
}

export default function RoleManager({ eventId }: RoleManagerProps = {}) {
  const [roles, setRoles] = useState<ConferenceUserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("host");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      const url = eventId
        ? `/api/conference/roles?event_id=${eventId}`
        : "/api/conference/roles";
      const res = await fetch(url);
      if (res.ok) setRoles(await res.json());
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const assignRole = async () => {
    if (!email.trim()) return;
    setAssigning(true);
    setAssignError(null);
    setAssignSuccess(null);
    try {
      const res = await fetch("/api/conference/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role: selectedRole,
          event_id: eventId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAssignError(data.error || "Failed to assign role");
        return;
      }
      setEmail("");
      setAssignSuccess(`Role assigned successfully`);
      setTimeout(() => setAssignSuccess(null), 3000);
      fetchRoles();
    } finally {
      setAssigning(false);
    }
  };

  const removeRole = async (roleId: string) => {
    await fetch(`/api/conference/roles?id=${roleId}`, { method: "DELETE" });
    fetchRoles();
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "host": return "text-[#C8A84E] bg-[#C8A84E]/10 border-[#C8A84E]/20";
      case "admin": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "moderator": return "text-[#2764FF] bg-[#2764FF]/10 border-[#2764FF]/20";
      case "presenter": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default: return "text-klo-muted bg-white/5 border-white/10";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Assign role form */}
      <div className="glass rounded-2xl p-4 border border-white/5 space-y-3">
        <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider">
          Assign Role by Email
        </p>
        {assignError && (
          <p className="text-xs text-red-400">{assignError}</p>
        )}
        {assignSuccess && (
          <p className="text-xs text-emerald-400">{assignSuccess}</p>
        )}
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address..."
            className="flex-1 bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:border-[#2764FF]/50"
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-klo-navy/50 border border-klo-slate rounded-lg px-4 py-2 text-sm text-klo-text focus:outline-none focus:border-[#2764FF]/50"
          >
            <option value="host">Host</option>
            <option value="moderator">Moderator</option>
            <option value="presenter">Presenter</option>
            <option value="attendee">Attendee</option>
          </select>
        </div>
        <button
          onClick={assignRole}
          disabled={!email.trim() || assigning}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 disabled:opacity-40"
        >
          <Plus size={16} />
          {assigning ? "Assigning..." : "Assign Role"}
        </button>
      </div>

      {/* Roles list */}
      {roles.map((r) => (
        <div
          key={r.id}
          className="glass rounded-2xl p-4 border border-white/5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-klo-muted" />
            <div>
              <p className="text-sm text-klo-text font-mono">{r.user_id}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${roleColor(r.role)}`}>
                  {r.role}
                </span>
                {r.event_id && (
                  <span className="text-xs text-klo-muted">
                    Event scoped
                  </span>
                )}
                {r.session_id && (
                  <span className="text-xs text-klo-muted">
                    Session: {r.session_id.slice(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => removeRole(r.id)}
            className="p-2 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Remove role"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {roles.length === 0 && (
        <p className="text-sm text-klo-muted text-center py-4">No roles assigned yet</p>
      )}
    </div>
  );
}
