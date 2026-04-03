const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require("docx");

const md = fs.readFileSync("/home/runner/workspace/replit.md", "utf-8");
const lines = md.split("\n");

const children = [];

function addSpacer() {
  children.push(new Paragraph({ spacing: { after: 100 } }));
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.startsWith("# ")) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: line.replace(/^# /, ""), bold: true, size: 36, color: "1a1a2e" })],
    }));
  } else if (line.startsWith("## ")) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 360, after: 160 },
      children: [new TextRun({ text: line.replace(/^## /, ""), bold: true, size: 28, color: "2d2d5e" })],
    }));
  } else if (line.startsWith("### ")) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text: line.replace(/^### /, ""), bold: true, size: 24, color: "3d3d7e" })],
    }));
  } else if (line.startsWith("| ") && line.includes("|")) {
    if (line.match(/^\|[\s\-|]+\|$/)) continue;
    const cells = line.split("|").filter(c => c.trim()).map(c => c.trim());
    const isHeader = i + 1 < lines.length && lines[i + 1].match(/^\|[\s\-|]+\|$/);
    const runs = [];
    cells.forEach((cell, idx) => {
      if (idx > 0) runs.push(new TextRun({ text: "  |  ", color: "999999", size: 20 }));
      runs.push(new TextRun({ text: cell, bold: isHeader, size: 20, font: "Consolas" }));
    });
    children.push(new Paragraph({ spacing: { before: 40, after: 40 }, children: runs }));
  } else if (line.startsWith("- **") || line.startsWith("    - **")) {
    const indent = line.startsWith("    ") ? 720 : 360;
    const cleaned = line.replace(/^[\s-]+/, "");
    const runs = [];
    const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach(p => {
      if (p.startsWith("**") && p.endsWith("**")) {
        runs.push(new TextRun({ text: p.replace(/\*\*/g, ""), bold: true, size: 20 }));
      } else {
        const inlineParts = p.split(/(`[^`]+`)/g);
        inlineParts.forEach(ip => {
          if (ip.startsWith("`") && ip.endsWith("`")) {
            runs.push(new TextRun({ text: ip.replace(/`/g, ""), font: "Consolas", size: 18, color: "6b21a8" }));
          } else {
            runs.push(new TextRun({ text: ip, size: 20 }));
          }
        });
      }
    });
    children.push(new Paragraph({ spacing: { before: 60, after: 60 }, indent: { left: indent }, children: runs }));
  } else if (line.match(/^\d+\.\s/)) {
    const cleaned = line.replace(/^\d+\.\s/, "");
    const runs = [];
    const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach(p => {
      if (p.startsWith("**") && p.endsWith("**")) {
        runs.push(new TextRun({ text: p.replace(/\*\*/g, ""), bold: true, size: 20 }));
      } else {
        runs.push(new TextRun({ text: p, size: 20 }));
      }
    });
    const num = line.match(/^(\d+)\./)[1];
    runs.unshift(new TextRun({ text: num + ". ", bold: true, size: 20, color: "6b21a8" }));
    children.push(new Paragraph({ spacing: { before: 60, after: 60 }, indent: { left: 360 }, children: runs }));
  } else if (line.trim() === "") {
    addSpacer();
  } else {
    const runs = [];
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    parts.forEach(p => {
      if (p.startsWith("**") && p.endsWith("**")) {
        runs.push(new TextRun({ text: p.replace(/\*\*/g, ""), bold: true, size: 20 }));
      } else if (p.startsWith("`") && p.endsWith("`")) {
        runs.push(new TextRun({ text: p.replace(/`/g, ""), font: "Consolas", size: 18, color: "6b21a8" }));
      } else {
        runs.push(new TextRun({ text: p, size: 20 }));
      }
    });
    children.push(new Paragraph({ spacing: { before: 40, after: 40 }, children: runs }));
  }
}

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/runner/workspace/exports/CuraLive_Platform_Status_Replit.docx", buf);
  console.log("Done:", buf.length, "bytes");
});
