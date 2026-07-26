import { z } from "zod";

// ----------------------------------------------------------------
// Shared primitives
// ----------------------------------------------------------------

const uuidSchema = z.string().uuid();
const emailSchema = z.string().email().max(320);
const nonEmptyString = z.string().min(1).max(5000);

// Strict http(s)-only URL: z.string().url() alone accepts any WHATWG-parseable
// scheme (javascript:, data:, etc.), not just http/https — insufficient on its
// own for any URL that ends up bound to an href. Use this instead of a bare
// .url() wherever the value can render as a link. (Avery review, PR #234
// follow-up — a web-search-derived `link` field reached two href bindings
// with no scheme check.)
function isHttpUrl(val: string): boolean {
  try {
    const parsed = new URL(val);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const httpUrlSchema = (max: number) =>
  z.string().url().max(max).refine(isHttpUrl, { message: "Must be an http(s) URL" });

// ----------------------------------------------------------------
// Assessment download (PDF, PPTX, DOCX — all share the same shape)
// ----------------------------------------------------------------

export const assessmentDownloadSchema = z.object({
  title: z.string().max(500).optional(),
  score: z.number(),
  maxScore: z.number(),
  percentage: z.number().min(0).max(100),
  recommendations: z.array(z.string().max(2000)).optional(),
});

// ----------------------------------------------------------------
// POST /api/assessments — save assessment result
// ----------------------------------------------------------------

export const assessmentSaveSchema = z.object({
  assessment_type: nonEmptyString,
  score: z.number(),
  answers: z.unknown(), // JSON structure varies per assessment
  recommendations: z.array(z.string()).optional(),
});

// ----------------------------------------------------------------
// POST /api/ai-advisor
// ----------------------------------------------------------------

export const aiAdvisorSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.string().min(1),
        content: z.string().min(1).max(50000),
      })
    )
    .min(1)
    .max(100),
});

// ----------------------------------------------------------------
// POST /api/auth/register
// ----------------------------------------------------------------

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(200),
  full_name: z.string().max(200).optional(),
});

// ----------------------------------------------------------------
// POST /api/stripe/checkout
// ----------------------------------------------------------------

export const stripeCheckoutSchema = z.object({
  priceId: nonEmptyString,
  tier: z.enum(["pro", "executive"]),
});

// ----------------------------------------------------------------
// POST /api/stripe/portal
// ----------------------------------------------------------------

export const stripePortalSchema = z.object({
  customerId: nonEmptyString,
});

// ----------------------------------------------------------------
// Push notifications
// ----------------------------------------------------------------

export const pushSendSchema = z.object({
  title: nonEmptyString,
  body: nonEmptyString,
  url: z.string().max(2000).optional(),
  tag: z.string().max(200).optional(),
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
});

export const pushSubscribeSchema = z.object({
  platform: z.enum(["web", "ios", "android"]),
  token: z.unknown(), // web push token can be object or string
  userAgent: z.string().max(500).optional(),
});

export const pushUnsubscribeSchema = z.object({
  token: z.unknown(), // can be object or string
});

// ----------------------------------------------------------------
// Admin: changelog
// ----------------------------------------------------------------

export const changelogCreateSchema = z.object({
  version: nonEmptyString,
  title: nonEmptyString,
  description: z.string().max(5000).optional(),
  type: z.string().max(50).optional(),
});

export const changelogDeleteSchema = z.object({
  id: uuidSchema,
});

// ----------------------------------------------------------------
// Admin: inquiries PATCH
// ----------------------------------------------------------------

export const inquiryUpdateSchema = z.object({
  id: uuidSchema,
  status: z.enum(["new", "reviewed", "contacted", "archived"]),
});

// ----------------------------------------------------------------
// Admin: activity log
// ----------------------------------------------------------------

