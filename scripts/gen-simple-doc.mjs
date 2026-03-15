import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, ShadingType, BorderStyle,
} from "docx";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public");
mkdirSync(outDir, { recursive: true });

function title(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 40, color: "FFFFFF" })],
    shading: { type: ShadingType.SOLID, color: "1D4ED8" },
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0 },
  });
}

function subtitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: "DBEAFE", italics: true })],
    shading: { type: ShadingType.SOLID, color: "1E40AF" },
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 400 },
  });
}

function section(text, color) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: "FFFFFF" })],
    shading: { type: ShadingType.SOLID, color },
    spacing: { before: 360, after: 100 },
    indent: { left: 80 },
  });
}

function step(num, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: `  ${num}  `, bold: true, size: 20, color: "FFFFFF", shading: { type: ShadingType.SOLID, color: "374151" } }),
      new TextRun({ text: `   ${text}`, size: 20, color: "1F2937" }),
    ],
    spacing: { before: 100, after: 100 },
    indent: { left: 360 },
  });
}

function note(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, color: "6B7280", italics: true })],
    spacing: { before: 60, after: 200 },
    indent: { left: 440 },
  });
}

function plain(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21, color: "374151" })],
    spacing: { before: 120, after: 120 },
    indent: { left: 200 },
  });
}

function callout(text, color) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: "FFFFFF", bold: true })],
    shading: { type: ShadingType.SOLID, color },
    spacing: { before: 160, after: 160 },
    indent: { left: 200, right: 200 },
  });
}

function hr() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "E5E7EB" } },
    spacing: { before: 160, after: 160 },
  });
}

const doc = new Document({
  creator: "CuraLive",
  title: "CuraLive — How It All Works",
  sections: [{
    properties: {},
    children: [
      title("CuraLive — How It All Works"),
      subtitle("A plain-language guide for the team"),

      // BIG PICTURE
      section("The Big Picture", "1E3A8A"),
      plain("CuraLive has one central control room — the Operator Console (OCC). Think of it like a live event production desk. Everything flows through it: loading the day's event, seeing who has registered, managing who joins the call, and getting the intelligence report at the end."),

      hr(),

      // BOOKING AN EVENT
      section("Booking an Event", "C05621"),
      plain("When a new event is coming up, an operator sets it up on CuraLive. Here is what that looks like:"),
      step("1", "Open the Create Event page on CuraLive"),
      step("2", "Enter the event details — name, date, type, who is speaking, and the dial-in phone number"),
      step("3", "Save it — the event is now stored and ready"),
      step("4", "On the day, the operator opens the OCC and selects that event — everything loads automatically"),
      note("The event details, dial-in numbers, and speaker list are all saved and linked. The OCC reads them when the operator starts the session."),

      hr(),

      // REGISTRATION
      section("How Attendees Register", "5B21B6"),
      plain("Before the event, attendees receive a registration link. Here is what happens when they use it:"),
      step("1", "Attendee clicks the registration link and fills in their name, email, and company"),
      step("2", "CuraLive automatically assigns them a unique 5-digit PIN"),
      step("3", "They receive their confirmation with the dial-in number and their PIN"),
      step("4", "On event day, they call the number and enter their PIN when prompted"),
      note("The PIN is how CuraLive recognises each person when they call in. The operator sees their name appear in the OCC the moment they dial in."),

      callout("All registrations are stored and accessible from the OCC — the operator can see the full list, check who has joined, and resend PINs if needed.", "065F46"),

      hr(),

      // LIVE EVENT
      section("On the Day — How a Live Call Works", "1E40AF"),
      plain("There are three ways people join a CuraLive event:"),

      new Paragraph({
        children: [new TextRun({ text: "DIAL-IN  (attendee calls us)", bold: true, size: 21, color: "1D4ED8" })],
        spacing: { before: 160, after: 80 },
        indent: { left: 300 },
      }),
      step("1", "Attendee dials the CuraLive phone number"),
      step("2", "They hear a greeting and are asked to enter their PIN"),
      step("3", "The OCC shows the operator who is calling"),
      step("4", "Operator clicks Admit and they join the live call"),

      new Paragraph({
        children: [new TextRun({ text: "DIAL-OUT  (we call them)", bold: true, size: 21, color: "92400E" })],
        spacing: { before: 200, after: 80 },
        indent: { left: 300 },
      }),
      step("1", "Operator types the participant's phone number into the OCC"),
      step("2", "CuraLive calls their phone — it rings like a normal call"),
      step("3", "When they answer, they are connected straight into the conference"),

      new Paragraph({
        children: [new TextRun({ text: "EXTERNAL BRIDGE  (joining another conference)", bold: true, size: 21, color: "C05621" })],
        spacing: { before: 200, after: 80 },
        indent: { left: 300 },
      }),
      step("1", "Operator logs the external bridge's dial-in number and access code in CuraLive"),
      step("2", "CuraLive dials into that bridge on your behalf"),
      step("3", "The platform enters the access codes automatically — no manual keypad needed"),
      step("4", "CuraLive sits inside the external conference and records the audio"),
      note("This is the CCAudioOnly Bridge feature — used when the event is hosted on an outside platform like a bank's conference bridge."),

      hr(),

      // AI
      section("What AI Does During and After the Call", "5B21B6"),
      plain("While the call is running, CuraLive's intelligence layer works quietly in the background:"),
      step("\u2022", "Transcribes every word in real time"),
      step("\u2022", "Scores the tone and sentiment of the conversation"),
      step("\u2022", "Flags any compliance-sensitive language automatically"),
      step("\u2022", "Builds an intelligence record for every event"),
      plain("After the call ends, all of this is available in the Intelligence Terminal — a dashboard that shows patterns and signals across all your events over time."),

      hr(),

      // WHAT STILL NEEDS BUILDING
      section("What Still Needs to Be Built", "991B1B"),
      plain("Two features are currently on the list to complete the picture Graham drew:"),
      step("1", "Booking details panel inside the OCC — so operators can see the day's event info without leaving the console"),
      step("2", "Registrations manager inside the OCC — to browse, search, and manage all sign-ups for the day's event in one place"),

      new Paragraph({ spacing: { before: 500 } }),
      new Paragraph({
        children: [new TextRun({
          text: `CuraLive  —  Confidential  |  ${new Date().toLocaleDateString("en-ZA")}`,
          size: 16, color: "9CA3AF", italics: true,
        })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(join(outDir, "CuraLive_Platform_Architecture.docx"), buf);
console.log("Done.");
