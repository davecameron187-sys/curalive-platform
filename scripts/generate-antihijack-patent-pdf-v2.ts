// @ts-nocheck
import PDFDocument from "pdfkit";
import fs from "fs";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 60, bottom: 60, left: 65, right: 65 },
  bufferPages: true,
  info: {
    Title: "AI AntiHijack — Provisional Patent Specification — CIPC Submission",
    Author: "David Cameron",
  },
});

const outputPath = "docs/AI_AntiHijack_Patent_CIPC_Submission.pdf";
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const W = doc.page.width - 130;

function addFooter() {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(7).font("Helvetica").fillColor("#888888");
    doc.text(
      "AI AntiHijack — Confidential | Provisional Patent Specification | CIPC Submission | 2026/03/12",
      65, doc.page.height - 40, { width: W, align: "center" }
    );
    doc.text(`Page ${i + 1}`, 65, doc.page.height - 40, { width: W, align: "right" });
  }
}

function heading(text: string, size = 16) {
  doc.moveDown(0.5);
  doc.fontSize(size).font("Helvetica-Bold").fillColor("#1a1a2e").text(text);
  doc.moveDown(0.3);
}

function subheading(text: string) {
  doc.moveDown(0.4);
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#2d3436").text(text);
  doc.moveDown(0.2);
}

function para(text: string) {
  doc.fontSize(10).font("Helvetica").fillColor("#333333").text(text, { width: W, lineGap: 3, paragraphGap: 4 });
}

function bold(text: string) {
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#333333").text(text, { width: W });
}

function bullet(text: string) {
  doc.fontSize(10).font("Helvetica").fillColor("#333333").text(`    •  ${text}`, { width: W - 20, lineGap: 2 });
}

function labeledField(label: string, value: string) {
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor("#333333").text(label, { underline: true });
  doc.moveDown(0.3);
  para(value);
}

function definition(term: string, desc: string) {
  doc.moveDown(0.2);
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a2e").text(term);
  doc.fontSize(10).font("Helvetica").fillColor("#333333").text(desc, { width: W, lineGap: 2 });
}

function drawLine() {
  doc.moveDown(0.3);
  doc.moveTo(65, doc.y).lineTo(65 + W, doc.y).lineWidth(0.5).strokeColor("#cccccc").stroke();
  doc.moveDown(0.3);
}

function checkPage(needed = 100) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - needed) {
    doc.addPage();
  }
}

function diagramBox(lines: string[]) {
  checkPage(lines.length * 12 + 20);
  doc.moveDown(0.3);
  doc.fontSize(8).font("Courier").fillColor("#2d3436");
  lines.forEach(line => {
    doc.text(line, 85, doc.y, { width: W - 40 });
  });
  doc.moveDown(0.5);
}

function sysTableRow(module: string, purpose: string) {
  checkPage(40);
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#1a1a2e").text(module, 85, doc.y, { width: 180, continued: false });
  doc.moveUp();
  doc.fontSize(9).font("Helvetica").fillColor("#333333").text(purpose, 270, doc.y, { width: W - 220 });
  doc.moveDown(0.3);
}


// ============================================================
// COVER / TITLE PAGE — MATCHING CURALIVE FORMAT EXACTLY
// ============================================================

doc.moveDown(3);
doc.fontSize(14).font("Helvetica-Bold").fillColor("#888888").text("PROVISIONAL PATENT SPECIFICATION", { align: "center" });
doc.moveDown(1.5);
doc.fontSize(28).font("Helvetica-Bold").fillColor("#1a1a2e").text("AI AntiHijack", { align: "center" });
doc.moveDown(0.3);
doc.fontSize(13).font("Helvetica").fillColor("#555555").text("CIPC Submission", { align: "center" });
doc.moveDown(4);

drawLine();
doc.moveDown(1);

// Title block — same layout as CuraLive
labeledField("Title of the Invention",
  "System and Method for Artificial Intelligence-Based Anti-Hijack Detection, Journey Integrity Monitoring, Secure Vehicle Authorization, Protected Immobilization, Authenticated Reactivation, Multi-Device Correlation, Adaptive Emergency Communication, Predictive Threat Intelligence, Anti-Jamming Communication Resilience, and Tamper-Resilient Evidence Preservation");

doc.moveDown(1);

labeledField("Applicant",
  "David Cameron\n41 Rooigras Avenue\n73 Tiffani Gardens\nBassonia\n2090\nJohannesburg\n+27 84 444 6001\nRepublic of South Africa");

doc.addPage();

// ============================================================
// ABSTRACT
// ============================================================

heading("Abstract");
para("A system and method for protecting a vehicle and its occupant by learning driver-specific behaviour, monitoring planned, shared, selected, or inferred journeys, correlating signals from an in-vehicle device, a handset, and optionally a wearable device, and detecting anomalous conditions indicative of hijacking, coercion, theft, tampering, signal jamming, or unauthorized startup. The system may determine an authorization state based on one or more trusted credentials and tamper-related signals, place the vehicle in a protected immobilized state when authorization is absent, invalid, or compromised, and permit authenticated reactivation only after verified satisfaction of one or more reactivation conditions. An adaptive communication orchestration engine dynamically selects, ranks, or combines multiple communication pathways including cellular, Bluetooth, Wi-Fi, mesh, sub-GHz, store-and-forward, or delayed-burst channels to maintain emergency capability under degraded or jammed communication conditions. A predictive threat intelligence module analyses historical incident data, hotspot patterns, and behavioural baselines to generate proactive route-risk assessments and pre-journey safety recommendations. A tamper-resilient evidence preservation module cryptographically secures forensic data for post-incident investigation, insurance claim support, and legal proceedings.");

drawLine();

// ============================================================
// FIELD OF THE INVENTION
// ============================================================

heading("Field of the Invention");
para("The present invention relates to vehicle security systems, journey monitoring systems, intelligent authorization systems, and emergency communication platforms.");
doc.moveDown(0.3);
para("More specifically, the invention relates to artificial intelligence systems capable of learning driver behaviour, monitoring journey integrity, correlating signals from a vehicle, a mobile handset, and optionally a wearable device, detecting unauthorized startup, signal jamming, or tampering conditions, and initiating adaptive anti-hijack and emergency response actions.");
doc.moveDown(0.3);
para("The invention further relates to secure authorization and immobilization methods in which valid operation of a vehicle is conditioned upon the existence of a verified authorization state and the absence of tamper-related anomalies.");
doc.moveDown(0.3);
para("The invention further relates to predictive threat intelligence methods wherein historical crime data, geographic risk profiles, and driver behavioural baselines are correlated to generate proactive safety assessments and dynamic route recommendations.");
doc.moveDown(0.3);
para("The invention further relates to anti-jamming communication resilience methods wherein signal interference is detected or inferred, local decision capability is preserved, and transmissions are routed through fallback pathways including store-and-forward or delayed-burst channels.");

drawLine();

// ============================================================
// DEFINITIONS
// ============================================================

heading("Definitions");

