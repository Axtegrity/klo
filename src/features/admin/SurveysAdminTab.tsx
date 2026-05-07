"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Power,
  PowerOff,
  BarChart3,
  Download,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import Modal from "@/components/shared/Modal";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface Survey {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  intro_text: string | null;
  is_active: boolean;
  show_on_homepage: boolean;
  response_count: number;
  created_at: string;
}

interface SurveySection {
  id: string;
  title: string;
  sort_order: number;
}

interface QuestionResult {
  question_id: string;
  question_text: string;
  question_type: "single" | "multi" | "open";
  section_id: string | null;
  options: string[];
  counts: Record<string, number>;
  open_responses: string[];
  total: number;
}

interface SurveyResults {
  sections: SurveySection[];
  questions: QuestionResult[];
  total_respondents: number;
  filtered: boolean;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function SurveysAdminTab() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // CRUD modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [savingModal, setSavingModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [crudError, setCrudError] = useState<string | null>(null);

  // Cross-filter state
  const [filterQuestionId, setFilterQuestionId] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const fetchSurveys = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/surveys");
      if (res.ok) setSurveys(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  async function handleCreate(fields: {
    title: string;
    slug: string;
    description: string;
    intro_text: string;
    is_active: boolean;
    show_on_homepage: boolean;
  }) {
    setSavingModal(true);
    setCrudError(null);
    try {
      const res = await fetch("/api/admin/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      setShowCreateModal(false);
      await fetchSurveys();
    } catch (err) {
      setCrudError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSavingModal(false);
    }
  }

  async function handleEdit(id: string, fields: {
    title: string;
    slug: string;
    description: string;
    intro_text: string;
    is_active: boolean;
    show_on_homepage: boolean;
  }) {
    setSavingModal(true);
    setCrudError(null);
    try {
      const res = await fetch(`/api/admin/surveys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      setEditingSurvey(null);
      await fetchSurveys();
    } catch (err) {
      setCrudError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingModal(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this survey? All associated responses will also be removed. This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/surveys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      if (selectedSurvey?.id === id) {
        setSelectedSurvey(null);
        setResults(null);
      }
    } catch (err) {
      setCrudError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  const fetchResults = useCallback(
    async (surveyId: string, fqId?: string, fv?: string) => {
      setResultsLoading(true);
      try {
        let url = `/api/admin/surveys/${surveyId}/results`;
        if (fqId && fv) {
          url += `?filter_question_id=${fqId}&filter_value=${encodeURIComponent(fv)}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          // Auto-expand all sections
          setExpandedSections(
            new Set((data.sections as SurveySection[]).map((s) => s.id))
          );
        }
      } finally {
        setResultsLoading(false);
      }
    },
    []
  );

  const toggleSurvey = async (
    id: string,
    field: "is_active" | "show_on_homepage",
    value: boolean
  ) => {
    await fetch(`/api/admin/surveys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    fetchSurveys();
    if (selectedSurvey?.id === id) {
      setSelectedSurvey((s) => (s ? { ...s, [field]: value } : s));
    }
  };

  const selectSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setFilterQuestionId("");
    setFilterValue("");
    fetchResults(survey.id);
  };

  const applyFilter = () => {
    if (selectedSurvey && filterQuestionId && filterValue) {
      fetchResults(selectedSurvey.id, filterQuestionId, filterValue);
    }
  };

  const clearFilter = () => {
    setFilterQuestionId("");
    setFilterValue("");
    if (selectedSurvey) fetchResults(selectedSurvey.id);
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    if (!results || !selectedSurvey) return;
    const rows: string[] = ["Question,Type,Option,Count,Percentage"];
    for (const q of results.questions) {
      if (q.question_type === "open") {
        for (const r of q.open_responses) {
          rows.push(
            `"${q.question_text}",open,"${r.replace(/"/g, '""')}",1,`
          );
        }
      } else {
        const opts = q.options.length > 0 ? q.options : Object.keys(q.counts);
        for (const opt of opts) {
          const count = q.counts[opt] || 0;
          const pct =
            q.total > 0 ? ((count / q.total) * 100).toFixed(1) : "0";
          rows.push(
            `"${q.question_text}",${q.question_type},"${opt}",${count},${pct}%`
          );
        }
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSurvey.slug}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -- Survey list --
  if (!selectedSurvey) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-klo-text flex items-center gap-2">
            <ClipboardList size={20} />
            Surveys
          </h2>
          <button
            onClick={() => { setCrudError(null); setShowCreateModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2764FF]/10 hover:bg-[#2764FF]/20 border border-[#2764FF]/30 text-sm text-[#2764FF] font-semibold transition-colors"
          >
            <Plus size={16} />
            New Survey
          </button>
        </div>

        {crudError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {crudError}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
          </div>
        ) : surveys.length === 0 ? (
          <div className="glass rounded-2xl p-10 border border-white/5 text-center">
            <ClipboardList size={36} className="text-klo-muted/30 mx-auto mb-3" />
            <p className="text-klo-muted text-sm mb-4">No surveys yet.</p>
            <button
              onClick={() => { setCrudError(null); setShowCreateModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2764FF]/10 hover:bg-[#2764FF]/20 border border-[#2764FF]/30 text-sm text-[#2764FF] font-semibold transition-colors"
            >
              <Plus size={16} />
              Create your first survey
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((s) => (
              <div
                key={s.id}
                className="glass rounded-2xl p-4 border border-white/5"
              >
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => selectSurvey(s)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-sm font-semibold text-klo-text truncate">
                      {s.title}
                    </p>
                    <p className="text-xs text-klo-muted mt-0.5">
                      {s.response_count} response
                      {s.response_count !== 1 ? "s" : ""} &middot;{" "}
                      {s.is_active ? (
                        <span className="text-emerald-400">Active</span>
                      ) : (
                        <span className="text-klo-muted/60">Inactive</span>
                      )}
                      {s.show_on_homepage && (
                        <span className="text-[#2764FF] ml-2">
                          On Homepage
                        </span>
                      )}
                    </p>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        toggleSurvey(s.id, "is_active", !s.is_active)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        s.is_active
                          ? "text-emerald-400 hover:bg-emerald-500/10"
                          : "text-klo-muted hover:bg-white/5"
                      }`}
                      title={s.is_active ? "Deactivate survey" : "Activate survey"}
                    >
                      {s.is_active ? (
                        <Power size={16} />
                      ) : (
                        <PowerOff size={16} />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        toggleSurvey(
                          s.id,
                          "show_on_homepage",
                          !s.show_on_homepage
                        )
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        s.show_on_homepage
                          ? "text-[#2764FF] hover:bg-[#2764FF]/10"
                          : "text-klo-muted hover:bg-white/5"
                      }`}
                      title={
                        s.show_on_homepage
                          ? "Hide from homepage"
                          : "Show on homepage"
                      }
                    >
                      {s.show_on_homepage ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => selectSurvey(s)}
                      className="p-2 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors"
                      title="View results"
                    >
                      <BarChart3 size={16} />
                    </button>
                    <button
                      onClick={() => { setCrudError(null); setEditingSurvey(s); }}
                      className="p-2 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors"
                      title="Edit survey"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => void handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="p-2 rounded-lg text-red-300/60 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete survey"
                    >
                      {deletingId === s.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <SurveyFormModal
            mode="create"
            saving={savingModal}
            error={crudError}
            onSubmit={(fields) => void handleCreate(fields)}
            onClose={() => { setShowCreateModal(false); setCrudError(null); }}
          />
        )}

        {editingSurvey && (
          <SurveyFormModal
            mode="edit"
            initial={editingSurvey}
            saving={savingModal}
            error={crudError}
            onSubmit={(fields) => void handleEdit(editingSurvey.id, fields)}
            onClose={() => { setEditingSurvey(null); setCrudError(null); }}
          />
        )}
      </div>
    );
  }

  // -- Survey results view --
  // Get filterable questions (single-select only — for cross-tab)
  const filterableQuestions = (results?.questions ?? []).filter(
    (q) => q.question_type === "single" && q.options.length > 0
  );

  // Get selected filter question for its options
  const filterQuestion = filterableQuestions.find(
    (q) => q.question_id === filterQuestionId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              setSelectedSurvey(null);
              setResults(null);
            }}
            className="p-2 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-klo-text truncate">
              {selectedSurvey.title}
            </h2>
            <p className="text-xs text-klo-muted">
              {results?.total_respondents ?? 0} responses
              {results?.filtered && (
                <span className="text-amber-400 ml-2">(filtered)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() =>
              toggleSurvey(
                selectedSurvey.id,
                "show_on_homepage",
                !selectedSurvey.show_on_homepage
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedSurvey.show_on_homepage
                ? "bg-[#2764FF]/10 text-[#2764FF]"
                : "bg-white/5 text-klo-muted hover:text-klo-text"
            }`}
          >
            {selectedSurvey.show_on_homepage ? (
              <Eye size={14} />
            ) : (
              <EyeOff size={14} />
            )}
            Homepage CTA
          </button>
          <button
            onClick={exportCSV}
            disabled={!results}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2764FF]/10 text-[#2764FF] hover:bg-[#2764FF]/20 transition-colors text-xs font-medium disabled:opacity-40"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Cross-filter */}
      <div className="glass rounded-2xl p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-klo-muted" />
          <span className="text-xs font-semibold text-klo-text">
            Cross-Filter
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterQuestionId}
            onChange={(e) => {
              setFilterQuestionId(e.target.value);
              setFilterValue("");
            }}
            className="flex-1 bg-klo-dark border border-white/10 rounded-lg px-3 py-2 text-xs text-klo-text focus:outline-none focus:border-[#2764FF]/50"
          >
            <option value="">Filter by question...</option>
            {filterableQuestions.map((q, i) => (
              <option key={q.question_id} value={q.question_id}>
                Q{i + 1}: {q.question_text.slice(0, 60)}
                {q.question_text.length > 60 ? "..." : ""}
              </option>
            ))}
          </select>

          {filterQuestion && (
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="flex-1 bg-klo-dark border border-white/10 rounded-lg px-3 py-2 text-xs text-klo-text focus:outline-none focus:border-[#2764FF]/50"
            >
              <option value="">Select answer...</option>
              {filterQuestion.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <button
              onClick={applyFilter}
              disabled={!filterQuestionId || !filterValue}
              className="px-4 py-2 rounded-lg bg-[#2764FF] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
            {results?.filtered && (
              <button
                onClick={clearFilter}
                className="px-4 py-2 rounded-lg bg-white/5 text-klo-muted text-xs font-medium hover:text-klo-text transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {resultsLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
        </div>
      ) : results ? (
        <div className="space-y-4">
          {results.sections.map((section) => {
            const sectionQuestions = results.questions.filter(
              (q) => q.section_id === section.id
            );
            const isExpanded = expandedSections.has(section.id);

            return (
              <div
                key={section.id}
                className="glass rounded-2xl border border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <h3 className="text-sm font-semibold text-klo-text">
                    {section.title}
                  </h3>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-klo-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-klo-muted" />
                  )}
                </button>

                {isExpanded && (
                  <div className="divide-y divide-white/5">
                    {sectionQuestions.map((q) => (
                      <div key={q.question_id} className="p-4 space-y-3">
                        <p className="text-sm font-medium text-klo-text">
                          {q.question_text}
                        </p>
                        <p className="text-xs text-klo-muted">
                          {q.total} response{q.total !== 1 ? "s" : ""}
                        </p>

                        {q.question_type === "open" ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {q.open_responses.length === 0 ? (
                              <p className="text-xs text-klo-muted/60 italic">
                                No responses yet
                              </p>
                            ) : (
                              q.open_responses.map((r, i) => (
                                <div
                                  key={i}
                                  className="text-xs text-klo-muted bg-klo-dark/50 rounded-lg p-3"
                                >
                                  &ldquo;{r}&rdquo;
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {q.options.map((opt) => {
                              const count = q.counts[opt] || 0;
                              const pct =
                                q.total > 0
                                  ? Math.round((count / q.total) * 100)
                                  : 0;
                              const maxCount = Math.max(
                                ...Object.values(q.counts),
                                0
                              );
                              const isLeading =
                                count === maxCount && maxCount > 0;
                              return (
                                <div key={opt}>
                                  <div className="flex items-center justify-between text-xs mb-0.5">
                                    <span
                                      className={
                                        isLeading
                                          ? "text-klo-text font-semibold"
                                          : "text-klo-muted"
                                      }
                                    >
                                      {opt}
                                    </span>
                                    <span
                                      className={
                                        isLeading
                                          ? "text-klo-text font-semibold"
                                          : "text-klo-muted"
                                      }
                                    >
                                      {count} ({pct}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-white/5">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: isLeading
                                          ? "#D4A853"
                                          : "#2764FF",
                                        opacity: isLeading ? 1 : 0.6,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Questions without a section */}
          {results.questions.filter((q) => !q.section_id).length > 0 && (
            <div className="glass rounded-2xl border border-white/5 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-klo-text">
                Uncategorized
              </h3>
              {results.questions
                .filter((q) => !q.section_id)
                .map((q) => (
                  <div key={q.question_id} className="space-y-3">
                    <p className="text-sm font-medium text-klo-text">
                      {q.question_text}
                    </p>
                    <p className="text-xs text-klo-muted">
                      {q.total} response{q.total !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------
// Survey Create/Edit Modal
// ------------------------------------------------------------

interface SurveyFormFields {
  title: string;
  slug: string;
  description: string;
  intro_text: string;
  is_active: boolean;
  show_on_homepage: boolean;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function SurveyFormModal({
  mode,
  initial,
  saving,
  error,
  onSubmit,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: Survey;
  saving: boolean;
  error: string | null;
  onSubmit: (fields: SurveyFormFields) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugManual, setSlugManual] = useState(mode === "edit");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [introText, setIntroText] = useState(initial?.intro_text ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? false);
  const [showOnHomepage, setShowOnHomepage] = useState(initial?.show_on_homepage ?? false);
  const [validationError, setValidationError] = useState("");

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManual) {
      setSlug(toSlug(val));
    }
  }

  function handleSlugChange(val: string) {
    setSlugManual(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  function handleSubmit() {
    if (!title.trim()) {
      setValidationError("Title is required.");
      return;
    }
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug.trim())) {
      setValidationError("Slug must be lowercase letters, numbers, and hyphens only.");
      return;
    }
    setValidationError("");
    onSubmit({
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      intro_text: introText.trim(),
      is_active: isActive,
      show_on_homepage: showOnHomepage,
    });
  }

  const inputClass = "w-full bg-[#0D1117] border border-[#21262D] rounded-lg px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted/50 focus:outline-none focus:ring-2 focus:ring-[#2764FF]/50";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-klo-muted mb-1.5 block";

  return (
    <Modal isOpen={true} onClose={onClose} title={mode === "create" ? "Create survey" : "Edit survey"}>
      <div className="space-y-4">
        {(validationError || error) && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {validationError || error}
          </div>
        )}

        <div>
          <label className={labelClass}>
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="AI Readiness Survey"
            className={inputClass}
            maxLength={300}
          />
        </div>

        <div>
          <label className={labelClass}>
            Slug <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="ai-readiness-survey"
            className={inputClass}
            maxLength={300}
          />
          <p className="text-[11px] text-klo-muted mt-1">
            Lowercase letters, numbers, and hyphens only. Auto-generated from title.
          </p>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="A brief description shown to participants..."
            className={`${inputClass} resize-y`}
            maxLength={2000}
          />
        </div>

        <div>
          <label className={labelClass}>Intro text</label>
          <textarea
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            rows={3}
            placeholder="Welcome copy shown before the survey begins..."
            className={`${inputClass} resize-y`}
            maxLength={5000}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-klo-text">Active</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setShowOnHomepage((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${showOnHomepage ? "bg-[#2764FF]" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showOnHomepage ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-klo-text">Show on homepage</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#2764FF]/20 text-[#2764FF] hover:bg-[#2764FF]/30 border border-[#2764FF]/30 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mode === "create" ? "Create survey" : "Save changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