export const activityLogSchema = z.object({
  action: nonEmptyString,
  entity_type: nonEmptyString,
  entity_id: z.string().optional(),
  details: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ----------------------------------------------------------------
// Admin: events POST
// ----------------------------------------------------------------

export const adminEventCreateSchema = z.object({
  title: nonEmptyString,
  conference_name: nonEmptyString,
  conference_location: nonEmptyString,
  event_category: z.string().max(100).optional(),
  description: z.string().max(10000).optional(),
  event_date: nonEmptyString,
  event_time: z.string().max(50).optional(),
  event_timezone: z.string().max(100).optional(),
  website_url: z.string().url().max(2000).optional().or(z.literal("")),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().max(10000).optional(),
  session_name: z.string().max(500).optional(),
  room_location: z.string().max(500).optional(),
  is_guest_presenter: z.boolean().optional(),
  // Required — every new event must set an end time (session lifecycle feature,
  // 2026-07). No .nullable() either: an empty string is rejected by nonEmptyString
  // (min length 1), so the create form must collect a real HH:MM value.
  session_end_time: nonEmptyString.max(50),
  access_code: z.string().max(50).optional(),
  event_status: z.enum(["upcoming", "live", "ended", "past"]).optional(),
});

// ----------------------------------------------------------------
// Admin: events [id] PUT
// ----------------------------------------------------------------

export const adminEventUpdateSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(10000).nullable().optional(),
  conference_name: z.string().max(500).optional(),
  conference_location: z.string().max(500).optional(),
  event_category: z.string().max(100).optional(),
  event_date: z.string().nullable().optional(),
  event_time: z.string().max(50).nullable().optional(),
  event_timezone: z.string().max(100).optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  slug: z.string().max(500).optional(),
  access_code: z.string().max(50).nullable().optional(),
  seminar_mode: z.boolean().optional(),
  website_url: z.string().max(2000).nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
  session_name: z.string().max(500).nullable().optional(),
  room_location: z.string().max(500).nullable().optional(),
  is_guest_presenter: z.boolean().optional(),
  // Optional so partial PUTs (seminar_mode toggle, pinned_as_next, End/Close
  // Event, etc.) can omit it — but no longer .nullable(): once a value has
  // been set, it can't be explicitly cleared back to null via this endpoint.
  session_end_time: z.string().max(50).optional(),
  event_status: z.enum(["upcoming", "live", "ended", "past"]).nullable().optional(),
  event_status_override: z.string().max(50).nullable().optional(),
  display_name_mode: z.string().max(50).optional(),
  hosting_entity: z.string().max(500).nullable().optional(),
  display_on_events_page: z.boolean().optional(),
  pinned_as_next: z.boolean().optional(),
  rehearsal_mode: z.boolean().optional(),
  auto_show_results: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

// ----------------------------------------------------------------
// Admin: presentations
// ----------------------------------------------------------------

export const presentationCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  category: z.string().max(200).optional(),
});

export const presentationUpdateSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  category: z.string().max(200).optional(),
  is_published: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

// ----------------------------------------------------------------
// Admin: marketing social queue
// ----------------------------------------------------------------

export const socialQueueCreateSchema = z.object({
  event_id: z.string().optional(),
  platform: z.string().max(50).optional(),
  content: z.string().max(10000).optional(),
  hashtags: z.array(z.string().max(100)).optional(),
  scheduled_for: z.string().optional(),
  auto_generate: z.boolean().optional(),
});

export const socialQueueUpdateSchema = z.object({
  status: z.string().max(50).optional(),
  content: z.string().max(10000).optional(),
  hashtags: z.array(z.string().max(100)).optional(),
  platform: z.string().max(50).optional(),
  scheduled_for: z.string().optional(),
  posted_at: z.string().optional(),
  posted_url: z.string().max(2000).optional(),
});

// ----------------------------------------------------------------
// Admin: assessments DELETE
// ----------------------------------------------------------------

export const assessmentDeleteSchema = z.object({
  ids: z.array(uuidSchema).optional(),
});

// ----------------------------------------------------------------
// Conference: guest sign-in
// ----------------------------------------------------------------

export const guestSigninSchema = z.object({
  display_name: z.string().min(1).max(200),
  access_code: z.string().min(1).max(50),
});

// ----------------------------------------------------------------
// Conference: word cloud POST
// ----------------------------------------------------------------

export const wordCloudSubmitSchema = z.object({
  word: z.string().min(1).max(30),
  event_id: z.string().optional(),
});

// ----------------------------------------------------------------
// Conference: announcements POST
// ----------------------------------------------------------------

export const announcementCreateSchema = z.object({
  title: z.string().min(1).max(500),
  message: z.string().min(1).max(5000),
  event_id: z.string().optional(),
});

// ----------------------------------------------------------------
// Conference: roles POST
// ----------------------------------------------------------------

export const roleAssignSchema = z.object({
  user_id: z.string().optional(),
  email: z.string().email().optional(),
  session_id: z.string().optional(),
  event_id: z.string().optional(),
  role: z.enum(["admin", "moderator", "presenter", "attendee", "host"]),
});

