"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import Button from "@/components/shared/Button";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface SurveySection {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface SurveyQuestion {
  id: string;
  section_id: string | null;
  question_text: string;
  question_type: "single" | "multi" | "open";
  options: string[];
  sort_order: number;
  required: boolean;
}

interface Survey {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  intro_text: string | null;
}

type Answers = Record<string, { value?: string; values?: string[]; text?: string }>;

// ------------------------------------------------------------
// Fingerprint (simple anonymous ID)
// ------------------------------------------------------------

function getFingerprint(): string {
  const key = "klo_survey_fp";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(key, fp);
  }
  return fp;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function SurveyClient({ slug }: { slug: string }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [sections, setSections] = useState<SurveySection[]>([]);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);

  // Fetch survey data
  useEffect(() => {
    fetch(`/api/surveys/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setSurvey(data.survey);
        setSections(data.sections);
        setQuestions(data.questions);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const currentQuestion = questions[currentStep];
  const currentSection = currentQuestion
    ? sections.find((s) => s.id === currentQuestion.section_id)
    : null;

  // Check if current question has been answered
  const isAnswered = useCallback(() => {
    if (!currentQuestion) return false;
    const a = answers[currentQuestion.id];
    if (!a) return !currentQuestion.required;
    if (currentQuestion.question_type === "single") return !!a.value;
    if (currentQuestion.question_type === "multi")
      return (a.values?.length ?? 0) > 0;
    if (currentQuestion.question_type === "open")
      return !currentQuestion.required || (a.text?.trim().length ?? 0) > 0;
    return false;
  }, [currentQuestion, answers]);

  const handleSingleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { value } }));
    // Auto-advance after a brief delay so the user sees their selection
    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setDirection(1);
        setCurrentStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 400);
    }
  };

  const handleMultiToggle = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionId]?.values ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [questionId]: { values: next } };
    });
  };

  const handleOpenText = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { text } }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setDirection(-1);
    setStarted(false);
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!survey) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload = questions.map((q) => {
      const a = answers[q.id];
      return {
        question_id: q.id,
        answer_value:
          q.question_type === "single"
            ? a?.value
            : q.question_type === "open"
              ? a?.text
              : undefined,
        answer_values: q.question_type === "multi" ? a?.values : undefined,
      };
    });

    try {
      const res = await fetch(`/api/surveys/${slug}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: getFingerprint(),
          answers: payload,
        }),
      });

      if (res.status === 409) {
        setSubmitError("You have already completed this survey. Thank you!");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSubmitError(data?.error ?? "Failed to submit. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // -- Loading / Not Found --
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
        <div className="w-8 h-8 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1117] px-6">
        <div className="text-center space-y-4">
          <ClipboardList size={48} className="text-klo-muted mx-auto" />
          <h1 className="text-2xl font-display font-bold text-klo-text">
            Survey Not Found
          </h1>
          <p className="text-klo-muted">
            This survey may have ended or the link is incorrect.
          </p>
          <Button variant="primary" href="/">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // -- Submitted --
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1117] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-klo-text">
            Thank You!
          </h1>
          <p className="text-klo-muted text-lg leading-relaxed">
            Your responses have been recorded. Thank you for contributing to this
            important research.
          </p>
          <Button variant="primary" href="/">
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // -- Intro Screen --
  if (!started) {
    return (
      <div className="min-h-screen px-6 py-24 md:py-32 bg-[#0D1117]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#2764FF]/10 flex items-center justify-center">
              <ClipboardList size={36} className="text-[#2764FF]" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-klo-muted text-lg">{survey.description}</p>
            )}
          </div>

          {survey.intro_text && (
            <div className="text-left bg-[#011A5E]/30 border border-[#0E3783]/50 rounded-2xl p-6">
              <p className="text-klo-muted text-sm leading-relaxed whitespace-pre-line">
                {survey.intro_text}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-sm text-klo-muted">
            <span>{questions.length} questions</span>
            <span>~{Math.ceil(questions.length / 3)} minutes</span>
          </div>

          <Button variant="primary" size="lg" onClick={() => setStarted(true)}>
            Begin Survey
          </Button>
        </motion.div>
      </div>
    );
  }

  // -- Survey Questions --
  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  const prevSectionId =
    currentStep > 0 ? questions[currentStep - 1]?.section_id : null;
  const showSectionHeader =
    currentSection && currentSection.id !== prevSectionId;

  return (
    <div className="min-h-screen px-6 py-24 md:py-32 bg-[#0D1117]">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Progress */}
        {/* Survey progress — reaches 100% only after final question is answered */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-klo-muted">
              Question{" "}
              <span className="text-klo-text font-medium">{currentStep + 1}</span>{" "}
              of {questions.length}
            </span>
            <span className="text-[#68E9FA] font-medium text-xs uppercase tracking-wider">
              {currentSection?.title ?? "Survey"}
            </span>
          </div>
          <div className="w-full h-2 bg-klo-slate rounded-full overflow-hidden">
            <div
              className="h-full bg-[#68E9FA] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="relative overflow-x-hidden min-h-[300px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Section header */}
              {showSectionHeader && (
                <div className="pb-4 border-b border-[#0E3783]/50">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2764FF]">
                    {currentSection.title}
                  </h3>
                  {currentSection.description && (
                    <p className="text-xs text-klo-muted mt-1">
                      {currentSection.description}
                    </p>
                  )}
                </div>
              )}

              {/* Question text */}
              <h2 className="font-display text-xl md:text-2xl font-semibold text-klo-text leading-snug flex items-start gap-3 flex-wrap">
                <span>
                  {currentStep + 1}. {currentQuestion.question_text}
                </span>
                {!currentQuestion.required && (
                  <span className="text-xs font-sans font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-klo-text/10 text-klo-text/70 mt-2">
                    Optional
                  </span>
                )}
              </h2>

              {/* Options */}
              {currentQuestion.question_type === "single" && (
                <div className="space-y-3">
                  {currentQuestion.options.map((opt) => {
                    const isSelected =
                      answers[currentQuestion.id]?.value === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          handleSingleSelect(currentQuestion.id, opt)
                        }
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-[#68E9FA] bg-[#68E9FA]/10 shadow-md shadow-[#68E9FA]/5"
                            : "border-[#0E3783] bg-[#011A5E] hover:border-[#68E9FA]/30 hover:bg-[#011A5E]/80"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "border-[#68E9FA] bg-[#68E9FA]"
                                : "border-[#8BA3D4]/40"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-[#0D1117]" />
                            )}
                          </div>
                          <span
                            className={`text-sm leading-relaxed ${
                              isSelected ? "text-klo-text" : "text-klo-muted"
                            }`}
                          >
                            {opt}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.question_type === "multi" && (
                <div className="space-y-3">
                  <p className="text-xs text-klo-muted">
                    Select all that apply
                  </p>
                  {currentQuestion.options.map((opt) => {
                    const isSelected =
                      answers[currentQuestion.id]?.values?.includes(opt) ??
                      false;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          handleMultiToggle(currentQuestion.id, opt)
                        }
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-[#68E9FA] bg-[#68E9FA]/10 shadow-md shadow-[#68E9FA]/5"
                            : "border-[#0E3783] bg-[#011A5E] hover:border-[#68E9FA]/30 hover:bg-[#011A5E]/80"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "border-[#68E9FA] bg-[#68E9FA]"
                                : "border-[#8BA3D4]/40"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2.5 6L5 8.5L9.5 3.5"
                                  stroke="#0D1117"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`text-sm leading-relaxed ${
                              isSelected ? "text-klo-text" : "text-klo-muted"
                            }`}
                          >
                            {opt}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.question_type === "open" && (
                <textarea
                  value={answers[currentQuestion.id]?.text ?? ""}
                  onChange={(e) =>
                    handleOpenText(currentQuestion.id, e.target.value)
                  }
                  placeholder="Type your response..."
                  rows={4}
                  className="w-full bg-[#011A5E] border border-[#0E3783] rounded-xl px-4 py-3 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-[#68E9FA]/50 resize-none"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col gap-4 pt-4 border-t border-[#0E3783]/50">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={18} />
              Previous
            </Button>

            {currentStep === questions.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={submitting || (!isAnswered() && currentQuestion.required)}
              >
                {submitting ? "Submitting..." : "Submit Survey"}
                <Send size={16} />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                disabled={!isAnswered() && currentQuestion.required}
              >
                Next
                <ChevronRight size={18} />
              </Button>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              Start Over
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
