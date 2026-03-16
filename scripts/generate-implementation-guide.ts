// @ts-nocheck
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, PageBreak
} from "docx";
import fs from "fs";

const BLUE = "1a1a2e";
const GREY = "555555";
const DARK = "333333";

function heading(text: string, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, color: BLUE, font: "Calibri" })] });
}
function h2(text: string) { return heading(text, HeadingLevel.HEADING_2); }
function h3(text: string) { return heading(text, HeadingLevel.HEADING_3); }

function para(text: string, spacing = 120) {
  return new Paragraph({ spacing: { after: spacing }, children: [new TextRun({ text, font: "Calibri", size: 22, color: DARK })], });
}

function boldPara(text: string) {
  return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, bold: true, font: "Calibri", size: 22, color: BLUE })], });
}

function bullet(text: string) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text, font: "Calibri", size: 22, color: DARK })] });
}

function subBullet(text: string) {
  return new Paragraph({ bullet: { level: 1 }, spacing: { after: 60 }, children: [new TextRun({ text, font: "Calibri", size: 21, color: GREY })] });
}

function numberedPara(num: string, text: string) {
  return new Paragraph({ spacing: { after: 100 }, children: [
    new TextRun({ text: `${num}. `, bold: true, font: "Calibri", size: 22, color: BLUE }),
    new TextRun({ text, font: "Calibri", size: 22, color: DARK }),
  ]});
}

function divider() {
  return new Paragraph({ spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } }, children: [new TextRun({ text: "" })] });
}

function cell(text: string, bold = false, shading?: string) {
  return new TableCell({
    children: [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text, bold, font: "Calibri", size: 20, color: bold && shading ? "ffffff" : DARK })] })],
    width: { size: 100, type: WidthType.AUTO },
    ...(shading ? { shading: { type: ShadingType.SOLID, color: shading, fill: shading } } : {}),
  });
}

