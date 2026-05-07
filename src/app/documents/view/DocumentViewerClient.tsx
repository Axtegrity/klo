"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ArrowLeft, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

function getFileExt(url: string): string {
  const match = url.split("?")[0].match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toUpperCase() : "FILE";
}

interface Props {
  url: string;
  name: string;
  docPages?: string[] | null;
}

export default function DocumentViewerClient({ url, name, docPages }: Props) {
  const ext = getFileExt(url);
  const isPdf = url.toLowerCase().endsWith(".pdf");
  const totalPages = docPages?.length ?? 0;

  const [page, setPage] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll paper card into view whenever page changes
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  const goTo = (n: number) => setPage(Math.max(0, Math.min(totalPages - 1, n)));

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

      {/* Content */}
      {docPages && totalPages > 0 ? (
        /* Paginated Word doc — paper card on dark */
        <div className="min-h-[calc(100vh-57px)] bg-[#0D1117] py-10 px-4 sm:px-6">
          <div
            ref={cardRef}
            className="max-w-3xl mx-auto rounded-xl overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.7)] scroll-mt-20"
          >
            {/* KLO accent stripe */}
            <div className="h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD]" />

            {/* Paper body */}
            <div className="bg-[#FAFAF8] px-8 py-12 sm:px-14 sm:py-14">
              <div
                key={page}
                className="klo-doc-body animate-in fade-in duration-300"
                dangerouslySetInnerHTML={{ __html: docPages[page] }}
              />

              {/* Page navigation */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => goTo(page - 1)}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                      disabled:opacity-30 disabled:cursor-not-allowed
                      text-[#2764FF] hover:bg-[#2764FF]/8 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {/* Page dots / counter */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium tabular-nums">
                      {page + 1} / {totalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goTo(i)}
                          className={`rounded-full transition-all ${
                            i === page
                              ? "w-5 h-2 bg-[#2764FF]"
                              : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                          }`}
                          aria-label={`Go to page ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => goTo(page + 1)}
                    disabled={page === totalPages - 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                      disabled:opacity-30 disabled:cursor-not-allowed
                      text-[#2764FF] hover:bg-[#2764FF]/8 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : isPdf ? (
        /* Native PDF viewer */
        <div style={{ height: "calc(100vh - 57px)" }}>
          <iframe
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={name}
          />
        </div>
      ) : (
        /* Unsupported format fallback */
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-[#8B949E]">
          <FileText className="w-14 h-14 opacity-30" />
          <p className="text-lg font-medium text-[#E6EDF3]">Preview not available</p>
          <p className="text-sm">This file type can&apos;t be previewed in the browser.</p>
          <a
            href={url}
            download={name}
            className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-[#2764FF] hover:bg-[#2764FF]/80 text-white font-medium rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Download to open
          </a>
        </div>
      )}
    </div>
  );
}
