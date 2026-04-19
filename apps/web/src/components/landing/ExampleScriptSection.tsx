"use client";

import { motion } from "framer-motion";

const scriptLines = [
  { label: "Regulate", color: "#5B8DEF", text: "I\u2019m here. I won\u2019t let you kick." },
  { label: "Connect", color: "#6FCF97", text: "You really wanted to stay." },
  { label: "Guide", color: "#D9A441", text: "We are leaving now. Hold my hand." },
] as const;

export default function ExampleScriptSection() {
  return (
    <section id="example-script" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-[#1E2430] sm:text-4xl">
            See how Sturdy helps in real moments
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#4B5563] sm:text-lg">
            When emotions run high, Sturdy helps you find calm words to say.
          </p>
        </motion.div>

        {/* Two-column product preview */}
        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left – situation context */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-[#5B8DEF]">
              Situation
            </p>
            <h3 className="mt-3 text-2xl font-bold text-[#1E2430]">
              Leaving the park
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[#4B5563]">
              Leaving the park is hard because a fun activity is ending.
            </p>
            <p className="mt-6 text-sm leading-relaxed text-[#4B5563]/70">
              Short scripts designed for real parenting moments.
            </p>
          </motion.div>

          {/* Right – device-style script output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-[#F7F9FC] shadow-xl ring-1 ring-black/5">
              {/* Device top bar */}
              <div className="flex items-center gap-2 bg-[#EEF2F7] px-6 py-4">
                <span className="h-2 w-2 rounded-full bg-[#6FCF97]" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#4B5563]">
                  Sturdy Script
                </span>
              </div>

              {/* Script lines */}
              <div className="space-y-0 divide-y divide-[#EEF2F7]">
                {scriptLines.map((line, i) => (
                  <motion.div
                    key={line.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.12, ease: "easeOut" }}
                    className="px-6 py-5"
                  >
                    <p
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: line.color }}
                    >
                      {line.label}
                    </p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[#1E2430]">
                      &ldquo;{line.text}&rdquo;
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
