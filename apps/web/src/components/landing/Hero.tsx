"use client";
import { motion } from "framer-motion";

const scenarios = [
  "He's losing it right now and I don't know what to say",
  "She's been crying for 20 minutes and nothing is working",
  "He said he hates me and slammed his door",
  "She threw herself on the floor and I'm losing patience",
];

export default function Hero() {
  return (
    <section style={{
      minHeight: "90vh",
      display: "flex", alignItems: "center",
      padding: "80px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Amber glow */}
      <div style={{
        position: "absolute", bottom: 0, left: "50%",
        transform: "translateX(-50%)",
        width: 600, height: 300,
        background: "radial-gradient(ellipse, rgba(200,136,58,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ maxWidth: 680 }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "6px 14px",
              marginBottom: 32,
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--sos)",
              display: "inline-block",
            }} />
            <span style={{ fontSize: 12, color: "var(--text-sec)", fontWeight: 500 }}>
              Now on Google Play
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: "clamp(40px, 6vw, 68px)",
              fontStyle: "italic",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-1px",
              color: "var(--text)",
              marginBottom: 24,
            }}
          >
            The words to say<br />
            <span style={{ color: "var(--amber)" }}>right now.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            style={{
              fontSize: 20,
              lineHeight: 1.6,
              color: "var(--text-sec)",
              marginBottom: 40,
              maxWidth: 520,
            }}
          >
            Sturdy gives parents calm, grounded scripts for hard moments —
            shaped to your child&apos;s age, their patterns, and what&apos;s actually happening right now.
          </motion.p>

          {/* Live SOS input mockup */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            style={{
              background: "rgba(232,116,97,0.05)",
              border: "1px solid rgba(232,116,97,0.2)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 16,
              maxWidth: 480,
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
            }}>
              <span style={{
                background: "rgba(232,116,97,0.15)",
                border: "1px solid rgba(232,116,97,0.3)",
                borderRadius: 6, padding: "2px 8px",
                fontSize: 10, fontWeight: 700,
                color: "var(--sos)", letterSpacing: 0.5,
              }}>SOS</span>
              <span style={{ fontSize: 13, color: "var(--text-sec)" }}>
                What&apos;s happening with{" "}
                <span style={{ color: "var(--amber)" }}>Tyler</span> right now?
              </span>
            </div>
            <p style={{
              fontSize: 14, color: "rgba(232,116,97,0.5)",
              fontStyle: "italic",
            }}>
              {scenarios[0]}
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "linear-gradient(90deg, var(--amber), var(--amber-mid))",
                color: "#140f0a",
                fontWeight: 600, fontSize: 15,
                padding: "14px 28px",
                borderRadius: 14,
                textDecoration: "none",
                letterSpacing: 0.2,
              }}
            >
              Download free
            </a>
            <a
              href="#how-it-works"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-sec)",
                fontWeight: 500, fontSize: 15,
                padding: "14px 28px",
                borderRadius: 14,
                textDecoration: "none",
              }}
            >
              See how it works
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            style={{
              marginTop: 20,
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            SOS is always free. No credit card. No account required to start.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
