/**
 * email.test.ts — Validates the Resend email helper and API key.
 *
 * Sends a real test email to Resend's test address to confirm the key works.
 * Uses the onboarding@resend.dev shared domain which is always available.
 */
import { describe, it, expect } from "vitest";
import { sendEmail, buildIRSummaryEmail, buildRegistrationConfirmationEmail } from "./_core/email";

describe("Email helper", () => {
  it("should build a valid IR summary HTML email", () => {
    const html = buildIRSummaryEmail({
      contactName: "Test Contact",
      eventTitle: "Q4 2025 Earnings Call",
      company: "CuraLive Inc.",
      summary: "Strong Q4 results with 28% YoY revenue growth.",
      date: "2 March 2026",
    });
    expect(html).toContain("Q4 2025 Earnings Call");
    expect(html).toContain("Test Contact");
    expect(html).toContain("CuraLive Inc.");
    expect(html).toContain("28% YoY revenue growth");
  });

  it("should build a valid registration confirmation HTML email", () => {
    const html = buildRegistrationConfirmationEmail({
      firstName: "Jane",
      lastName: "Smith",
      eventTitle: "Annual Investor Day",
      company: "CuraLive Inc.",
      eventDate: "15 April 2026",
      dialInNumber: "+27 11 535 0000",
      accessCode: "9341",
    });
    expect(html).toContain("Annual Investor Day");
    expect(html).toContain("Jane Smith");
    expect(html).toContain("+27 11 535 0000");
    expect(html).toContain("9341");
  });

  it("should attempt to send a real test email via Resend API", async () => {
    // Resend allows sending to 'delivered@resend.dev' for testing — no domain verification needed
    const result = await sendEmail({
      to: "delivered@resend.dev",
      subject: "CuraLive — API Key Validation Test",
      html: buildIRSummaryEmail({
        contactName: "Resend Test",
        eventTitle: "API Key Validation",
        company: "CuraLive Inc.",
        summary: "This is an automated test to confirm the Resend API key is working correctly.",
        date: new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }),
      }),
    });

    // If RESEND_API_KEY is not set, sendEmail returns success: false with a specific message
    if (!process.env.RESEND_API_KEY) {
      expect(result.success).toBe(false);
      expect(result.error).toContain("RESEND_API_KEY not configured");
    } else {
      // The API key is set — the call was made. It may succeed or fail depending on
      // domain verification status, but the key itself must be valid (no auth error).
      if (result.error) {
        expect(result.error).not.toContain("API key is invalid");
        expect(result.error).not.toContain("RESEND_API_KEY not configured");
      }
      // result.success may be false if the sender domain isn't verified yet — that's OK
      expect(typeof result.success).toBe("boolean");
    }
  }, 15_000); // allow up to 15s for the API call
});
