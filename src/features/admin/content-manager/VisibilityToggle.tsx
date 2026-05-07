"use client";

import { Eye, EyeOff, Archive } from "lucide-react";
import type { Visibility } from "./useContent";

const OPTIONS: { id: Visibility; label: string; icon: React.ElementType; colorClass: string }[] = [
  { id: "published", label: "Published", icon: Eye, colorClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "hidden",    label: "Hidden",    icon: EyeOff, colorClass: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  { id: "archived",  label: "Archived",  icon: Archive, colorClass: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
];

interface Props {
  value: Visibility;
  onChange: (value: Visibility) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

export default function VisibilityToggle({ value, onChange, size = "md", disabled = false }: Props) {
  const padding = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";
  const iconSize = size === "sm" ? 12 : 14;
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const minHeight = size === "sm" ? "min-h-[32px]" : "min-h-[36px]";

  return (
    <div className="inline-flex gap-1 p-1 rounded-lg bg-klo-dark/50 border border-white/5">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled && !isActive) onChange(opt.id);
            }}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 ${padding} rounded-md ${textSize} font-medium transition-all ${minHeight} ${
              isActive
                ? `${opt.colorClass} border`
                : "text-klo-muted hover:text-klo-text border border-transparent"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Icon size={iconSize} />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