// ----------------------------------------------------------------
// Conference: polls POST
// ----------------------------------------------------------------

const singlePollQuestion = z.object({
  question: z.string().min(1).max(2000),
  options: z.array(z.string().max(500)).min(2).max(20),
});

export const pollCreateSchema = z.object({
  question: z.string().max(2000).optional(),
  options: z.array(z.string().max(500)).optional(),
  questions: z.array(singlePollQuestion).max(20).optional(),
  session_id: z.string().optional(),
  event_id: z.string().optional(),
});

// ----------------------------------------------------------------
// Conference: polls [id] PUT
// ----------------------------------------------------------------

export const pollUpdateSchema = z.object({
  is_active: z.boolean().optional(),
  is_deployed: z.boolean().optional(),
  show_results: z.boolean().optional(),
});

// ----------------------------------------------------------------
// Leads: POST /api/leads
// ----------------------------------------------------------------

export const leadsCreateSchema = z.object({
  name: z.string().min(1).max(500),
  email: emailSchema,
  phone: z.string().max(50).optional(),
  organization: z.string().max(500).optional(),
  source: z.enum(["assessment", "survey"]),
  source_id: z.string().min(1).max(200),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ----------------------------------------------------------------
// Conference: polls [id] vote
// ----------------------------------------------------------------

export const pollVoteSchema = z.object({
  option_index: z.number().int().min(0),
  voter_id: z.string().min(16).max(64),
});

// ----------------------------------------------------------------
// Conference: polls export
// ----------------------------------------------------------------

const pollDataSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  votes: z.array(z.number()),
  totalVotes: z.number(),
});

export const pollExportSchema = z.object({
  polls: z.array(pollDataSchema).min(1),
});

// ----------------------------------------------------------------
// Conference: questions POST
// ----------------------------------------------------------------

export const questionSubmitSchema = z.object({
  text: z.string().min(1).max(2000),
  author_name: z.string().max(200).optional(),
  session_id: z.string().optional(),
  event_id: z.string().optional(),
});

// ----------------------------------------------------------------
// Conference: questions [id] PUT
// ----------------------------------------------------------------

export const questionUpdateSchema = z.object({
  is_answered: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
  released: z.boolean().optional(),
  archive: z.boolean().optional(),
});

// ----------------------------------------------------------------
// Conference: sessions POST
// ----------------------------------------------------------------

export const sessionCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  scheduled_at: z.string().datetime().optional(),
  session_date: z.string().date().optional().nullable(),
  qa_enabled: z.boolean().optional(),
  release_mode: z.enum(["all", "single", "hide_all"]).optional(),
  speaker: z.string().max(200).optional(),
  room: z.string().max(200).optional(),
  time_label: z.string().max(200).optional(),
  sort_order: z.number().int().optional(),
  event_id: z.string().optional(),
});

// ----------------------------------------------------------------
// Conference: sessions [id] PUT
// ----------------------------------------------------------------

export const sessionUpdateSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  scheduled_at: z.string().datetime().optional().nullable(),
  session_date: z.string().date().optional().nullable(),
  is_active: z.boolean().optional(),
  qa_enabled: z.boolean().optional(),
  release_mode: z.enum(["all", "single", "hide_all"]).optional(),
  speaker: z.string().max(200).optional(),
  room: z.string().max(200).optional(),
  time_label: z.string().max(200).optional(),
  sort_order: z.number().int().optional(),
  session_mode: z.enum(["sequential", "simultaneous"]).optional(),
});

// Conference: end session (no body — all data comes from DB)
export const sessionEndSchema = z.object({});

// ----------------------------------------------------------------
// Conference: profanity POST
// ----------------------------------------------------------------

export const profanityTermSchema = z.object({
  term: z.string().min(1).max(200),
});

// ----------------------------------------------------------------
// Conference: settings PUT
// ----------------------------------------------------------------

export const conferenceSettingsUpdateSchema = z.object({
  key: z.string().max(200).optional(),
  value: z.string().max(10000).optional(),
  active: z.boolean().optional(),
  event_id: z.string().optional(),
  session_id: z.string().optional(),
  qa_enabled: z.boolean().optional(),
  release_mode: z.enum(["all", "single", "hide_all"]).optional(),
});

// ----------------------------------------------------------------
// Conference: session-attendance POST/DELETE
// ----------------------------------------------------------------

export const sessionAttendanceSchema = z.object({
  session_id: nonEmptyString,
});

