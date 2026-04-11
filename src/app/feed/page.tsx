"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rss, ChevronDown, ChevronUp, Clock, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Badge from "@/components/shared/Badge";
import Card from "@/components/shared/Card";
import {
  categoryColors,
  type FeedCategory,
  type FeedPost,
} from "@/lib/feed-data";

const allCategories: ("All" | FeedCategory)[] = [
  "All",
  "AI Breakthroughs",
  "Regulatory Shifts",
  "Tech Ethics",
  "Church Implications",
  "Leadership",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getFirstParagraph(content: string): string {
  const paragraphs = content.split("\n\n");
  return paragraphs[0] || content;
}

function getCategoryBadgeVariant(
  category: FeedCategory
): "gold" | "blue" | "green" | "muted" {
  const mapping = categoryColors[category];
  return mapping as "gold" | "blue" | "green" | "muted";
}

function FeedCard({ post, index }: { post: FeedPost; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const firstParagraph = getFirstParagraph(post.content);
  const hasMoreContent = post.content.length > firstParagraph.length;

  return (
    <motion.div variants={cardVariant} custom={index} layout>
      <Card className="relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant={getCategoryBadgeVariant(post.category)}>
            {post.category}
          </Badge>
        </div>

        <h2 className="font-display text-xl font-bold text-klo-text mb-3 leading-tight">
          {post.title}
        </h2>

        <div className="flex items-center gap-4 text-sm text-klo-muted mb-5">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            {post.readTime}
          </span>
        </div>

        <div className="text-klo-muted leading-relaxed prose-invert">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
              strong: ({ children }) => (
                <strong className="text-klo-text font-semibold">
                  {children}
                </strong>
              ),
            }}
          >
            {expanded ? post.content : firstParagraph}
          </ReactMarkdown>

          {hasMoreContent && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 inline-flex items-center gap-1.5 text-[#2764FF] text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
            >
              {expanded ? (
                <>
                  Show Less <ChevronUp size={16} />
                </>
              ) : (
                <>
                  Read More <ChevronDown size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default function FeedPage() {
  const [activeCategory, setActiveCategory] = useState<"All" | FeedCategory>(
    "All"
  );
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);

  // Fetch published feed posts from Supabase
  useEffect(() => {
    fetch("/api/content/feed")
      .then((res) => res.json())
      .then((json) => setFeedPosts(json.data ?? []))
      .catch((err) => console.error("Failed to fetch feed:", err));
  }, []);

  const filteredPosts =
    activeCategory === "All"
      ? feedPosts
      : feedPosts.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-10"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#2764FF]/10 flex items-center justify-center">
              <Rss size={22} className="text-[#2764FF]" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Executive Intelligence Feed
              </h1>
              <p className="text-klo-muted text-sm mt-0.5">
                Keith&apos;s Perspective on What Matters
              </p>
            </div>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            variants={fadeUp}
            custom={1}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1"
          >
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white border-[#2764FF]"
                    : "bg-[#161B22] text-[#8B949E] border-[#21262D] hover:border-[#2764FF]/30 hover:text-klo-text"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Feed */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={staggerContainer}
            className="flex flex-col gap-6"
          >
            {filteredPosts.map((post, i) => (
              <FeedCard key={post.id} post={post} index={i} />
            ))}

            {filteredPosts.length === 0 && (
              <motion.div
                variants={cardVariant}
                custom={0}
                className="text-center py-16"
              >
                <p className="text-klo-muted text-lg">
                  No posts in this category yet.
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
