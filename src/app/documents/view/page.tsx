"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Download, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

function getViewerSrc(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return url;
  // Word, PowerPoint, plain text — use Google Docs Viewer for inline rendering
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
}

function getFileExt(url: string): string {
  const match = url.split("?")[0].match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toUpperCase() : "FILE";
}

function DocumentViewer() {
  const params = useSearchParams();
  const url  = params.get("url")  ?? "";
  const name = params.get("name") ?? "Document";

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#8B949E]">
        <FileText className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">No document specified.</p>
        <Link href="/" className="mt-4 text-sm text-[#2764FF] hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const isPdf = url.toLowerCase().endsWith(".pdf");
  const viewerSrc = getViewerSrc(url);
  const ext = getFileExt(url);

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-[#161B22] border-b border-[#21262D] px-4 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-[#8B949E] hover:text-[#E6EDF3] transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 text-xs font-bold rounded bg-[#2764FF]/20 text-[#2764FF]">
            {ext}
          </span>
          <p className="text-sm text-[#E6EDF3] truncate font-medium">{name}</p>
        </div>

        <a
          href={url}
          download={name}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-[#21262D] hover:bg-[#2764FF]/20 text-[#E6EDF3] hover:text-[#2764FF] border border-[#21262D] hover:border-[#2764FF]/30 transition-all"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>

      {/* Viewer */}
      <div className="w-full" style={{ height: "calc(100vh - 57px)" }}>
        {isPdf ? (
          <iframe
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={name}
          />
        ) : (
          <iframe
            src={viewerSrc}
            className="w-full h-full border-0 bg-white"
            title={name}
            allow="autoplay"
          />
        )}
      </div>
    </div>
  );
}

export default function DocumentViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0D1117]">
        <div className="w-8 h-8 border-2 border-[#2764FF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DocumentViewer />
    </Suspense>
  );
}