const definitions: [string, string][] = [
  ["Vehicle Device", "An in-vehicle electronic device installed in or associated with a vehicle and configured to collect, process, transmit, or store vehicle-related data."],
  ["Driver Behaviour Profile", "A data-driven representation of normal or expected behaviour of a specific driver, including route choices, timing patterns, speed tendencies, stop tendencies, acceleration tendencies, or any combination thereof."],
  ["Journey Integrity", "The degree to which live vehicle movement corresponds with an intended, selected, shared, or inferred journey."],
  ["Threat Score", "A computed risk value derived from one or more contextual signals and used to classify the likelihood or severity of distress, hijack, tamper, theft, coercion, unauthorized activity, or signal interference."],
  ["Communication Pathway", "Any channel, interface, network, or relay mechanism by which the platform may transmit or receive data, including cellular, Bluetooth, Wi-Fi, mesh, sub-GHz, or equivalent pathways."],
  ["Communication Orchestration Engine", "A computational module configured to evaluate available communication pathways and select, rank, combine, or sequence pathways for one or more transmissions."],
  ["Trusted Device", "A mobile phone, wearable, vehicle component, key credential, tag, or other authorised device recognised by the platform as being associated with an authorised user."],
  ["Wearable Device", "A smartwatch, smart band, biometric wearable, or other body-associated electronic device capable of providing one or more signals relating to presence, pairing, body contact, motion, biometrics, user input, or location."],
  ["Correlation Engine", "A module configured to combine signals from two or more sources, including vehicle, phone, wearable, cloud, key, or route context, in order to classify a condition or determine a response."],
  ["Covert Emergency Mode", "An operating state in which one or more security actions are activated without requiring visible driver interaction."],
  ["Driver-Vehicle Separation Event", "A detected condition in which the vehicle and a trusted device associated with the driver diverge geographically or behaviourally beyond an expected threshold."],
  ["High-Risk Zone", "A geographic or contextual condition associated with increased vulnerability to vehicle crime, hijacking, isolation risk, or other security threats."],
  ["Authorization State", "A machine-determined state indicating whether one or more valid authorization conditions exist for vehicle startup, operability, reactivation, or continued use."],
  ["Trusted Credential", "A key transponder, OEM immobilizer credential, secure token, paired handset, paired wearable, cryptographic secret, server-issued authorization code, biometric confirmation, or other credential recognised as satisfying at least part of an authorization condition."],
  ["Protected Immobilized State", "A recoverable secured state in which startup or selected vehicle functions are inhibited, while preserving tamper records, alert functionality, or reactivation controls."],
  ["Authenticated Reactivation", "A controlled process by which a protected immobilized state is removed after verified presentation of one or more trusted credentials, tokens, confirmations, or service authorizations."],
  ["Startup Sequence Anomaly", "An irregular ignition, ECU, CAN bus, credential, or related sequence indicative of bypass, tampering, unauthorized activation, or abnormal startup behaviour."],
  ["Tamper Event", "Any detected physical, electrical, logical, software, firmware, or communication-layer interference with the vehicle, the vehicle device, the ECU, wiring, sensors, or associated components."],
  ["Secure Authorization Layer", "A hardware, software, or hybrid subsystem configured to determine the authorization state and control startup, lockout, or reactivation behaviour."],
  ["Predictive Threat Intelligence", "Analytical insights generated from historical incident data, geographic crime patterns, temporal risk profiles, and driver behavioural baselines, used to forecast elevated risk conditions before they materialise."],
  ["Signal Interference Event", "A condition in which one or more communication or location channels are degraded, denied, jammed, spoofed, or rendered unreliable beyond normal environmental variation."],
  ["Anti-Jamming Communication Resilience Layer", "A subsystem configured to detect or infer signal interference, preserve local decision capability, switch among primary and fallback communication paths, perform store-and-forward or delayed-burst transmission, and preserve forensic records during degraded connectivity."],
  ["Geofenced Behavioural Anomaly", "An anomalous driver or vehicle behaviour that is classified differently depending on the geographic context in which it occurs, enabling location-aware threat sensitivity adjustment."],
  ["Tamper-Resilient Evidence Record", "A cryptographically secured, timestamped record of forensic data including location breadcrumbs, audio captures, tamper logs, and communication attempts, preserved for post-incident investigation, insurance claims, or legal proceedings."],
  ["Occupant Duress Indicator", "A physiological, behavioural, or environmental signal from one or more sensors — including heart rate elevation, skin conductance change, voice stress pattern, or abnormal inactivity — that may indicate the vehicle occupant is under coercion or distress."],
  ["Cargo Integrity Module", "A subsystem configured to monitor cargo-related sensors including door-open events, weight changes, temperature deviations, or seal-break detections and to correlate cargo anomalies with vehicle security events."],
  ["Multi-Vehicle Coordinated Response", "A fleet or community capability wherein multiple vehicles on the same network coordinate response actions during a security event, including relay communication, witness data capture, or convoy integrity monitoring."],
];

definitions.forEach(([term, desc]) => {
  checkPage(60);
  definition(term, desc);
});

drawLine();

// ============================================================
// BACKGROUND OF THE INVENTION
// ============================================================

doc.addPage();
heading("Background of the Invention");

para("Vehicle hijacking, coercive vehicle diversion, vehicle theft, signal interference, and unauthorized startup remain significant safety and asset-protection risks in many regions. South Africa alone records over 16,000 vehicle hijackings annually, with logistics vehicles and commercial fleets facing disproportionate risk due to cargo value and predictable route patterns.");
doc.moveDown(0.3);
para("Conventional vehicle tracking systems typically rely on GPS and cellular communication, often require manual panic-button activation, and frequently become less effective when a driver cannot safely interact with a device or when a communication jammer is present. Signal jamming devices are increasingly accessible and are commonly deployed during hijacking incidents to defeat standard cellular-based tracking.");
doc.moveDown(0.3);
para("Known immobilizer and key-based systems generally verify only a limited startup credential and may not correlate route context, vehicle telemetry, trusted-device presence, or startup-sequence anomalies to determine whether a broader threat condition exists.");
doc.moveDown(0.3);
para("Known family-tracking applications may provide route visibility but do not generally learn each driver over time, correlate signals from vehicle, handset, and wearable devices, classify route deviations under threat conditions, or control a protected immobilization and authenticated reactivation workflow.");
doc.moveDown(0.3);
para("Existing vehicle security systems do not generate predictive threat intelligence based on historical crime data correlated with driver-specific behavioural patterns, geographic risk profiles, and temporal risk windows. There is no known prior art describing a system that proactively adjusts detection sensitivity and route recommendations based on predictive risk assessments generated from aggregated incident intelligence.");
doc.moveDown(0.3);
para("Furthermore, existing systems do not provide tamper-resilient forensic evidence preservation with cryptographic integrity verification suitable for insurance claim substantiation and legal proceedings. There is no known prior art describing a vehicle security platform that autonomously generates court-admissible evidence packages from multi-source sensor data captured during a security incident.");
doc.moveDown(0.3);
para("Existing systems do not detect or respond to signal jamming as a security indicator. There is no known prior art describing a vehicle security system that treats simultaneous degradation of multiple communication channels as a threat signal, maintains local AI decision capability during communication denial, and autonomously routes alerts through fallback pathways including store-and-forward or delayed-burst transmission.");
doc.moveDown(0.3);
para("There is accordingly a need for a more capable anti-hijack platform that may learn behaviour over time, monitor journey integrity, detect unauthorized startup or tampering conditions, correlate multi-device signals, survive degraded communications, execute controlled responses including protected immobilization and authenticated reactivation, generate predictive threat intelligence, preserve tamper-resilient forensic evidence, and coordinate fleet-level security responses.");

drawLine();

// ============================================================
// SUMMARY OF THE INVENTION
// ============================================================

heading("Summary of the Invention");
para("The present invention provides a vehicle security platform comprising:");
doc.moveDown(0.2);

const summaryBullets = [
  "an in-vehicle electronic device, an artificial intelligence processor, a journey-monitoring module, and a communication module configured for one or more communication pathways;",
  "driver-specific behavioural learning and journey integrity monitoring for planned, shared, selected, or inferred journeys;",
  "multi-device correlation across vehicle, handset, wearable, key, route context, and optional cloud inputs;",
  "a secure authorization layer configured to determine an authorization state and to place the vehicle in a protected immobilized state when authorization is absent, invalid, or compromised;",
  "authenticated reactivation only after verified satisfaction of one or more reactivation conditions;",
  "predictive threat intelligence using historical incident data, temporal risk windows, and route-risk forecasting;",
  "an anti-jamming communication resilience layer configured to detect signal interference, preserve local decision support, and switch among primary and fallback pathways including store-and-forward or delayed-burst transmission;",
  "a tamper-resilient evidence preservation module configured to cryptographically secure forensic data and generate incident packages;",
  "a geofenced behavioural anomaly engine that autonomously adjusts detection sensitivity based on real-time geographic risk context;",
  "an occupant duress detection capability using physiological and behavioural indicators from wearable or in-vehicle sensors;",
  "a cargo integrity monitoring module configured to correlate cargo anomalies with vehicle security events;",
  "a self-improving intelligence pipeline wherein detection models autonomously improve through accumulated journey data, verified incidents, and operator corrections;",
  "a multi-vehicle coordinated response capability for fleet and community deployments.",
];

summaryBullets.forEach(b => { bullet(b); });

drawLine();

// ============================================================
// SYSTEM OVERVIEW
// ============================================================

heading("System Overview");
para("The anti-hijack platform may include the following modules and components:");
doc.moveDown(0.3);

const sysModules: [string, string][] = [
  ["In-vehicle AI device", "Local capture, processing, tamper sensing, and decision support"],
  ["Driver and trusted-contact applications", "Journey setup, trip sharing, event review, escalation visibility"],
  ["Communication orchestration engine", "Adaptive multi-path emergency communication and failover"],
  ["Secure authorization layer", "Startup validation, protected lockout, authenticated reactivation"],
  ["Predictive threat intelligence module", "Pre-journey risk scoring, route recommendations, dynamic sensitivity"],
  ["Anti-jamming communication resilience layer", "Interference detection, path failover, delayed transmission, evidence preservation"],
  ["Evidence preservation module", "Cryptographic evidence capture, sync, reconstruction, claim support"],
  ["Geofenced anomaly engine", "Location-aware detection threshold adjustment"],
  ["Occupant duress detection module", "Physiological and behavioural distress indicators from wearable/in-vehicle sensors"],
  ["Cargo integrity module", "Door, weight, temperature, and seal monitoring correlated with security events"],
  ["Self-improving model pipeline", "Autonomous detection accuracy improvement from accumulated data"],
  ["Multi-vehicle coordination engine", "Fleet-level coordinated response, relay communication, convoy integrity"],
  ["Response policy engine", "Stage-based action selection and escalation"],
  ["Voice/audio interface", "Route-risk prompts, covert distress phrase recognition"],
];

sysModules.forEach(([mod, purpose]) => {
  checkPage(30);
  sysTableRow(mod, purpose);
});

