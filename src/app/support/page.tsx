import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support | KLO",
  description:
    "Get help with the KLO app. Find answers to frequently asked questions or contact our support team.",
};

const faqs = [
  {
    question: "How do I join an event?",
    answer:
      "Navigate to the Conference page and enter your display name to join a live event. You\u2019ll be connected to the session in real time.",
  },
  {
    question: "How do I vote on polls?",
    answer:
      "During a live event, polls will appear on screen automatically. Simply tap your answer to cast your vote.",
  },
  {
    question: "How do I submit a question?",
    answer:
      "Use the Q&A tab during a live event to type and submit your question. The speaker may address it during the session.",
  },
  {
    question: "How do I book Keith for my event?",
    answer:
      "Visit the Booking page in the app or send an email to info@keithlodom.ai with your event details, preferred dates, and audience size.",
  },
  {
    question: "How do I manage my subscription?",
    answer:
      "Subscriptions purchased through the App Store or Google Play are managed through your device\u2019s subscription settings. On iOS, go to Settings \u2192 Apple ID \u2192 Subscriptions. On Android, open Google Play \u2192 Payments & subscriptions.",
  },
  {
    question: "Is my data private?",
    answer: "privacy",
  },
];

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-klo-muted hover:text-klo-text transition-colors mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Home
      </Link>

      <h1 className="text-3xl font-display font-bold text-klo-text mb-3">
        Support
      </h1>
      <p className="text-klo-muted mb-12">
        Find answers below or reach out to our team directly.
      </p>

      {/* Contact Card */}
      <div className="rounded-xl border border-[#2764FF]/20 bg-[#2764FF]/[0.06] p-6 mb-14">
        <h2 className="text-lg font-semibold text-klo-text mb-2">
          Contact Us
        </h2>
        <p className="text-klo-muted text-sm mb-4">
          Have a question not covered below? We&apos;re happy to help.
        </p>
        <a
          href="mailto:info@keithlodom.ai"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2764FF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2764FF]/90 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          info@keithlodom.ai
        </a>
      </div>

      {/* FAQ Section */}
      <h2 className="text-xl font-semibold text-klo-text mb-6">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        {faqs.map((faq) => (
          <div
            key={faq.question}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <h3 className="font-medium text-klo-text mb-2">{faq.question}</h3>
            {faq.answer === "privacy" ? (
              <p className="text-klo-muted text-sm leading-relaxed">
                Yes. We take your privacy seriously and only collect data
                necessary to provide the service. Read our full{" "}
                <Link
                  href="/privacy"
                  className="text-[#D4A853] hover:underline"
                >
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>
            ) : (
              <p className="text-klo-muted text-sm leading-relaxed">
                {faq.answer}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-klo-muted/60 text-xs text-center mt-14">
        &copy; {new Date().getFullYear()} Keith L. Odom. All rights reserved.
      </p>
    </div>
  );
}
