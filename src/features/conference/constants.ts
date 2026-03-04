export const CONFERENCE_COLORS = {
  gold: "#C8A84E",
  blue: "#2764FF",
  cyan: "#21B8CD",
  purple: "#8840FF",
  lime: "#6ECF55",
  magenta: "#F77A81",
  yellow: "#FBF073",
} as const;

export const WORD_CLOUD_PALETTE = [
  CONFERENCE_COLORS.blue,
  CONFERENCE_COLORS.cyan,
  CONFERENCE_COLORS.gold,
  CONFERENCE_COLORS.purple,
  CONFERENCE_COLORS.lime,
  CONFERENCE_COLORS.magenta,
  CONFERENCE_COLORS.yellow,
];

export type ConferenceToolTab = "polls" | "qa" | "wordcloud";

export const CONFERENCE_TOOL_TABS: { id: ConferenceToolTab; label: string }[] = [
  { id: "polls", label: "Polls" },
  { id: "qa", label: "Q&A" },
  { id: "wordcloud", label: "Word Cloud" },
];

export const MONITOR_CYCLE_INTERVAL = 10000; // 10s per view
export const WORD_CLOUD_MIN_FONT = 14;
export const WORD_CLOUD_MAX_FONT = 72;
