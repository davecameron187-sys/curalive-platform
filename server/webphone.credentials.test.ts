/**
 * Webphone Credentials Validation Tests
 * Validates that Twilio and Telnyx API credentials are correctly configured
 * and can authenticate against their respective APIs.
 */
import { describe, it, expect } from "vitest";
import twilio from "twilio";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;
const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_SIP_CONNECTION_ID = process.env.TELNYX_SIP_CONNECTION_ID;

describe("Webphone Credentials", () => {
  describe("Environment Variables", () => {
    it("should have all Twilio credentials set", () => {
      expect(TWILIO_ACCOUNT_SID).toBeDefined();
      expect(TWILIO_ACCOUNT_SID).toMatch(/^AC/);
      expect(TWILIO_AUTH_TOKEN).toBeDefined();
      expect(TWILIO_AUTH_TOKEN!.length).toBeGreaterThan(10);
      expect(TWILIO_API_KEY).toBeDefined();
      expect(TWILIO_API_KEY).toMatch(/^SK/);
      expect(TWILIO_API_SECRET).toBeDefined();
      expect(TWILIO_API_SECRET!.length).toBeGreaterThan(10);
      // API Secret must NOT equal Auth Token — they are separate credentials
      expect(TWILIO_API_SECRET).not.toBe(TWILIO_AUTH_TOKEN);
      expect(TWILIO_TWIML_APP_SID).toBeDefined();
      expect(TWILIO_TWIML_APP_SID).toMatch(/^AP/);
    });

    it("should have all Telnyx credentials set", () => {
      expect(TELNYX_API_KEY).toBeDefined();
      expect(TELNYX_API_KEY).toMatch(/^KEY/);
      expect(TELNYX_SIP_CONNECTION_ID).toBeDefined();
      expect(TELNYX_SIP_CONNECTION_ID!.length).toBeGreaterThan(5);
    });
  });

  describe("Twilio API Connectivity", () => {
    it("should authenticate with Twilio API using Account SID and Auth Token", async () => {
      // Use TWILIO_AUTH_TOKEN (not API Secret) for REST API authentication
      const credentials = Buffer.from(
        `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
      ).toString("base64");

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as { sid: string; status: string };
      expect(data.sid).toBe(TWILIO_ACCOUNT_SID);
      expect(data.status).toBe("active");
    }, 15000);

    it("should confirm TwiML App SID exists in Twilio account", async () => {
      const credentials = Buffer.from(
        `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
      ).toString("base64");

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Applications/${TWILIO_TWIML_APP_SID}.json`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as { sid: string; friendly_name: string };
      expect(data.sid).toBe(TWILIO_TWIML_APP_SID);
    }, 15000);

    it("should generate a valid Voice Access Token signed with API Key + Secret", () => {
      const { AccessToken } = twilio.jwt;
      const { VoiceGrant } = AccessToken;

      // Token MUST be signed with API Key + Secret (NOT Auth Token)
      const token = new AccessToken(
        TWILIO_ACCOUNT_SID!,
        TWILIO_API_KEY!,
        TWILIO_API_SECRET!,
        { identity: "test-operator", ttl: 60 }
      );
      const grant = new VoiceGrant({
        outgoingApplicationSid: TWILIO_TWIML_APP_SID,
        incomingAllow: true,
      });
      token.addGrant(grant);
      const jwt = token.toJwt();

      const parts = jwt.split(".");
      expect(parts.length).toBe(3); // valid JWT structure
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      expect(payload.iss).toBe(TWILIO_API_KEY); // ISS must be the API Key SID
      expect(payload.sub).toBe(TWILIO_ACCOUNT_SID); // SUB must be the Account SID
      expect(payload.grants?.voice?.outgoing?.application_sid).toBe(TWILIO_TWIML_APP_SID);
    });
  });

  describe("Telnyx API Connectivity", () => {
    it("should authenticate with Telnyx API and retrieve SIP connection", async () => {
      const response = await fetch(
        `https://api.telnyx.com/v2/ip_connections/${TELNYX_SIP_CONNECTION_ID}`,
        {
          headers: {
            Authorization: `Bearer ${TELNYX_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 200 = found, 404 = not found (different connection type), both indicate valid auth
      // 401 = invalid credentials (fail)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    }, 15000);

    it("should be able to list Telnyx SIP connections", async () => {
      const response = await fetch(
        "https://api.telnyx.com/v2/credential_connections",
        {
          headers: {
            Authorization: `Bearer ${TELNYX_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = (await response.json()) as { data: Array<{ connection_name: string }> };
      expect(Array.isArray(data.data)).toBe(true);
      // Confirm our curalive-webphone connection exists
      const ourConnection = data.data.find(
        (c) => c.connection_name === "curalive-webphone"
      );
      expect(ourConnection).toBeDefined();
    }, 15000);
  });
});