para("The system may operate using artificial intelligence models, statistical models, rule-based agents, hybrid decision systems, or equivalent analytical mechanisms capable of analysing vehicle, driver, and environmental signals.");

drawLine();

// ============================================================
// BRIEF DESCRIPTION OF DRAWINGS
// ============================================================

doc.addPage();
heading("Brief Description of the Drawings");

const figures = [
  "Figure 1 illustrates an example overall platform architecture.",
  "Figure 2 illustrates an example communication architecture with multiple fallback channels.",
  "Figure 3 illustrates an example artificial intelligence detection pipeline.",
  "Figure 4 illustrates an example learning feedback loop for driver behavioural modelling.",
  "Figure 5 illustrates an example in-vehicle device hardware architecture.",
  "Figure 6 illustrates an example wearable, phone, and vehicle correlation engine.",
  "Figure 7 illustrates an example voice-trigger emergency workflow.",
  "Figure 8 illustrates an example journey-monitoring and risk-reclassification workflow.",
  "Figure 9 illustrates an example response policy engine with staged escalation.",
  "Figure 10 illustrates an example anomaly scenario involving route deviation and trusted-device changes.",
  "Figure 11 illustrates an example startup authorization, protected lockout, and authenticated reactivation flow.",
  "Figure 12 illustrates an example predictive threat intelligence pipeline.",
  "Figure 13 illustrates an example tamper-resilient evidence preservation and forensic reconstruction workflow.",
  "Figure 14 illustrates an example anti-jamming communication resilience workflow.",
  "Figure 15 illustrates an example self-improving detection model pipeline.",
  "Figure 16 illustrates an example occupant duress detection and correlation workflow.",
  "Figure 17 illustrates an example multi-vehicle coordinated response architecture.",
];

figures.forEach(f => { para(f); doc.moveDown(0.15); });

drawLine();

// ============================================================
// DETAILED DESCRIPTION OF THE INVENTION
// ============================================================

heading("Detailed Description of the Invention");

// 1
subheading("1. In-Vehicle AI Device (refer FIG 1 and FIG 5)");
para("The system includes a concealed or otherwise installed in-vehicle electronic device configured to capture location, motion, telemetry, and communication-related data. The device may be OEM integrated, ECU associated, or implemented as a hardened secondary module. The device may include one or more processors, secure storage, one or more radios, one or more sensors, optional backup power, and one or more interfaces to vehicle systems including CAN, OBD, or equivalent interfaces.");

// 2
checkPage(80);
subheading("2. Driver Behaviour Learning (refer FIG 3 and FIG 4)");
para("The artificial intelligence processor records historical journey data and constructs driver-specific behavioural profiles. Learning may include route preferences, departure timing, arrival timing, stop tendencies, braking style, acceleration style, typical trip durations, and normal contexts of use. Profiles may be maintained separately for multiple authorised drivers.");

// 3
checkPage(80);
subheading("3. Journey Monitoring and Live Route Following (refer FIG 1, FIG 3 and FIG 8)");
para("A driver may define an intended journey in a mobile application, including home, school, work, or a custom route, or the system may infer an expected route from prior behaviour. The platform may share journey progress with one or more trusted contacts. Real-time movement may be compared with the expected route or destination progress in order to classify a journey state.");

// 4
checkPage(80);
subheading("4. Route Deviation and Irregular Movement Detection (refer FIG 3, FIG 8 and FIG 10)");
para("The platform analyses route deviations, abnormal detours, prolonged stationary periods, repeated circling, movement into isolated or high-risk areas, unusual speed changes, or inconsistent arrival behaviour. Deviations may be classified as benign, irregular, suspicious, or high-risk according to context such as traffic, route-risk data, and behavioural history.");

// 5
checkPage(80);
subheading("5. Wearable and Handset Correlation Layer (refer FIG 6 and FIG 10)");
para("In some embodiments the platform integrates signals from a mobile handset and one or more wearable devices associated with a driver. Wearable-device signals may include location, motion, body-contact state, pairing state, biometric information, user gesture, button input, or voice input. The correlation engine may determine that a condition is more likely serious when route deviation is combined with handset loss, wearable removal, separation, or a biometrically unusual state.");

// 6
checkPage(80);
subheading("6. Threat Detection and Scoring (refer FIG 3, FIG 6 and FIG 10)");
para("The platform computes a threat score based on weighted combinations of signals. Example contributing signals may include route deviation, behaviour deviation, communication interference, hotspot context, wearable removal, handset-offline state, driver-vehicle separation, distress phrase detection, tamper signals, startup-sequence anomalies, occupant duress indicators, or cargo integrity violations. The threat score may be used to select a response stage.");

// 7
checkPage(80);
subheading("7. Communication Orchestration (refer FIG 2)");
para("The communication orchestration engine evaluates available communication pathways and selects, sequences, or combines one or more pathways according to expected reliability, latency, stealth, power cost, and threat context. Pathways may include cellular communication, Bluetooth relay to nearby devices, Wi-Fi offload, mesh or sub-GHz transmission, store-and-forward delivery, or cloud-assisted routing.");

// 8
checkPage(80);
subheading("8. Voice Activated Emergency Mode (refer FIG 7)");
para('The system may include a voice-recognition component capable of detecting a predefined distress phrase such as "activate hijack mode" or another covert phrase. Upon detection the platform may silently increase monitoring, initiate covert emergency mode, or cause one or more communications or tracking actions to occur without visible driver interaction.');

// 9
checkPage(120);
subheading("9. Secure Authorization and Protected Immobilization Layer (refer FIG 11)");
para("The platform may determine an authorization state for startup, operability, or reactivation based on one or more trusted credentials and one or more anomaly or tamper indicators. Trusted credentials may include a key transponder, OEM immobilizer credential, secure handset token, wearable token, or cryptographic secret. Tamper indicators may include missing credential state, abnormal startup sequence, unauthorized ignition pattern, ECU or CAN anomalies, bypass attempts, or physical tamper signals.");
doc.moveDown(0.3);
para("When the authorization state is absent, invalid, or compromised, the platform may place the vehicle in a protected immobilized state. In the protected immobilized state the platform may inhibit startup, inhibit selected vehicle functions, maintain tamper logs, preserve alert capability, and initiate one or more notifications. The protected immobilized state is preferably recoverable rather than destructive.");
doc.moveDown(0.3);
para("The platform may permit authenticated reactivation only after verified satisfaction of one or more reactivation conditions. Such conditions may include return of a valid credential, owner confirmation, trusted-device confirmation, service-agent confirmation, server-side approval, one-time token validation, or a combination thereof. In preferred embodiments, reactivation events are logged and previously used reactivation tokens are invalidated after use.");

// 10
checkPage(80);
subheading("10. Response Policy Engine (refer FIG 9)");
para("The response policy engine may execute staged actions. A first stage may increase monitoring or logging. A second stage may request a discreet verification or confirmation event. A third stage may alert one or more trusted contacts. A fourth stage may trigger covert tracking, communication escalation, or responder notification. In authorization-related conditions, the selected stage may include startup inhibition, protected immobilization, or authenticated reactivation workflow management.");

// 11
checkPage(80);
subheading("11. Route Risk Intelligence (refer FIG 8)");
para("The platform may consume hotspot data, congestion data, route isolation indicators, historical incident patterns, or similar context in order to generate route-risk scores. Such scores may adjust recommendations, alert timing, or threat classification.");

// 12
checkPage(80);
subheading("12. Learning Feedback and Model Update (refer FIG 4 and FIG 15)");
para("Behavioural models may be updated over time using additional journey history, verified false positives, verified incidents, operator feedback, or trusted-contact confirmation. Updated behavioural models may improve classification accuracy and reduce false positives. The model improvement pipeline operates autonomously, retraining detection models after each journey or at scheduled intervals without requiring human-initiated training cycles.");

// 13
checkPage(200);
subheading("13. Predictive Threat Intelligence Module (refer FIG 12)");
para("The system includes a predictive threat intelligence module that generates proactive risk assessments before and during journeys. The predictive module operates as follows:");
doc.moveDown(0.3);
bold("Historical Incident Correlation");
para("The system aggregates anonymised historical vehicle crime data including hijacking incidents, theft hotspots, and carjacking patterns by geographic area, time of day, day of week, and seasonal trends. This data is correlated with the driver's planned or inferred route to generate a pre-journey risk assessment.");
doc.moveDown(0.3);
bold("Dynamic Risk Scoring");
para("During a journey, the predictive module continuously recalculates risk based on real-time signals including current geographic position relative to known hotspots, time-of-day risk factors, traffic density changes, and deviation from safe corridors. The dynamic risk score may trigger preemptive escalation of monitoring sensitivity before an incident is detected.");
doc.moveDown(0.3);
bold("Proactive Route Recommendations");
para("When the predictive module identifies an elevated risk corridor on a planned route, it may generate alternative route recommendations that maintain journey efficiency while reducing exposure to high-risk zones. Recommendations may be presented to the driver via the mobile application or voice interface.");
doc.moveDown(0.3);
bold("Temporal Risk Windows");
para("The module identifies recurring temporal patterns in crime data — for example, elevated hijacking risk during specific hours at specific intersections — and adjusts detection thresholds and alert readiness during those windows without requiring manual configuration.");
doc.moveDown(0.3);
bold("Fleet and Community Intelligence");
para("In fleet or community deployments, anonymised threat intelligence may be aggregated across multiple vehicles to generate real-time risk maps that benefit all participants, creating a network effect where each additional vehicle improves the collective intelligence available to all users.");

