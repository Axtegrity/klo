"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Building2, GraduationCap, Church, Lightbulb } from "lucide-react";

const credentials = [
  {
    icon: Building2,
    title: "Director of Technology, COGIC",
    description:
      "Leading digital transformation for the largest Pentecostal denomination in the world.",
  },
  {
    icon: GraduationCap,
    title: "MIT Media Lab Alumni",
    description:
      "Former Senior Fiscal Officer, working alongside world-class researchers in disruptive technology.",
  },
  {
    icon: Lightbulb,
    title: "CEO, Axtegrity Consulting",
    description:
      "Microsoft Solutions Partner specializing in ERP solutions, cloud services, and custom software.",
  },
  {
    icon: Church,
    title: "Lead Pastor, The Place of Grace",
    description:
      "A forward-thinking ministry in Orlando, FL committed to transformative change.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function SpeakerBio() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        {/* Two-column layout: image left, content right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-start">
          {/* Image column */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-2"
          >
            <div className="relative">
              {/* Gold accent border */}
              <div className="absolute -inset-1 bg-gradient-to-br from-[#C8A84E]/30 via-[#C8A84E]/10 to-transparent rounded-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-[#C8A84E]/20">
                <Image
                  src="/images/keith/KO.jpg"
                  alt="Keith L. Odom — Technology Innovator, Speaker, and Pastor"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
              {/* Subtitle bar */}
              <div className="mt-4 text-center">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C8A84E]">
                  Innovator &middot; Ministry Technologist &middot; Entrepreneur &middot; Pastor
                </p>
              </div>
            </div>
          </motion.div>

          {/* Content column */}
          <div className="lg:col-span-3">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="space-y-6"
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-block text-xs font-semibold tracking-[0.15em] uppercase text-[#2764FF] mb-3">
                  About the Speaker
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-klo-text leading-tight">
                  Keith L. Odom
                </h2>
              </motion.div>

              <motion.p
                variants={fadeUp}
                custom={1}
                className="text-klo-muted leading-relaxed text-[15px]"
              >
                Keith Odom is a pioneering voice at the intersection of faith and technology.
                As the <span className="text-klo-text font-medium">Director of Technology for
                the Church of God in Christ (COGIC)</span>&mdash;the largest Pentecostal
                denomination in the world&mdash;he leads its digital transformation strategy.
                His career began at the renowned <span className="text-klo-text font-medium">MIT
                Media Lab</span>, where he developed a passion for innovation alongside
                world-class researchers in disruptive technology.
              </motion.p>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-klo-muted leading-relaxed text-[15px]"
              >
                Today Keith serves as <span className="text-klo-text font-medium">CEO of
                Axtegrity Consulting</span>, a Microsoft Solutions Partner, and leads{" "}
                <span className="text-klo-text font-medium">TechChurch</span>&mdash;helping
                churches embrace emerging technologies through initiatives like the Church &amp;
                Technology Summit. He also serves as{" "}
                <span className="text-klo-text font-medium">Lead Pastor of The Place of Grace
                Church</span> in Orlando, FL. At every level, Keith champions the belief that
                technology, grounded in Kingdom purpose, can be a catalyst for revival, reach,
                and relevance.
              </motion.p>

              {/* Credential cards */}
              <motion.div
                variants={fadeUp}
                custom={3}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4"
              >
                {credentials.map((cred) => {
                  const Icon = cred.icon;
                  return (
                    <div
                      key={cred.title}
                      className="flex items-start gap-3 p-4 rounded-xl bg-[#161B22] border border-[#21262D] hover:border-[#C8A84E]/20 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#C8A84E]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={16} className="text-[#C8A84E]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-klo-text leading-tight">
                          {cred.title}
                        </p>
                        <p className="text-xs text-klo-muted mt-1 leading-snug">
                          {cred.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
