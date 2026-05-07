"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
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

  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  const goTo = (n: number) => setPage(Math.max(0, Math.min(totalPages - 1, n)));

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Vault-style hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0D1117]" />

        <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-white/5 border border-white/10 text-klo-muted">
                {ext}
              </span>
              <a
                href={url}
                download={name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-klo-muted hover:text-klo-text hover:border-white/20 transition-colors"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-klo-text leading-tight max-w-4xl">
              {name}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-8 mt-8"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-klo-muted hover:text-klo-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </motion.div>

          {/* Document body */}
          {docPages && totalPages > 0 ? (
            <div ref={cardRef} className="max-w-3xl scroll-mt-6">
              <div className="rounded-xl overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.7)]">
                {/* KLO accent stripe */}
                <div className="h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD]" />
                {/* Paper body */}
                <div className="bg-[#FAFAF8] px-8 py-12 sm:px-14 sm:py-14">
                  <div
                    key={page}
                    className="klo-doc-body animate-in fade-in duration-300"
                    dangerouslySetInnerHTML={{ __html: docPages[page] }}
                  />

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => goTo(page - 1)}
                        disabled={page === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed text-[#2764FF] hover:bg-[#2764FF]/8 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

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
                                i === page ? "w-5 h-2 bg-[#2764FF]" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                              }`}
                              aria-label={`Go to page ${i + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => goTo(page + 1)}
                        disabled={page === totalPages - 1}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed text-[#2764FF] hover:bg-[#2764FF]/8 transition-colors"
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
            <div className="rounded-xl overflow-hidden border border-white/5" style={{ height: "calc(100vh - 320px)", minHeight: 480 }}>
              <iframe
                src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title={name}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-klo-muted">
              <FileText className="w-14 h-14 opacity-30" />
              <p className="text-lg font-medium text-klo-text">Preview not available</p>
              <p className="text-sm">This file type can&apos;t be previewed in the browser.</p>
              <a
                href={url}
                download={name}
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-klo-accent hover:bg-klo-accent/80 text-white font-medium rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Download to open
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