// 14
checkPage(200);
subheading("14. Anti-Jamming Communication Resilience Layer (refer FIG 14)");
para("The system includes an anti-jamming communication resilience layer that detects or infers signal interference and maintains emergency capability during degraded communications. The anti-jamming layer operates as follows:");
doc.moveDown(0.3);
bold("Interference Detection");
para("The system monitors communication quality, signal strength, signal-to-noise ratio, GNSS availability, radio health, and channel consistency across all available communication pathways. When simultaneous degradation of multiple channels is detected — particularly when correlated with continued vehicle motion — the system flags a signal interference event. The system distinguishes between ordinary signal loss (e.g., tunnel, rural area) and deliberate jamming by correlating radio degradation patterns with motion, route, and telemetry data.");
doc.moveDown(0.3);
bold("Local Decision Preservation");
para("During a signal interference event, the system preserves local AI decision capability on the in-vehicle device. Anomaly scoring, threat classification, and evidence capture continue without cloud connectivity. The in-vehicle processor maintains autonomous operation capability for the duration of the interference event.");
doc.moveDown(0.3);
bold("Fallback Path Selection");
para("When the primary communication pathway (typically cellular) is degraded, the system selects, sequences, or combines fallback pathways. Fallback options may include Bluetooth relay to nearby devices, Wi-Fi offload to available access points, mesh or sub-GHz radio transmission, or store-and-forward delivery wherein alerts are stored locally and transmitted when a usable communication window is detected.");
doc.moveDown(0.3);
bold("Dead Reckoning During GNSS Loss");
para("When GNSS (GPS) signals are jammed or spoofed, the system derives interim position and movement estimates from inertial sensors, vehicle-bus speed data, compass heading, and pre-incident trajectory extrapolation. Dead-reckoning data is included in the forensic evidence record.");
doc.moveDown(0.3);
bold("Delayed-Burst Alert Transmission");
para("When all real-time communication pathways are blocked, the system stores alerts, evidence, and status data locally. It continuously probes for available communication windows. When a temporary connectivity opportunity is detected — even briefly — the system performs a delayed-burst transmission, sending compressed critical data in the shortest possible time.");

// 15
checkPage(200);
subheading("15. Tamper-Resilient Evidence Preservation Module (refer FIG 13)");
para("The system includes a tamper-resilient evidence preservation module that autonomously captures, secures, and preserves forensic data during and after security incidents. The evidence module operates as follows:");
doc.moveDown(0.3);
bold("Cryptographic Evidence Integrity");
para("All forensic data captured during a security incident — including location breadcrumbs, audio recordings, tamper logs, communication attempts, and sensor readings — is cryptographically hashed and timestamped to establish chain-of-custody integrity. Evidence records cannot be modified after capture without invalidating the cryptographic hash.");
doc.moveDown(0.3);
bold("Multi-Source Evidence Correlation");
para("The module correlates evidence from multiple sources including vehicle telemetry, handset location history, wearable data, communication logs, and external data feeds to construct a comprehensive incident timeline.");
doc.moveDown(0.3);
bold("Automated Incident Reconstruction");
para("Following a security incident, the module autonomously generates a structured incident report comprising a chronological timeline of events, geographic track data, threat score progression, communication attempts, response actions taken, and tamper events detected.");
doc.moveDown(0.3);
bold("Insurance Claim Support");
para("Evidence packages generated by the module are structured to meet common insurance claim documentation requirements, including timestamped proof of vehicle location, proof of unauthorized access or tamper, proof of immobilization activation, and proof of communication attempts to emergency services.");
doc.moveDown(0.3);
bold("Secure Cloud Synchronisation");
para("Forensic evidence is synchronised to secure cloud storage when communication pathways are available, ensuring evidence survival even if the in-vehicle device is physically destroyed or removed. Evidence synchronisation uses end-to-end encryption and may utilise opportunistic connectivity windows.");

// 16
checkPage(120);
subheading("16. Geofenced Behavioural Anomaly Engine");
para("The system includes a geofenced behavioural anomaly engine that autonomously adjusts detection sensitivity and threat classification based on real-time geographic context.");
doc.moveDown(0.3);
bold("Location-Aware Sensitivity");
para("Detection thresholds for route deviation, speed anomalies, and stop duration are adjusted based on the current geographic risk profile. The same behaviour that is classified as benign in a low-risk area may be classified as suspicious or high-risk in a known crime hotspot.");
doc.moveDown(0.3);
bold("Dynamic Geofence Learning");
para("The system autonomously learns and updates geofence boundaries based on aggregated incident data, emerging crime patterns, and community intelligence feeds. Geofences are not limited to predefined static boundaries but evolve as risk landscapes change.");
doc.moveDown(0.3);
bold("Context-Aware False Positive Reduction");
para("By incorporating geographic context into anomaly classification, the engine reduces false positive rates in low-risk environments while maintaining heightened sensitivity in high-risk zones, resulting in a more accurate and less intrusive user experience.");

// 17 — NEW
checkPage(150);
subheading("17. Occupant Duress Detection Module (refer FIG 16)");
para("The system includes an occupant duress detection module that identifies physiological and behavioural indicators of coercion or distress without requiring the occupant to take any deliberate action.");
doc.moveDown(0.3);
bold("Physiological Distress Indicators");
para("When a wearable device is present, the system monitors heart rate, heart rate variability, skin conductance (galvanic skin response), and body temperature. Sudden physiological changes — particularly elevated heart rate combined with route deviation or unexpected stop — contribute to the threat score as an occupant duress indicator.");
doc.moveDown(0.3);
bold("Voice Stress Analysis");
para("The system may analyse voice patterns from in-vehicle microphones or phone calls to detect stress indicators including pitch elevation, speech rate changes, tremor, or atypical silence patterns. Voice stress analysis operates passively and does not require the driver to speak a specific phrase.");
doc.moveDown(0.3);
bold("Behavioural Inactivity Detection");
para("The system monitors expected driver interactions — such as phone movement, wearable motion, or steering input — and flags abnormal periods of inactivity that may indicate the driver is incapacitated, restrained, or no longer in control of the vehicle.");

// 18 — NEW
checkPage(150);
subheading("18. Cargo Integrity Monitoring Module");
para("For commercial and logistics deployments, the system includes a cargo integrity monitoring module that detects cargo-related anomalies and correlates them with vehicle security events.");
doc.moveDown(0.3);
bold("Cargo Sensor Integration");
para("The module integrates with cargo door sensors, weight sensors, temperature sensors, and electronic seal monitors. Cargo anomalies — such as an unexpected door opening while the vehicle is in motion, a sudden weight decrease during transit, or a seal break — are treated as security indicators and contribute to the threat score.");
doc.moveDown(0.3);
bold("Correlation with Vehicle Events");
para("Cargo anomalies are correlated with vehicle position, route deviation, and communication status. A door-open event during an unscheduled stop in a high-risk area generates a significantly higher threat score than a door-open event at a designated delivery point.");
doc.moveDown(0.3);
bold("Cargo Chain-of-Custody Evidence");
para("The evidence preservation module extends to cargo events, capturing timestamped records of cargo sensor data, door access events, weight changes, and temperature deviations. This data is included in forensic evidence packages for cargo theft insurance claims.");

// 19 — NEW
checkPage(150);
subheading("19. Multi-Vehicle Coordinated Response (refer FIG 17)");
para("In fleet or community deployments, the system supports coordinated security response across multiple vehicles on the same network.");
doc.moveDown(0.3);
bold("Proximity Alert Relay");
para("When a vehicle generates a high-threat alert, nearby vehicles on the same network receive a proximity warning. This enables convoy vehicles to take evasive action or nearby fleet vehicles to serve as communication relays when the affected vehicle's communications are jammed.");
doc.moveDown(0.3);
bold("Witness Data Capture");
para("Nearby fleet vehicles may autonomously capture environmental data — including their own camera feeds, GPS positions, and sensor readings — when a proximate security event is detected. This witness data is correlated with the primary incident and included in the evidence package.");
doc.moveDown(0.3);
bold("Convoy Integrity Monitoring");
para("For fleet deployments operating in convoy, the system monitors inter-vehicle spacing, relative positions, and communication health. If a vehicle drops out of the convoy unexpectedly — particularly when combined with communication loss — the system escalates the event immediately.");

