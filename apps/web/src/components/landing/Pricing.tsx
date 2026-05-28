"use client";
import { motion } from "framer-motion";

const freeFeatures = [
  "50 scripts per month — all modes",
  "SOS — the words for hard moments",
  "Question mode — the quiet questions too",
  "Crisis support — always free, no limit",
  "1 child profile",
  "Gentle tone",
];

const premiumFeatures = [
  "Unlimited scripts across all modes",
  "Unlimited child profiles",
  "Tone selector — Soft, Gentle, Direct",
  "Full child profile — triggers, history, saved scripts",
  "Follow-up scripts",
  "Voice on every mode",
];

export default function Pricing() {
  return (
    <section id="pricing" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <h2 style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontStyle: "italic", fontWeight: 600,
            letterSpacing: "-0.5px",
            color: "var(--text)", marginBottom: 16,
          }}>
            Start free. Upgrade when it fits.
          </h2>
          <p style={{ fontSize: 17, color: "var(--text-sec)", maxWidth: 480, margin: "0 auto" }}>
            The free tier is a real product — not a trial. SOS and crisis support are always free.
          </p>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20, maxWidth: 760, margin: "0 auto",
        }}>
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45 }}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20, padding: 28,
            }}
          >
            <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 8 }}>Free</p>
            <p style={{
              fontFamily: "Fraunces, serif",
              fontSize: 40, fontWeight: 700,
              color: "var(--text)", marginBottom: 4,
            }}>$0</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28 }}>
              No credit card. Always.
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {freeFeatures.map((f) => (
                <li key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--text-sec)", marginTop: 2, flexShrink: 0 }}>·</span>
                  <span style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.5 }}>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", textAlign: "center",
                marginTop: 28, padding: "13px 0",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--text-sec)", fontSize: 14, fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Download free
            </a>
          </motion.div>

          {/* Sturdy+ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{
              background: "rgba(200,136,58,0.06)",
              border: "1px solid rgba(200,136,58,0.35)",
              borderRadius: 20, padding: 28,
              position: "relative",
            }}
          >
            <div style={{
              position: "absolute", top: -12, left: 24,
              background: "linear-gradient(90deg, var(--amber), var(--amber-mid))",
              borderRadius: 999, padding: "4px 14px",
              fontSize: 11, fontWeight: 700,
              color: "#140f0a", letterSpacing: 0.5,
            }}>
              STURDY+
            </div>
            <p style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 8 }}>Monthly</p>
            <p style={{
              fontFamily: "Fraunces, serif",
              fontSize: 40, fontWeight: 700,
              color: "var(--text)", marginBottom: 4,
            }}>$9.99</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28 }}>
              Or $69.99/year · 3-day free trial
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {premiumFeatures.map((f) => (
                <li key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--amber)", marginTop: 2, flexShrink: 0 }}>·</span>
                  <span style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", textAlign: "center",
                marginTop: 28, padding: "13px 0",
                background: "linear-gradient(90deg, var(--amber), var(--amber-mid))",
                borderRadius: 12,
                color: "#140f0a", fontSize: 14, fontWeight: 600,
                textDecoration: "none",
                letterSpacing: 0.2,
              }}
            >
              Start free trial
            </a>
          </motion.div>
        </div>

        <p style={{
          textAlign: "center", marginTop: 32,
          fontSize: 12, color: "var(--text-muted)", fontStyle: "italic",
        }}>
          Cancel any time. Crisis support is always free, regardless of plan.
        </p>
      </div>
    </section>
  );
}
