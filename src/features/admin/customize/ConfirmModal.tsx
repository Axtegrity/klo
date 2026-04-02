"use client";

import { AlertTriangle } from "lucide-react";
import Button from "@/components/shared/Button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  changes: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  changes,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-[#161B22] border border-[#21262D] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-klo-text">{title}</h3>
          </div>
          <p className="text-sm text-klo-muted">{description}</p>
        </div>

        {/* Changes list */}
        {changes.length > 0 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-klo-muted uppercase tracking-wider mb-2">
              Changes to apply
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg bg-klo-dark/50 p-3 border border-white/5">
              {changes.map((change, i) => (
                <div
                  key={i}
                  className="text-sm text-klo-text flex items-start gap-2"
                >
                  <span className="text-[#2764FF] shrink-0 mt-0.5">*</span>
                  <span>{change}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} size="sm">
            Confirm & Save
          </Button>
        </div>
      </div>
    </div>
  );
}
