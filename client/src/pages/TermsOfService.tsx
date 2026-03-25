/**
 * TermsOfService.tsx — Terms of Service for CuraLive
 * Accessible at /legal/terms
 */
import { useLocation } from "wouter";
import { ArrowLeft, Zap } from "lucide-react";

const EFFECTIVE_DATE = "1 March 2026";
const COMPANY_NAME = "CuraLive (Pty) Ltd";
const COMPANY_JURISDICTION = "South Africa";
const CONTACT_EMAIL = "legal@curalive.cc";
const PLATFORM_NAME = "CuraLive";
const WEBSITE = "https://curalive.cc";

export default function TermsOfService() {
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
            <span className="text-sm font-semibold">Terms of Service</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight">CuraLive</span>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          These Terms of Service ("Terms") govern your access to and use of the {PLATFORM_NAME} platform and related services
          (collectively, the "Service") operated by {COMPANY_NAME}, a company incorporated in {COMPANY_JURISDICTION}
          ("CuraLive", "we", "us", or "our"). By accessing or using the Service, you agree to be bound by these Terms.
          If you do not agree, you may not use the Service.
        </p>

        {[
          {
            title: "1. Definitions",
            content: `"Platform" means the ${PLATFORM_NAME} web application accessible at ${WEBSITE} and any associated APIs, mobile applications, or integrations. "Operator" means a user who creates and manages webcast events. "Attendee" means a user who registers for and participates in events hosted on the Platform. "Content" means any audio, video, text, data, or other material uploaded to or transmitted through the Platform.`,
          },
          {
            title: "2. Eligibility",
            content: "You must be at least 18 years of age and have the legal capacity to enter into binding contracts to use the Service. By using the Service, you represent and warrant that you meet these requirements. If you are using the Service on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.",
          },
          {
            title: "3. Account Registration",
            content: "To access certain features of the Service, you must create an account via our OAuth authentication system. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately at " + CONTACT_EMAIL + " of any unauthorised use of your account. We reserve the right to suspend or terminate accounts that violate these Terms.",
          },
          {
            title: "4. Permitted Use",
            content: "You may use the Service solely for lawful purposes and in accordance with these Terms. You agree not to: (a) use the Service to transmit unlawful, harmful, defamatory, obscene, or fraudulent content; (b) attempt to gain unauthorised access to any part of the Service or its infrastructure; (c) use automated tools to scrape, crawl, or extract data from the Service without our prior written consent; (d) resell or sublicense access to the Service without our express written authorisation; (e) use the Service to conduct or facilitate market manipulation, insider trading, or any activity that violates applicable securities laws.",
          },
          {
            title: "5. Intellectual Property",
            content: `The Service, including all software, designs, trademarks, and content created by ${COMPANY_NAME}, is owned by or licensed to us and is protected by applicable intellectual property laws. These Terms do not grant you any ownership rights in the Service. You retain ownership of Content you upload to the Platform, but you grant us a non-exclusive, royalty-free, worldwide licence to host, process, and transmit your Content solely to provide the Service.`,
          },
          {
            title: "6. Data and Privacy",
            content: "Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection, processing, and storage of your data as described in the Privacy Policy. We process personal data in accordance with applicable data protection laws, including the Protection of Personal Information Act (POPIA) in South Africa and the General Data Protection Regulation (GDPR) where applicable.",
          },
          {
            title: "7. Third-Party Integrations",
            content: "The Service integrates with third-party platforms including Zoom, Microsoft Teams, Webex, Recall.ai, Ably, and Mux. Your use of these integrations is subject to the respective third-party terms of service. We are not responsible for the availability, accuracy, or conduct of third-party services.",
          },
          {
            title: "8. Payment and Billing",
            content: "Certain features of the Service require payment of fees as described in our pricing page. All fees are quoted exclusive of applicable taxes. We reserve the right to modify our pricing with 30 days' written notice. Fees paid are non-refundable except as required by applicable law or as expressly stated in a separate agreement.",
          },
          {
            title: "9. Limitation of Liability",
            content: `To the maximum extent permitted by applicable law, ${COMPANY_NAME} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with your use of the Service. Our total aggregate liability to you for any claims arising under these Terms shall not exceed the fees paid by you in the 12 months preceding the claim.`,
          },
          {
            title: "10. Disclaimer of Warranties",
            content: `The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.`,
          },
          {
            title: "11. Indemnification",
            content: `You agree to indemnify, defend, and hold harmless ${COMPANY_NAME} and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in connection with: (a) your use of the Service; (b) your violation of these Terms; (c) your Content; or (d) your violation of any third-party rights.`,
          },
          {
            title: "12. Termination",
            content: "We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease. Provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.",
          },
          {
            title: "13. Governing Law and Dispute Resolution",
            content: `These Terms are governed by and construed in accordance with the laws of ${COMPANY_JURISDICTION}, without regard to conflict of law principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of ${COMPANY_JURISDICTION}. Before initiating formal proceedings, the parties agree to attempt to resolve disputes through good-faith negotiation for a period of 30 days.`,
          },
          {
            title: "14. Changes to These Terms",
            content: "We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on the Platform and updating the effective date. Your continued use of the Service after the effective date of the revised Terms constitutes your acceptance of the changes.",
          },
          {
            title: "15. Contact",
            content: `If you have any questions about these Terms, please contact us at ${CONTACT_EMAIL} or write to ${COMPANY_NAME}, South Africa.`,
          },
        ].map(({ title, content }) => (
          <section key={title} className="space-y-2">
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
          </section>
        ))}

        {/* Footer nav */}
        <div className="pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <button onClick={() => navigate("/legal/privacy")} className="hover:text-foreground transition-colors">Privacy Policy</button>
          <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">← Back to Home</button>
          <span className="ml-auto">© {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
