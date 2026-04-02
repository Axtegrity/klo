"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import ConfirmModal from "./ConfirmModal";

interface ColorField {
  key: string;
  label: string;
  value: string;
}

const DEFAULT_COLORS: ColorField[] = [
  { key: "primary", label: "Primary Color", value: "#2764FF" },
  { key: "accent", label: "Accent / Gold", value: "#C8A84E" },
  { key: "background", label: "Page Background", value: "#0D1117" },
  { key: "surface", label: "Card Surface", value: "#161B22" },
  { key: "text", label: "Body Text", value: "#E6EDF3" },
];

export default function BrandColorsPanel() {
  const [colors, setColors] = useState<ColorField[]>(DEFAULT_COLORS);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const updateColor = (key: string, value: string) => {
    setColors((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value } : c))
    );
    setSaved(false);
  };

  const getChanges = () =>
    colors
      .filter((c) => c.value !== DEFAULT_COLORS.find((d) => d.key === c.key)?.value)
      .map((c) => `${c.label}: ${DEFAULT_COLORS.find((d) => d.key === c.key)?.value} \u2192 ${c.value}`);

  const hasChanges = getChanges().length > 0;

  const handleSaveClick = () => {
    if (!hasChanges) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setColors(DEFAULT_COLORS);
    setSaved(false);
  };

  const getColor = (key: string) =>
    colors.find((c) => c.key === key)?.value ?? "#000";

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-klo-text mb-1">
              Brand Colors
            </h3>
            <p className="text-sm text-klo-muted">
              Changes apply across the entire app. Preview below before saving.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {colors.map((color) => (
              <div
                key={color.key}
                className="flex items-center gap-3 p-3 rounded-xl bg-klo-dark/50 border border-white/5"
              >
                <label
                  htmlFor={`color-${color.key}`}
                  className="relative w-10 h-10 rounded-lg border-2 border-white/10 cursor-pointer overflow-hidden shrink-0"
                  style={{ backgroundColor: color.value }}
                >
                  <input
                    id={`color-${color.key}`}
                    type="color"
                    value={color.value}
                    onChange={(e) => updateColor(color.key, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-klo-text">
                    {color.label}
                  </p>
                  <p className="text-xs text-klo-muted font-mono uppercase">
                    {color.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Live Preview */}
      <Card>
        <h3 className="text-base font-semibold text-klo-text mb-4">
          Live Preview
        </h3>
        <div
          className="rounded-xl p-6 border border-white/10 space-y-4"
          style={{ backgroundColor: getColor("background") }}
        >
          {/* Preview nav bar */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-white/5"
            style={{ backgroundColor: getColor("surface") }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: getColor("text") }}
            >
              keithlodom.ai
            </span>
            <div className="flex gap-2">
              <span
                className="text-xs px-3 py-1 rounded"
                style={{
                  color: getColor("text"),
                  opacity: 0.6,
                }}
              >
                Home
              </span>
              <span
                className="text-xs px-3 py-1 rounded"
                style={{ color: getColor("primary") }}
              >
                Assessments
              </span>
            </div>
          </div>

          {/* Preview card */}
          <div
            className="rounded-lg p-4 border border-white/5"
            style={{ backgroundColor: getColor("surface") }}
          >
            <h4
              className="text-lg font-semibold mb-2"
              style={{ color: getColor("text") }}
            >
              Sample Card Title
            </h4>
            <p
              className="text-sm mb-4"
              style={{ color: getColor("text"), opacity: 0.6 }}
            >
              This is how body text looks on a card surface with your chosen
              colors.
            </p>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: getColor("primary") }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: getColor("accent"),
                  color: getColor("background"),
                }}
              >
                Accent Button
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button variant="ghost" onClick={handleReset} disabled={!hasChanges}>
          Reset to Defaults
        </Button>
        <Button variant="primary" onClick={handleSaveClick} disabled={!hasChanges}>
          {saved ? (
            <span className="inline-flex items-center gap-1.5">
              <Check size={16} /> Saved!
            </span>
          ) : (
            "Save Colors"
          )}
        </Button>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Confirm Color Changes"
        description="These brand colors will apply across the entire website immediately."
        changes={getChanges()}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
