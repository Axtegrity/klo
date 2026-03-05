"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  FileText,
  FileSpreadsheet,
  File,
  Download,
  LogIn,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import type { VaultItem } from "@/lib/vault-data";

const fileTypeConfig: Record<
  string,
  { label: string; variant: "blue" | "green" | "gold" | "purple" | "muted"; icon: React.ElementType }
> = {
  pdf: { label: "PDF", variant: "blue", icon: FileText },
  doc: { label: "DOC", variant: "purple", icon: FileText },
  docx: { label: "DOC", variant: "purple", icon: FileText },
  xls: { label: "XLS", variant: "green", icon: FileSpreadsheet },
  xlsx: { label: "XLS", variant: "green", icon: FileSpreadsheet },
  txt: { label: "TXT", variant: "muted", icon: File },
};

export default function EventPresentation({ item }: { item: VaultItem }) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return (
    <div className="space-y-8">
      {/* Conference info header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-[#011A5E] border border-[#0E3783] rounded-2xl p-6"
      >
        <h2 className="font-display text-lg font-semibold text-klo-text mb-4">
          Conference Details
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {item.conferenceName && (
            <div className="flex items-center gap-2 text-klo-muted">
              <Calendar size={16} className="text-[#68E9FA] shrink-0" />
              <span>{item.conferenceName}</span>
            </div>
          )}
          {item.conferenceLocation && (
            <div className="flex items-center gap-2 text-klo-muted">
              <MapPin size={16} className="text-[#68E9FA] shrink-0" />
              <span>{item.conferenceLocation}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Files table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
        className="bg-[#011A5E] border border-[#0E3783] rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#0E3783]">
          <h2 className="font-display text-lg font-semibold text-klo-text">
            Presentation Files
          </h2>
          <p className="text-sm text-klo-muted mt-1">
            {item.files?.length ?? 0} file{(item.files?.length ?? 0) !== 1 ? "s" : ""} available
          </p>
        </div>

        {item.files && item.files.length > 0 ? (
          <div className="divide-y divide-[#0E3783]">
            {item.files.map((file) => {
              const config = fileTypeConfig[file.type] ?? fileTypeConfig.txt;
              const FileIcon = config.icon;

              return (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-white/5 shrink-0">
                      <FileIcon size={18} className="text-klo-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-klo-text font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-klo-muted">{file.size}</p>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  {isAuthenticated ? (
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white hover:opacity-90 transition-opacity shrink-0 w-full sm:w-auto"
                    >
                      <Download size={14} />
                      Download
                    </a>
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-[#E6EDF3]/20 text-klo-muted hover:text-klo-text hover:border-[#E6EDF3]/40 transition-colors shrink-0 w-full sm:w-auto"
                    >
                      <LogIn size={14} />
                      Sign in
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-klo-muted text-sm">
              No files have been uploaded for this event yet.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
