"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import { haptics } from "@/lib/haptics";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const eventTypes = [
  "Conference / Summit",
  "Corporate Event",
  "Church / Ministry Event",
  "Workshop / Training",
  "Virtual / Webinar",
  "Panel Discussion",
  "Other",
];

const budgetRanges = [
  "Under $5K",
  "$5K - $10K",
  "$10K - $25K",
  "$25K+",
  "Prefer not to say",
];

/* ------------------------------------------------------------------ */
/*  Animations                                                          */
/* ------------------------------------------------------------------ */

const successVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, delay: 0.2, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

interface FormErrors {
  [key: string]: string;
}

export default function InquiryForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    eventName: "",
    eventDate: "",
    eventType: "",
    message: "",
    budgetRange: "",
    audienceSize: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [serverMessage, setServerMessage] = useState("");

  /* ---- Validation ---- */
  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Please enter your full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.eventName.trim()) {
      newErrors.eventName = "Please enter the name of your event.";
    }

    if (!formData.eventType) {
      newErrors.eventType = "Please select an event type.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /* ---- Handlers ---- */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setServerMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setServerMessage(data.message);
        haptics.success();
      } else {
        setStatus("error");
        setServerMessage(
          data.message || "Something went wrong. Please try again."
        );
        haptics.error();
      }
    } catch {
      setStatus("error");
      setServerMessage(
        "Unable to connect to the server. Please check your connection and try again."
      );
      haptics.error();
    }
  };

  /* ---- Success state ---- */
  if (status === "success") {
    return (
      <Card className="text-center py-16">
        <motion.div
          variants={successVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="w-20 h-20 rounded-full bg-[#2764FF]/15 flex items-center justify-center mx-auto mb-6">
            <motion.svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              className="text-[#2764FF]"
            >
              <motion.path
                d="M10 20L17 27L30 13"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkVariants}
                initial="hidden"
                animate="visible"
              />
            </motion.svg>
          </div>
          <h3 className="font-display text-2xl font-bold text-klo-text mb-3">
            Inquiry Received
          </h3>
          <p className="text-klo-muted max-w-md mx-auto">
            {serverMessage ||
              "Thank you for your interest in booking Keith L. Odom. Our team will review your inquiry and respond within 2 business days."}
          </p>
        </motion.div>
      </Card>
    );
  }

  /* ---- Form styles ---- */
  const inputBase =
    "w-full bg-[#161B22] border border-[#21262D] rounded-lg px-4 py-3 text-white text-sm placeholder:text-klo-muted/50 focus:border-[#2764FF] focus:ring-1 focus:ring-[#2764FF]/30 focus:outline-none transition-colors duration-200";

  const inputError = "border-red-500/60 focus:border-red-500/80 focus:ring-red-500/30";

  function fieldClass(field: string) {
    return `${inputBase} ${errors[field] ? inputError : ""}`;
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Server error banner */}
        <AnimatePresence>
          {status === "error" && serverMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0, transition: { ease: "easeOut" as const } }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4"
            >
              <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-300 text-sm">{serverMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row 1 — Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-white mb-1.5"
            >
              Full Name <span className="text-[#2764FF]">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={formData.name}
              onChange={handleChange}
              className={fieldClass("name")}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white mb-1.5"
            >
              Email <span className="text-[#2764FF]">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@organization.com"
              value={formData.email}
              onChange={handleChange}
              className={fieldClass("email")}
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Row 2 — Organization & Event Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="organization"
              className="block text-sm font-medium text-white mb-1.5"
            >
              Organization
            </label>
            <input
              id="organization"
              name="organization"
              type="text"
              placeholder="Your organization"
              value={formData.organization}
              onChange={handleChange}
              className={fieldClass("organization")}
            />
          </div>
          <div>
            <label
              htmlFor="eventName"
              className="block text-sm font-medium text-white mb-1.5"
            >
              Event Name <span className="text-[#2764FF]">*</span>
            </label>
            <input
              id="eventName"
              name="eventName"
              type="text"
              placeholder="Name of your event"
              value={formData.eventName}
              onChange={handleChange}
              className={fieldClass("eventName")}
            />
            {errors.eventName && (
              <p className="text-red-400 text-xs mt-1">{errors.eventName}</p>
            )}
          </div>
        </div>

        {/* Row 3 — Event Date & Event Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="eventDate"
              className="block text-sm font-medium text-white mb-1.5"
            >
              Event Date
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={handleChange}
              className={fieldClass("eventDate")}
            />
          </div>
          <div>
            <label
              htmlFor="eventType"
              className="block text-sm font-medium text-white mb-1.5"
            >
              Event Type <span className="text-[#2764FF]">*</span>
            </label>
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className={fieldClass("eventType")}
            >
              <option value="" disabled>
                Select event type
              </option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.eventType && (
              <p className="text-red-400 text-xs mt-1">{errors.eventType}</p>
            )}
          </div>
        </div>

        {/* Row 4 — Budget Range & Audience Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="budgetRange"
              className="block text-sm font-medium text-white mb-1.5"
            >
              Budget Range
            </label>
            <select
              id="budgetRange"
              name="budgetRange"
              value={formData.budgetRange}
              onChange={handleChange}
              className={fieldClass("budgetRange")}
            >
              <option value="" disabled>
                Select budget range
              </option>
              {budgetRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="audienceSize"
              className="block text-sm font-medium text-white mb-1.5"
            >
              Expected Audience Size
            </label>
            <input
              id="audienceSize"
              name="audienceSize"
              type="text"
              placeholder="e.g., 200 attendees"
              value={formData.audienceSize}
              onChange={handleChange}
              className={fieldClass("audienceSize")}
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-white mb-1.5"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            placeholder="Tell us about your event, audience, and any specific topics you'd like Keith to address..."
            value={formData.message}
            onChange={handleChange}
            className={fieldClass("message") + " resize-none"}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full md:w-auto"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Inquiry
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
