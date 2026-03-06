"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { QrCode, MessageSquare, BarChart3, Cloud } from "lucide-react";

const features = [
  { icon: MessageSquare, label: "Ask Questions" },
  { icon: BarChart3, label: "Vote in Polls" },
  { icon: Cloud, label: "Word Cloud" },
];

export default function JoinConferencePage() {
  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] bg-[#2764FF]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] bg-[#21B8CD]/8 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 max-w-5xl w-full"
      >
        {/* Left: Text */}
        <div className="flex-1 text-center lg:text-left">
          <p className="text-[#2764FF] font-bold text-sm md:text-base tracking-[4px] uppercase mb-4">
            Keith L. Odom
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
            <span className="bg-gradient-to-r from-white to-[#c7d2fe] bg-clip-text text-transparent">
              Join the
            </span>
            <br />
            <span className="bg-gradient-to-r from-white to-[#c7d2fe] bg-clip-text text-transparent">
              Conversation
            </span>
          </h1>
          <p className="text-[#8B949E] text-base sm:text-lg md:text-xl leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
            Scan the QR code to ask questions,
            <br className="hidden sm:block" />
            vote on topics, and engage live.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#C9D1D9]"
              >
                <Icon size={16} className="text-[#2764FF]" />
                {label}
              </div>
            ))}
          </div>

          <p className="text-[#484F58] font-mono text-sm md:text-base tracking-wider">
            klo-app.vercel.app/conference
          </p>
        </div>

        {/* Right: QR Code */}
        <div className="flex flex-col items-center gap-6 shrink-0">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-3xl"
          >
            <QrCode size={32} className="text-[#21B8CD]" />
          </motion.div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_0_60px_rgba(39,100,255,0.2),0_0_120px_rgba(33,184,205,0.1)]">
            <Image
              src="/klo-qr.svg"
              alt="Scan to join the conference"
              width={240}
              height={240}
              className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72"
              priority
            />
          </div>

          <p className="text-[#E2E8F0] font-semibold text-lg sm:text-xl">
            Scan to Join
          </p>
        </div>
      </motion.div>

      {/* Bottom gradient bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2764FF] via-[#21B8CD] to-[#2764FF]" />
    </div>
  );
}
