import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel, ShadingType } from "docx";
import * as fs from "fs";

const headerCell = (text: string) =>
  new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Calibri" })] })],
    shading: { type: ShadingType.SOLID, color: "1F2937" },
    width: { size: 2000, type: WidthType.DXA },
  });

const cell = (text: string) =>
  new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Calibri" })] })],
    width: { size: 2000, type: WidthType.DXA },
  });

const heading = (text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) =>
  new Paragraph({ heading: level, children: [new TextRun({ text, bold: true, font: "Calibri" })] });

const body = (text: string) =>
  new Paragraph({ children: [new TextRun({ text, size: 22, font: "Calibri" })], spacing: { after: 120 } });

const bold = (text: string) =>
  new Paragraph({ children: [new TextRun({ text, bold: true, size: 22, font: "Calibri" })], spacing: { after: 80 } });

const bullet = (text: string) =>
  new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text, size: 22, font: "Calibri" })], spacing: { after: 60 } });

const spacer = () => new Paragraph({ children: [], spacing: { after: 200 } });

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children: [
      heading("CuraLive CIPC Patent Portfolio"),
      heading("Submission 4 Alignment Brief", HeadingLevel.HEADING_2),
      spacer(),
      body("Prepared for: Manus AI Processing"),
      body("Date: 19 March 2026"),
      body("Applicant: David Cameron"),
      body("Subject: Pre-filing review of CIP Submission 4 (Modules 30–31) against prior submissions"),
      spacer(),

      heading("Filing History", HeadingLevel.HEADING_2),
      new Table({
        rows: [
          new TableRow({ children: [headerCell("Filing"), headerCell("Date"), headerCell("Modules"), headerCell("Claims"), headerCell("Figures"), headerCell("Status")] }),
          new TableRow({ children: [cell("Submission 1 (Parent)"), cell("12 March 2026"), cell("1–13"), cell("1–25"), cell("FIG 1–12"), cell("Filed (App ID 1773575338868)")] }),
          new TableRow({ children: [cell("Submission 2 (CIP)"), cell("16 March 2026"), cell("19–27"), cell("26–33"), cell("FIG 13–20"), cell("Filed")] }),
          new TableRow({ children: [cell("Submission 3 (CIP)"), cell("18 March 2026"), cell("28"), cell("34–43"), cell("FIG 21–27"), cell("Filed")] }),
          new TableRow({ children: [cell("Submission 4 (CIP)"), cell("19 March 2026"), cell("30–31"), cell("45–46"), cell("None defined"), cell("Pending — requires corrections")] }),
        ],
        width: { size: 10000, type: WidthType.DXA },
      }),
      body("Modules 14–18 are operational expansion modules (part of built platform, not separately claimed)."),
      spacer(),

      heading("Issues Identified — Must Fix Before Filing", HeadingLevel.HEADING_2),
      spacer(),

      heading("Issue 1: Claim 44 is Missing", HeadingLevel.HEADING_3),
      body("CIP Submission 3 ends at Claim 43. Submission 4 starts at Claim 45, skipping Claim 44 entirely. The running total states 25 + 8 + 10 + 2 = 45 claims, which means the new claims should be numbered 44 and 45, not 45 and 46."),
      bold("Action required:"),
      body("Renumber the two new claims to 44 and 45, or add a third claim and use 44–46. Update the claims summary to reflect the correct total."),
      spacer(),

      heading("Issue 2: Module 29 Listed but Never Disclosed", HeadingLevel.HEADING_3),
      body("Submission 4's module summary table lists Module 29 as \"Autonomous Shadow Mode Monthly Intelligence Layer\" from CIP Submission 3. However, CIP Submission 3 only discloses Module 28 (Autonomous AI Self-Evolution Engine). Module 29 does not appear anywhere in any filed document. It cannot be referenced as prior art if it was never formally described."),
      bold("Action required:"),
      body("Either (a) remove Module 29 from the summary table entirely, or (b) formally disclose Module 29 in this Submission 4 filing with a full detailed description and at least one new claim."),
      spacer(),

      heading("Issue 3: FIG 23 Reference Conflict", HeadingLevel.HEADING_3),
      body("Submission 4 says Module 31 should \"Refer: FIG 23\". However, FIG 23 was already used in CIP Submission 3 for the Autonomous Promotion Pipeline lifecycle state machine. CIP Submission 3 used figures FIG 21–27. Any new figures in Submission 4 must start at FIG 28 or higher."),
      bold("Action required:"),
      body("Reassign Module 31's figure to FIG 28 (or appropriate next number), create the actual figure content, and update the reference in the specification text."),
      spacer(),

      heading("Issue 4: Module M Amendment Creates Duplication Risk", HeadingLevel.HEADING_3),
      body("A separate \"CIP Amendment — Module M\" document was filed as an amendment to CIP Submission 2. This amendment contains identical content to Module 28 in CIP Submission 3 (same six algorithms, same architecture, same prior art differentiation) but uses completely different claim numbers (53–62 instead of 34–43)."),
      body("This means the same invention is being claimed twice under different numbers in two different filings. Additionally, the Module M amendment references \"claims 1–52\" in its incorporation section, which does not match any filing's actual claim count."),
      bold("Action required:"),
      body("Decide which filing covers Module 28/M and withdraw or consolidate the other. If the Module M amendment was filed first and CIP 3 supersedes it, formally withdraw the amendment. If both are live, CIPC may reject one or both for double-patenting."),
      spacer(),

      heading("Issue 5: Module 30 Detailed Description is Missing", HeadingLevel.HEADING_3),
      body("Submission 4 states: \"As previously provided — retained verbatim for continuity.\" But the actual detailed description of Module 30 (Autonomous IR Assistant Layer) is not included in the document. A patent filing must stand alone — if Module 30 was described in a draft or internal document that was not formally filed, the full specification text must be included in this submission."),
      bold("Action required:"),
      body("Insert the complete Module 30 detailed description including purpose, detailed operation, novel elements, and technical architecture into the Submission 4 document."),
      spacer(),

      heading("Issue 6: Claim Depth is Significantly Thinner Than Prior Submissions", HeadingLevel.HEADING_3),
      new Table({
        rows: [
          new TableRow({ children: [headerCell("Filing"), headerCell("Modules"), headerCell("Claims"), headerCell("Claims per Module")] }),
          new TableRow({ children: [cell("Submission 1"), cell("13"), cell("25"), cell("~1.9")] }),
          new TableRow({ children: [cell("Submission 2"), cell("9"), cell("8"), cell("~0.9")] }),
          new TableRow({ children: [cell("Submission 3"), cell("1"), cell("10"), cell("10.0")] }),
          new TableRow({ children: [cell("Submission 4"), cell("2"), cell("2"), cell("1.0")] }),
        ],
        width: { size: 8000, type: WidthType.DXA },
      }),
      body("CIP Submission 3 set a high standard — Module 28's six algorithms each received individual dependent claims with specific formulas and thresholds. Module 31 introduces multiple novel components but covers all of them in a single independent claim."),
      spacer(),
      bold("Recommended additional dependent claims for Module 31:"),
      bullet("A claim for the shadow mode testing method for autonomously generated tool proposals"),
      bullet("A claim for the blockchain-certified evolution history providing audit-proof expansion records"),
      bullet("A claim for the predictive capability roadmap that anticipates future AGI-level features"),
      bullet("A claim for the automatic integration mechanism that deploys validated tools without human intervention"),
      spacer(),
      bold("Recommended additional dependent claims for Module 30:"),
      bullet("Claims covering the specific autonomous IR workflows (AGM preparation, crisis communications, ESG reporting, NGO donor engagement)"),
      bullet("A claim for the zero-input proactive execution model across all corporate communications"),
      spacer(),

      heading("Items That Are Correctly Aligned", HeadingLevel.HEADING_2),
      bullet("Cross-references to all three prior filings (parent App ID, CIP 2 date, CIP 3 date) are accurate"),
      bullet("Applicant details (name, address, contact, jurisdiction) are consistent across all four submissions"),
      bullet("The \"extends prior filings\" continuity language follows the established pattern"),
      bullet("The Title of Invention properly accumulates all prior scope from Submissions 1–3"),
      bullet("Background and Summary sections correctly reference what each prior submission contributed"),
      bullet("Filing authority (CIPC) and jurisdiction (South Africa with PCT intended) are consistent"),
      bullet("Production URL and GitHub repository references are present"),
      spacer(),

      heading("Recommended Corrected Claims Summary", HeadingLevel.HEADING_2),
      new Table({
        rows: [
          new TableRow({ children: [headerCell("Claims"), headerCell("Scope"), headerCell("Filing")] }),
          new TableRow({ children: [cell("1–25"), cell("Core platform (13 modules)"), cell("Parent Provisional")] }),
          new TableRow({ children: [cell("26–33"), cell("Autonomous modules 19–27"), cell("CIP Submission 2")] }),
          new TableRow({ children: [cell("34–43"), cell("Module 28 (Self-Evolution Engine)"), cell("CIP Submission 3")] }),
          new TableRow({ children: [cell("44–45"), cell("Modules 30–31 (IR Assistant + AGI Expansion)"), cell("CIP Submission 4")] }),
        ],
        width: { size: 10000, type: WidthType.DXA },
      }),
      body("Total: 45 claims (or more if dependent claims are added as recommended)."),
      spacer(),

      heading("Note on \"AGI\" Language", HeadingLevel.HEADING_2),
      body("Submission 4 uses \"AGI-level intelligence\" and \"AGI Transition\" throughout. This is strategically bold for early IP positioning but may attract additional examiner scrutiny. The term \"AGI\" has no standardised legal or technical definition, which could lead to enablement challenges (an examiner may ask how the system proves it achieves \"AGI-level\" capability)."),
      body("Consider whether alternative phrases like \"advanced autonomous intelligence\" or \"self-expanding AI capability\" provide equivalent coverage with less examination risk. If the strategic intent is specifically to claim the AGI terminology space, the current language achieves that."),
      spacer(),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "— End of Brief —", italics: true, size: 20, font: "Calibri" })],
      }),
      spacer(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Prepared by CuraLive development platform for Manus AI processing — 19 March 2026", italics: true, size: 18, font: "Calibri", color: "6B7280" })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("attached_assets/CIP_Submission_4_Alignment_Brief.docx", buffer);
  console.log("DOCX generated successfully");
});
