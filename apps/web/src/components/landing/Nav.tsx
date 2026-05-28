"use client";
import { useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: "1px solid var(--border)",
      background: "rgba(2,2,2,0.85)",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 24px",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <span style={{
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 22, fontStyle: "italic",
          color: "var(--amber)",
          letterSpacing: "-0.3px",
        }}>
          Sturdy
        </span>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: 32, alignItems: "center" }}
          className="hidden-mobile">
          <a href="#how-it-works" style={navLink}>How it works</a>
          <a href="#example" style={navLink}>Example</a>
          <a href="#pricing" style={navLink}>Pricing</a>
        </nav>

        {/* CTA */}
        <a
          href="https://play.google.com/store"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "linear-gradient(90deg, var(--amber), var(--amber-mid))",
            color: "#140f0a",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 600,
            fontSize: 14,
            padding: "10px 20px",
            borderRadius: 12,
            textDecoration: "none",
            letterSpacing: 0.2,
          }}
        >
          Get Sturdy
        </a>
      </div>

      <style>{`
        @media (max-width: 640px) { .hidden-mobile { display: none !important; } }
      `}</style>
    </header>
  );
}

const navLink: React.CSSProperties = {
  color: "var(--text-sec)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 500,
  transition: "color 0.2s",
};
