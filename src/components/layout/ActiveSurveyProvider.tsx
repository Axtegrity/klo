"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ActiveSurvey {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

interface ActiveSurveyContextValue {
  survey: ActiveSurvey | null;
  loading: boolean;
}

const ActiveSurveyContext = createContext<ActiveSurveyContextValue>({
  survey: null,
  loading: true,
});

export function useActiveSurvey() {
  return useContext(ActiveSurveyContext);
}

export default function ActiveSurveyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [survey, setSurvey] = useState<ActiveSurvey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/surveys/active?nav=1")
      .then((r) => r.json())
      .then((data) => setSurvey(data.survey ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ActiveSurveyContext.Provider value={{ survey, loading }}>
      {children}
    </ActiveSurveyContext.Provider>
  );
}
