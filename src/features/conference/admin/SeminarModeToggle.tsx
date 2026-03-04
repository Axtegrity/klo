"use client";

import { useState, useEffect } from "react";
import { Radio } from "lucide-react";

export default function SeminarModeToggle() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/conference/settings")
      .then((r) => r.json())
      .then((data) => setActive(data.active ?? false))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/conference/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (res.ok) {
        setActive(!active);
      }
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/5 animate-pulse">
        <div className="h-6 w-48 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${active ? "bg-emerald-500/10" : "bg-white/5"}`}>
            <Radio className={`w-5 h-5 ${active ? "text-emerald-400" : "text-klo-muted"}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-klo-text">Seminar Mode</h3>
            <p className="text-xs text-klo-muted">
              {active
                ? "Interactive tools are live for attendees"
                : "Tools are hidden from attendees"}
            </p>
          </div>
        </div>

        <button
          onClick={toggle}
          disabled={toggling}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            active ? "bg-emerald-500" : "bg-white/10"
          }`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
              active ? "translate-x-7" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
