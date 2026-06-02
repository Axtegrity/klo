export type FeedCategory = string;

export interface FeedPost {
  id: string;
  title: string;
  category: FeedCategory;
  content: string;
  publishedAt: string;
  readTime: string;
  isPremium: boolean;
}

export const categoryColors: Record<string, string> = {
  // Vault categories (primary)
  "AI & Ethics": "blue",
  "Church & Tech": "green",
  "Governance": "gold",
  "Leadership": "gold",
  "Youth & Workforce": "green",
  "Previous Events": "muted",
  "Current Events": "blue",
  // Legacy feed categories (backward compat)
  "AI Breakthroughs": "blue",
  "Regulatory Shifts": "gold",
  "Tech Ethics": "green",
  "Church Implications": "muted",
  "Uncategorized": "muted",
} as const;

export function getCategoryColor(category: string): "blue" | "gold" | "green" | "muted" {
  return (categoryColors[category] ?? "muted") as "blue" | "gold" | "green" | "muted";
}
