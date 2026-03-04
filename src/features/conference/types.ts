export interface Poll {
  id: string;
  question: string;
  options: string[];
  is_active: boolean;
  show_results: boolean;
  created_at: string;
  closed_at: string | null;
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
}

export interface WordCloudEntry {
  word: string;
  count: number;
}

export interface SeminarMode {
  active: boolean;
}
