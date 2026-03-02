"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PolicyBuilder from "@/components/advisor/PolicyBuilder";

export default function PolicyBuilderPage() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/advisor"
          className="inline-flex items-center gap-2 text-sm text-[#8B949E] hover:text-[#2764FF] transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Advisor
        </Link>

        <PolicyBuilder />
      </div>
    </div>
  );
}