// 20 — NEW
checkPage(120);
subheading("20. Self-Improving Detection Intelligence (refer FIG 15)");
para("The system includes a self-improving intelligence pipeline that autonomously enhances detection accuracy over time.");
doc.moveDown(0.3);
bold("Autonomous Model Retraining");
para("Detection models are periodically retrained using accumulated journey data, verified incident outcomes, false positive confirmations, and operator corrections. Retraining occurs autonomously without human-initiated training cycles, ensuring the system continuously adapts to evolving threat patterns.");
doc.moveDown(0.3);
bold("Autonomous Pattern Discovery");
para("The system analyses the aggregate intelligence dataset to autonomously detect emerging patterns — including new crime corridors, shifting temporal risk profiles, and previously unidentified behavioural indicators of hijacking — without requiring human definition of the patterns to be detected.");
doc.moveDown(0.3);
bold("Compounding Intelligence Advantage");
para("Each journey processed by the system increases the depth and accuracy of subsequent analysis. The system autonomously refines detection thresholds, scoring weights, and geofence boundaries based on accumulated data, creating a compounding intelligence advantage that becomes more valuable with each vehicle and journey added to the network.");

// 21
checkPage(120);
subheading("21. Best Method of Performing the Invention");
para("In a preferred embodiment, the invention is implemented as an OEM-integrated or hardened in-vehicle security module with secure storage, local AI inference, backup power, CAN or OBD integration, and multiple radios. The preferred authorization workflow uses at least one trusted credential together with startup-sequence analysis and tamper indicators to determine an authorization state, after which the vehicle either enters a normal operable state or a protected immobilized state. The preferred reactivation workflow uses one or more verified credentials and a logged, recoverable token-based reactivation process. The preferred evidence workflow uses cryptographic hashing and timestamping with opportunistic secure cloud synchronisation. The preferred anti-jamming workflow uses local interference detection, fallback-path selection, dead-reckoning during GNSS loss, and opportunistic store-and-forward or delayed-burst alert transmission. The preferred occupant duress detection uses wearable heart-rate and voice stress analysis correlated with vehicle movement data.");

// 22
checkPage(80);
subheading("22. Industrial Applicability");
para("The invention is industrially applicable to private passenger vehicles, high-risk commuter vehicles, family safety deployments, school transport, fleet management, logistics fleets, cross-border freight, insurer-linked telematics, rental vehicles, executive protection, cash-in-transit operations, and security-company supported response platforms. The invention may be implemented wholly on-device, wholly in a remote platform, or in hybrid form.");

// 23
checkPage(120);
subheading("23. Alternative Implementations");
para("The systems and methods described in this specification may be implemented using a variety of computational architectures and analytical techniques.");
doc.moveDown(0.3);
para("The artificial intelligence analysis engines described herein may operate using machine learning models, neural networks, natural language processing systems, large language models, rule-based systems, statistical models, hybrid analytical systems, or equivalent computational mechanisms capable of analysing vehicle, driver, and environmental signals.");
doc.moveDown(0.3);
para("The predictive threat intelligence module may consume data from public crime databases, private security intelligence feeds, insurance industry incident databases, community reporting platforms, or equivalent data sources.");
doc.moveDown(0.3);
para("The tamper-resilient evidence preservation module may store evidence locally on secure storage within the in-vehicle device, in secure cloud storage, or in both locations simultaneously.");
doc.moveDown(0.3);
para("The communication orchestration engine may utilise any signaling protocol including but not limited to cellular (4G/5G/LTE), Bluetooth Low Energy, Wi-Fi, LoRa, sub-GHz ISM band, satellite (LEO/GEO), or equivalent communication mechanisms.");
doc.moveDown(0.3);
para("The specific examples described in this specification are provided for illustrative purposes and should not be interpreted as limiting the scope of the invention to any particular technology, platform, deployment model, or implementation approach.");

// 24
checkPage(80);
subheading("24. Future Embodiments");
para("The system may integrate with autonomous vehicle control systems to execute safe-stop or safe-harbour manoeuvres when a critical threat is confirmed.");
doc.moveDown(0.3);
para("The system may integrate with smart-city infrastructure including traffic camera networks, ANPR (automatic number plate recognition) systems, and municipal emergency response platforms.");
doc.moveDown(0.3);
para("Communication signals may be extended to include satellite communication (LEO constellation) for operation in areas with no terrestrial cellular coverage.");
doc.moveDown(0.3);
para("The predictive threat intelligence module may consume real-time social media feeds, crowd-sourced incident reports, and emergency service dispatch data to enhance risk assessment timeliness.");

drawLine();

// ============================================================
// EXAMPLE EMBODIMENTS
// ============================================================

doc.addPage();
heading("Example Embodiments");

const embodiments = [
  "In one embodiment, a driver begins a monitored journey from home to work, shares the trip with a trusted contact, and the system tracks expected route progression. The vehicle then deviates toward a high-risk area, threat score increases, and the platform sends covert alerts while maintaining tracking.",
  "In another embodiment, the vehicle continues moving while the driver's mobile handset unexpectedly goes offline and the driver's wearable indicates removal or loss of body contact. The correlation engine classifies the condition as high-risk and the response policy engine escalates alerts.",
  "In a further embodiment, the vehicle route continues toward an unexpected destination while the wearable location diverges from the vehicle route, thereby indicating a potential driver-vehicle separation event. The platform escalates notifications and preserves location breadcrumbs for both vehicle and associated trusted-device data.",
  'In yet another embodiment, the driver speaks a predefined covert phrase while the vehicle is stopped at an unexpected location. The platform triggers covert emergency mode and transmits alerts through one or more selected communication pathways.',
  "In a further embodiment relating to startup security, a startup attempt occurs in the absence of a valid trusted credential and in the presence of an abnormal startup sequence on the vehicle bus. The authorization state is determined to be invalid, the platform places the vehicle in a protected immobilized state, and one or more tamper alerts are sent. Subsequent authenticated reactivation is permitted only after verification of a trusted credential and a valid reactivation condition.",
  "In a further embodiment relating to predictive intelligence, the system analyses historical crime data and identifies that a driver's regular evening commute route passes through an intersection with elevated hijacking risk between 18:00 and 20:00. The system generates a pre-journey notification recommending an alternative route during those hours and increases detection sensitivity when the driver approaches that area.",
  "In a further embodiment relating to evidence preservation, during a hijacking incident the system autonomously captures vehicle location breadcrumbs at increased frequency, records ambient audio, logs all tamper events and communication attempts, cryptographically secures all captured data, and synchronises the evidence package to secure cloud storage. Following the incident, the system generates an automated incident reconstruction report suitable for insurance claims and law enforcement investigation.",
  "In a further embodiment relating to signal jamming, a signal jammer causes simultaneous GNSS degradation and cellular collapse while vehicle motion sensors indicate continued movement. The system flags a signal interference event, switches to a Bluetooth relay fallback pathway, stores forensic records locally, derives interim movement estimates from inertial and vehicle-bus data, and transmits delayed-burst alerts once a usable communication window is detected.",
  "In a further embodiment relating to occupant duress, the driver's wearable detects a sudden elevation in heart rate and skin conductance concurrent with a route deviation toward a known crime hotspot. The system correlates the physiological duress indicators with the route and location signals, classifies the condition as high-risk, and escalates alerts without requiring any action from the driver.",
  "In a further embodiment relating to cargo integrity, a logistics vehicle's cargo door sensor detects an unauthorised opening while the vehicle is stopped at an unscheduled location in an industrial area at 22:00. The system correlates the cargo breach with the unscheduled stop, high-risk location, and time-of-day risk factor, generates a critical alert to the fleet control room, and captures timestamped evidence of the cargo breach event.",
  "In a further embodiment relating to multi-vehicle coordination, a convoy of three fleet vehicles is operating on a cross-border route. The lead vehicle detects signal jamming and route deviation. The system relays the alert through the second vehicle's cellular connection via Bluetooth, enabling the fleet control room to receive the alert despite the primary vehicle's communications being blocked. The trailing vehicles autonomously capture witness GPS and sensor data correlated with the incident.",
];

embodiments.forEach(e => {
  checkPage(80);
  para(e);
  doc.moveDown(0.5);
});

drawLine();

// ============================================================
// ADVANTAGES
// ============================================================

heading("Advantages of the Invention");

const advantages = [
  "improved early detection of hijack or coercive diversion by combining behavioural learning with route monitoring",
  "reduced false positives through multi-signal correlation across vehicle, handset, wearable, and context data",
  "continued emergency capability under degraded communication conditions through adaptive pathway selection",
  "support for discreet activation and silent escalation where a driver cannot safely press a panic button",
  "support for protected immobilization and authenticated reactivation in unauthorized startup or tamper scenarios",
  "proactive threat avoidance through predictive intelligence and dynamic route recommendations",
  "tamper-resilient forensic evidence with cryptographic integrity for insurance and legal proceedings",
  "autonomous geofenced sensitivity adjustment reducing false positives while maintaining vigilance in high-risk zones",
  "enhanced resilience against communication jamming through interference detection, fallback channels, and delayed-burst recovery",
  "passive occupant duress detection using physiological and behavioural indicators without requiring driver action",
  "cargo integrity monitoring with correlation to vehicle security events for logistics and commercial fleet protection",
  "multi-vehicle coordinated response enabling relay communication, witness data capture, and convoy integrity monitoring",
  "self-improving detection models that autonomously increase accuracy with each journey and incident processed",
  "network intelligence effects in fleet and community deployments where each vehicle strengthens collective security",
  "broad applicability to consumer, family, school transport, fleet, logistics, insurer, and security use cases",
];

