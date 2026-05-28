export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "40px 24px",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <span style={{
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 18, fontStyle: "italic",
          color: "var(--amber)",
        }}>
          Sturdy
        </span>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <a href="/privacy" style={footerLink}>Privacy Policy</a>
          <a href="mailto:sturdymobile@gmail.com" style={footerLink}>Contact</a>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          © 2026 Sturdy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

const footerLink: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  textDecoration: "none",
};
