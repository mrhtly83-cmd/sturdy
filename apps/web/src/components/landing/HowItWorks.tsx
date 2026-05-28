"use client";
import { motion } from "framer-motion";

const steps = [
  {
    n: "1",
    title: "Describe what's happening",
    body: "Type what's going on in plain language. No forms, no categories, no selecting from a list. Just say it.",
    example: '"He completely shut down and won\'t talk to me or look at me."',
    color: "var(--amber)",
  },
  {
    n: "2",
    title: "Sturdy reads the moment",
    body: "Sturdy understands your child's age and what's actually happening — and shapes a response to this specific situation.",
    example: null,
    color: "var(--amber-mid)",
  },
  {
    n: "3",
    title: "You get words to say",
    body: "Three steps: Regulate, Connect, Guide. Calm, grounded language you can say out loud right now — or adapt to make it yours.",
    example: null,
    color: "var(--amber-light)",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 560, marginBottom: 64 }}
        >
          <h2 style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontStyle: "italic",
            fontWeight: 600,
            letterSpacing: "-0.5px",
            color: "var(--text)",
            marginBottom: 16,
          }}>
            Type the moment.<br />Get the script.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--text-sec)" }}>
            Sturdy asks very little, moves fast, and gives you words you can actually use.
            No reading. No scrolling. No framework to learn.
          </p>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "28px 24px",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(200,136,58,0.12)",
                border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}>
                <span style={{
                  fontFamily: "Fraunces, serif", fontWeight: 700,
                  fontSize: 16, color: step.color,
                }}>{step.n}</span>
              </div>
              <h3 style={{
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 600, fontSize: 17,
                color: "var(--text)", marginBottom: 10,
              }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-sec)" }}>
                {step.body}
              </p>
              {step.example && (
                <div style={{
                  marginTop: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: 12, padding: "12px 14px",
                  fontSize: 13, fontStyle: "italic",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}>
                  {step.example}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
