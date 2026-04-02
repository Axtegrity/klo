"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import Button from "@/components/shared/Button";

export interface EditField {
  key: string;
  label: string;
  value: string;
  type: "text" | "textarea" | "url" | "select" | "file";
  maxLength?: number;
  options?: string[];
  hint?: string;
  required?: boolean;
}

interface EditModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  fields: EditField[];
  files?: { name: string; type: string; size: string }[];
  onSave: (values: Record<string, string>) => void;
  onClose: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

export default function EditModal({
  open,
  title,
  subtitle,
  fields,
  files = [],
  onSave,
  onClose,
  onDelete,
  isNew = false,
}: EditModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const f of fields) map[f.key] = f.value;
    return map;
  });
  const [uploadedFiles, setUploadedFiles] = useState(files);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const update = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const getChanges = (): string[] => {
    const changes: string[] = [];
    for (const f of fields) {
      if (values[f.key] !== f.value) {
        changes.push(`${f.label} updated`);
      }
    }
    if (uploadedFiles.length !== files.length) {
      changes.push("Files modified");
    }
    return changes;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).map((f) => ({
      name: f.name,
      type: f.type || "application/octet-stream",
      size: f.size < 1024 * 1024
        ? `${(f.size / 1024).toFixed(0)} KB`
        : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const inputClasses =
    "w-full bg-[#0D1117] border border-[#21262D] rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50 focus:border-[#2764FF]/50 transition-all";

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "PDF";
    if (type.includes("word") || type.includes("docx")) return "DOC";
    if (type.includes("text")) return "TXT";
    if (type.includes("presentation") || type.includes("pptx")) return "PPT";
    return "FILE";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[10vh] pb-8 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#161B22] border border-[#21262D] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262D]">
          <div>
            <h3 className="text-lg font-semibold text-klo-text">{title}</h3>
            {subtitle && (
              <p className="text-xs text-klo-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-klo-muted hover:text-klo-text transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {fields.map((field) => (
            <div key={field.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`edit-${field.key}`}
                  className="text-sm text-klo-muted flex items-center gap-1.5"
                >
                  {field.label}
                  {field.required && <span className="text-red-400">*</span>}
                  {field.type === "url" && (
                    <ExternalLink size={12} className="text-klo-muted/50" />
                  )}
                </label>
                {field.maxLength && (
                  <span
                    className={`text-xs font-mono ${
                      (values[field.key]?.length ?? 0) > field.maxLength
                        ? "text-red-400"
                        : "text-klo-muted/50"
                    }`}
                  >
                    {values[field.key]?.length ?? 0}/{field.maxLength}
                  </span>
                )}
              </div>

              {field.type === "textarea" ? (
                <textarea
                  id={`edit-${field.key}`}
                  value={values[field.key] ?? ""}
                  onChange={(e) => update(field.key, e.target.value)}
                  maxLength={field.maxLength}
                  rows={4}
                  className={`${inputClasses} resize-none`}
                />
              ) : field.type === "select" ? (
                <select
                  id={`edit-${field.key}`}
                  value={values[field.key] ?? ""}
                  onChange={(e) => update(field.key, e.target.value)}
                  className={inputClasses}
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`edit-${field.key}`}
                  type={field.type === "url" ? "url" : "text"}
                  value={values[field.key] ?? ""}
                  onChange={(e) => update(field.key, e.target.value)}
                  maxLength={field.maxLength}
                  className={`${inputClasses} ${
                    field.type === "url" ? "font-mono text-xs" : ""
                  }`}
                />
              )}

              {field.hint && (
                <p className="text-xs text-klo-muted/50 mt-1">{field.hint}</p>
              )}
            </div>
          ))}

          {/* File Upload Section */}
          <div className="pt-2">
            <p className="text-sm text-klo-muted mb-2">Attachments</p>

            {/* Existing files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                {uploadedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-klo-dark/50 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#2764FF]">
                          {getFileIcon(file.type)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-klo-text truncate max-w-[300px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-klo-muted">{file.size}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-klo-muted hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[#21262D] hover:border-[#2764FF]/30 text-klo-muted hover:text-klo-text transition-all cursor-pointer"
            >
              <Upload size={18} />
              <span className="text-sm">
                Upload PDF, Word, TXT, or PowerPoint
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.pptx,.ppt"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-klo-muted/50 mt-1.5">
              Max 10 MB per file. Accepted: PDF, Word (.doc/.docx), Text (.txt), PowerPoint (.pptx)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#21262D] flex items-center justify-between">
          <div>
            {onDelete && !isNew && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Are you sure?</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={onDelete}
                    >
                      Yes, Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {showSaveConfirm ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <span className="text-xs text-amber-400">This goes live immediately.</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowSaveConfirm(false);
                    onSave(values);
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveConfirm(false)}
                >
                  Back
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowSaveConfirm(true)}
              >
                {isNew ? "Create & Publish" : "Save Changes"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
