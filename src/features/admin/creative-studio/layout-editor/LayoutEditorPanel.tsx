"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  Monitor,
  Tablet,
  Smartphone,
  Columns2,
  Columns3,
  Columns4,
  Square,
} from "lucide-react";
import type { SectionBlock, SectionType, ColumnCount, Spacing, Padding, ViewportSize, PageConfig } from "@/types/creative-studio";
import { useLayoutEditor } from "./useLayoutEditor";

const SECTION_TYPES: { id: SectionType; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "cta", label: "Call to Action" },
  { id: "testimonial", label: "Testimonial" },
  { id: "spacer", label: "Spacer" },
];

const VIEWPORTS: { size: ViewportSize; icon: React.ElementType; label: string }[] = [
  { size: 390, icon: Smartphone, label: "Mobile" },
  { size: 768, icon: Tablet, label: "Tablet" },
  { size: 1440, icon: Monitor, label: "Desktop" },
];

export default function LayoutEditorPanel() {
  const { pages, selectedPage, selectedSlug, setSelectedSlug, loading, updatePage } = useLayoutEditor();
  const [viewport, setViewport] = useState<ViewportSize>(1440);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Local state for editing
  const [sections, setSections] = useState<SectionBlock[]>([]);
  const [columns, setColumns] = useState<ColumnCount>(1);
  const [spacing, setSpacing] = useState<Spacing>("normal");
  const [padding, setPadding] = useState<Padding>("md");

  // Sync when page changes
  const loadPage = useCallback(() => {
    if (selectedPage) {
      const layout = selectedPage.layout_config as { columns?: number; spacing?: string; padding?: string } | null;
      setSections((selectedPage.sections as SectionBlock[]) ?? []);
      setColumns((layout?.columns as ColumnCount) ?? 1);
      setSpacing((layout?.spacing as Spacing) ?? "normal");
      setPadding((layout?.padding as Padding) ?? "md");
    }
  }, [selectedPage]);

  // Load on mount and when selectedPage changes
  useState(() => { loadPage(); });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const updated = [...prev];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated.map((s, i) => ({ ...s, order: i }));
    });
  };

  const addSection = (type: SectionType) => {
    const newSection: SectionBlock = {
      id: crypto.randomUUID(),
      type,
      order: sections.length,
      visible: true,
      config: {},
    };
    setSections((prev) => [...prev, newSection]);
  };

  const toggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    setError("");
    try {
      await updatePage(selectedSlug, {
        sections: sections as SectionBlock[],
        layout_config: { columns, spacing, padding, maxWidthPx: viewport } as PageConfig["layout_config"],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw size={24} className="animate-spin text-klo-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button onClick={() => setError("")} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 size={14} className="text-red-400" /></button>
        </div>
      )}

      {/* Page Selector + Viewport + Save */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedSlug}
          onChange={(e) => { setSelectedSlug(e.target.value); loadPage(); }}
          className="px-3 py-2.5 rounded-xl bg-klo-dark/50 border border-white/5 text-klo-text text-sm min-h-[44px]"
        >
          {pages.map((p) => (
            <option key={p.page_slug} value={p.page_slug}>{p.page_label}</option>
          ))}
        </select>

        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/30 border border-white/5">
          {VIEWPORTS.map((vp) => {
            const Icon = vp.icon;
            return (
              <button
                key={vp.size}
                onClick={() => setViewport(vp.size)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
                  viewport === vp.size ? "bg-klo-slate text-klo-text shadow" : "text-klo-muted hover:text-klo-text"
                }`}
              >
                <Icon size={14} /> {vp.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-klo-accent text-white text-sm font-medium hover:bg-klo-accent/80 min-h-[44px] disabled:opacity-50 ml-auto"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Layout"}
        </button>
      </div>

      {/* Grid Controls */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl glass border border-white/5">
        <div>
          <span className="text-xs text-klo-muted mb-2 block">Columns</span>
          <div className="flex gap-1">
            {([1, 2, 3, 4] as ColumnCount[]).map((col) => {
              const icons = { 1: Square, 2: Columns2, 3: Columns3, 4: Columns4 };
              const Icon = icons[col];
              return (
                <button
                  key={col}
                  onClick={() => setColumns(col)}
                  className={`p-2 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center ${
                    columns === col ? "bg-klo-accent/20 text-klo-accent" : "text-klo-muted hover:text-klo-text"
                  }`}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-xs text-klo-muted mb-2 block">Spacing</span>
          <div className="flex gap-1">
            {(["tight", "normal", "loose"] as Spacing[]).map((s) => (
              <button
                key={s}
                onClick={() => setSpacing(s)}
                className={`px-3 py-1.5 rounded-lg text-xs min-h-[36px] capitalize ${
                  spacing === s ? "bg-klo-accent/20 text-klo-accent" : "text-klo-muted hover:text-klo-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs text-klo-muted mb-2 block">Padding</span>
          <div className="flex gap-1">
            {(["none", "sm", "md", "lg"] as Padding[]).map((p) => (
              <button
                key={p}
                onClick={() => setPadding(p)}
                className={`px-3 py-1.5 rounded-lg text-xs min-h-[36px] uppercase ${
                  padding === p ? "bg-klo-accent/20 text-klo-accent" : "text-klo-muted hover:text-klo-text"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sections List (Drag & Drop) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-klo-text">Sections ({sections.length})</h4>
          <div className="flex gap-1">
            {SECTION_TYPES.map((st) => (
              <button
                key={st.id}
                onClick={() => addSection(st.id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-klo-dark/30 border border-white/5 text-xs text-klo-muted hover:text-klo-text min-h-[32px]"
              >
                <Plus size={12} /> {st.label}
              </button>
            ))}
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onToggleVisibility={() => toggleVisibility(section.id)}
                onRemove={() => removeSection(section.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {sections.length === 0 && (
          <div className="text-center py-8 text-klo-muted text-sm">
            No sections yet. Add one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function SortableSection({
  section,
  onToggleVisibility,
  onRemove,
}: {
  section: SectionBlock;
  onToggleVisibility: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        section.visible
          ? "bg-klo-dark/30 border-white/5"
          : "bg-klo-dark/10 border-white/3 opacity-50"
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-klo-muted min-h-[44px] min-w-[44px] flex items-center justify-center">
        <GripVertical size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-klo-text capitalize">{section.type}</span>
        <span className="text-xs text-klo-muted ml-2">#{section.order + 1}</span>
      </div>

      <button onClick={onToggleVisibility} className="p-2 rounded-lg hover:bg-white/5 text-klo-muted min-h-[44px] min-w-[44px] flex items-center justify-center">
        {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      <button onClick={onRemove} className="p-2 rounded-lg hover:bg-red-500/20 text-klo-muted hover:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}