// ----------------------------------------------------------------
// Maven webhook POST
// ----------------------------------------------------------------

export const mavenWebhookSchema = z.object({
  type: z.enum(["bug_report", "feature_request", "feedback", "change_request"]),
  title: nonEmptyString,
  description: nonEmptyString,
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  email: emailSchema.optional(),
  project: z.string().max(200).optional(),
});

// ----------------------------------------------------------------
// Contact form — already has manual validation, but we add Zod
// for consistency. The existing validateForm/validateConsultForm
// are preserved; Zod runs first as a quick structural check.
// ----------------------------------------------------------------

export const contactBookingSchema = z.object({
  type: z.literal("booking").optional(),
  name: z.string().min(2).max(200),
  email: emailSchema,
  organization: z.string().max(500).optional(),
  eventName: z.string().min(2).max(500),
  eventDate: z.string().max(50).optional(),
  eventType: nonEmptyString,
  message: z.string().max(10000).optional(),
  budgetRange: z.string().max(200).optional(),
  audienceSize: z.string().max(200).optional(),
});

export const contactConsultationSchema = z.object({
  type: z.literal("consultation"),
  firstName: z.string().min(2).max(200),
  lastName: z.string().min(2).max(200),
  email: emailSchema,
  phone: nonEmptyString,
  industry: nonEmptyString,
  location: z.string().max(500).optional(),
  areaOfInterest: nonEmptyString,
  organizationName: nonEmptyString,
  organizationSize: z.string().max(200).optional(),
  currentChallenge: z.string().max(10000).optional(),
  additionalDetails: z.string().max(10000).optional(),
});

export const contactFormSchema = z.discriminatedUnion("type", [
  contactConsultationSchema,
  contactBookingSchema.extend({ type: z.literal("booking") }),
]);

// ----------------------------------------------------------------
// Admin: surveys POST (create)
// ----------------------------------------------------------------

export const surveyCreateSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/, { message: "Slug must be lowercase letters, numbers, and hyphens only" }),
  description: z.string().max(2000).optional(),
  intro_text: z.string().max(5000).optional(),
  is_active: z.boolean().optional(),
  show_on_homepage: z.boolean().optional(),
});

// Admin: surveys [id] PATCH (update metadata)
export const surveyUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/, { message: "Slug must be lowercase letters, numbers, and hyphens only" }).optional(),
  description: z.string().max(2000).optional(),
  intro_text: z.string().max(5000).optional(),
  is_active: z.boolean().optional(),
  show_on_homepage: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

// ----------------------------------------------------------------
// Strategy Rooms — session create/update
// ----------------------------------------------------------------

// Shared URL field: accepts a valid https/http URL, empty string, or null/undefined.
// Rejects arbitrary non-URL strings (e.g. "#anchor-only" slugs).
const urlOrEmpty = z
  .union([
    z.string().max(2000).url(),
    z.literal(""),
    z.null(),
  ])
  .optional();

export const strategySessionCreateSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  date: z.string().max(60).optional(),
  session_date: z.string().optional(), // ISO date string
  time: z.string().max(60).optional(),
  facilitator: z.string().max(200).optional(),
  total_seats: z.number().int().min(1).max(1000),
  attendees_override: z.number().int().min(0).optional(),
  is_past: z.boolean().optional(),
  tier: z.enum(['pro', 'executive']),
  topics: z.array(z.string().max(100)).max(20).optional(),
  agenda: z.array(z.object({
    time: z.string().max(50),
    title: z.string().max(200),
    description: z.string().max(500),
  })).max(20).optional(),
  key_takeaways: z.array(z.string().max(500)).max(20).optional(),
  join_url: urlOrEmpty,
  replay_url: urlOrEmpty,
  notes_url: urlOrEmpty,
  published: z.boolean().optional(),
});

export const strategySessionUpdateSchema = strategySessionCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

// ----------------------------------------------------------------
// Creative Studio — Media Library
// ----------------------------------------------------------------

export const mediaAssetCreateSchema = z.object({
  name: z.string().min(1).max(500),
  original_name: z.string().min(1).max(500),
  storage_path: z.string().min(1).max(2000),
  public_url: z.string().url().max(2000),
  mime_type: z.string().min(1).max(200),
  size_bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration_ms: z.number().int().positive().optional(),
  folder: z.string().max(200).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  alt_text: z.string().max(500).optional(),
  asset_type: z.enum(["image", "video", "audio", "graphic"]),
});

