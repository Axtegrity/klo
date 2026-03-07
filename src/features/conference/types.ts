export interface Poll {
  id: string;
  question: string;
  options: string[];
  is_active: boolean;
  is_deployed: boolean;
  show_results: boolean;
  created_at: string;
  closed_at: string | null;
  session_id: string | null;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_index: number;
  created_at: string;
}

export interface PollWithVotes extends Poll {
  votes: number[];
  totalVotes: number;
  hasVoted: boolean;
}

export interface Question {
  id: string;
  text: string;
  author_name: string;
  upvotes: number;
  is_answered: boolean;
  is_hidden: boolean;
  created_at: string;
  // V2 fields
  session_id: string | null;
  archived_at: string | null;
  archived_by: string | null;
  released: boolean;
  likes: number;
}

export interface WordCloudEntry {
  word: string;
  count: number;
}

export interface SeminarMode {
  active: boolean;
}

// V2 types

export interface ConferenceSession {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  is_active: boolean;
  qa_enabled: boolean;
  release_mode: "all" | "single" | "hide_all";
  speaker: string | null;
  room: string | null;
  time_label: string | null;
  sort_order: number;
  created_at: string;
}

export interface ConferenceUserRole {
  id: string;
  user_id: string;
  session_id: string | null;
  role: "admin" | "moderator" | "presenter" | "attendee";
  assigned_by: string | null;
  created_at: string;
}

export interface ProfanityTerm {
  id: string;
  term: string;
  created_at: string;
}

export interface ProfanityLogEntry {
  id: string;
  original_text: string;
  flagged_terms: string[];
  action: string;
  voter_fingerprint: string | null;
  created_at: string;
}

export interface ProfanityCheckResult {
  ok: boolean;
  reason?: string;
  flagged?: string[];
}
