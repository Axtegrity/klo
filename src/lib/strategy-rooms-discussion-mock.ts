// ── Strategy Rooms Discussion Mock Data ───────────────────────────────────────
// Discussion threads are deferred to a future phase.
// This file preserves the mock comments for the detail page UI.

export interface DiscussionComment {
  id: string;
  author: string;
  authorInitials: string;
  content: string;
  timestamp: string;
  likes: number;
}

export const sampleDiscussionComments: DiscussionComment[] = [
  {
    id: "dc-1",
    author: "Marcus Thompson",
    authorInitials: "MT",
    content:
      "Really looking forward to this session. Our church just started exploring AI tools and we need a governance framework before things get out of hand.",
    timestamp: "2 days ago",
    likes: 8,
  },
  {
    id: "dc-2",
    author: "Rev. Patricia Coleman",
    authorInitials: "PC",
    content:
      "Can we discuss how to handle congregation concerns about AI? We have had pushback from members who see it as conflicting with faith values.",
    timestamp: "2 days ago",
    likes: 12,
  },
  {
    id: "dc-3",
    author: "David Kim",
    authorInitials: "DK",
    content:
      "Has anyone implemented an AI usage policy at their organization yet? Would love to see examples during the session.",
    timestamp: "1 day ago",
    likes: 6,
  },
  {
    id: "dc-4",
    author: "Sarah Mitchell",
    authorInitials: "SM",
    content:
      "Keith, will you be covering the ethical implications of using AI for pastoral care and counseling? That is a huge topic for us.",
    timestamp: "1 day ago",
    likes: 15,
  },
  {
    id: "dc-5",
    author: "Keith L. Odom",
    authorInitials: "KO",
    content:
      "Great questions from everyone. Yes, we will absolutely cover AI ethics in pastoral contexts and I will share policy templates you can adapt. Bring your specific scenarios!",
    timestamp: "1 day ago",
    likes: 22,
  },
  {
    id: "dc-6",
    author: "Anthony Brooks",
    authorInitials: "AB",
    content:
      "Our denomination is developing AI guidelines at the national level. Happy to share what we have so far as a starting point for discussion.",
    timestamp: "18 hours ago",
    likes: 9,
  },
  {
    id: "dc-7",
    author: "Lisa Chen",
    authorInitials: "LC",
    content:
      "I work in nonprofit tech and many of these AI governance principles apply across sectors. Excited to bring a cross-industry perspective.",
    timestamp: "14 hours ago",
    likes: 5,
  },
  {
    id: "dc-8",
    author: "Rev. James Washington",
    authorInitials: "JW",
    content:
      "We are a small church with limited tech staff. Will this session address governance for organizations that do not have a dedicated IT team?",
    timestamp: "10 hours ago",
    likes: 11,
  },
  {
    id: "dc-9",
    author: "Nicole Ramirez",
    authorInitials: "NR",
    content:
      "Just registered! The intersection of AI and faith leadership is exactly the kind of strategic thinking we need more of in this space.",
    timestamp: "6 hours ago",
    likes: 7,
  },
  {
    id: "dc-10",
    author: "Michael Foster",
    authorInitials: "MF",
    content:
      "Can we talk about vendor evaluation? So many AI tools are popping up claiming to be built for churches and I am not sure which ones to trust.",
    timestamp: "3 hours ago",
    likes: 4,
  },
  {
    id: "dc-11",
    author: "Tanya Williams",
    authorInitials: "TW",
    content:
      "This is so timely. We just had a board meeting where AI governance was raised as a priority. Sharing this session with our entire leadership team.",
    timestamp: "1 hour ago",
    likes: 3,
  },
];