export const mediaAssetUpdateSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  folder: z.string().max(200).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  alt_text: z.string().max(500).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

export const mediaListQuerySchema = z.object({
  folder: z.string().max(200).optional(),
  asset_type: z.enum(["image", "video", "audio", "graphic"]).optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ----------------------------------------------------------------
// Creative Studio — Animation Presets
// ----------------------------------------------------------------

export const animationPresetCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  category: z.enum(["fade", "slide", "bounce", "scale", "parallax", "custom"]),
  config: z.object({
    initial: z.record(z.string(), z.unknown()),
    animate: z.record(z.string(), z.unknown()),
    exit: z.record(z.string(), z.unknown()).optional(),
    transition: z.object({
      duration: z.number().min(0).max(10),
      delay: z.number().min(0).max(10).optional(),
      ease: z.string().max(50),
      repeat: z.number().int().min(0).optional(),
    }),
    trigger: z.enum(["load", "scroll", "hover", "tap"]),
    scrollY: z.object({
      offset: z.tuple([z.string(), z.string()]),
      outputY: z.tuple([z.string(), z.string()]),
    }).optional(),
  }),
  preview_css: z.string().max(5000).optional(),
});

export const animationPresetUpdateSchema = animationPresetCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" },
);

// ----------------------------------------------------------------
// Creative Studio — Theme Config
// ----------------------------------------------------------------

export const themeConfigCreateSchema = z.object({
  name: z.string().min(1).max(200),
  colors: z.record(z.string().max(50), z.string().max(50)),
  typography: z.object({
    bodyFont: z.string().max(200),
    displayFont: z.string().max(200),
    baseSizeRem: z.number().min(0.5).max(3),
    scaleRatio: z.number().min(1).max(2),
    weights: z.object({
      body: z.number().int().min(100).max(900),
      heading: z.number().int().min(100).max(900),
    }),
  }),
  buttons: z.object({
    radiusPx: z.number().min(0).max(50),
    shadowPx: z.number().min(0).max(50),
    hoverScale: z.number().min(1).max(1.5),
    variant: z.enum(["solid", "ghost", "outline"]),
  }),
  dark_mode: z.boolean().optional(),
  custom_css: z.string().max(10000).optional(),
});

export const themeConfigUpdateSchema = themeConfigCreateSchema.partial().extend({
  is_active: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" },
);

// ----------------------------------------------------------------
// Creative Studio — Audio Assets
// ----------------------------------------------------------------

export const audioAssetCreateSchema = z.object({
  name: z.string().min(1).max(500),
  storage_path: z.string().min(1).max(2000),
  public_url: z.string().url().max(2000),
  size_bytes: z.number().int().positive(),
  duration_ms: z.number().int().positive().optional(),
  assigned_to: z.array(z.string().max(200)).optional(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
});

export const audioAssetUpdateSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  assigned_to: z.array(z.string().max(200)).optional(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

// ----------------------------------------------------------------
// Creative Studio — Page Configs
// ----------------------------------------------------------------

// ----------------------------------------------------------------
// Content Manager — vault + feed content with visibility toggle
// ----------------------------------------------------------------

export const visibilitySchema = z.enum(["published", "hidden", "archived"]);

export const vaultContentUpsertSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500).regex(/^[a-z0-9-]+$/),
  content_type: z.string().max(50),
  category: z.string().max(200),
  body: z.string().max(100000).optional(),
  excerpt: z.string().max(2000).optional(),
  thumbnail_url: z.string().max(2000).nullable().optional(),
  tier_required: z.enum(["free", "essentials", "professional", "enterprise"]).optional(),
  visibility: visibilitySchema.optional(),
  author_name: z.string().max(200).optional(),
  published_at: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  featured_in_feed: z.boolean().optional(),
});

export const vaultContentUpdateSchema = vaultContentUpsertSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" },
);

const categoryValidation = (
  data: Record<string, unknown>
): boolean => {
  if (data.metadata && typeof data.metadata === 'object' && 'category' in data.metadata) {
    const cat = (data.metadata as Record<string, unknown>).category;
    if (typeof cat !== 'string') return false;
    if (cat.length > 100) return false;
    if (cat.trim().length === 0) return false;
  }
  return true;
};

const feedPostBase = z.object({
  title: z.string().max(500).nullable().optional(),
  body: z.string().min(1).max(100000),
  post_type: z.string().max(50).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  visibility: visibilitySchema.optional(),
  published_at: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  is_pinned: z.boolean().optional(),
});

