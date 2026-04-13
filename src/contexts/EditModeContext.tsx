"use client";

// EditModeContext — provides edit-mode state and pending image changes
// to the home page component tree when rendered inside /admin/edit.
//
// Default (editMode: false) means the public home page is completely
// unaffected — context consumers only activate their overlays when
// editMode is true.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { HeroConfig, SectionImages } from "@/lib/page-config-server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditableSlot = "hero" | "latestBrief" | "featuredInsight";

interface PendingChanges {
  hero_config?: HeroConfig | null;
  section_images?: SectionImages | null;
}

interface EditModeContextValue {
  editMode: boolean;
  pendingChanges: PendingChanges;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  setSlotImage: (slot: EditableSlot, url: string | null) => void;
  discard: () => void;
  publish: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const EditModeContext = createContext<EditModeContextValue>({
  editMode: false,
  pendingChanges: {},
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  setSlotImage: () => {},
  discard: () => {},
  publish: async () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

interface EditModeProviderProps {
  children: React.ReactNode;
  /** The server-fetched page config at initial load — used as the discard baseline. */
  initialHeroConfig: HeroConfig | null;
  initialSectionImages: SectionImages | null;
}

export function EditModeProvider({
  children,
  initialHeroConfig,
  initialSectionImages,
}: EditModeProviderProps) {
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    hero_config: initialHeroConfig,
    section_images: initialSectionImages,
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Autosave: debounce 1500ms. Ref stores the timer so it doesn't re-render.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutosave = useCallback((changes: PendingChanges) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const res = await fetch("/api/admin/creative-studio/pages/home", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        });
        if (res.ok) {
          setIsDirty(false);
          setLastSavedAt(new Date());
        }
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  }, []);

  const setSlotImage = useCallback(
    (slot: EditableSlot, url: string | null) => {
      setPendingChanges((prev) => {
        let next: PendingChanges;

        if (slot === "hero") {
          const base = prev.hero_config ?? initialHeroConfig;
          next = {
            ...prev,
            hero_config: base
              ? { ...base, backgroundType: "image", backgroundRef: url }
              : {
                  headline: "Keith L. Odom",
                  subheadline:
                    "Empowering organizations with AI-driven strategy and digital transformation",
                  backgroundType: "image",
                  backgroundRef: url,
                  overlayOpacity: 0.95,
                },
          };
        } else {
          const sectionKey =
            slot === "latestBrief" ? "latestBrief" : "featuredInsight";
          next = {
            ...prev,
            section_images: {
              ...(prev.section_images ?? initialSectionImages ?? {}),
              [sectionKey]: {
                backgroundType: "image" as const,
                backgroundRef: url,
                overlayOpacity: 0.04,
              },
            },
          };
        }

        setIsDirty(true);
        triggerAutosave(next);
        return next;
      });
    },
    [initialHeroConfig, initialSectionImages, triggerAutosave]
  );

  const discard = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setPendingChanges({
      hero_config: initialHeroConfig,
      section_images: initialSectionImages,
    });
    setIsDirty(false);
  }, [initialHeroConfig, initialSectionImages]);

  const publish = useCallback(async () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/creative-studio/pages/home", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingChanges),
      });
      if (res.ok) {
        setIsDirty(false);
        setLastSavedAt(new Date());
      }
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges]);

  const value = useMemo(
    () => ({
      editMode: true,
      pendingChanges,
      isDirty,
      isSaving,
      lastSavedAt,
      setSlotImage,
      discard,
      publish,
    }),
    [
      pendingChanges,
      isDirty,
      isSaving,
      lastSavedAt,
      setSlotImage,
      discard,
      publish,
    ]
  );

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEditMode() {
  return useContext(EditModeContext);
}