function importantNote(text: string) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: { left: { style: BorderStyle.SINGLE, size: 6, color: "2563eb" } },
    indent: { left: 200 },
    children: [new TextRun({ text: `KEY POINT: ${text}`, bold: true, font: "Calibri", size: 22, color: "2563eb" })],
  });
}

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
    children: [

      // ============================================================
      // COVER
      // ============================================================
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
        new TextRun({ text: "AI AntiHijack", bold: true, font: "Calibri", size: 52, color: BLUE }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: "Complete Implementation Guide", font: "Calibri", size: 28, color: GREY }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: "Everything You Need to Know to Build and Deploy This", font: "Calibri", size: 22, color: GREY }),
      ]}),
      divider(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: "David Cameron — Confidential — March 2026", font: "Calibri", size: 20, color: GREY, italics: true }),
      ]}),

      // ============================================================
      // TABLE OF CONTENTS
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("What This Document Covers"),
      para("This is the real, no-fluff implementation guide. It answers every question about HOW to actually build and deploy AI AntiHijack on real vehicles. By the end, you should be able to explain exactly what happens at every stage — from the data leaving a vehicle to an alert arriving on someone's phone."),
      para("Sections:"),
      numberedPara("1", "The Big Picture — how the whole system fits together (one page summary)"),
      numberedPara("2", "Getting Data Out of Vehicles — the 3 options and exactly how each works"),
      numberedPara("3", "Building the AI Brain — what AI models you need, how to train them, what tools to use"),
      numberedPara("4", "The Alert System — how alerts get from the AI to a human being"),
      numberedPara("5", "The Forensic Evidence System — how incident data is captured and secured"),
      numberedPara("6", "The Predictive Intelligence System — how crime data feeds into route recommendations"),
      numberedPara("7", "Infrastructure — what servers, databases, and services you need"),
      numberedPara("8", "The Build Roadmap — week by week, what to build and in what order"),
      numberedPara("9", "Skills and People — what you can do yourself vs what you need help with"),
      numberedPara("10", "Complete Cost Breakdown — every rand you'll spend"),
      numberedPara("11", "Explaining It to Leigh — how to walk through this with Tragar"),

      // ============================================================
      // SECTION 1: BIG PICTURE
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("1. The Big Picture"),
      para("The entire system works like this — think of it as a chain with 5 links:"),

      boldPara("VEHICLE → DATA PIPE → AI BRAIN → DECISION ENGINE → ALERT/ACTION"),

      para("Here is what each link does:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Link", true, BLUE), cell("What It Does", true, BLUE), cell("Real-World Analogy", true, BLUE)] }),
          new TableRow({ children: [cell("1. Vehicle"), cell("Generates raw data — GPS position, speed, stops, phone status, engine data"), cell("Like a patient wearing a heart monitor — it generates vital signs")] }),
          new TableRow({ children: [cell("2. Data Pipe"), cell("Sends that data from the vehicle to your cloud servers in real time"), cell("Like the wire from the heart monitor to the nurse's station")] }),
          new TableRow({ children: [cell("3. AI Brain"), cell("Analyses the data, compares it to 'normal' patterns, detects anomalies"), cell("Like a doctor reading the heart monitor — trained to spot problems")] }),
          new TableRow({ children: [cell("4. Decision Engine"), cell("Combines multiple signals into a threat score, decides what to do"), cell("Like the doctor deciding: watch and wait, or call a code blue")] }),
          new TableRow({ children: [cell("5. Alert/Action"), cell("Sends notifications to the right people through the right channels"), cell("Like the nurse paging the surgeon and calling the family")] }),
        ],
      }),

      importantNote("You are NOT building a tracking device company. You are building an AI INTELLIGENCE layer that sits on TOP of existing tracking. Tragar already has vehicles and tracking. You add the brain."),

      divider(),

      // ============================================================
      // SECTION 2: GETTING DATA OUT OF VEHICLES
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("2. Getting Data Out of Vehicles"),
      para("This is the first and most important question: how do you get live data from a moving vehicle into your system? There are 3 options. You will likely use a combination."),

      // --- OPTION A ---
      h2("Option A: Tap Into Tragar's Existing Tracking Provider (API)"),
      para("This is the fastest, cheapest, and easiest option. Here's exactly how it works:"),

      h3("What you need to find out from Leigh:"),
      numberedPara("1", "Who is Tragar's current vehicle tracking provider? (Cartrack, Netstar, MiX Telematics, Tracker SA, Ctrack, or another?)"),
      numberedPara("2", "Does Tragar have an account login or portal where they view their vehicles?"),
      numberedPara("3", "Ask Leigh: 'Does your tracking company offer an API or data feed?' — he may not know, but his tracking provider will"),

      h3("What you do next:"),
      para("Contact the tracking provider's technical team (or business development) and ask:"),
      bullet("'We want to access our fleet's live GPS data via your API. Do you offer this?'"),
      bullet("'What data fields are available?' — you need: vehicle ID, latitude, longitude, speed, heading, ignition status, timestamp"),
      bullet("'What is the update frequency?' — ideally every 10–30 seconds per vehicle"),
      bullet("'Is there a cost for API access?' — some providers include it, some charge R50–R200/month extra"),
      bullet("'What authentication method do you use?' — usually an API key or OAuth token"),

      h3("How the API connection works technically:"),
      para("An API is like a phone line between two computer systems. Tragar's tracking provider has a server that knows where every vehicle is. You build a system that calls that server and asks 'where are all my vehicles right now?' — and the tracking server answers with the current data."),

      boldPara("The data you receive looks something like this:"),
      para("Vehicle ID: TRG-001 | Latitude: -26.1544 | Longitude: 28.2326 | Speed: 72 km/h | Heading: North | Ignition: On | Time: 2026-03-15 14:32:05"),

      para("Your system receives this data every 10–30 seconds for every vehicle. That's the raw input your AI brain analyses."),

      h3("How you build the API connection:"),
      para("This is a software development task. You build a small application (a 'service') that:"),
      numberedPara("1", "Connects to the tracking provider's API using the credentials they give you"),
      numberedPara("2", "Requests data for all Tragar's pilot vehicles on a loop (every 10–30 seconds)"),
      numberedPara("3", "Receives the GPS/speed/status data"),
      numberedPara("4", "Stores it in your database"),
      numberedPara("5", "Passes it to the AI brain for analysis"),

      para("Programming language: TypeScript/Node.js (what you're already using for CuraLive) or Python. Both work well for this."),
      para("Time to build: 2–5 days if the tracking provider has good API documentation."),

      importantNote("This is the option I recommend for the Tragar pilot. Zero hardware cost, zero installation in vehicles, and you can be up and running in days."),

      divider(),

      // --- OPTION B ---
      h2("Option B: Driver Smartphone App"),
      para("If the tracking provider doesn't offer API access (or Tragar doesn't have a tracking provider), you use the drivers' smartphones to collect data."),

      h3("What the app does:"),
      para("You build a mobile app (Android — most fleet drivers in SA use Android) that runs in the background while the driver is working. The app collects:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Data Type", true, BLUE), cell("How the Phone Gets It", true, BLUE), cell("Why You Need It", true, BLUE)] }),
          new TableRow({ children: [cell("GPS location"), cell("Phone's built-in GPS chip"), cell("Track where the vehicle is in real time")] }),
          new TableRow({ children: [cell("Speed"), cell("Calculated from GPS positions over time"), cell("Detect unusual speed patterns — too fast, too slow, stopped unexpectedly")] }),
          new TableRow({ children: [cell("Accelerometer"), cell("Phone's built-in motion sensor"), cell("Detect sudden braking, impact, the phone being thrown or grabbed")] }),
          new TableRow({ children: [cell("Bluetooth proximity"), cell("Bluetooth Low Energy (BLE) beacon in vehicle"), cell("Detect if the driver's phone leaves the vehicle while it's still moving")] }),
          new TableRow({ children: [cell("Network status"), cell("Phone's cellular/WiFi radios"), cell("Detect if cellular signal is jammed — a common hijacking technique")] }),
          new TableRow({ children: [cell("Battery level"), cell("Phone OS reports"), cell("Ensure the app keeps running — alert if battery drops too low")] }),
        ],
      }),

      h3("How you build the app:"),
      para("You have two options for building the mobile app:"),

      boldPara("Option B1: React Native (recommended)"),
      para("React Native lets you write one codebase in JavaScript/TypeScript (which you already know) and deploy to both Android and iOS. Since you're already building CuraLive with React, this is the natural choice."),
      bullet("Key library for GPS: react-native-geolocation-service — provides background location tracking"),
      bullet("Key library for Bluetooth: react-native-ble-plx — communicates with BLE beacons"),
      bullet("Key library for background tasks: react-native-background-actions — keeps the app running when the screen is off"),
      bullet("Data transmission: the app sends data to your server via HTTPS every 5–10 seconds"),

      boldPara("Option B2: Native Android (Java/Kotlin)"),
      para("More complex to build, but gives you deeper access to phone sensors and better battery life. You'd need an Android developer if you go this route."),

      h3("The Bluetooth beacon (for driver-vehicle separation detection):"),
      para("This is a small, cheap device you stick inside each vehicle. It constantly broadcasts a Bluetooth signal. The driver's phone listens for this signal."),
      bullet("If the phone can hear the beacon → driver is in/near the vehicle (normal)"),
      bullet("If the phone suddenly can't hear the beacon → driver's phone has been separated from the vehicle (red flag)"),
      bullet("If the beacon stops broadcasting → someone has removed or tampered with it (red flag)"),
      bullet("Cost: R150–R400 per beacon (buy them on Takealot or from RS Components)"),
      bullet("Battery life: 1–3 years depending on the beacon model"),
      bullet("Recommended beacon: Minew E8 or Kontakt.io Smart Beacon — both available in SA"),

      h3("How data gets from the phone to your server:"),
      para("The app collects data points and sends them to your cloud server in batches (every 5–10 seconds) over the driver's mobile data connection."),
      bullet("Data usage: approximately 30–50 MB per month per driver — negligible on most data plans"),
      bullet("If the phone loses signal temporarily, data is stored locally on the phone and sent when signal returns"),
      bullet("Data is sent over HTTPS (encrypted) so it can't be intercepted"),

      para("Time to build the app: 3–6 weeks for a functional pilot version."),

      importantNote("The smartphone app is your backup option if API access isn't available. It's more work to build but gives you richer data (accelerometer, Bluetooth proximity) that the tracking API doesn't provide."),

      divider(),

      // --- OPTION C ---
      h2("Option C: OBD-II Device (Maximum Data, Higher Cost)"),
      para("OBD-II (On-Board Diagnostics) is a standard diagnostic port built into every vehicle manufactured after 2006. It's the port mechanics plug into to read engine fault codes. You can plug a small device into this port that reads vehicle data AND has its own GPS and cellular connection."),

      h3("What an OBD-II device gives you that the other options don't:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Data", true, BLUE), cell("Why It Matters", true, BLUE)] }),
          new TableRow({ children: [cell("Engine RPM"), cell("Detect if engine is running while vehicle is supposedly 'stopped' — indicates theft in progress")] }),
          new TableRow({ children: [cell("Fuel level"), cell("Detect fuel theft or draining (common before abandoning a hijacked vehicle)")] }),
          new TableRow({ children: [cell("Ignition status"), cell("Exact moment the vehicle was started, stopped, or restarted (by hijacker)")] }),
          new TableRow({ children: [cell("Door lock status"), cell("Detect forced entry or doors opening during suspicious stops")] }),
          new TableRow({ children: [cell("Vehicle speed (from ECU)"), cell("More accurate than GPS speed — directly from the vehicle's computer")] }),
          new TableRow({ children: [cell("Independent GPS"), cell("Even if the main tracker is jammed/removed, this device still knows where the vehicle is")] }),
          new TableRow({ children: [cell("Independent SIM card"), cell("Its own cellular connection — if the main tracker's SIM is jammed, this one might still work (different network/frequency)")] }),
          new TableRow({ children: [cell("Tamper detection"), cell("Alerts if someone unplugs the device from the OBD port")] }),
        ],
      }),

      h3("Which OBD-II device to buy:"),
      para("You don't manufacture these — you buy commercial OBD-II tracking devices that have an open API or data export:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Device", true, BLUE), cell("Price (approx)", true, BLUE), cell("Data Access", true, BLUE), cell("Where to Buy", true, BLUE)] }),
          new TableRow({ children: [cell("Teltonika FMB920"), cell("R1,200–R1,800"), cell("Full API, open protocol"), cell("Glopos, IoT suppliers SA")] }),
          new TableRow({ children: [cell("Queclink GV500"), cell("R1,500–R2,500"), cell("TCP/UDP raw data stream"), cell("Queclink distributors SA")] }),
          new TableRow({ children: [cell("CalAmp LMU-3640"), cell("R2,000–R3,000"), cell("Cloud API (PEG platform)"), cell("CalAmp partners SA")] }),
          new TableRow({ children: [cell("Ruptela FM-Eco4+"), cell("R1,000–R1,500"), cell("Open protocol, well documented"), cell("Ruptela distributors")] }),
        ],
      }),

      para("Each device also needs a SIM card with a data plan. Cost: R30–R80/month per SIM (Vodacom IoT or MTN IoT plans)."),

      h3("How you install it:"),
      numberedPara("1", "Find the OBD-II port in the vehicle — it's usually under the dashboard on the driver's side, near the steering column"),
      numberedPara("2", "Plug the device into the OBD port — it clicks in, no tools needed"),
      numberedPara("3", "Insert the SIM card into the device"),
      numberedPara("4", "Power on — the device draws power from the vehicle's battery through the OBD port"),
      numberedPara("5", "Configure the device to send data to your server (done via the device's configuration tool or SMS commands)"),
      para("Installation time: 10–15 minutes per vehicle. No mechanical knowledge required."),

      h3("How you receive data from OBD devices:"),
      para("These devices send raw data packets over cellular (TCP/UDP) to a server you run. You need to:"),
      numberedPara("1", "Run a 'device gateway' server that listens for incoming data from the OBD devices"),
      numberedPara("2", "The gateway decodes the raw data packets into usable fields (latitude, longitude, speed, RPM, etc.)"),
      numberedPara("3", "Most device manufacturers provide decoder libraries or documentation for their data format"),
      numberedPara("4", "The decoded data goes into your database and AI brain — same as the other options"),

      importantNote("For the Tragar pilot, I recommend OBD devices on 3–5 vehicles only (the ones on the highest-risk routes) to demonstrate the full capability. Use API or app for the rest."),

      divider(),

      // ============================================================
      // SECTION 3: THE AI BRAIN
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("3. Building the AI Brain — The Core Intelligence"),
      para("This is the heart of the system and the part that makes it different from a standard tracker. Here's exactly what AI models you need, how they work, and how to build them."),

      h2("3.1 What 'AI' Actually Means Here"),
      para("When we say 'AI', we mean machine learning models — software that learns patterns from data and detects when something doesn't fit the pattern. You are NOT building ChatGPT or a talking robot. You're building pattern recognition software."),
      para("Think of it like this: if you watched the same driver do the same route 50 times, you'd start to know what 'normal' looks like. If on trip 51, they suddenly turned off the highway into an industrial area at 11pm, you'd know something is wrong. The AI does this — but for every driver, every route, every second of every journey, simultaneously."),

      h2("3.2 The Four AI Models You Need"),

      // MODEL 1
      h3("Model 1: Driver Behaviour Baseline (Anomaly Detection)"),
      boldPara("What it does:"),
      para("Learns what 'normal' looks like for each driver — their typical routes, speeds, stop patterns, and driving style. Then flags when current behaviour doesn't match."),

      boldPara("How it works technically:"),
      para("This is an unsupervised anomaly detection model. The term 'unsupervised' means it learns from the data without you having to label anything as 'good' or 'bad' — it figures out what's normal on its own."),

      boldPara("Algorithm options (pick one):"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Algorithm", true, BLUE), cell("How It Works (simple)", true, BLUE), cell("Best For", true, BLUE)] }),
          new TableRow({ children: [cell("Isolation Forest"), cell("Randomly splits data into groups — unusual data points end up isolated quickly"), cell("General anomaly detection — good starting point")] }),
          new TableRow({ children: [cell("DBSCAN"), cell("Groups nearby data points together — points that don't belong to any group are anomalies"), cell("Spatial/route anomalies — detecting unusual locations")] }),
          new TableRow({ children: [cell("LSTM Neural Network"), cell("Learns sequences — 'after A, expect B' — flags when the sequence breaks"), cell("Time-based behaviour — detecting unusual sequences of events")] }),
          new TableRow({ children: [cell("Autoencoder"), cell("Learns to compress and reconstruct normal data — fails to reconstruct anomalies"), cell("Complex multi-signal anomaly detection")] }),
        ],
      }),

      boldPara("My recommendation: Start with Isolation Forest (simplest to implement, works well). Upgrade to LSTM later."),

      boldPara("What data it needs to learn:"),
      bullet("2–4 weeks of normal driving data per driver (GPS + speed + stops)"),
      bullet("Minimum 20–30 complete journeys per driver to build a reliable baseline"),
      bullet("The model retrains weekly as it accumulates more data"),

      boldPara("Tools to build it:"),
      bullet("Language: Python (industry standard for ML)"),
      bullet("Library: scikit-learn (for Isolation Forest/DBSCAN) or TensorFlow/PyTorch (for LSTM)"),
      bullet("Training: runs on your cloud server — no special hardware needed for this data volume"),

      divider(),

      // MODEL 2
      h3("Model 2: Route Deviation Detector (Geospatial AI)"),
      boldPara("What it does:"),
      para("Compares the vehicle's current position and trajectory against the expected route. Calculates how far off-route the vehicle is and whether it's moving toward a high-risk area."),

      boldPara("How it works technically:"),
      para("This is a combination of geofencing and route corridor analysis. You define a 'corridor' around each expected route (like a buffer zone). If the vehicle leaves the corridor, the model calculates:"),
      bullet("How far off-route is it? (in metres/kilometres)"),
      bullet("In which direction is it deviating? (toward which area?)"),
      bullet("Is the deviation consistent with normal route variations (traffic detour, road closure) or unusual?"),
      bullet("Is the vehicle heading toward a known crime hotspot?"),

      boldPara("Tools to build it:"),
      bullet("Geospatial library: Turf.js (JavaScript) or Shapely (Python) — calculates distances, intersections, buffer zones"),
      bullet("Mapping data: OpenStreetMap (free) or Google Maps Platform (paid but more accurate)"),
      bullet("Crime hotspot data: SAPS annual crime statistics (free, published by police stations) — geocode the locations"),
      bullet("Route calculation: OSRM (free, open source) or Google Directions API (paid, ~R0.01 per request)"),

      boldPara("This is simpler than Model 1 — it's more geometry than AI. A developer can build the basic version in 1–2 weeks."),

      divider(),

      // MODEL 3
      h3("Model 3: Multi-Signal Threat Scorer (The Decision Engine)"),
      boldPara("What it does:"),
      para("Takes the outputs from all other models and data sources, combines them, and produces a single threat score (0–100). This is what determines whether an alert gets sent."),

      boldPara("How it works technically:"),
      para("This is a weighted scoring system. Each signal gets a score, and they're combined with weights that reflect how important each signal is:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Signal", true, BLUE), cell("Weight", true, BLUE), cell("Score Range", true, BLUE), cell("Example", true, BLUE)] }),
          new TableRow({ children: [cell("Route deviation distance"), cell("25%"), cell("0–100"), cell("0 = on route, 100 = 5+ km off route toward hotspot")] }),
          new TableRow({ children: [cell("Driver behaviour anomaly"), cell("20%"), cell("0–100"), cell("0 = normal behaviour, 100 = highly unusual pattern")] }),
          new TableRow({ children: [cell("Phone/device connectivity"), cell("20%"), cell("0–100"), cell("0 = all connected, 100 = phone offline + tracker offline")] }),
          new TableRow({ children: [cell("Location risk (crime data)"), cell("15%"), cell("0–100"), cell("0 = low-crime area, 100 = known hijacking hotspot")] }),
          new TableRow({ children: [cell("Time-of-day risk"), cell("10%"), cell("0–100"), cell("0 = midday in business area, 100 = 2am in industrial zone")] }),
          new TableRow({ children: [cell("Vehicle anomaly (if OBD)"), cell("10%"), cell("0–100"), cell("0 = normal, 100 = engine running + door open + stationary")] }),
        ],
      }),

      para("Combined threat score = (route × 0.25) + (behaviour × 0.20) + (connectivity × 0.20) + (location × 0.15) + (time × 0.10) + (vehicle × 0.10)"),

      boldPara("Example scenario:"),
      para("Driver deviates 2km off route (score: 60) + phone goes offline (score: 80) + vehicle is near a known hotspot (score: 70) + it's 19:00 on a Friday (score: 50) = Combined: (60×0.25) + (20×0.20) + (80×0.20) + (70×0.15) + (50×0.10) + (0×0.10) = 15 + 4 + 16 + 10.5 + 5 + 0 = 50.5 → GUARDED level alert"),
      para("Now add: behaviour model flags highly unusual movement pattern (score: 90) = recalculate with behaviour at 90: 15 + 18 + 16 + 10.5 + 5 + 0 = 64.5 → HIGH level alert → operations team notified"),

      boldPara("This is NOT machine learning — it's weighted arithmetic. You can build this in a day. The power comes from the signals feeding into it."),

      importantNote("You fine-tune the weights over time based on real data from the pilot. If you find that route deviation is more predictive than time-of-day, you increase its weight. This is the 'intelligence' — it gets smarter as you learn what actually predicts incidents."),

      divider(),

      // MODEL 4
      h3("Model 4: Predictive Risk Engine (Crime Pattern Analysis)"),
      boldPara("What it does:"),
      para("Analyses historical crime data and identifies patterns — which areas are dangerous, at what times, on which days. Uses this to score route risk BEFORE a journey starts."),

      boldPara("Data sources (all free or cheap):"),
      bullet("SAPS annual crime statistics — published per police station, includes hijacking and vehicle theft counts. Available from saps.gov.za"),
      bullet("CrimeStatsSA — processed SAPS data with geographic coordinates. Free academic resource"),
      bullet("News reports — hijacking incidents reported in media can be geocoded and added to your database"),
      bullet("Your own data — over time, anomalies and incidents detected by your system become the most valuable data source"),

      boldPara("How it works:"),
      numberedPara("1", "Geocode crime data — convert 'Diepsloot SAPS' into GPS coordinates (-26.0333, 28.0167)"),
      numberedPara("2", "Create a heat map — areas with more incidents get higher risk scores"),
      numberedPara("3", "Add time dimension — some areas are risky only at night, others all day"),
      numberedPara("4", "When a route is planned, calculate which risk zones it passes through and at what times"),
      numberedPara("5", "Output: 'This route has a risk score of 72/100 at 18:00. Alternative route via N17 scores 34/100.'"),

      boldPara("Tools: Python with pandas (data processing) + folium or kepler.gl (mapping) + basic statistical analysis. Not complex AI — mostly data processing and spatial analysis."),

      divider(),

      // ============================================================
      // SECTION 4: THE ALERT SYSTEM
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("4. The Alert System — Getting Warnings to People"),
      para("The AI detecting a threat is useless if nobody sees the alert. Here's exactly how alerts get from your system to a human being."),

      h2("4.1 The Monitoring Dashboard (Web Application)"),
      para("You build a web-based dashboard — similar to what you've already built with CuraLive. This is a React application that shows:"),
      bullet("Live map with all vehicles plotted — colour-coded green (normal), yellow (elevated), orange (high), red (critical)"),
      bullet("Alert feed on the side — newest alerts at the top, with vehicle ID, threat level, reason, and location"),
      bullet("Click on any vehicle to see: current position, current route, threat score breakdown, driver details, journey history"),
      bullet("Click on any alert to see: full context, map showing where the anomaly occurred, recommended action"),

      boldPara("Technology:"),
      bullet("Frontend: React + TypeScript (you already know this from CuraLive)"),
      bullet("Maps: Leaflet.js (free, open source) or Google Maps JavaScript API (paid but better)"),
      bullet("Real-time updates: WebSocket connection — dashboard updates every 5 seconds without refreshing"),
      bullet("Build time: 2–4 weeks for a functional pilot version"),

      h2("4.2 Push Notifications (Mobile)"),
      para("For High and Critical alerts, designated people receive instant notifications on their phones:"),

      boldPara("How to implement:"),
      bullet("Service: Firebase Cloud Messaging (FCM) — free, by Google. Works on Android and iOS"),
      bullet("You send a notification from your server to FCM, FCM delivers it to the person's phone"),
      bullet("Cost: Free for up to 1 million messages/month (you'll use a tiny fraction of this)"),
      bullet("No app required on the receiver's end — FCM can send to a simple PWA (Progressive Web App) or a lightweight notification app"),

      h2("4.3 SMS Alerts"),
      para("For critical escalation when push notifications aren't acknowledged:"),
      boldPara("How to implement:"),
      bullet("Service: Twilio or Africa's Talking (SMS API providers)"),
      bullet("Africa's Talking is recommended — SA-based, cheaper for local SMS"),
      bullet("Cost: approximately R0.30–R0.50 per SMS via Africa's Talking"),
      bullet("You send an API call to Africa's Talking with the phone number and message, they deliver the SMS"),
      bullet("Setup time: 1–2 hours — create an account, get an API key, write a few lines of code"),

      h2("4.4 WhatsApp Alerts"),
      para("WhatsApp is how South Africa communicates. For the pilot, you can send WhatsApp alerts:"),
      boldPara("How to implement:"),
      bullet("Service: WhatsApp Business API via Twilio or 360dialog"),
      bullet("You need an approved WhatsApp Business number (application process takes 1–2 weeks)"),
      bullet("Cost: approximately R0.50–R0.80 per WhatsApp message"),
      bullet("Alternative for pilot: Use a WhatsApp group and send automated messages via a simple bot. Less formal but works for testing"),

      divider(),

      // ============================================================
      // SECTION 5: FORENSIC EVIDENCE
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("5. The Forensic Evidence System"),
      para("This is one of the patent's strongest claims and a major differentiator. Here's how it works:"),

      h2("5.1 What gets captured during an incident:"),
      para("When the threat score crosses the HIGH threshold (61+), the system automatically switches to 'evidence mode':"),
      bullet("GPS recording frequency increases from every 30 seconds to every 2–5 seconds"),
      bullet("All sensor data is logged with millisecond timestamps"),
      bullet("If the smartphone app is used: the microphone can be activated (with driver pre-consent) to record ambient audio"),
      bullet("Every data point is immediately hashed (explained below) and stored"),

      h2("5.2 Cryptographic hashing — what it means and how to do it:"),
      para("A hash is a digital fingerprint. You take any piece of data — a GPS coordinate, a timestamp, an audio file — and run it through a mathematical function that produces a unique string of characters. If even one digit of the original data is changed, the hash is completely different."),

      boldPara("Example:"),
      para("Data: 'Vehicle TRG-001 at -26.1544, 28.2326 at 2026-03-15 14:32:05.003'"),
      para("SHA-256 Hash: a7f3b8c91d...e4f2 (64 characters)"),
      para("If someone changes the time to 14:32:06, the hash becomes completely different: 9c2e1a...b7d4"),
      para("This means: if the hash matches, the data has NOT been tampered with. If the hash doesn't match, the data HAS been changed."),

      boldPara("How to implement:"),
      bullet("Use SHA-256 hashing — built into every programming language (Node.js: crypto.createHash('sha256'))"),
      bullet("Hash each data point as it's captured"),
      bullet("Store the data and its hash in your database"),
      bullet("Also store a copy of the hash on a separate server (so even if your main database is compromised, the integrity can be verified)"),
      bullet("This is standard cryptographic practice — simple to implement, powerful in court"),

      h2("5.3 Evidence package output:"),
      para("After an incident, the system generates a PDF/document containing:"),
      bullet("Complete timeline with timestamps and GPS coordinates"),
      bullet("Map showing the vehicle's exact route during the incident"),
      bullet("All alerts that were triggered and when"),
      bullet("Hash verification summary (proving data integrity)"),
      bullet("Sensor data log (speed, stops, connectivity, etc.)"),
      para("This document can be submitted to insurers or SAPS as supporting evidence."),

      divider(),

      // ============================================================
      // SECTION 6: PREDICTIVE INTELLIGENCE
      // ============================================================
      heading("6. The Predictive Intelligence System"),
      para("This builds over time and becomes more valuable the longer the system runs."),

      h2("6.1 Crime data collection and processing:"),
      numberedPara("1", "Download SAPS crime statistics (annual, per police station) — free from saps.gov.za"),
      numberedPara("2", "Geocode each police station (convert station name to GPS coordinates) — use Google Geocoding API or manual lookup"),
      numberedPara("3", "Map hijacking and vehicle theft counts to coordinates"),
      numberedPara("4", "Build a risk grid — divide Gauteng (and route corridors) into 1km × 1km grid squares, assign risk scores based on nearby crime data"),
      numberedPara("5", "Add time-of-day weighting — SAPS data includes time categories for some crime types"),
      numberedPara("6", "Update quarterly when new SAPS data is published"),

      h2("6.2 Route risk scoring:"),
      para("When a delivery route is planned:"),
      numberedPara("1", "Plot the route on the risk grid"),
      numberedPara("2", "Calculate which risk squares the route passes through"),
      numberedPara("3", "Weight by time of day (planned departure and estimated arrival)"),
      numberedPara("4", "Sum the risk scores along the route = total route risk score"),
      numberedPara("5", "If risk exceeds a threshold, suggest an alternative route"),

      para("Technology: OSRM (Open Source Routing Machine — free) for route calculation + your risk grid database."),

      divider(),

      // ============================================================
      // SECTION 7: INFRASTRUCTURE
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("7. Infrastructure — What Servers and Services You Need"),
      para("Here's every piece of infrastructure required and what it costs:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Service", true, BLUE), cell("What It Does", true, BLUE), cell("Provider", true, BLUE), cell("Monthly Cost", true, BLUE)] }),
          new TableRow({ children: [cell("Cloud Server (Application)"), cell("Runs your API, AI models, alert system"), cell("AWS EC2 / DigitalOcean / Hetzner SA"), cell("R500–R2,000")] }),
          new TableRow({ children: [cell("Database"), cell("Stores vehicle data, driver profiles, alerts, evidence"), cell("PostgreSQL on same server or managed (AWS RDS)"), cell("R0–R800")] }),
          new TableRow({ children: [cell("Real-time messaging"), cell("WebSocket server for live dashboard updates"), cell("Built into your app server / or Redis Pub/Sub"), cell("R0–R200")] }),
          new TableRow({ children: [cell("SMS/WhatsApp alerts"), cell("Sends SMS and WhatsApp messages"), cell("Africa's Talking / Twilio"), cell("R50–R500 (usage based)")] }),
          new TableRow({ children: [cell("Push notifications"), cell("Sends mobile push notifications"), cell("Firebase Cloud Messaging (Google)"), cell("R0 (free)")] }),
          new TableRow({ children: [cell("Maps/Routing"), cell("Route calculation, geocoding"), cell("OSRM (free) or Google Maps Platform"), cell("R0–R500")] }),
          new TableRow({ children: [cell("Domain + SSL"), cell("HTTPS for dashboard and API"), cell("Cloudflare (free) + any domain registrar"), cell("R100–R200/year")] }),
          new TableRow({ children: [cell("OBD SIM cards (if used)"), cell("Cellular data for OBD-II devices"), cell("Vodacom IoT / MTN IoT"), cell("R30–R80 per device")] }),
        ],
      }),

      boldPara("Total monthly infrastructure cost for pilot (10–20 vehicles): R1,000–R4,000"),
      para("This is the total cost to run the entire system. The expensive part is your time building it, not the infrastructure."),

      importantNote("For the pilot, I'd recommend Hetzner Cloud South Africa — their data centre is in Johannesburg, which means low latency for SA vehicles. A CX21 server (2 vCPU, 4GB RAM) costs approximately R250/month and can handle 20 vehicles easily."),

      divider(),

      // ============================================================
      // SECTION 8: BUILD ROADMAP
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("8. The Build Roadmap — What to Build and When"),
      para("Here is the exact order to build everything, week by week:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Week", true, BLUE), cell("What You Build", true, BLUE), cell("Deliverable", true, BLUE)] }),
          new TableRow({ children: [cell("Week 1–2"), cell("Data ingestion layer: Connect to tracking API or build smartphone app MVP. Set up cloud server and database."), cell("You can receive live GPS data from at least 1 vehicle and store it")] }),
          new TableRow({ children: [cell("Week 3–4"), cell("Route deviation detector: Build geofencing and route corridor logic. Load SAPS crime data and build risk grid."), cell("System can detect when a vehicle deviates from expected route and flag high-risk areas")] }),
          new TableRow({ children: [cell("Week 5–6"), cell("Driver behaviour baseline: Implement Isolation Forest model. Let it train on 2 weeks of collected data."), cell("System starts recognising 'normal' patterns per driver")] }),
          new TableRow({ children: [cell("Week 7–8"), cell("Threat scoring engine: Build the weighted scoring system. Connect all signal inputs. Define alert thresholds."), cell("System produces a 0–100 threat score per vehicle in real time")] }),
          new TableRow({ children: [cell("Week 9–10"), cell("Alert system: Build monitoring dashboard (React + maps). Implement push notifications, SMS, and WhatsApp alerts."), cell("Operations team can see live vehicle status and receive alerts")] }),
          new TableRow({ children: [cell("Week 11–12"), cell("Evidence system: Build hash-secured logging. Create evidence package generator. Build predictive route risk display."), cell("System generates tamper-proof evidence packages and pre-journey risk scores")] }),
          new TableRow({ children: [cell("Week 13–14"), cell("Testing and refinement: Test with real Tragar vehicles in silent mode. Tune model thresholds and alert weights."), cell("System runs silently on pilot vehicles, you review output")] }),
          new TableRow({ children: [cell("Week 15+"), cell("Go live: Activate live alerts for Tragar operations team. Begin weekly check-ins and accuracy review."), cell("Full system operational on 10–20 Tragar vehicles")] }),
        ],
      }),

      importantNote("Total build time: approximately 12–14 weeks from start to go-live. This assumes you're working on this alongside other projects. If you work on it full-time, you could compress it to 8–10 weeks."),

      divider(),

      // ============================================================
      // SECTION 9: SKILLS AND PEOPLE
      // ============================================================
      heading("9. Skills and People — What You Can Do vs What You Need"),

      h2("What you can build yourself (based on your CuraLive experience):"),
      bullet("Cloud server setup and management (you already do this)"),
      bullet("API integration with tracking providers (REST API — same as any API you've integrated)"),
      bullet("Database design and management (PostgreSQL — same as CuraLive)"),
      bullet("Monitoring dashboard (React + TypeScript + maps — same tech stack as CuraLive)"),
      bullet("Alert system (push notifications, SMS, WhatsApp — API integrations)"),
      bullet("Threat scoring engine (weighted arithmetic — straightforward code)"),
      bullet("Evidence system (hashing + PDF generation — you've already done PDF generation)"),
      bullet("Crime data processing (data wrangling — can be done in TypeScript or Python)"),

      h2("Where you might need help:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Area", true, BLUE), cell("Why", true, BLUE), cell("Options", true, BLUE), cell("Cost", true, BLUE)] }),
          new TableRow({ children: [cell("ML model training (Isolation Forest / LSTM)"), cell("Requires Python + scikit-learn/TensorFlow experience"), cell("Learn it (2–4 weeks), or hire a freelance ML engineer"), cell("R0 if self-taught / R5,000–R15,000 freelance")] }),
          new TableRow({ children: [cell("Mobile app (if needed)"), cell("React Native requires specific mobile dev knowledge"), cell("Learn it (3–4 weeks), or hire a React Native developer"), cell("R0 if self-taught / R15,000–R40,000 freelance")] }),
          new TableRow({ children: [cell("OBD device gateway"), cell("Parsing raw TCP/UDP telemetry data is niche"), cell("Use open-source gateways (Traccar — free) or device vendor libraries"), cell("R0 (Traccar is free and well documented)")] }),
        ],
      }),

      importantNote("Traccar (traccar.org) is a free, open-source GPS tracking server that already supports hundreds of OBD/GPS device protocols. Instead of building your own device gateway, you can run Traccar and connect your AI layer to its database. This saves weeks of development."),

      divider(),

      // ============================================================
      // SECTION 10: COMPLETE COST BREAKDOWN
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("10. Complete Cost Breakdown"),

      h2("One-Time Setup Costs:"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Item", true, BLUE), cell("Cost", true, BLUE), cell("Notes", true, BLUE)] }),
          new TableRow({ children: [cell("OBD-II devices (3–5 units)"), cell("R4,000–R9,000"), cell("Only if using Option C — not required for API/app approach")] }),
          new TableRow({ children: [cell("BLE beacons (10–20 units)"), cell("R1,500–R8,000"), cell("Only if using smartphone app with proximity detection")] }),
          new TableRow({ children: [cell("Domain registration"), cell("R100–R200"), cell("Annual cost for antihijack.co.za or similar")] }),
          new TableRow({ children: [cell("WhatsApp Business API setup"), cell("R0–R500"), cell("Depends on provider — some charge setup fees")] }),
          new TableRow({ children: [cell("Freelance ML engineer (optional)"), cell("R5,000–R15,000"), cell("Only if you don't want to build the ML models yourself")] }),
        ],
      }),
      boldPara("Total one-time setup: R5,600–R32,700 (depending on options chosen)"),
      para("Minimum viable approach (API only, no OBD, no freelancer): R100–R700"),

      h2("Monthly Running Costs:"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Item", true, BLUE), cell("Monthly Cost", true, BLUE)] }),
          new TableRow({ children: [cell("Cloud server (Hetzner CX21)"), cell("R250–R500")] }),
          new TableRow({ children: [cell("Database (PostgreSQL on same server)"), cell("R0 (included)")] }),
          new TableRow({ children: [cell("SMS alerts (Africa's Talking)"), cell("R50–R200")] }),
          new TableRow({ children: [cell("WhatsApp alerts"), cell("R50–R200")] }),
          new TableRow({ children: [cell("OBD SIM cards (if used, 3–5 devices)"), cell("R90–R400")] }),
          new TableRow({ children: [cell("Maps API (if using Google)"), cell("R0–R500")] }),
          new TableRow({ children: [cell("Push notifications (Firebase)"), cell("R0 (free)")] }),
        ],
      }),
      boldPara("Total monthly running cost: R440–R1,800"),
      para("Minimum viable approach (API + free maps + minimal alerts): R300–R500/month"),

      importantNote("The entire pilot can run for under R1,000/month in infrastructure costs. Your biggest investment is your time building it."),

      divider(),

      // ============================================================
      // SECTION 11: EXPLAINING IT TO LEIGH
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),
      heading("11. How to Explain This to Leigh"),
      para("When you sit down with Leigh, keep it simple. Here's a suggested conversation flow:"),

      h2("The 2-Minute Pitch:"),
      para("'Leigh, I've been developing an AI security system for logistics vehicles. It's different from normal tracking — instead of just showing you where your trucks are, it THINKS. It learns what normal looks like for each driver, and when something unusual happens — a route deviation, a phone going offline, a stop in a dangerous area — it detects it automatically and alerts your control room. No panic button needed, no driver action required.'"),

      para("'I've filed a provisional patent with CIPC for the technology. Before I take this to market, I want to test it on real vehicles — and I want to do that with Tragar. I'm offering a free 90-day pilot on 10–20 of your vehicles. Zero cost to you. All I need is access to your tracking data and feedback from your ops team.'"),

      h2("When he asks 'How does it actually work?':"),
      para("'Your tracking company already sends GPS data from your vehicles. I tap into that same data feed — nothing changes for your drivers or your current system. My AI analyses the data in real time and builds a picture of what normal looks like. When it sees something abnormal, it scores the threat from 0 to 100. Low scores are ignored. High scores trigger alerts to whoever you designate — your ops manager, yourself, a control room number.'"),

      h2("When he asks 'What do we need to do?':"),
      para("'Almost nothing. Tell me who your tracking provider is, and I'll handle the technical connection. Pick 10–20 vehicles for the pilot. Give me a contact for your ops team who can receive alerts. That's it. The first month is silent — the AI just learns. After that, alerts start flowing. At the end of 90 days, we review the results together and decide if it's worth continuing.'"),

      h2("When he asks 'What's the catch?':"),
      para("'There isn't one. I need real-world proof that this works before I can take it to insurers and tracking companies. You're helping me build that proof. In exchange, Tragar gets the technology for free during the pilot and at the best price permanently after that. If it doesn't work, we shake hands and move on — you've lost nothing.'"),

      h2("When he asks 'What if our drivers don't like it?':"),
      para("'Your drivers won't even know it's there. We're not installing anything on their vehicles or asking them to use an app. We're analysing data your tracking system already collects. The alerts go to your ops team, not to drivers. It's completely invisible to them.'"),

      divider(),

      // ============================================================
      // CLOSING
      // ============================================================
      heading("Final Summary — Your Action Items"),

      numberedPara("1", "Talk to Leigh — get a yes to the pilot concept"),
      numberedPara("2", "Find out Tragar's tracking provider — ask Leigh who they use and whether they have a portal/login"),
      numberedPara("3", "Contact the tracking provider — ask about API access for live vehicle data"),
      numberedPara("4", "Set up your cloud server — Hetzner Cloud SA, CX21, install PostgreSQL and Node.js"),
      numberedPara("5", "Build the data ingestion layer — connect to the tracking API and start storing data"),
      numberedPara("6", "Build the route deviation detector — geofencing, crime hotspot data, corridor analysis"),
      numberedPara("7", "Let the AI learn — 2–4 weeks of data collection before anomaly detection activates"),
      numberedPara("8", "Build the dashboard — React app with maps showing vehicles, alerts, and risk scores"),
      numberedPara("9", "Build the alert system — push notifications, SMS, WhatsApp for high-threat events"),
      numberedPara("10", "Run silent for 2 weeks — review output, tune thresholds, fix false positives"),
      numberedPara("11", "Go live — activate alerts to Tragar's ops team"),
      numberedPara("12", "Review results — at 90 days, compile report, present to Leigh, decide next steps"),

      para("Total investment: approximately R5,000–R30,000 in hardware/services + 12–14 weeks of your development time."),
      para("If the pilot succeeds: you have a proven product, a case study, and a launching pad for the insurance and tracking company conversations that could make this technology worth hundreds of millions."),

      divider(),

      new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "AI AntiHijack — Complete Implementation Guide", bold: true, font: "Calibri", size: 22, color: BLUE }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "David Cameron — Confidential — March 2026", font: "Calibri", size: 20, color: GREY, italics: true }),
      ]}),
    ],
  }],
});

async function generate() {
  const buffer = await Packer.toBuffer(doc);
  const path = "docs/AI_AntiHijack_Implementation_Guide.docx";
  fs.writeFileSync(path, buffer);
  const stats = fs.statSync(path);
  console.log(`DOCX saved: ${path}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB`);
}

generate().catch(console.error);
