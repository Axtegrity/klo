"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Tab = "attendee" | "host" | "admin";

export default function GuidePage() {
  const { status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("attendee");
  const [content, setContent] = useState<Record<Tab, string>>({ attendee: "", host: "", admin: "" });
  const [loading, setLoading] = useState<Record<Tab, boolean>>({ attendee: false, host: false, admin: false });
  const [generated, setGenerated] = useState<Record<Tab, string>>({ attendee: "", host: "", admin: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const generateGuide = async (tab: Tab) => {
    if (content[tab]) return;
    setLoading((prev) => ({ ...prev, [tab]: true }));

    try {
      const res = await fetch("/api/conference/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab }),
      });

      const data = await res.json();
      const text = data.text || "Could not generate guide.";
      const timestamp = new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
      setContent((prev) => ({ ...prev, [tab]: text }));
      setGenerated((prev) => ({ ...prev, [tab]: timestamp }));
    } catch {
      setContent((prev) => ({ ...prev, [tab]: "Failed to generate guide. Please try again." }));
    } finally {
      setLoading((prev) => ({ ...prev, [tab]: false }));
    }
  };

  useEffect(() => {
    generateGuide("attendee");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "attendee", label: "Attendee" },
    { id: "host", label: "Host" },
    { id: "admin", label: "Admin" },
  ];

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-klo-text mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          KLO App Guide
        </h1>
        <p className="text-klo-muted text-sm">AI-generated reference guide — always current</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/50 border border-white/5 mb-8 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); generateGuide(tab.id); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-klo-slate text-klo-text shadow-md" : "text-klo-muted hover:text-klo-text"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl border border-white/5 p-6 min-h-[400px]">
        {loading[activeTab] ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
            <p className="text-klo-muted text-sm">Generating guide…</p>
          </div>
        ) : content[activeTab] ? (
          <div>
            {generated[activeTab] && (
              <p className="text-xs text-klo-muted mb-4 pb-4 border-b border-white/5">
                Generated {generated[activeTab]}
              </p>
            )}
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-klo-text leading-relaxed">
                {content[activeTab]}
              </pre>
            </div>
            <button
              onClick={() => { setContent((prev) => ({ ...prev, [activeTab]: "" })); generateGuide(activeTab); }}
              className="mt-6 text-xs text-klo-muted hover:text-klo-text transition-colors"
            >
              ↻ Regenerate
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
