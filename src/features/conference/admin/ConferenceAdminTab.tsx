"use client";

import SeminarModeToggle from "./SeminarModeToggle";
import PollManager from "./PollManager";
import QuestionModerator from "./QuestionModerator";
import WordCloudManager from "./WordCloudManager";

export default function ConferenceAdminTab() {
  return (
    <div className="space-y-8">
      {/* Seminar Mode Toggle */}
      <section>
        <SeminarModeToggle />
      </section>

      {/* Poll Management */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Poll Management</h2>
        <PollManager />
      </section>

      {/* Question Moderation */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Question Moderation</h2>
        <QuestionModerator />
      </section>

      {/* Word Cloud */}
      <section>
        <h2 className="text-lg font-semibold text-klo-text mb-4">Word Cloud</h2>
        <WordCloudManager />
      </section>
    </div>
  );
}
