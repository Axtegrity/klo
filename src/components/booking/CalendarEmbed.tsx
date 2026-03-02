"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, CheckCircle2, ExternalLink } from "lucide-react";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                   */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Mock time slots                                                     */
/* ------------------------------------------------------------------ */

interface TimeSlot {
  date: string;
  dayLabel: string;
  dateLabel: string;
  slots: string[];
}

function generateMockSlots(): TimeSlot[] {
  const days: TimeSlot[] = [];
  const now = new Date();

  // Find next 5 weekdays
  let count = 0;
  const cursor = new Date(now);
  cursor.setDate(cursor.getDate() + 1); // start from tomorrow

  while (count < 5) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      // skip weekends
      const dayLabel = cursor.toLocaleDateString("en-US", { weekday: "short" });
      const dateLabel = cursor.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const dateStr = cursor.toISOString().split("T")[0];

      days.push({
        date: dateStr,
        dayLabel,
        dateLabel,
        slots: ["10:00 AM", "1:00 PM", "3:30 PM"],
      });
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function CalendarEmbed() {
  const mockSlots = useMemo(() => generateMockSlots(), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const selectedDay = mockSlots.find((d) => d.date === selectedDate);

  const handleConfirm = () => {
    setConfirmed(true);
  };

  return (
    <Card className="border-[#2764FF]/20">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-[#2764FF]/10 flex items-center justify-center mx-auto mb-5">
          <Calendar size={24} className="text-[#2764FF]" />
        </div>
        <h3 className="font-display text-2xl md:text-3xl font-bold text-klo-text mb-3">
          Schedule a Discovery Call
        </h3>
        <p className="text-klo-muted max-w-lg mx-auto">
          Pick a convenient time for a 30-minute introductory call to discuss
          your event, objectives, and how Keith can deliver maximum impact.
        </p>
      </div>

      {confirmed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, ease: "easeOut" as const },
          }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 rounded-full bg-[#2764FF]/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-[#2764FF]" />
          </div>
          <h4 className="font-display text-xl font-bold text-klo-text mb-2">
            Call Scheduled
          </h4>
          <p className="text-klo-muted text-sm">
            {selectedDay?.dayLabel}, {selectedDay?.dateLabel} at {selectedTime}
          </p>
          <p className="text-klo-muted text-xs mt-2">
            You will receive a confirmation email with the meeting details.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Date selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {mockSlots.map((day, i) => (
              <motion.button
                key={day.date}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i}
                onClick={() => {
                  setSelectedDate(day.date);
                  setSelectedTime(null);
                }}
                className={`flex flex-col items-center px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  selectedDate === day.date
                    ? "border-[#2764FF] bg-[#2764FF]/10 text-[#2764FF]"
                    : "border-klo-slate bg-klo-navy/40 text-klo-muted hover:border-[#2764FF]/30 hover:text-klo-text"
                }`}
              >
                <span className="text-xs font-medium uppercase tracking-wider">
                  {day.dayLabel}
                </span>
                <span className="text-sm font-semibold mt-1">
                  {day.dateLabel}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Time slots */}
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.35, ease: "easeOut" as const },
              }}
              className="mb-6"
            >
              <p className="text-klo-muted text-sm text-center mb-3">
                Available times for{" "}
                <span className="text-klo-text font-medium">
                  {selectedDay.dayLabel}, {selectedDay.dateLabel}
                </span>
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {selectedDay.slots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer ${
                      selectedTime === time
                        ? "border-[#2764FF] bg-[#2764FF]/10 text-[#2764FF]"
                        : "border-klo-slate bg-klo-navy/40 text-klo-muted hover:border-[#2764FF]/30 hover:text-klo-text"
                    }`}
                  >
                    <Clock size={14} />
                    {time}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confirm button */}
          {selectedDate && selectedTime && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.3, ease: "easeOut" as const },
              }}
              className="flex justify-center"
            >
              <Button variant="primary" size="lg" onClick={handleConfirm}>
                <CheckCircle2 size={16} />
                Confirm Booking
              </Button>
            </motion.div>
          )}
        </>
      )}

      {/* Cal.com note */}
      <div className="mt-8 pt-6 border-t border-klo-slate/50 text-center">
        <p className="text-klo-muted/60 text-xs flex items-center justify-center gap-1.5">
          <ExternalLink size={12} />
          Powered by Cal.com &mdash; Full calendar integration coming soon
        </p>
      </div>
    </Card>
  );
}
