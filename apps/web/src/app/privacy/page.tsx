export const metadata = {
  title: "Privacy Policy — Sturdy",
  description: "How Sturdy collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <main style={{
      background: "var(--bg-deep)",
      minHeight: "100vh",
      padding: "60px 24px 100px",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a href="/" style={{
          fontSize: 14, color: "var(--text-muted)",
          textDecoration: "none", display: "block", marginBottom: 48,
        }}>
          ← Sturdy
        </a>

        <h1 style={{
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: "clamp(32px, 4vw, 48px)",
          fontStyle: "italic", fontWeight: 600,
          color: "var(--text)", marginBottom: 8,
        }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 48 }}>
          Effective June 15, 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <Section title="What Sturdy is">
            Sturdy is a parenting support application that provides AI-generated communication
            scripts and guidance. This Privacy Policy explains how we collect, use, store, and
            protect your information when you use the Sturdy mobile application and related services.
          </Section>

          <Section title="Information We Collect">
            {`When you create an account, we collect your email address and authentication credentials. If you sign in through Google or Apple, we receive only the email and unique identifier provided by that service. We do not receive or store your third-party password.

To personalize scripts, you may provide your child's first name, age, and behavioral context such as known triggers. You choose what to share and can edit or delete this information at any time. We do not collect information directly from children.

When you request a script or ask a question, the text you type is sent to our AI system to generate a response. We store a brief summary and metadata (mode used, trigger category) but do not store the full text of your input after the response is generated, except in Question mode where responses are saved so you can revisit them.

We collect basic usage data including which features you use and how many scripts you generate per month, for quota enforcement and product improvement.`}
          </Section>

          <Section title="Safety Events">
            If our safety filter detects a crisis situation, we log a brief record of the event type
            for safety monitoring. This includes the risk level and type of crisis resource shown,
            but not the full text of your message. Safety event records are deleted when you delete
            your account.
          </Section>

          <Section title="How We Use Your Information">
            We use your information to generate personalized parenting scripts, enforce free-tier
            usage limits, improve our AI models and product quality, and communicate important
            account information. We do not use your information for advertising. We do not sell
            your information to third parties.
          </Section>

          <Section title="AI Processing">
            {`Sturdy uses Anthropic's Claude AI to generate responses. When you submit a message, relevant context (your child's age, your message, and optional behavioral notes) is sent to Anthropic's API to generate a response. Anthropic's privacy policy governs their handling of this data. We do not send personally identifying information such as your name or email to the AI model.

Sturdy's AI responses are suggestions only. They are not professional parenting advice, psychological guidance, or medical recommendations.`}
          </Section>

          <Section title="Children's Privacy">
            Sturdy is designed for use by parents and caregivers. We do not knowingly collect
            information directly from children under 13. Child profile information (name, age,
            behavioral notes) is provided by the parent and used solely to personalize AI responses.
            This information is stored securely and deleted when the parent deletes their account.
          </Section>

          <Section title="Data Storage and Security">
            Your data is stored on Supabase infrastructure with encryption at rest and in transit.
            We use row-level security to ensure users can only access their own data. We retain
            your data only as long as your account is active.
          </Section>

          <Section title="Account Deletion">
            You can delete your account at any time from the Settings screen in the Sturdy app.
            Account deletion permanently removes all your data including child profiles, scripts,
            session history, and usage records. We offer a 30-day pause period if you want to
            reconsider — during this period your data is preserved but your account is inactive.
            After 30 days, deletion is permanent and irreversible. We do not retain anonymized
            copies of your data after deletion.
          </Section>

          <Section title="Third-Party Services">
            Sturdy uses the following third-party services: Supabase (database and authentication),
            Anthropic (AI response generation), and RevenueCat (subscription management). Each
            service has its own privacy policy governing their data handling.
          </Section>

          <Section title="Your Rights">
            You have the right to access, correct, or delete your personal information at any time.
            You can export your data before deletion from the Settings screen. To request data
            correction or for any privacy questions, contact us at sturdymobile@gmail.com.
          </Section>

          <Section title="Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes through the app. Continued use of Sturdy after changes constitutes acceptance
            of the updated policy.
          </Section>

          <Section title="Contact">
            For privacy questions or concerns, contact us at sturdymobile@gmail.com.
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{
        fontFamily: "DM Sans, sans-serif",
        fontWeight: 600, fontSize: 18,
        color: "var(--text)", marginBottom: 12,
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: 15, lineHeight: 1.75,
        color: "var(--text-sec)",
        whiteSpace: "pre-line",
      }}>
        {children}
      </p>
    </div>
  );
}
