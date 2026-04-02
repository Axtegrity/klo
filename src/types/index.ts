// ============================================================
// KLO App — Core Type Definitions
// ============================================================

/** Lucide icon name reference (string union kept open for extensibility). */
export type IconName = string;

// ------------------------------------------------------------
// Navigation & Layout
// ------------------------------------------------------------

export interface NavigationItem {
  label: string;
  href: string;
  icon: IconName;
  /** Optional badge count displayed on the nav item. */
  badge?: number;
  /** Whether the link requires authentication. */
  requiresAuth?: boolean;
}

// ------------------------------------------------------------
// User & Profile
// ------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: "free" | "pro" | "executive" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface Profile extends User {
  bio?: string;
  organization?: string;
  title?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedIn?: string;
  interests: string[];
  completedAssessments: string[];
  subscriptionTier: SubscriptionTierSlug;
  onboardingComplete: boolean;
}

// ------------------------------------------------------------
// Subscription
// ------------------------------------------------------------

export type SubscriptionTierSlug = "free" | "pro" | "executive";

export interface SubscriptionTier {
  slug: SubscriptionTierSlug;
  name: string;
  price: number;
  /** Billing interval label, e.g. "month". */
  interval: "month" | "year";
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  /** Stripe price ID or equivalent. */
  stripePriceId?: string;
}

// ------------------------------------------------------------
// Assessments
// ------------------------------------------------------------

export interface Assessment {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  href: string;
  /** Number of questions in the assessment. */
  questionCount?: number;
  /** Estimated minutes to complete. */
  estimatedMinutes?: number;
  category?: string;
}

export interface AssessmentAnswer {
  questionId: string;
  value: string | number | boolean;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  userId: string;
  answers: AssessmentAnswer[];
  score: number;
  maxScore: number;
  percentile?: number;
  summary: string;
  recommendations: string[];
  completedAt: string;
  createdAt: string;
}

// ------------------------------------------------------------
// Vault (Premium Content)
// ------------------------------------------------------------

export type VaultContentType = "video" | "article" | "pdf" | "template" | "tool";

export interface VaultContent {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: VaultContentType;
  thumbnailUrl?: string;
  contentUrl: string;
  /** Minimum tier required to access this content. */
  requiredTier: SubscriptionTierSlug;
  tags: string[];
  duration?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// AI Advisor
// ------------------------------------------------------------

export type AdvisorRole = "user" | "assistant" | "system";

export interface AdvisorMessage {
  id: string;
  role: AdvisorRole;
  content: string;
  timestamp: string;
  /** Optional metadata attached by the AI (e.g. citations). */
  metadata?: Record<string, unknown>;
}

export interface AdvisorConversation {
  id: string;
  userId: string;
  title: string;
  messages: AdvisorMessage[];
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// Strategy Room
// ------------------------------------------------------------

export type StrategyRoomStatus = "draft" | "active" | "completed" | "archived";

export interface StrategyRoom {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  status: StrategyRoomStatus;
  participants: string[];
  objectives: string[];
  /** Key deliverables or action items. */
  deliverables: StrategyDeliverable[];
  createdAt: string;
  updatedAt: string;
}

export interface StrategyDeliverable {
  id: string;
  title: string;
  assignee?: string;
  completed: boolean;
  dueDate?: string;
}

// ------------------------------------------------------------
// Community Feed
// ------------------------------------------------------------

export type FeedPostType = "text" | "image" | "link" | "poll";

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  type: FeedPostType;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  likes: number;
  createdAt: string;
}

// ------------------------------------------------------------
// Services
// ------------------------------------------------------------

export interface Service {
  title: string;
  description: string;
  icon: IconName;
  features?: string[];
  href?: string;
}

// ------------------------------------------------------------
// Affiliations
// ------------------------------------------------------------

export interface Affiliation {
  name: string;
  role?: string;
  logoUrl?: string;
  url?: string;
}

// ------------------------------------------------------------
// Admin Analytics
// ------------------------------------------------------------

export interface AdminDashboardStats {
  users: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
    byTier: { free: number; pro: number; executive: number };
  };
  subscriptions: {
    total: number;
    mrr: number;
  };
  advisor: {
    totalMessages: number;
    totalTokens: number;
    avgPerUser: number;
  };
  assessments: {
    totalCompleted: number;
    byType: Record<string, number>;
  };
  strategyRooms: {
    activeRooms: number;
  };
  vault: {
    totalContent: number;
    byType: Record<string, number>;
    byTier: Record<string, number>;
  };
}

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  organization_name: string | null;
  subscription_tier: string;
  role: string;
  disabled: boolean;
  disabled_at: string | null;
  disabled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminAssessmentResult {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  assessment_type: string;
  score: number;
  created_at: string;
}

export interface AdminTimeSeriesPoint {
  date: string;
  count: number;
}

export interface AdminActivityData {
  signups: AdminTimeSeriesPoint[];
  advisorUsage: AdminTimeSeriesPoint[];
  assessments: AdminTimeSeriesPoint[];
  subscriptionConversions: AdminTimeSeriesPoint[];
}

export interface AdminInquiry {
  id: string;
  type: "booking" | "consultation";
  status: "new" | "reviewed" | "contacted" | "archived";
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  event_name: string | null;
  event_date: string | null;
  event_type: string | null;
  budget_range: string | null;
  audience_size: string | null;
  message: string | null;
  industry: string | null;
  location: string | null;
  area_of_interest: string | null;
  organization_size: string | null;
  current_challenge: string | null;
  timeline: string | null;
  previous_consultant: string | null;
  additional_details: string | null;
  ip_address: string | null;
  created_at: string;
}
