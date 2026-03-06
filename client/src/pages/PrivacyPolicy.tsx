/**
 * PrivacyPolicy.tsx — Privacy Policy for CuraLive
 * Accessible at /legal/privacy
 */
import { useLocation } from "wouter";
import { ArrowLeft, Zap } from "lucide-react";

const EFFECTIVE_DATE = "1 March 2026";
const COMPANY_NAME = "CuraLive (Pty) Ltd";
const CONTACT_EMAIL = "privacy@choruscall.ai";
const PLATFORM_NAME = "CuraLive";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-semibold">Privacy Policy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight">Chorus<span className="text-primary">.AI</span></span>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {COMPANY_NAME} ("CuraLive", "we", "us", or "our") is committed to protecting your personal information.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the
          {" "}{PLATFORM_NAME} platform. Please read this policy carefully. If you do not agree with its terms, please
          discontinue use of the platform.
        </p>

        {[
          {
            title: "1. Information We Collect",
            content: `We collect information you provide directly to us, including: registration data (name, email address, company, job title, phone number, country); account credentials via our OAuth authentication provider; event content (questions submitted during Q&A, poll responses, chat messages); and payment information processed by our third-party payment processor (we do not store card details). We also collect information automatically when you use the platform, including: log data (IP address, browser type, pages visited, time spent); device information (hardware model, operating system, unique device identifiers); and usage data (features used, events attended, watch time). We use cookies and similar tracking technologies to enhance your experience and analyse platform usage.`,
          },
          {
            title: "2. How We Use Your Information",
            content: "We use the information we collect to: provide, maintain, and improve the Service; process registrations and send confirmation and reminder emails; facilitate live events including real-time transcription, Q&A, and polling; generate post-event reports and analytics for event operators; send transactional communications (registration confirmations, calendar invites, event reminders); respond to your enquiries and provide customer support; detect and prevent fraud, abuse, and security incidents; comply with legal obligations; and with your consent, send marketing communications about new features and events.",
          },
          {
            title: "3. Legal Basis for Processing (GDPR)",
            content: "For users in the European Economic Area, we process your personal data on the following legal bases: performance of a contract (to provide the Service you have registered for); legitimate interests (to improve our platform, prevent fraud, and communicate with operators); consent (for marketing communications and optional analytics); and compliance with legal obligations.",
          },
          {
            title: "4. Information Sharing and Disclosure",
            content: "We do not sell your personal information. We may share your information with: event operators who have organised an event you registered for (they receive your registration details and attendance data); service providers who assist us in operating the platform (hosting, email delivery, payment processing, analytics) under confidentiality agreements; third-party integrations you authorise (Zoom, Microsoft Teams, Webex, Recall.ai); and law enforcement or regulatory authorities when required by applicable law or to protect our legal rights.",
          },
          {
            title: "5. Data Retention",
            content: "We retain your personal information for as long as necessary to provide the Service and comply with our legal obligations. Registration data is retained for the duration of your account plus 3 years. Event recordings and transcripts are retained for 2 years unless deleted earlier by the event operator. You may request deletion of your personal data at any time (see Section 8).",
          },
          {
            title: "6. International Data Transfers",
            content: "Your information may be transferred to and processed in countries other than your country of residence, including South Africa, the United States, and the European Union. We ensure that such transfers comply with applicable data protection laws through appropriate safeguards such as standard contractual clauses.",
          },
          {
            title: "7. Security",
            content: "We implement industry-standard technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. These measures include encryption in transit (TLS), access controls, and regular security assessments. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
          },
          {
            title: "8. Your Rights",
            content: `Depending on your location, you may have the following rights regarding your personal information: access — request a copy of the personal data we hold about you; rectification — request correction of inaccurate or incomplete data; erasure — request deletion of your personal data ("right to be forgotten"); restriction — request that we limit how we process your data; portability — receive your data in a structured, machine-readable format; objection — object to processing based on legitimate interests; and withdrawal of consent — withdraw consent for marketing communications at any time. To exercise any of these rights, please contact us at ${CONTACT_EMAIL}. We will respond within 30 days.`,
          },
          {
            title: "9. Cookies",
            content: "We use essential cookies to maintain your session and authentication state. We use analytics cookies to understand how the platform is used and to improve the Service. You may disable non-essential cookies through your browser settings, but this may affect certain features of the platform. We do not use cookies for advertising or cross-site tracking.",
          },
          {
            title: "10. Children's Privacy",
            content: "The Service is not directed to children under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately at " + CONTACT_EMAIL + " and we will take steps to delete such information.",
          },
          {
            title: "11. Third-Party Links",
            content: "The platform may contain links to third-party websites or services. This Privacy Policy does not apply to those third-party sites. We encourage you to review the privacy policies of any third-party services you access through the platform.",
          },
          {
            title: "12. Changes to This Policy",
            content: "We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the platform and updating the effective date. Your continued use of the Service after the effective date constitutes acceptance of the revised policy.",
          },
          {
            title: "13. Contact Us",
            content: `If you have questions, concerns, or complaints about this Privacy Policy or our data practices, please contact our Privacy Officer at ${CONTACT_EMAIL} or write to ${COMPANY_NAME}, South Africa. If you are located in the EEA and are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.`,
          },
        ].map(({ title, content }) => (
          <section key={title} className="space-y-2">
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
          </section>
        ))}

        {/* Footer nav */}
        <div className="pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <button onClick={() => navigate("/legal/terms")} className="hover:text-foreground transition-colors">Terms of Service</button>
          <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">← Back to Home</button>
          <span className="ml-auto">© {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
