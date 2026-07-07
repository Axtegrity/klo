"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, Eye, EyeOff, Loader2, FileText } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "ppt", "pptx"];

interface EventFile {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: string;
  is_visible: boolean;
}

interface SessionFilesProps {
  eventId: string;
  sessionId: string;
}

export default function SessionFiles({ eventId, sessionId }: SessionFilesProps) {
  const [files, setFiles] = useState<EventFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    const res = await fetch(`/api/admin/events/${eventId}/files?session_id=${sessionId}`);
    if (res.ok) setFiles(await res.json());
  }, [eventId, sessionId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is 50MB. (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      setError(`File type .${ext} not allowed. Allowed: ${ALLOWED_FILE_TYPES.join(", ")}`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch(`/api/admin/events/${eventId}/files/sign-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
      });
      const signData = await signRes.json().catch(() => ({}));
      if (!signRes.ok) {
        setError(signData.error || "Upload failed");
        return;
      }

      const { error: uploadError } = await getSupabase()
        .storage.from("event-files")
        .uploadToSignedUrl(signData.path, signData.token, file);
      if (uploadError) {
        setError(uploadError.message || "Upload failed");
        return;
      }

      const res = await fetch(`/api/admin/events/${eventId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: signData.path,
          fileName: file.name,
          fileSizeBytes: file.size,
          sessionId,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Upload failed");
        return;
      }
      fetchFiles();
    } finally {
      setUploading(false);
    }
  };

  const toggleVisibility = async (fileId: string, current: boolean) => {
    await fetch(`/api/admin/events/${eventId}/files?fileId=${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !current }),
    });
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, is_visible: !current } : f));
  };

  const deleteFile = async (fileId: string) => {
    if (!window.confirm("Delete this file?")) return;
    await fetch(`/api/admin/events/${eventId}/files?fileId=${fileId}`, { method: "DELETE" });
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      {files.map((file) => (
        <div key={file.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
          <FileText size={14} className="text-klo-muted shrink-0" />
          <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-klo-text truncate hover:text-[#2764FF] transition-colors">
            {file.file_name}
          </a>
          <span className="text-xs text-klo-muted shrink-0">{file.file_size}</span>
          <button onClick={() => toggleVisibility(file.id, file.is_visible)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title={file.is_visible ? "Hide from attendees" : "Show to attendees"}>
            {file.is_visible ? <Eye size={13} className="text-emerald-400" /> : <EyeOff size={13} className="text-klo-muted" />}
          </button>
          <button onClick={() => deleteFile(file.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
            <Trash2 size={13} className="text-klo-muted hover:text-red-400" />
          </button>
        </div>
      ))}
      <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-white/10 hover:border-[#2764FF]/30 cursor-pointer transition-colors">
        {uploading ? <Loader2 size={14} className="text-klo-muted animate-spin" /> : <Upload size={14} className="text-klo-muted" />}
        <span className="text-xs text-klo-muted">{uploading ? "Uploading..." : "Upload file"}</span>
        <input type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
      </label>
    </div>
  );
}
