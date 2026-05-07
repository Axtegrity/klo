"use client";

import { Download, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

function getFileExt(url: string): string {
  const match = url.split("?")[0].match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toUpperCase() : "FILE";
}

interface Props {
  url: string;
  name: string;
  htmlContent?: string | null;
}

export default function DocumentViewerClient({ url, name, htmlContent }: Props) {
  const ext = getFileExt(url);
  const isPdf = url.toLowerCase().endsWith(".pdf");

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
      {htmlContent ? (
        /* Mammoth-converted HTML — Word doc rendered as styled prose */
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div
            className="klo-doc-body"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
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
