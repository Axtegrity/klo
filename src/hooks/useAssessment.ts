"use client";

import { useState, useCallback } from "react";
import type { AssessmentQuestion } from "@/lib/assessment-questions";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface AssessmentAnswerRecord {
  questionId: string;
  value: number;
  category: string;
}

export interface AssessmentSavedResult {
  assessmentId: string;
  answers: AssessmentAnswerRecord[];
  score: number;
  maxScore: number;
  completedAt: string;
}

interface UseAssessmentReturn {
  currentStep: number;
  answers: Record<string, number>;
  isComplete: boolean;
  score: number;
  maxScore: number;
  answerQuestion: (questionId: string, value: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submitAssessment: () => AssessmentSavedResult;
  resetAssessment: () => void;
  previousResult: AssessmentSavedResult | null;
}

// ------------------------------------------------------------
// localStorage helpers
// ------------------------------------------------------------

const STORAGE_PREFIX = "klo-assessment-";

function getSavedResult(assessmentId: string): AssessmentSavedResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${assessmentId}`);
    return raw ? (JSON.parse(raw) as AssessmentSavedResult) : null;
  } catch {
    return null;
  }
}

function saveResult(result: AssessmentSavedResult): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${result.assessmentId}`,
      JSON.stringify(result),
    );
  } catch {
    // Silently fail if storage is full
  }
}

function clearResult(assessmentId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${assessmentId}`);
  } catch {
    // Silently fail
  }
}

// ------------------------------------------------------------
// Hook
// ------------------------------------------------------------

export function useAssessment(
  assessmentId: string,
  questions: AssessmentQuestion[],
): UseAssessmentReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [previousResult, setPreviousResult] =
    useState<AssessmentSavedResult | null>(() => getSavedResult(assessmentId));

  const maxScore = questions.length * 5;

  const answerQuestion = useCallback((questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, questions.length - 1));
  }, [questions.length]);

  const prevQuestion = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const submitAssessment = useCallback((): AssessmentSavedResult => {
    const totalScore = Object.values(answers).reduce(
      (sum, val) => sum + val,
      0,
    );
    setScore(totalScore);
    setIsComplete(true);

    const answerRecords: AssessmentAnswerRecord[] = questions.map((q) => ({
      questionId: q.id,
      value: answers[q.id] ?? 0,
      category: q.category,
    }));

    const result: AssessmentSavedResult = {
      assessmentId,
      answers: answerRecords,
      score: totalScore,
      maxScore,
      completedAt: new Date().toISOString(),
    };

    saveResult(result);
    setPreviousResult(result);

    return result;
  }, [answers, assessmentId, maxScore, questions]);

  const resetAssessment = useCallback(() => {
    setCurrentStep(0);
    setAnswers({});
    setIsComplete(false);
    setScore(0);
    clearResult(assessmentId);
    setPreviousResult(null);
  }, [assessmentId]);

  return {
    currentStep,
    answers,
    isComplete,
    score,
    maxScore,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    submitAssessment,
    resetAssessment,
    previousResult,
  };
}