export const feedPostUpsertSchema = feedPostBase.refine(categoryValidation, {
  message: "metadata.category must be a non-empty string, max 100 chars",
  path: ["metadata", "category"],
});

export const feedPostUpdateSchema = feedPostBase.partial()
  .refine(categoryValidation, {
    message: "metadata.category must be a non-empty string, max 100 chars",
    path: ["metadata", "category"],
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const contentListQuerySchema = z.object({
  visibility: visibilitySchema.optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const sectionImageConfigSchema = z.object({
  backgroundType: z.enum(["image", "color"]),
  backgroundRef: z.string().max(2000).nullable(),
  overlayOpacity: z.number().min(0).max(1).optional(),
});

// ----------------------------------------------------------------
// Content Automation Pipeline — vault_drafts + vault_topic_lanes
// ----------------------------------------------------------------

// Kept in sync with VAULT_CATEGORIES in src/lib/vault-data.ts. This is a
// separate literal list (not an import) because validation.ts has no
// dependency today on vault-data.ts and Zod enums need a literal tuple —
// if VAULT_CATEGORIES ever changes, update this list in the same commit.
export const vaultDraftCategorySchema = z.enum([
  "AI & Ethics",
  "Church & Tech",
  "Governance",
  "Leadership",
  "Youth & Workforce",
  "Previous Events",
  "Current Events",
]);

export const vaultDraftInsertSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500).regex(/^[a-z0-9-]+$/),
  body: z.string().min(1).max(100000),
  excerpt: z.string().max(2000).optional(),
  category: vaultDraftCategorySchema,
  content_type: z.string().max(50).optional(),
  tier_required: z.enum(["free", "essentials", "professional", "enterprise"]).optional(),
  topic_source: z.string().max(500).optional(),
  status: z.enum(["pending", "published", "discarded"]).optional(),
});

// Reused wherever a client supplies a future publish timestamp — currently
// just the "schedule" action below, but kept standalone since the
// future-datetime check is the meaningful validation, not the action shape.
export const scheduledPublishSchema = z.string().datetime().refine(
  (val) => new Date(val).getTime() > Date.now(),
  { message: "scheduled_publish_at must be a future datetime" }
);

// "cancel_schedule" isn't in the original spec's action list but is
// required to support the Draft Review Queue's "Cancel Schedule" control
// (resets a scheduled draft back to pending) — there's no other way to
// reverse a "schedule" action once applied. Flagged as an addition, not a
// silent one.
export const vaultDraftReviewSchema = z
  .object({
    action: z.enum(["publish", "discard", "schedule", "cancel_schedule"]),
    scheduled_publish_at: scheduledPublishSchema.optional(),
  })
  .refine((data) => data.action !== "schedule" || data.scheduled_publish_at !== undefined, {
    message: 'scheduled_publish_at is required when action is "schedule"',
    path: ["scheduled_publish_at"],
  });

// "scheduled" included alongside the three original statuses so the Draft
// Review Queue UI can filter to it — see DraftReviewQueue.tsx.
export const vaultDraftListQuerySchema = z.object({
  status: z.enum(["pending", "published", "discarded", "scheduled"]).optional(),
});

export const vaultTopicLaneSchema = z.object({
  // Constrained to VAULT_CATEGORIES (via vaultDraftCategorySchema, defined
  // above) — not free text. Lanes exist to drive category-based content
  // generation; the pipeline inserts `category: lane.name` verbatim into
  // vault_content on publish (see content-automation.ts), and
  // src/app/vault/page.tsx's category filter tabs are built only from the
  // fixed VAULT_CATEGORIES enum. A lane name outside that enum would
  // publish articles with no reachable category tab. (Avery review, PR
  // #225, finding A.)
  name: vaultDraftCategorySchema,
  description: z.string().max(2000).optional(),
  active: z.boolean().optional(),
});

export const vaultTopicLaneToggleSchema = z.object({
  id: uuidSchema,
  active: z.boolean(),
});

// Bare domain only — no scheme, no path, no whitespace. This is what gets
// passed verbatim into the Anthropic web_search tool's `allowed_domains`
// array (src/lib/claude.ts), which expects bare hostnames like
// "technologyreview.com", not full URLs.
//
// Validated by splitting on "." and checking each label with plain string
// operations (length/startsWith/endsWith) plus a single flat, ungrouped
// character-class regex — deliberately avoiding any quantified group
// wrapping another quantified/optional group, since even a *bounded*
// version of that shape (e.g. `(x{0,61})?`) still trips
// eslint-plugin-security's detect-unsafe-regex heuristic.
function isValidDomainLabel(label: string): boolean {
  if (label.length < 1 || label.length > 63) return false;
  if (label.startsWith("-") || label.endsWith("-")) return false;
  return /^[a-z0-9-]+$/.test(label);
}

const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(255)
  .refine(
    (val) => {
      if (/[\s/:]/.test(val)) return false;
      const labels = val.split(".");
      return labels.length >= 2 && labels.every(isValidDomainLabel);
    },
    { message: "Must be a bare domain (e.g. example.com) with no scheme, path, or whitespace" }
  );

// `category` is intentionally NOT constrained to VAULT_CATEGORIES at the
// schema level (unlike vaultTopicLaneSchema's `name`) — it's a free-form
// organizational tag on a source, not something that drives a public
// category filter tab the way a topic lane's name does. The admin UI's
// add-source form limits its dropdown to VAULT_CATEGORIES for consistency,
// but the schema itself only bounds length.
export const vaultTrustedSourceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  domain: domainSchema,
  category: z.string().trim().max(100).optional(),
});