advantages.forEach(a => {
  checkPage(25);
  bullet(a);
});

drawLine();

// ============================================================
// CLAIMS
// ============================================================

doc.addPage();
heading("Claims", 18);

// --- SYSTEM CLAIMS ---
subheading("System Claims:");

const systemClaims = [
  "1. A vehicle security platform comprising: an in-vehicle electronic device; an artificial intelligence processor associated with the in-vehicle electronic device; a journey-monitoring module; and a communication module configured for one or more communication pathways, wherein the artificial intelligence processor is configured to detect anomalous or distress-related conditions associated with a vehicle journey.",
  "2. The platform of claim 1, wherein the artificial intelligence processor is configured to learn driver-specific behavioural patterns from historical driving data.",
  "3. The platform of claim 1 or claim 2, wherein the historical driving data includes one or more of route history, timing history, braking behaviour, acceleration behaviour, stop patterns, or trip durations.",
  "4. The platform of any one of the preceding claims, wherein the platform is configured to compare real-time vehicle movement with an intended, selected, shared, or inferred journey.",
  "5. The platform of any one of the preceding claims, wherein a journey-monitoring module classifies route deviations as benign, irregular, or high-risk according to context.",
  "6. The platform of any one of the preceding claims, wherein the platform computes a threat score using two or more contextual signals.",
  "7. The platform of claim 6, wherein the contextual signals include one or more of route deviation, driver behaviour deviation, communication interference, hotspot context, wearable removal, handset-offline state, driver-vehicle separation, distress phrase detection, tamper signals, occupant duress indicators, cargo integrity violations, or startup-sequence anomalies.",
  "8. The platform of any one of the preceding claims, further comprising a communication orchestration engine configured to select, sequence, combine, or rank multiple communication pathways.",
  "9. The platform of claim 8, wherein the communication pathways include one or more of cellular transmission, Bluetooth relay, mesh communication, sub-GHz radio transmission, Wi-Fi transmission, satellite transmission, or store-and-forward delivery.",
  "10. The platform of any one of the preceding claims, wherein the platform is configured to initiate covert emergency communication without requiring visible user interaction.",
  "11. The platform of any one of the preceding claims, further comprising a wearable-device integration layer configured to receive one or more wearable-device signals.",
  "12. The platform of claim 11, wherein the wearable-device signals include one or more of pairing state, connection state, location, motion, body-contact state, biometric state, or user input state.",
  "13. The platform of claim 11 or claim 12, wherein a correlation engine combines wearable-device signals with vehicle route data and handset status data to determine whether an anomalous or distress-related condition exists.",
  "14. The platform of claim 13, wherein the anomalous or distress-related condition includes a handset-offline event that occurs together with route deviation or wearable change.",
  "15. The platform of claim 13 or claim 14, wherein the anomalous or distress-related condition includes a driver-vehicle separation event.",
  "16. The platform of any one of claims 11 to 15, wherein the wearable device is configured to initiate covert emergency activation by gesture, button sequence, voice input, or equivalent user action.",
  "17. The platform of any one of the preceding claims, wherein a voice-recognition module detects a predefined distress phrase and initiates covert emergency mode.",
  "18. The platform of any one of the preceding claims, wherein the response policy engine executes a staged escalation sequence including increased monitoring, trusted-contact alerts, covert tracking, or responder escalation.",
  "19. The platform of claim 18, wherein the selected stage is determined according to threat score, communication availability, route context, driver profile, or authorization state.",
  "20. The platform of any one of the preceding claims, wherein the platform consumes hotspot or route-risk data and adjusts threat scoring or route recommendations accordingly.",
  "21. The platform of any one of the preceding claims, wherein the artificial intelligence processor maintains separate behavioural profiles for different drivers of the same vehicle.",
  "22. The platform of any one of the preceding claims, wherein the platform continues at least partial operation when the handset is offline or unavailable.",
];

systemClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- AUTH CLAIMS ---
checkPage(60);
subheading("Authorization and Immobilization Claims:");

const authClaims = [
  "23. The platform of any one of the preceding claims, further comprising a secure authorization layer configured to determine an authorization state for vehicle startup, operability, lockout, or reactivation based on one or more trusted credentials and one or more anomaly or tamper indicators.",
  "24. The platform of claim 23, wherein the trusted credentials include one or more of a key transponder, an OEM immobilizer credential, a handset token, a wearable token, a cryptographic secret, a biometric confirmation, a server-issued code, or a one-time authorization token.",
  "25. The platform of claim 23 or claim 24, wherein the anomaly or tamper indicators include one or more of missing credential state, startup-sequence anomaly, ECU anomaly, CAN bus anomaly, bypass attempt, unauthorized ignition pattern, firmware anomaly, software tampering, or physical tamper input.",
  "26. The platform of any one of claims 23 to 25, wherein, when the authorization state is absent, invalid, or compromised, the platform places the vehicle in a protected immobilized state in which startup or one or more selected vehicle functions are inhibited while alerting, logging, or monitoring capabilities are maintained.",
  "27. The platform of claim 26, wherein the protected immobilized state is recoverable and is removed only after authenticated reactivation.",
  "28. The platform of claim 27, wherein authenticated reactivation requires verification of one or more reactivation conditions including one or more of presentation of a valid trusted credential, owner confirmation, service-agent confirmation, trusted-device confirmation, server-side authorization, or one-time token validation.",
];

authClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- PREDICTIVE CLAIMS ---
checkPage(60);
subheading("Predictive Threat Intelligence Claims:");

const predClaims = [
  "29. The platform of any one of the preceding claims, further comprising a predictive threat intelligence module configured to generate proactive risk assessments by correlating historical incident data, geographic crime patterns, temporal risk profiles, and driver behavioural baselines.",
  "30. The platform of claim 29, wherein the predictive module generates pre-journey risk notifications and alternative route recommendations when elevated risk is identified on a planned or inferred route.",
  "31. The platform of claim 29 or claim 30, wherein the predictive module identifies recurring temporal risk windows — specific times and locations with historically elevated crime rates — and autonomously adjusts detection sensitivity during those windows.",
  "32. The platform of any one of claims 29 to 31, further comprising a fleet or community intelligence capability wherein anonymised threat intelligence is aggregated across multiple vehicles to generate real-time risk maps benefiting all participants.",
];

predClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- FORENSIC EVIDENCE CLAIMS ---
checkPage(60);
subheading("Forensic Evidence Claims:");

const forClaims = [
  "33. The platform of any one of the preceding claims, further comprising a tamper-resilient evidence preservation module configured to cryptographically hash and timestamp forensic data captured during security incidents to establish chain-of-custody integrity.",
  "34. The platform of claim 33, wherein the evidence module correlates data from multiple sources including vehicle telemetry, handset location, wearable data, communication logs, and cargo sensor data to construct a comprehensive incident timeline.",
  "35. The platform of claim 33 or claim 34, wherein the evidence module autonomously generates structured incident reports comprising chronological timelines, geographic track data, threat score progression, and response actions taken.",
  "36. The platform of any one of claims 33 to 35, wherein evidence packages are structured to meet insurance claim documentation requirements including timestamped proof of vehicle location, unauthorized access, immobilization activation, and emergency communication attempts.",
  "37. The platform of any one of claims 33 to 36, wherein forensic evidence is synchronised to secure cloud storage using end-to-end encryption and opportunistic connectivity windows.",
];

forClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- GEOFENCED ANOMALY CLAIMS ---
checkPage(60);
subheading("Geofenced Anomaly Claims:");

const geoClaims = [
  "38. The platform of any one of the preceding claims, further comprising a geofenced behavioural anomaly engine that autonomously adjusts detection thresholds for route deviation, speed anomalies, and stop duration based on real-time geographic risk context.",
  "39. The platform of claim 38, wherein the geofenced engine autonomously learns and updates geofence boundaries based on aggregated incident data and emerging crime patterns.",
  "40. The platform of claim 38 or claim 39, wherein the geofenced engine reduces false positive rates in low-risk environments while maintaining heightened sensitivity in high-risk zones.",
];

geoClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- ANTI-JAMMING CLAIMS --- NEW
checkPage(60);
subheading("Anti-Jamming Communication Resilience Claims:");

const jamClaims = [
  "41. The platform of any one of the preceding claims, further comprising an anti-jamming communication resilience layer comprising: an interference detection module configured to detect or infer a signal interference event from degradation in one or more communication or location channels; and a failover module configured to preserve local decision support and to select, sequence, combine, or defer one or more transmissions over available primary or fallback pathways.",
  "42. The platform of claim 41, wherein the interference detection module correlates radio degradation with motion, route, or telemetry data to distinguish deliberate signal interference from ordinary signal loss.",
  "43. The platform of claim 41 or claim 42, wherein the system preserves a local evidence record and performs dead-reckoning from inertial sensors or vehicle-bus inputs during at least part of a signal interference event.",
  "44. The platform of any one of claims 41 to 43, wherein the system performs delayed-burst alert transmission by storing alerts locally during communication denial and transmitting compressed critical data when a temporary connectivity window is detected.",
];

jamClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- OCCUPANT DURESS CLAIMS --- NEW
checkPage(60);
subheading("Occupant Duress Detection Claims:");

const duressClaims = [
  "45. The platform of any one of the preceding claims, further comprising an occupant duress detection module configured to identify physiological or behavioural indicators of coercion or distress from one or more wearable or in-vehicle sensors without requiring deliberate occupant action.",
  "46. The platform of claim 45, wherein the physiological indicators include one or more of elevated heart rate, heart rate variability changes, skin conductance changes, or body temperature anomalies detected from a wearable device.",
  "47. The platform of claim 45 or claim 46, further comprising a voice stress analysis capability configured to detect stress indicators including pitch elevation, speech rate changes, or tremor patterns from in-vehicle or phone audio.",
  "48. The platform of any one of claims 45 to 47, wherein occupant duress indicators are correlated with route deviation, location risk, and time-of-day risk factors to produce a combined threat score.",
];

duressClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- CARGO INTEGRITY CLAIMS --- NEW
checkPage(60);
subheading("Cargo and Asset Protection Claims:");

const cargoClaims = [
  "49. The platform of any one of the preceding claims, further comprising a cargo integrity monitoring module configured to detect cargo-related anomalies including unauthorised door openings, weight changes, temperature deviations, or seal-break events and to correlate cargo anomalies with vehicle security events.",
  "50. The platform of claim 49, wherein a cargo anomaly detected during an unscheduled stop in a high-risk area generates an elevated threat score relative to the same cargo anomaly detected at a designated delivery point.",
  "51. The platform of claim 49 or claim 50, wherein the evidence preservation module captures timestamped cargo sensor data and includes cargo chain-of-custody records in forensic evidence packages for cargo theft insurance claims.",
];

cargoClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- MULTI-VEHICLE CLAIMS --- NEW
checkPage(60);
subheading("Multi-Vehicle Coordinated Response Claims:");

const multiClaims = [
  "52. The platform of any one of the preceding claims, further comprising a multi-vehicle coordination engine configured to coordinate security response actions across multiple vehicles on the same network.",
  "53. The platform of claim 52, wherein a vehicle generating a high-threat alert transmits a proximity warning to nearby fleet vehicles, enabling relay communication when the affected vehicle's primary communication is jammed.",
  "54. The platform of claim 52 or claim 53, wherein nearby fleet vehicles autonomously capture witness data including GPS positions, sensor readings, and environmental observations correlated with a proximate security event.",
  "55. The platform of any one of claims 52 to 54, further comprising a convoy integrity monitoring capability that detects unexpected vehicle separation from a convoy and escalates the event when combined with communication loss or route deviation.",
];

multiClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- SELF-IMPROVING CLAIMS --- NEW
checkPage(60);
subheading("Autonomous Self-Improving Intelligence Claims:");

const selfClaims = [
  "56. The platform of any one of the preceding claims, further comprising a self-improving intelligence pipeline wherein detection models are autonomously retrained using accumulated journey data, verified incident outcomes, and operator corrections without human-initiated training cycles.",
  "57. The platform of claim 56, further comprising an autonomous pattern discovery module that analyses the aggregate intelligence dataset to autonomously detect emerging threat patterns including new crime corridors, shifting temporal risk profiles, and previously unidentified behavioural indicators that were not predefined by human operators.",
  "58. The platform of claim 56 or claim 57, wherein the system autonomously refines detection thresholds, threat scoring weights, and geofence boundaries based on accumulated data, creating a compounding intelligence advantage that increases in value with each journey and vehicle added to the network.",
];

selfClaims.forEach(c => {
  checkPage(50);
  para(c);
  doc.moveDown(0.4);
});

// --- METHOD CLAIMS ---
checkPage(60);
subheading("Method Claims:");

const methodClaims = [
  "59. A computer-implemented method of monitoring a vehicle journey, the method comprising: learning one or more behavioural patterns associated with a driver; comparing live vehicle movement with an intended, selected, shared, or inferred journey; computing a threat score from two or more contextual signals; and executing one or more response actions according to the threat score.",
  "60. The method of claim 59, further comprising correlating vehicle data with handset data, wearable-device data, and optionally cargo sensor data to determine whether an anomalous or distress-related condition exists.",
  "61. The method of claim 59 or claim 60, further comprising selecting one or more communication pathways according to expected reliability, latency, stealth, or communication availability.",
  "62. A computer-implemented method of controlling vehicle startup authorization, the method comprising: determining an authorization state from one or more trusted credentials and one or more anomaly or tamper indicators; inhibiting startup or placing the vehicle into a protected immobilized state when the authorization state is absent, invalid, or compromised; and permitting authenticated reactivation only after verified satisfaction of one or more reactivation conditions.",
  "63. A computer-implemented method of generating predictive vehicle threat intelligence, the method comprising: aggregating historical vehicle crime data by geographic area, time, and incident type; correlating aggregated data with a driver's planned or inferred route; generating a pre-journey risk assessment; and adjusting detection sensitivity based on the predicted risk profile.",
  "64. A computer-implemented method of preserving tamper-resilient forensic evidence during a vehicle security incident, the method comprising: capturing forensic data from multiple vehicle and device sensors; cryptographically hashing and timestamping captured data to establish integrity; correlating multi-source data to construct an incident timeline; and generating a structured evidence package suitable for insurance claims or legal proceedings.",
  "65. A computer-implemented method of maintaining emergency communication capability during a signal interference event, the method comprising: detecting or inferring degradation of one or more communication or location channels; preserving local anomaly evaluation and evidence capture during the degradation; selecting or sequencing one or more fallback communication pathways; and transmitting, storing, or deferring one or more alerts or evidence packages until a transmission condition is satisfied.",
  "66. A computer-implemented method of detecting occupant duress without deliberate occupant action, the method comprising: monitoring physiological or behavioural signals from one or more wearable or in-vehicle sensors; detecting anomalous physiological patterns indicative of coercion or distress; correlating detected duress indicators with vehicle route, location risk, and time-of-day risk factors; and contributing the correlated duress assessment to a threat score computation.",
  "67. A non-transitory computer-readable medium carrying instructions which, when executed by one or more processors of an in-vehicle device, handset, wearable device, or remote platform, cause performance of the method of any one of claims 59 to 66.",
  "68. A vehicle security system substantially as herein described with reference to any one or more of the accompanying drawings.",
];

methodClaims.forEach(c => {
  checkPage(60);
  para(c);
  doc.moveDown(0.4);
});

drawLine();

// ============================================================
// DRAWINGS
// ============================================================

doc.addPage();
heading("Drawings", 18);
para("Figures 1 to 17 are attached hereto and form part of this specification.");
doc.moveDown(1);

// FIG 1
checkPage(200);
subheading("FIG 1 — Overall Platform Architecture");
diagramBox([
  "+-----------------------------------+",
  "| Vehicle Journey                   |",
  "| (Planned / Shared / Inferred)     |",
  "+----------------+------------------+",
  "                 |",
  "                 v",
  "+-----------------------------------+",
  "| Multi-Source Signal Capture       |",
  "| - Vehicle Telemetry (CAN/OBD)    |",
  "| - GPS / Location                 |",
  "| - Handset Signals                |",
  "| - Wearable Signals               |",
  "| - Audio / Voice                  |",
  "| - Cargo Sensors                  |",
  "+----------------+------------------+",
  "                 |",
  "                 v",
  "+-----------------------------------+",
  "| AI Detection & Scoring Engine    |",
  "| - Behaviour Anomaly Detection    |",
  "| - Route Deviation Analysis       |",
  "| - Threat Score Computation       |",
  "| - Authorization State Check      |",
  "| - Occupant Duress Detection      |",
  "| - Cargo Integrity Check          |",
  "+----------------+------------------+",
  "                 |",
  "                 v",
  "+-----------------------------------+",
  "| Response Policy Engine           |",
  "| - Staged Escalation              |",
  "| - Protected Immobilization       |",
  "| - Evidence Preservation          |",
  "| - Multi-Vehicle Coordination     |",
  "+-----------------------------------+",
]);

// FIG 2
checkPage(200);
subheading("FIG 2 — Communication Architecture");
diagramBox([
  "+-----------------------------------+",
  "| Communication Orchestration      |",
  "| Engine                           |",
  "+---+-------+-------+-------+-----+",
  "    |       |       |       |",
  "+---v-+ +---v-+ +---v-+ +---v-+",
  "|Cell-| |Blue-| |Mesh | |Store|",
  "|ular | |tooth| |/Sub | |& Fwd|",
  "+--+--+ +--+--+ +--+--+ +--+--+",
  "   |       |       |       |",
  "   +-------+-------+-------+",
  "                |",
  "                v",
  "   +----------------------------+",
  "   | Alert Delivery             |",
  "   | - Trusted Contacts         |",
  "   | - Emergency Responders     |",
  "   | - Cloud Platform           |",
  "   | - Fleet Vehicles (relay)   |",
  "   +----------------------------+",
]);

