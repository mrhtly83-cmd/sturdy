"use client";
import { motion } from "framer-motion";

const scriptSteps = [
  {
    label: "REGULATE",
    color: "#E87461",
    bg: "rgba(232,116,97,0.08)",
    border: "rgba(232,116,97,0.2)",
    action: "Get low, stay calm. Match his energy downward.",
    script: "\"You're having a really hard time right now.\"",
  },
  {
    label: "CONNECT",
    color: "#8DB89A",
    bg: "rgba(141,184,154,0.08)",
    border: "rgba(141,184,154,0.2)",
    action: "Move closer. Don't make eye contact yet.",
    script: "\"I'm right here with you. I'm not going anywhere.\"",
  },
  {
    label: "GUIDE",
    color: "var(--amber)",
    bg: "rgba(200,136,58,0.08)",
    border: "rgba(200,136,58,0.2)",
    action: "Offer one small, concrete choice.",
    script: "\"Take your time. When you're ready, I'm here.\"",
  },
];

export default function Script() {
  return (
    <section id="example" style={{
      padding: "100px 24px",
      background: "rgba(255,255,255,0.015)",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 80, alignItems: "center",
        }}
          className="script-grid"
        >
          {/* Left — context */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
          >
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
              color: "var(--amber)", textTransform: "uppercase",
              display: "block", marginBottom: 16,
            }}>
              Real example
            </span>
            <h2 style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontStyle: "italic", fontWeight: 600,
              letterSpacing: "-0.5px",
              color: "var(--text)", marginBottom: 20, lineHeight: 1.2,
            }}>
              Tyler, age 6.<br />Complete shutdown.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-sec)", marginBottom: 16 }}>
              He completely shut down and won&apos;t talk to me or look at me.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-muted)", fontStyle: "italic" }}>
              Sturdy understands Tyler is 6, reads the shutdown pattern, and returns
              three grounded steps you can say out loud right now.
            </p>
          </motion.div>

          {/* Right — script output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 20, overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  background: "rgba(232,116,97,0.15)",
                  border: "1px solid rgba(232,116,97,0.3)",
                  borderRadius: 6, padding: "2px 8px",
                  fontSize: 10, fontWeight: 700,
                  color: "#E87461", letterSpacing: 0.5,
                }}>SOS</span>
                <span style={{ fontSize: 13, color: "var(--text-sec)" }}>
                  Tyler is having a hard time — his thinking brain is offline
                </span>
              </div>

              {/* Steps */}
              {scriptSteps.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.12 }}
                  style={{
                    padding: "18px 20px",
                    borderBottom: i < scriptSteps.length - 1 ? "1px solid var(--border)" : "none",
                    background: step.bg,
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: step.bg,
                      border: `1px solid ${step.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: step.color,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                      color: step.color, textTransform: "uppercase",
                    }}>
                      {step.label}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 11, color: "var(--text-muted)", marginBottom: 6,
                    fontStyle: "italic",
                  }}>
                    {step.action}
                  </p>
                  <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.5 }}>
                    {step.script}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .script-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