export const vaultTrustedSourceToggleSchema = z.object({
  id: uuidSchema,
  active: z.boolean(),
});

// ----------------------------------------------------------------
// Content Automation Pipeline — AI Tool of the Week suggestions
// (vault_pending_tool_updates)
// ----------------------------------------------------------------

// Shared shape for page_configs.tool_config (the homepage AI Tool of the
// Week section) — used both by pageConfigUpdateSchema below and by the
// tool-updates publish route, which re-validates a vault_pending_tool_updates
// row against this exact schema before writing it into page_configs. Extracted
// to a standalone export (rather than left inline in pageConfigUpdateSchema)
// specifically so the publish route can import and reuse it instead of
// duplicating — or silently skipping — the same validation. (Avery review,
// PR #234 follow-up.)
export const toolConfigSchema = z.object({
  date: z.string().max(60).optional(),
  name: z.string().min(1).max(100),
  category: z.string().max(60),
  description: z.string().max(500),
  why: z.string().max(500),
  link: httpUrlSchema(500),
  cta: z.string().max(40).optional(),
});

// Max lengths match toolConfigSchema above (name/category/description/why/
// cta) — a suggestion that passes this schema at insert time must also be
// able to pass toolConfigSchema unchanged at publish time. `link` uses the
// same strict http(s)-only check for the same reason (see httpUrlSchema).
export const vaultPendingToolSchema = z.object({
  tool_name: z.string().min(1).max(100),
  category: z.string().min(1).max(60),
  description: z.string().min(1).max(500),
  why_it_matters: z.string().min(1).max(500),
  link: httpUrlSchema(500),
  cta: z.string().min(1).max(40).optional(),
  status: z.enum(["pending", "published", "discarded"]).optional(),
});

export const vaultPendingToolReviewSchema = z.object({
  action: z.enum(["publish", "discard"]),
});

export const vaultPendingToolListQuerySchema = z.object({
  status: z.enum(["pending", "published", "discarded"]).optional(),
});

// referenceFilePath is downloaded server-side from the shared `documents`
// Supabase Storage bucket (src/lib/document-extraction.ts) and its extracted
// text is forwarded into the Anthropic prompt — so this field must be
// constrained to paths this feature's own sign-upload route could actually
// have minted, not merely any string. sign-upload/route.ts always produces
// `content-automation-refs/${Date.now()}-${sanitized}`, where `sanitized` is
// the client fileName with every character outside [a-zA-Z0-9._-] replaced
// by "_" (see that route). The regex below mirrors that exact character
// set so it accepts every path sign-upload can produce while rejecting a
// path aimed at any other object in the bucket (e.g. Creative Studio's
// `briefs/` folder):
//   - fixed, case-sensitive `content-automation-refs/` prefix — no other
//     folder in the bucket matches
//   - `[\w.-]+` only — excludes `/`, so no second path segment is reachable
//     (this alone rules out `../` traversal, since a literal `/` can never
//     appear after the prefix)
//   - `(?!.*\.\.)` belt-and-suspenders: explicitly rejects a literal `..`
//     anywhere in the remainder, even though the character-class exclusion
//     of `/` already makes `..` non-traversing on its own
//   - required `.pdf`/`.docx` extension (case-insensitive, matching
//     contentAutomationSignUploadSchema's own extension check below)
// (Avery review, PR #226, BLOCKING finding #1.)
const REFERENCE_FILE_PATH_REGEX = /^content-automation-refs\/(?!.*\.\.)[\w.-]+\.(?:pdf|docx)$/i;