// FIG 3
checkPage(200);
subheading("FIG 3 — AI Detection Pipeline");
diagramBox([
  "+---------------------------+",
  "| Raw Sensor Signals        |",
  "| (Vehicle + Phone +        |",
  "|  Wearable + Audio + Cargo)|",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Signal Preprocessing &    |",
  "| Feature Extraction        |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Behavioural Model         |",
  "| Comparison                |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+     +---------------------------+",
  "| Threat Score Engine       | <-- | Route Risk Intelligence   |",
  "+-----------+---------------+     | + Occupant Duress         |",
  "            |                     | + Cargo Integrity         |",
  "            v                     +---------------------------+",
  "+---------------------------+",
  "| Response Classification   |",
  "| (Benign / Irregular /     |",
  "|  Suspicious / High-Risk)  |",
  "+---------------------------+",
]);

// FIG 11
checkPage(250);
subheading("FIG 11 — Startup Authorization / Protected Lockout / Authenticated Reactivation");
diagramBox([
  "+---------------------------+",
  "| Startup Attempt Detected  |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Authorization Check       |",
  "| - Trusted credential?     |",
  "| - Normal startup seq?     |",
  "| - Tamper signals?         |",
  "| - Trusted device present? |",
  "+-----------+---------------+",
  "            |",
  "    +-------+-------+",
  "    |               |",
  "+---v---+     +-----v-----------+",
  "| VALID |     | INVALID /       |",
  "| Start |     | COMPROMISED     |",
  "| OK    |     +--------+--------+",
  "+-------+              |",
  "                       v",
  "             +-------------------+",
  "             | Protected         |",
  "             | Immobilized State |",
  "             | - Startup blocked |",
  "             | - Tamper logged   |",
  "             | - Alerts sent     |",
  "             +--------+----------+",
  "                      |",
  "                      v",
  "             +-------------------+",
  "             | Authenticated     |",
  "             | Reactivation      |",
  "             | - Owner confirm   |",
  "             | - Token validate  |",
  "             | - Server approve  |",
  "             +-------------------+",
]);

// FIG 12
checkPage(200);
subheading("FIG 12 — Predictive Threat Intelligence Pipeline");
diagramBox([
  "+---------------------------+     +---------------------------+",
  "| Historical Crime Data     |     | Driver Route / Schedule   |",
  "| (Hotspots, Incidents,     |     | (Planned or Inferred)     |",
  "|  Temporal Patterns)       |     |                           |",
  "+-----------+---------------+     +-----------+---------------+",
  "            |                                 |",
  "            +----------------+----------------+",
  "                             |",
  "                             v",
  "              +-----------------------------+",
  "              | Predictive Risk Engine      |",
  "              | - Geographic correlation    |",
  "              | - Temporal pattern match    |",
  "              | - Behavioural baseline      |",
  "              +-------------+---------------+",
  "                            |",
  "                            v",
  "              +-----------------------------+",
  "              | Pre-Journey Risk Assessment |",
  "              | - Risk score per segment    |",
  "              | - Alternative routes        |",
  "              | - Sensitivity adjustment    |",
  "              +-----------------------------+",
]);

// FIG 13
checkPage(200);
subheading("FIG 13 — Tamper-Resilient Evidence Preservation");
diagramBox([
  "+---------------------------+",
  "| Security Incident         |",
  "| Detected                  |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Multi-Source Data Capture  |",
  "| - Location breadcrumbs    |",
  "| - Audio recording         |",
  "| - Tamper event logs       |",
  "| - Communication attempts  |",
  "| - Sensor readings         |",
  "| - Cargo sensor data       |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Cryptographic Hashing &   |",
  "| Timestamping              |",
  "| (Chain of custody)        |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Secure Cloud Sync         |",
  "| (End-to-end encrypted)    |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Automated Incident Report |",
  "| - Chronological timeline  |",
  "| - Geographic track        |",
  "| - Threat score history    |",
  "| - Evidence package        |",
  "| - Cargo chain of custody  |",
  "+---------------------------+",
]);

// FIG 14
checkPage(200);
subheading("FIG 14 — Anti-Jamming Communication Resilience");
diagramBox([
  "+---------------------------+",
  "| Signal Degradation        |",
  "| Detected (Cellular +      |",
  "| GNSS + Wi-Fi)             |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Interference Analysis     |",
  "| - Ordinary loss?          |",
  "| - Deliberate jamming?     |",
  "| - Correlate with motion   |",
  "+-----------+---------------+",
  "            |",
  "    +-------+-------+",
  "    |               |",
  "+---v------+  +-----v-----------+",
  "| Ordinary |  | Signal          |",
  "| Loss     |  | Interference    |",
  "| (resume  |  | Event Flagged   |",
  "|  normal) |  +--------+--------+",
  "+----------+           |",
  "                       v",
  "             +-------------------+",
  "             | Local AI Active   |",
  "             | - Scoring continues|",
  "             | - Evidence captured|",
  "             | - Dead reckoning  |",
  "             +--------+----------+",
  "                      |",
  "                      v",
  "             +-------------------+",
  "             | Fallback Paths    |",
  "             | - Bluetooth relay |",
  "             | - Mesh / sub-GHz  |",
  "             | - Store & forward |",
  "             | - Delayed burst   |",
  "             +-------------------+",
]);

// FIG 15
checkPage(200);
subheading("FIG 15 — Self-Improving Detection Model Pipeline");
diagramBox([
  "+---------------------------+",
  "| Journeys processed by     |",
  "| current AI models         |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Detection Results         |",
  "| stored in database        |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Verified Outcomes +       |",
  "| Operator Corrections      |",
  "| captured as training      |",
  "| signals                   |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Autonomous Model          |",
  "| Retraining Pipeline       |",
  "+-----------+---------------+",
  "            |",
  "            v",
  "+---------------------------+",
  "| Improved AI Models        |",
  "| deployed for next         |",
  "| journeys                  |",
  "+-------------+-------------+",
  "              |",
  "              +-----> (loop back to journey processing)",
]);

// FIG 16
checkPage(200);
subheading("FIG 16 — Occupant Duress Detection and Correlation");
diagramBox([
  "+---------------------------+     +---------------------------+",
  "| Wearable Sensors          |     | In-Vehicle Audio          |",
  "| - Heart rate              |     | - Voice stress analysis   |",
  "| - Skin conductance        |     | - Silence detection       |",
  "| - Body temperature        |     |                           |",
  "+-----------+---------------+     +-----------+---------------+",
  "            |                                 |",
  "            +----------------+----------------+",
  "                             |",
  "                             v",
  "              +-----------------------------+",
  "              | Duress Correlation Engine   |",
  "              | - Physiological anomaly?    |",
  "              | - Route deviation?          |",
  "              | - High-risk location?       |",
  "              | - Time-of-day risk?         |",
  "              +-------------+---------------+",
  "                            |",
  "                            v",
  "              +-----------------------------+",
  "              | Duress Score -> Threat Score|",
  "              | (contributes to combined    |",
  "              |  threat assessment)         |",
  "              +-----------------------------+",
]);

// FIG 17
checkPage(200);
subheading("FIG 17 — Multi-Vehicle Coordinated Response");
diagramBox([
  "+============================================+",
  "|          FLEET NETWORK                     |",
  "+============================================+",
  "|                                            |",
  "|  +----------+  +----------+  +----------+  |",
  "|  | Vehicle A |  | Vehicle B|  | Vehicle C|  |",
  "|  | (THREAT)  |  | (relay)  |  | (witness)|  |",
  "|  +----+-----+  +----+-----+  +----+-----+  |",
  "|       |             |             |         |",
  "|       +------+------+------+------+         |",
  "|              |             |                |",
  "|              v             v                |",
  "|  +-------------------+  +--------------+    |",
  "|  | Proximity Alert   |  | Witness Data |    |",
  "|  | Relay to Control  |  | Capture      |    |",
  "|  +-------------------+  +--------------+    |",
  "|              |             |                |",
  "|              +------+------+                |",
  "|                     |                       |",
  "|                     v                       |",
  "|        +------------------------+           |",
  "|        | Fleet Control Room     |           |",
  "|        | + Evidence Package     |           |",
  "|        +------------------------+           |",
  "+============================================+",
]);

doc.moveDown(2);
drawLine();
doc.moveDown(0.5);
doc.fontSize(11).font("Helvetica-Bold").fillColor("#333333").text("End of Specification", { align: "center" });

addFooter();

doc.end();

stream.on("finish", () => {
  const stats = fs.statSync(outputPath);
  console.log(`PDF saved: ${outputPath}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB`);
  console.log(`Pages: ${doc.bufferedPageRange().count}`);
});