export const contentAutomationGenerateSchema = z.object({
  lane: z.string().max(200).optional(),
  guidance: z.string().max(2000).optional(),
  referenceFilePath: z
    .string()
    .max(2000)
    .regex(REFERENCE_FILE_PATH_REGEX, {
      message:
        "referenceFilePath must be a path minted by /api/admin/content-automation/sign-upload",
    })
    .optional(),
});

// ----------------------------------------------------------------
// Content Automation Pipeline — reference-file signed upload
// (mirrors src/app/api/admin/events/[id]/files/sign-upload/route.ts's
// signed-upload pattern against the existing `documents` bucket; this
// feature only wants PDF/DOCX, narrower than the bucket's own broader
// allowed_mime_types, enforced here at the route/schema level)
// ----------------------------------------------------------------

export const contentAutomationSignUploadSchema = z.object({
  fileName: z.string().min(1).max(500).regex(/\.(pdf|docx)$/i, {
    message: "Only .pdf and .docx files are allowed",
  }),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, { message: "File exceeds 10 MB limit" }),
});

export const pageConfigUpdateSchema = z.object({
  hero_config: z.object({
    label: z.string().max(200).optional(),
    headline: z.string().max(500).optional(),
    subheadline: z.string().max(1000).optional(),
    backgroundType: z.enum(["color", "image", "video"]).optional(),
    backgroundRef: z.string().max(2000).nullable().optional(),
    overlayOpacity: z.number().min(0).max(1).optional(),
  }).nullable().optional(),
  section_images: z.object({
    latestBrief: sectionImageConfigSchema.optional(),
    featuredInsight: sectionImageConfigSchema.optional(),
  }).nullable().optional(),
  brief_config: z.object({
    title: z.string().min(1).max(200),
    date: z.string().max(60),
    excerpt: z.string().max(500),
    link: z.string().max(500),
    cta: z.string().max(40),
    // Accepted here only so it round-trips through GET→edit→PATCH without
    // being stripped — the PATCH route always overwrites this with the
    // server's own current timestamp regardless of what's submitted, so a
    // client can't spoof freshness by sending its own value.
    last_updated: z.string().datetime().optional(),
  }).nullable().optional(),
  trending_config: z.object({
    date: z.string().max(60).optional(),
    heading: z.string().min(1).max(100),
    topic1: z.string().max(60),
    topic2: z.string().max(60),
    topic3: z.string().max(60),
    topic4: z.string().max(60),
    topic5: z.string().max(60),
  }).nullable().optional(),
  insight_config: z.object({
    date: z.string().max(60).optional(),
    category: z.string().min(1).max(60),
    title: z.string().min(1).max(200),
    description: z.string().max(600),
    link: z.string().max(500),
    cta: z.string().max(60),
  }).nullable().optional(),
  tool_config: toolConfigSchema.nullable().optional(),
  assessment_config: z.object({
    heading: z.string().min(1).max(100),
    subheading: z.string().max(200),
  }).nullable().optional(),
  strategy_config: z.object({
    visible: z.boolean().optional(),
    heading: z.string().max(100).optional(),
    title: z.string().max(200).optional(),
    date: z.string().max(60).optional(),
    description: z.string().max(500).optional(),
    seats: z.string().max(40).optional(),
    cta: z.string().max(40).optional(),
    link: z.string().max(500).optional(),
  }).nullable().optional(),
  layout_config: z.object({
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    spacing: z.enum(["tight", "normal", "loose"]),
    padding: z.enum(["none", "sm", "md", "lg"]),
    maxWidthPx: z.number().int().min(320).max(2560),
  }).optional(),
  sections: z.array(z.object({
    id: z.string().min(1).max(100),
    type: z.enum(["text", "image", "video", "cta", "testimonial", "spacer"]),
    order: z.number().int().min(0),
    visible: z.boolean(),
    config: z.record(z.string(), z.unknown()),
  })).max(50).optional(),
  animation_preset_id: z.string().uuid().nullable().optional(),
  audio_asset_id: z.string().uuid().nullable().optional(),
  theme_overrides: z.record(z.string().max(50), z.string().max(50)).nullable().optional(),
  meta_title: z.string().max(200).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
  published: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});
