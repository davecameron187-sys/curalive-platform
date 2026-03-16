// @ts-nocheck
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType
} from "docx";
import fs from "fs";

const BLUE = "1a1a2e";
const GREY = "555555";
const DARK = "333333";
const SUBHEAD = "2d3436";

function heading(text: string, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 300, after: 150 }, children: [new TextRun({ text, bold: true, color: BLUE, font: "Calibri" })] });
}
function h2(text: string) { return heading(text, HeadingLevel.HEADING_2); }

function para(text: string, spacing = 100) {
  return new Paragraph({ spacing: { after: spacing }, children: [new TextRun({ text, font: "Calibri", size: 20, color: DARK })], });
}

function boldPara(text: string) {
  return new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text, bold: true, font: "Calibri", size: 20, color: DARK })], });
}

function bullet(text: string) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text, font: "Calibri", size: 20, color: DARK })] });
}

function defn(term: string, desc: string) {
  return new Paragraph({ spacing: { after: 80 }, children: [
    new TextRun({ text: term + ": ", bold: true, font: "Calibri", size: 20, color: BLUE }),
    new TextRun({ text: desc, font: "Calibri", size: 20, color: DARK }),
  ]});
}

function divider() {
  return new Paragraph({ spacing: { before: 150, after: 150 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } }, children: [new TextRun({ text: "" })] });
}

function cell(text: string, bold = false, shading?: string) {
  return new TableCell({
    children: [new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text, bold, font: "Calibri", size: 18, color: bold && shading ? "ffffff" : DARK })] })],
    width: { size: 100, type: WidthType.AUTO },
    ...(shading ? { shading: { type: ShadingType.SOLID, color: shading, fill: shading } } : {}),
  });
}

function claimPara(text: string) {
  return new Paragraph({ spacing: { after: 100 }, indent: { left: 200 }, children: [new TextRun({ text, font: "Calibri", size: 20, color: DARK })], });
}

function diagramLine(text: string) {
  return new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text, font: "Courier New", size: 16, color: SUBHEAD })], });
}

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 900, bottom: 900, left: 1100, right: 1100 } } },
    children: [

      // COVER
      new Paragraph({ spacing: { before: 1500 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "PROVISIONAL PATENT SPECIFICATION", font: "Calibri", size: 24, color: GREY }),
      ]}),
      new Paragraph({ spacing: { before: 300, after: 100 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "AI AntiHijack", bold: true, font: "Calibri", size: 52, color: BLUE }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [
        new TextRun({ text: "CIPC Submission", font: "Calibri", size: 24, color: GREY }),
      ]}),
      divider(),

      // Title
      new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: "Title of the Invention", underline: {}, font: "Calibri", size: 20, color: DARK })] }),
      para("System and Method for Artificial Intelligence-Based Anti-Hijack Detection, Journey Integrity Monitoring, Secure Vehicle Authorization, Protected Immobilization, Authenticated Reactivation, Multi-Device Correlation, Adaptive Emergency Communication, Predictive Threat Intelligence, Anti-Jamming Communication Resilience, and Tamper-Resilient Evidence Preservation"),

      // Applicant
      new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: "Applicant", underline: {}, font: "Calibri", size: 20, color: DARK })] }),
      para("David Cameron\n41 Rooigras Avenue\n73 Tiffani Gardens\nBassonia\n2090\nJohannesburg\n+27 84 444 6001\nRepublic of South Africa"),

      divider(),

      // ABSTRACT
      heading("Abstract"),
      para("A system and method for protecting a vehicle and its occupant by learning driver-specific behaviour, monitoring planned, shared, selected, or inferred journeys, correlating signals from an in-vehicle device, a handset, and optionally a wearable device, and detecting anomalous conditions indicative of hijacking, coercion, theft, tampering, signal jamming, or unauthorized startup. The system may determine an authorization state based on one or more trusted credentials and tamper-related signals, place the vehicle in a protected immobilized state when authorization is absent, invalid, or compromised, and permit authenticated reactivation only after verified satisfaction of one or more reactivation conditions. An adaptive communication orchestration engine dynamically selects, ranks, or combines multiple communication pathways including cellular, Bluetooth, Wi-Fi, mesh, sub-GHz, store-and-forward, or delayed-burst channels to maintain emergency capability under degraded or jammed communication conditions. A predictive threat intelligence module analyses historical incident data, hotspot patterns, and behavioural baselines to generate proactive route-risk assessments and pre-journey safety recommendations. A tamper-resilient evidence preservation module cryptographically secures forensic data for post-incident investigation, insurance claim support, and legal proceedings."),
      divider(),

      // FIELD
      heading("Field of the Invention"),
      para("The present invention relates to vehicle security systems, journey monitoring systems, intelligent authorization systems, and emergency communication platforms."),
      para("More specifically, the invention relates to artificial intelligence systems capable of learning driver behaviour, monitoring journey integrity, correlating signals from a vehicle, a mobile handset, and optionally a wearable device, detecting unauthorized startup, signal jamming, or tampering conditions, and initiating adaptive anti-hijack and emergency response actions."),
      para("The invention further relates to secure authorization and immobilization methods in which valid operation of a vehicle is conditioned upon the existence of a verified authorization state and the absence of tamper-related anomalies."),
      para("The invention further relates to predictive threat intelligence methods wherein historical crime data, geographic risk profiles, and driver behavioural baselines are correlated to generate proactive safety assessments and dynamic route recommendations."),
      para("The invention further relates to anti-jamming communication resilience methods wherein signal interference is detected or inferred, local decision capability is preserved, and transmissions are routed through fallback pathways including store-and-forward or delayed-burst channels."),
      divider(),

      // DEFINITIONS
      heading("Definitions"),
      defn("Vehicle Device", "An in-vehicle electronic device installed in or associated with a vehicle and configured to collect, process, transmit, or store vehicle-related data."),
      defn("Driver Behaviour Profile", "A data-driven representation of normal or expected behaviour of a specific driver, including route choices, timing patterns, speed tendencies, stop tendencies, acceleration tendencies, or any combination thereof."),
      defn("Journey Integrity", "The degree to which live vehicle movement corresponds with an intended, selected, shared, or inferred journey."),
      defn("Threat Score", "A computed risk value derived from one or more contextual signals and used to classify the likelihood or severity of distress, hijack, tamper, theft, coercion, unauthorized activity, or signal interference."),
      defn("Communication Pathway", "Any channel, interface, network, or relay mechanism by which the platform may transmit or receive data, including cellular, Bluetooth, Wi-Fi, mesh, sub-GHz, or equivalent pathways."),
      defn("Communication Orchestration Engine", "A computational module configured to evaluate available communication pathways and select, rank, combine, or sequence pathways for one or more transmissions."),
      defn("Trusted Device", "A mobile phone, wearable, vehicle component, key credential, tag, or other authorised device recognised by the platform as being associated with an authorised user."),
      defn("Wearable Device", "A smartwatch, smart band, biometric wearable, or other body-associated electronic device capable of providing one or more signals relating to presence, pairing, body contact, motion, biometrics, user input, or location."),
      defn("Correlation Engine", "A module configured to combine signals from two or more sources, including vehicle, phone, wearable, cloud, key, or route context, in order to classify a condition or determine a response."),
      defn("Covert Emergency Mode", "An operating state in which one or more security actions are activated without requiring visible driver interaction."),
      defn("Driver-Vehicle Separation Event", "A detected condition in which the vehicle and a trusted device associated with the driver diverge geographically or behaviourally beyond an expected threshold."),
      defn("High-Risk Zone", "A geographic or contextual condition associated with increased vulnerability to vehicle crime, hijacking, isolation risk, or other security threats."),
      defn("Authorization State", "A machine-determined state indicating whether one or more valid authorization conditions exist for vehicle startup, operability, reactivation, or continued use."),
      defn("Trusted Credential", "A key transponder, OEM immobilizer credential, secure token, paired handset, paired wearable, cryptographic secret, server-issued authorization code, biometric confirmation, or other credential recognised as satisfying at least part of an authorization condition."),
      defn("Protected Immobilized State", "A recoverable secured state in which startup or selected vehicle functions are inhibited, while preserving tamper records, alert functionality, or reactivation controls."),
      defn("Authenticated Reactivation", "A controlled process by which a protected immobilized state is removed after verified presentation of one or more trusted credentials, tokens, confirmations, or service authorizations."),
      defn("Startup Sequence Anomaly", "An irregular ignition, ECU, CAN bus, credential, or related sequence indicative of bypass, tampering, unauthorized activation, or abnormal startup behaviour."),
      defn("Tamper Event", "Any detected physical, electrical, logical, software, firmware, or communication-layer interference with the vehicle, the vehicle device, the ECU, wiring, sensors, or associated components."),
      defn("Secure Authorization Layer", "A hardware, software, or hybrid subsystem configured to determine the authorization state and control startup, lockout, or reactivation behaviour."),
      defn("Predictive Threat Intelligence", "Analytical insights generated from historical incident data, geographic crime patterns, temporal risk profiles, and driver behavioural baselines, used to forecast elevated risk conditions before they materialise."),
      defn("Signal Interference Event", "A condition in which one or more communication or location channels are degraded, denied, jammed, spoofed, or rendered unreliable beyond normal environmental variation."),
      defn("Anti-Jamming Communication Resilience Layer", "A subsystem configured to detect or infer signal interference, preserve local decision capability, switch among primary and fallback communication paths, perform store-and-forward or delayed-burst transmission, and preserve forensic records during degraded connectivity."),
      defn("Geofenced Behavioural Anomaly", "An anomalous driver or vehicle behaviour that is classified differently depending on the geographic context in which it occurs, enabling location-aware threat sensitivity adjustment."),
      defn("Tamper-Resilient Evidence Record", "A cryptographically secured, timestamped record of forensic data including location breadcrumbs, audio captures, tamper logs, and communication attempts, preserved for post-incident investigation, insurance claims, or legal proceedings."),
      defn("Occupant Duress Indicator", "A physiological, behavioural, or environmental signal from one or more sensors — including heart rate elevation, skin conductance change, voice stress pattern, or abnormal inactivity — that may indicate the vehicle occupant is under coercion or distress."),
      defn("Cargo Integrity Module", "A subsystem configured to monitor cargo-related sensors including door-open events, weight changes, temperature deviations, or seal-break detections and to correlate cargo anomalies with vehicle security events."),
      defn("Multi-Vehicle Coordinated Response", "A fleet or community capability wherein multiple vehicles on the same network coordinate response actions during a security event, including relay communication, witness data capture, or convoy integrity monitoring."),
      divider(),

      // BACKGROUND
      heading("Background of the Invention"),
      para("Vehicle hijacking, coercive vehicle diversion, vehicle theft, signal interference, and unauthorized startup remain significant safety and asset-protection risks in many regions. South Africa alone records over 16,000 vehicle hijackings annually, with logistics vehicles and commercial fleets facing disproportionate risk due to cargo value and predictable route patterns."),
      para("Conventional vehicle tracking systems typically rely on GPS and cellular communication, often require manual panic-button activation, and frequently become less effective when a driver cannot safely interact with a device or when a communication jammer is present. Signal jamming devices are increasingly accessible and are commonly deployed during hijacking incidents to defeat standard cellular-based tracking."),
      para("Known immobilizer and key-based systems generally verify only a limited startup credential and may not correlate route context, vehicle telemetry, trusted-device presence, or startup-sequence anomalies to determine whether a broader threat condition exists."),
      para("Known family-tracking applications may provide route visibility but do not generally learn each driver over time, correlate signals from vehicle, handset, and wearable devices, classify route deviations under threat conditions, or control a protected immobilization and authenticated reactivation workflow."),
      para("Existing vehicle security systems do not generate predictive threat intelligence based on historical crime data correlated with driver-specific behavioural patterns, geographic risk profiles, and temporal risk windows. There is no known prior art describing a system that proactively adjusts detection sensitivity and route recommendations based on predictive risk assessments generated from aggregated incident intelligence."),
      para("Furthermore, existing systems do not provide tamper-resilient forensic evidence preservation with cryptographic integrity verification suitable for insurance claim substantiation and legal proceedings. There is no known prior art describing a vehicle security platform that autonomously generates court-admissible evidence packages from multi-source sensor data captured during a security incident."),
      para("Existing systems do not detect or respond to signal jamming as a security indicator. There is no known prior art describing a vehicle security system that treats simultaneous degradation of multiple communication channels as a threat signal, maintains local AI decision capability during communication denial, and autonomously routes alerts through fallback pathways including store-and-forward or delayed-burst transmission."),
      para("There is accordingly a need for a more capable anti-hijack platform that may learn behaviour over time, monitor journey integrity, detect unauthorized startup or tampering conditions, correlate multi-device signals, survive degraded communications, execute controlled responses including protected immobilization and authenticated reactivation, generate predictive threat intelligence, preserve tamper-resilient forensic evidence, and coordinate fleet-level security responses."),
      divider(),

      // SUMMARY
      heading("Summary of the Invention"),
      para("The present invention provides a vehicle security platform comprising:"),
      bullet("an in-vehicle electronic device, an artificial intelligence processor, a journey-monitoring module, and a communication module configured for one or more communication pathways;"),
      bullet("driver-specific behavioural learning and journey integrity monitoring for planned, shared, selected, or inferred journeys;"),
      bullet("multi-device correlation across vehicle, handset, wearable, key, route context, and optional cloud inputs;"),
      bullet("a secure authorization layer configured to determine an authorization state and to place the vehicle in a protected immobilized state when authorization is absent, invalid, or compromised;"),
      bullet("authenticated reactivation only after verified satisfaction of one or more reactivation conditions;"),
      bullet("predictive threat intelligence using historical incident data, temporal risk windows, and route-risk forecasting;"),
      bullet("an anti-jamming communication resilience layer configured to detect signal interference, preserve local decision support, and switch among primary and fallback pathways including store-and-forward or delayed-burst transmission;"),
      bullet("a tamper-resilient evidence preservation module configured to cryptographically secure forensic data and generate incident packages;"),
      bullet("a geofenced behavioural anomaly engine that autonomously adjusts detection sensitivity based on real-time geographic risk context;"),
      bullet("an occupant duress detection capability using physiological and behavioural indicators from wearable or in-vehicle sensors;"),
      bullet("a cargo integrity monitoring module configured to correlate cargo anomalies with vehicle security events;"),
      bullet("a self-improving intelligence pipeline wherein detection models autonomously improve through accumulated journey data, verified incidents, and operator corrections;"),
      bullet("a multi-vehicle coordinated response capability for fleet and community deployments."),
      divider(),

      // SYSTEM OVERVIEW
      heading("System Overview"),
      para("The anti-hijack platform may include the following modules and components:"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Module", true, BLUE), cell("Purpose", true, BLUE)] }),
          new TableRow({ children: [cell("In-vehicle AI device"), cell("Local capture, processing, tamper sensing, and decision support")] }),
          new TableRow({ children: [cell("Driver and trusted-contact applications"), cell("Journey setup, trip sharing, event review, escalation visibility")] }),
          new TableRow({ children: [cell("Communication orchestration engine"), cell("Adaptive multi-path emergency communication and failover")] }),
          new TableRow({ children: [cell("Secure authorization layer"), cell("Startup validation, protected lockout, authenticated reactivation")] }),
          new TableRow({ children: [cell("Predictive threat intelligence module"), cell("Pre-journey risk scoring, route recommendations, dynamic sensitivity")] }),
          new TableRow({ children: [cell("Anti-jamming communication resilience layer"), cell("Interference detection, path failover, delayed transmission, evidence preservation")] }),
          new TableRow({ children: [cell("Evidence preservation module"), cell("Cryptographic evidence capture, sync, reconstruction, claim support")] }),
          new TableRow({ children: [cell("Geofenced anomaly engine"), cell("Location-aware detection threshold adjustment")] }),
          new TableRow({ children: [cell("Occupant duress detection module"), cell("Physiological and behavioural distress indicators from wearable/in-vehicle sensors")] }),
          new TableRow({ children: [cell("Cargo integrity module"), cell("Door, weight, temperature, and seal monitoring correlated with security events")] }),
          new TableRow({ children: [cell("Self-improving model pipeline"), cell("Autonomous detection accuracy improvement from accumulated data")] }),
          new TableRow({ children: [cell("Multi-vehicle coordination engine"), cell("Fleet-level coordinated response, relay communication, convoy integrity")] }),
          new TableRow({ children: [cell("Response policy engine"), cell("Stage-based action selection and escalation")] }),
          new TableRow({ children: [cell("Voice/audio interface"), cell("Route-risk prompts, covert distress phrase recognition")] }),
        ],
      }),
      divider(),

      // BRIEF DESCRIPTION OF DRAWINGS
      heading("Brief Description of the Drawings"),
      para("Figure 1 illustrates an example overall platform architecture."),
      para("Figure 2 illustrates an example communication architecture with multiple fallback channels."),
      para("Figure 3 illustrates an example artificial intelligence detection pipeline."),
      para("Figure 4 illustrates an example learning feedback loop for driver behavioural modelling."),
      para("Figure 5 illustrates an example in-vehicle device hardware architecture."),
      para("Figure 6 illustrates an example wearable, phone, and vehicle correlation engine."),
      para("Figure 7 illustrates an example voice-trigger emergency workflow."),
      para("Figure 8 illustrates an example journey-monitoring and risk-reclassification workflow."),
      para("Figure 9 illustrates an example response policy engine with staged escalation."),
      para("Figure 10 illustrates an example anomaly scenario involving route deviation and trusted-device changes."),
      para("Figure 11 illustrates an example startup authorization, protected lockout, and authenticated reactivation flow."),
      para("Figure 12 illustrates an example predictive threat intelligence pipeline."),
      para("Figure 13 illustrates an example tamper-resilient evidence preservation and forensic reconstruction workflow."),
      para("Figure 14 illustrates an example anti-jamming communication resilience workflow."),
      para("Figure 15 illustrates an example self-improving detection model pipeline."),
      para("Figure 16 illustrates an example occupant duress detection and correlation workflow."),
      para("Figure 17 illustrates an example multi-vehicle coordinated response architecture."),
      divider(),

      // DETAILED DESCRIPTION
      heading("Detailed Description of the Invention"),

      h2("1. In-Vehicle AI Device (refer FIG 1 and FIG 5)"),
      para("The system includes a concealed or otherwise installed in-vehicle electronic device configured to capture location, motion, telemetry, and communication-related data. The device may be OEM integrated, ECU associated, or implemented as a hardened secondary module. The device may include one or more processors, secure storage, one or more radios, one or more sensors, optional backup power, and one or more interfaces to vehicle systems including CAN, OBD, or equivalent interfaces."),

      h2("2. Driver Behaviour Learning (refer FIG 3 and FIG 4)"),
      para("The artificial intelligence processor records historical journey data and constructs driver-specific behavioural profiles. Learning may include route preferences, departure timing, arrival timing, stop tendencies, braking style, acceleration style, typical trip durations, and normal contexts of use. Profiles may be maintained separately for multiple authorised drivers."),

      h2("3. Journey Monitoring and Live Route Following (refer FIG 1, FIG 3 and FIG 8)"),
      para("A driver may define an intended journey in a mobile application, including home, school, work, or a custom route, or the system may infer an expected route from prior behaviour. The platform may share journey progress with one or more trusted contacts. Real-time movement may be compared with the expected route or destination progress in order to classify a journey state."),

      h2("4. Route Deviation and Irregular Movement Detection (refer FIG 3, FIG 8 and FIG 10)"),
      para("The platform analyses route deviations, abnormal detours, prolonged stationary periods, repeated circling, movement into isolated or high-risk areas, unusual speed changes, or inconsistent arrival behaviour. Deviations may be classified as benign, irregular, suspicious, or high-risk according to context such as traffic, route-risk data, and behavioural history."),

      h2("5. Wearable and Handset Correlation Layer (refer FIG 6 and FIG 10)"),
      para("In some embodiments the platform integrates signals from a mobile handset and one or more wearable devices associated with a driver. Wearable-device signals may include location, motion, body-contact state, pairing state, biometric information, user gesture, button input, or voice input. The correlation engine may determine that a condition is more likely serious when route deviation is combined with handset loss, wearable removal, separation, or a biometrically unusual state."),

      h2("6. Threat Detection and Scoring (refer FIG 3, FIG 6 and FIG 10)"),
      para("The platform computes a threat score based on weighted combinations of signals. Example contributing signals may include route deviation, behaviour deviation, communication interference, hotspot context, wearable removal, handset-offline state, driver-vehicle separation, distress phrase detection, tamper signals, occupant duress indicators, cargo integrity violations, or startup-sequence anomalies. The threat score may be used to select a response stage."),

      h2("7. Communication Orchestration (refer FIG 2)"),
      para("The communication orchestration engine evaluates available communication pathways and selects, sequences, or combines one or more pathways according to expected reliability, latency, stealth, power cost, and threat context. Pathways may include cellular communication, Bluetooth relay to nearby devices, Wi-Fi offload, mesh or sub-GHz transmission, store-and-forward delivery, or cloud-assisted routing."),

      h2("8. Voice Activated Emergency Mode (refer FIG 7)"),
      para('The system may include a voice-recognition component capable of detecting a predefined distress phrase such as "activate hijack mode" or another covert phrase. Upon detection the platform may silently increase monitoring, initiate covert emergency mode, or cause one or more communications or tracking actions to occur without visible driver interaction.'),

      h2("9. Secure Authorization and Protected Immobilization Layer (refer FIG 11)"),
      para("The platform may determine an authorization state for startup, operability, or reactivation based on one or more trusted credentials and one or more anomaly or tamper indicators. Trusted credentials may include a key transponder, OEM immobilizer credential, secure handset token, wearable token, or cryptographic secret. Tamper indicators may include missing credential state, abnormal startup sequence, unauthorized ignition pattern, ECU or CAN anomalies, bypass attempts, or physical tamper signals."),
      para("When the authorization state is absent, invalid, or compromised, the platform may place the vehicle in a protected immobilized state. In the protected immobilized state the platform may inhibit startup, inhibit selected vehicle functions, maintain tamper logs, preserve alert capability, and initiate one or more notifications. The protected immobilized state is preferably recoverable rather than destructive."),
      para("The platform may permit authenticated reactivation only after verified satisfaction of one or more reactivation conditions. Such conditions may include return of a valid credential, owner confirmation, trusted-device confirmation, service-agent confirmation, server-side approval, one-time token validation, or a combination thereof. In preferred embodiments, reactivation events are logged and previously used reactivation tokens are invalidated after use."),

      h2("10. Response Policy Engine (refer FIG 9)"),
      para("The response policy engine may execute staged actions. A first stage may increase monitoring or logging. A second stage may request a discreet verification or confirmation event. A third stage may alert one or more trusted contacts. A fourth stage may trigger covert tracking, communication escalation, or responder notification. In authorization-related conditions, the selected stage may include startup inhibition, protected immobilization, or authenticated reactivation workflow management."),

      h2("11. Route Risk Intelligence (refer FIG 8)"),
      para("The platform may consume hotspot data, congestion data, route isolation indicators, historical incident patterns, or similar context in order to generate route-risk scores. Such scores may adjust recommendations, alert timing, or threat classification."),

      h2("12. Learning Feedback and Model Update (refer FIG 4 and FIG 15)"),
      para("Behavioural models may be updated over time using additional journey history, verified false positives, verified incidents, operator feedback, or trusted-contact confirmation. Updated behavioural models may improve classification accuracy and reduce false positives. The model improvement pipeline operates autonomously, retraining detection models after each journey or at scheduled intervals without requiring human-initiated training cycles."),

      h2("13. Predictive Threat Intelligence Module (refer FIG 12)"),
      para("The system includes a predictive threat intelligence module that generates proactive risk assessments before and during journeys. The predictive module operates as follows:"),
      boldPara("Historical Incident Correlation"),
      para("The system aggregates anonymised historical vehicle crime data including hijacking incidents, theft hotspots, and carjacking patterns by geographic area, time of day, day of week, and seasonal trends. This data is correlated with the driver's planned or inferred route to generate a pre-journey risk assessment."),
      boldPara("Dynamic Risk Scoring"),
      para("During a journey, the predictive module continuously recalculates risk based on real-time signals including current geographic position relative to known hotspots, time-of-day risk factors, traffic density changes, and deviation from safe corridors. The dynamic risk score may trigger preemptive escalation of monitoring sensitivity before an incident is detected."),
      boldPara("Proactive Route Recommendations"),
      para("When the predictive module identifies an elevated risk corridor on a planned route, it may generate alternative route recommendations that maintain journey efficiency while reducing exposure to high-risk zones. Recommendations may be presented to the driver via the mobile application or voice interface."),
      boldPara("Temporal Risk Windows"),
      para("The module identifies recurring temporal patterns in crime data — for example, elevated hijacking risk during specific hours at specific intersections — and adjusts detection thresholds and alert readiness during those windows without requiring manual configuration."),
      boldPara("Fleet and Community Intelligence"),
      para("In fleet or community deployments, anonymised threat intelligence may be aggregated across multiple vehicles to generate real-time risk maps that benefit all participants, creating a network effect where each additional vehicle improves the collective intelligence available to all users."),

      h2("14. Anti-Jamming Communication Resilience Layer (refer FIG 14)"),
      para("The system includes an anti-jamming communication resilience layer that detects or infers signal interference and maintains emergency capability during degraded communications. The anti-jamming layer operates as follows:"),
      boldPara("Interference Detection"),
      para("The system monitors communication quality, signal strength, signal-to-noise ratio, GNSS availability, radio health, and channel consistency across all available communication pathways. When simultaneous degradation of multiple channels is detected — particularly when correlated with continued vehicle motion — the system flags a signal interference event. The system distinguishes between ordinary signal loss (e.g., tunnel, rural area) and deliberate jamming by correlating radio degradation patterns with motion, route, and telemetry data."),
      boldPara("Local Decision Preservation"),
      para("During a signal interference event, the system preserves local AI decision capability on the in-vehicle device. Anomaly scoring, threat classification, and evidence capture continue without cloud connectivity. The in-vehicle processor maintains autonomous operation capability for the duration of the interference event."),
      boldPara("Fallback Path Selection"),
      para("When the primary communication pathway (typically cellular) is degraded, the system selects, sequences, or combines fallback pathways. Fallback options may include Bluetooth relay to nearby devices, Wi-Fi offload to available access points, mesh or sub-GHz radio transmission, or store-and-forward delivery wherein alerts are stored locally and transmitted when a usable communication window is detected."),
      boldPara("Dead Reckoning During GNSS Loss"),
      para("When GNSS (GPS) signals are jammed or spoofed, the system derives interim position and movement estimates from inertial sensors, vehicle-bus speed data, compass heading, and pre-incident trajectory extrapolation. Dead-reckoning data is included in the forensic evidence record."),
      boldPara("Delayed-Burst Alert Transmission"),
      para("When all real-time communication pathways are blocked, the system stores alerts, evidence, and status data locally. It continuously probes for available communication windows. When a temporary connectivity opportunity is detected — even briefly — the system performs a delayed-burst transmission, sending compressed critical data in the shortest possible time."),

      h2("15. Tamper-Resilient Evidence Preservation Module (refer FIG 13)"),
      para("The system includes a tamper-resilient evidence preservation module that autonomously captures, secures, and preserves forensic data during and after security incidents. The evidence module operates as follows:"),
      boldPara("Cryptographic Evidence Integrity"),
      para("All forensic data captured during a security incident — including location breadcrumbs, audio recordings, tamper logs, communication attempts, and sensor readings — is cryptographically hashed and timestamped to establish chain-of-custody integrity. Evidence records cannot be modified after capture without invalidating the cryptographic hash."),
      boldPara("Multi-Source Evidence Correlation"),
      para("The module correlates evidence from multiple sources including vehicle telemetry, handset location history, wearable data, communication logs, and external data feeds to construct a comprehensive incident timeline."),
      boldPara("Automated Incident Reconstruction"),
      para("Following a security incident, the module autonomously generates a structured incident report comprising a chronological timeline of events, geographic track data, threat score progression, communication attempts, response actions taken, and tamper events detected."),
      boldPara("Insurance Claim Support"),
      para("Evidence packages generated by the module are structured to meet common insurance claim documentation requirements, including timestamped proof of vehicle location, proof of unauthorized access or tamper, proof of immobilization activation, and proof of communication attempts to emergency services."),
      boldPara("Secure Cloud Synchronisation"),
      para("Forensic evidence is synchronised to secure cloud storage when communication pathways are available, ensuring evidence survival even if the in-vehicle device is physically destroyed or removed. Evidence synchronisation uses end-to-end encryption and may utilise opportunistic connectivity windows."),

      h2("16. Geofenced Behavioural Anomaly Engine"),
      para("The system includes a geofenced behavioural anomaly engine that autonomously adjusts detection sensitivity and threat classification based on real-time geographic context."),
      boldPara("Location-Aware Sensitivity"),
      para("Detection thresholds for route deviation, speed anomalies, and stop duration are adjusted based on the current geographic risk profile. The same behaviour that is classified as benign in a low-risk area may be classified as suspicious or high-risk in a known crime hotspot."),
      boldPara("Dynamic Geofence Learning"),
      para("The system autonomously learns and updates geofence boundaries based on aggregated incident data, emerging crime patterns, and community intelligence feeds. Geofences are not limited to predefined static boundaries but evolve as risk landscapes change."),
      boldPara("Context-Aware False Positive Reduction"),
      para("By incorporating geographic context into anomaly classification, the engine reduces false positive rates in low-risk environments while maintaining heightened sensitivity in high-risk zones, resulting in a more accurate and less intrusive user experience."),

      h2("17. Occupant Duress Detection Module (refer FIG 16)"),
      para("The system includes an occupant duress detection module that identifies physiological and behavioural indicators of coercion or distress without requiring the occupant to take any deliberate action."),
      boldPara("Physiological Distress Indicators"),
      para("When a wearable device is present, the system monitors heart rate, heart rate variability, skin conductance (galvanic skin response), and body temperature. Sudden physiological changes — particularly elevated heart rate combined with route deviation or unexpected stop — contribute to the threat score as an occupant duress indicator."),
      boldPara("Voice Stress Analysis"),
      para("The system may analyse voice patterns from in-vehicle microphones or phone calls to detect stress indicators including pitch elevation, speech rate changes, tremor, or atypical silence patterns. Voice stress analysis operates passively and does not require the driver to speak a specific phrase."),
      boldPara("Behavioural Inactivity Detection"),
      para("The system monitors expected driver interactions — such as phone movement, wearable motion, or steering input — and flags abnormal periods of inactivity that may indicate the driver is incapacitated, restrained, or no longer in control of the vehicle."),

      h2("18. Cargo Integrity Monitoring Module"),
      para("For commercial and logistics deployments, the system includes a cargo integrity monitoring module that detects cargo-related anomalies and correlates them with vehicle security events."),
      boldPara("Cargo Sensor Integration"),
      para("The module integrates with cargo door sensors, weight sensors, temperature sensors, and electronic seal monitors. Cargo anomalies — such as an unexpected door opening while the vehicle is in motion, a sudden weight decrease during transit, or a seal break — are treated as security indicators and contribute to the threat score."),
      boldPara("Correlation with Vehicle Events"),
      para("Cargo anomalies are correlated with vehicle position, route deviation, and communication status. A door-open event during an unscheduled stop in a high-risk area generates a significantly higher threat score than a door-open event at a designated delivery point."),
      boldPara("Cargo Chain-of-Custody Evidence"),
      para("The evidence preservation module extends to cargo events, capturing timestamped records of cargo sensor data, door access events, weight changes, and temperature deviations. This data is included in forensic evidence packages for cargo theft insurance claims."),

      h2("19. Multi-Vehicle Coordinated Response (refer FIG 17)"),
      para("In fleet or community deployments, the system supports coordinated security response across multiple vehicles on the same network."),
      boldPara("Proximity Alert Relay"),
      para("When a vehicle generates a high-threat alert, nearby vehicles on the same network receive a proximity warning. This enables convoy vehicles to take evasive action or nearby fleet vehicles to serve as communication relays when the affected vehicle's communications are jammed."),
      boldPara("Witness Data Capture"),
      para("Nearby fleet vehicles may autonomously capture environmental data — including their own camera feeds, GPS positions, and sensor readings — when a proximate security event is detected. This witness data is correlated with the primary incident and included in the evidence package."),
      boldPara("Convoy Integrity Monitoring"),
      para("For fleet deployments operating in convoy, the system monitors inter-vehicle spacing, relative positions, and communication health. If a vehicle drops out of the convoy unexpectedly — particularly when combined with communication loss — the system escalates the event immediately."),

      h2("20. Self-Improving Detection Intelligence (refer FIG 15)"),
      para("The system includes a self-improving intelligence pipeline that autonomously enhances detection accuracy over time."),
      boldPara("Autonomous Model Retraining"),
      para("Detection models are periodically retrained using accumulated journey data, verified incident outcomes, false positive confirmations, and operator corrections. Retraining occurs autonomously without human-initiated training cycles, ensuring the system continuously adapts to evolving threat patterns."),
      boldPara("Autonomous Pattern Discovery"),
      para("The system analyses the aggregate intelligence dataset to autonomously detect emerging patterns — including new crime corridors, shifting temporal risk profiles, and previously unidentified behavioural indicators of hijacking — without requiring human definition of the patterns to be detected."),
      boldPara("Compounding Intelligence Advantage"),
      para("Each journey processed by the system increases the depth and accuracy of subsequent analysis. The system autonomously refines detection thresholds, scoring weights, and geofence boundaries based on accumulated data, creating a compounding intelligence advantage that becomes more valuable with each vehicle and journey added to the network."),

      h2("21. Best Method of Performing the Invention"),
      para("In a preferred embodiment, the invention is implemented as an OEM-integrated or hardened in-vehicle security module with secure storage, local AI inference, backup power, CAN or OBD integration, and multiple radios. The preferred authorization workflow uses at least one trusted credential together with startup-sequence analysis and tamper indicators to determine an authorization state, after which the vehicle either enters a normal operable state or a protected immobilized state. The preferred reactivation workflow uses one or more verified credentials and a logged, recoverable token-based reactivation process. The preferred evidence workflow uses cryptographic hashing and timestamping with opportunistic secure cloud synchronisation. The preferred anti-jamming workflow uses local interference detection, fallback-path selection, dead-reckoning during GNSS loss, and opportunistic store-and-forward or delayed-burst alert transmission. The preferred occupant duress detection uses wearable heart-rate and voice stress analysis correlated with vehicle movement data."),

      h2("22. Industrial Applicability"),
      para("The invention is industrially applicable to private passenger vehicles, high-risk commuter vehicles, family safety deployments, school transport, fleet management, logistics fleets, cross-border freight, insurer-linked telematics, rental vehicles, executive protection, cash-in-transit operations, and security-company supported response platforms. The invention may be implemented wholly on-device, wholly in a remote platform, or in hybrid form."),

      h2("23. Alternative Implementations"),
      para("The systems and methods described in this specification may be implemented using a variety of computational architectures and analytical techniques."),
      para("The artificial intelligence analysis engines described herein may operate using machine learning models, neural networks, natural language processing systems, large language models, rule-based systems, statistical models, hybrid analytical systems, or equivalent computational mechanisms capable of analysing vehicle, driver, and environmental signals."),
      para("The predictive threat intelligence module may consume data from public crime databases, private security intelligence feeds, insurance industry incident databases, community reporting platforms, or equivalent data sources."),
      para("The tamper-resilient evidence preservation module may store evidence locally on secure storage within the in-vehicle device, in secure cloud storage, or in both locations simultaneously."),
      para("The communication orchestration engine may utilise any signaling protocol including but not limited to cellular (4G/5G/LTE), Bluetooth Low Energy, Wi-Fi, LoRa, sub-GHz ISM band, satellite (LEO/GEO), or equivalent communication mechanisms."),
      para("The specific examples described in this specification are provided for illustrative purposes and should not be interpreted as limiting the scope of the invention to any particular technology, platform, deployment model, or implementation approach."),

      h2("24. Future Embodiments"),
      para("The system may integrate with autonomous vehicle control systems to execute safe-stop or safe-harbour manoeuvres when a critical threat is confirmed."),
      para("The system may integrate with smart-city infrastructure including traffic camera networks, ANPR (automatic number plate recognition) systems, and municipal emergency response platforms."),
      para("Communication signals may be extended to include satellite communication (LEO constellation) for operation in areas with no terrestrial cellular coverage."),
      para("The predictive threat intelligence module may consume real-time social media feeds, crowd-sourced incident reports, and emergency service dispatch data to enhance risk assessment timeliness."),
      divider(),

      // EXAMPLE EMBODIMENTS
      heading("Example Embodiments"),
      para("In one embodiment, a driver begins a monitored journey from home to work, shares the trip with a trusted contact, and the system tracks expected route progression. The vehicle then deviates toward a high-risk area, threat score increases, and the platform sends covert alerts while maintaining tracking."),
      para("In another embodiment, the vehicle continues moving while the driver's mobile handset unexpectedly goes offline and the driver's wearable indicates removal or loss of body contact. The correlation engine classifies the condition as high-risk and the response policy engine escalates alerts."),
      para("In a further embodiment, the vehicle route continues toward an unexpected destination while the wearable location diverges from the vehicle route, thereby indicating a potential driver-vehicle separation event. The platform escalates notifications and preserves location breadcrumbs for both vehicle and associated trusted-device data."),
      para('In yet another embodiment, the driver speaks a predefined covert phrase while the vehicle is stopped at an unexpected location. The platform triggers covert emergency mode and transmits alerts through one or more selected communication pathways.'),
      para("In a further embodiment relating to startup security, a startup attempt occurs in the absence of a valid trusted credential and in the presence of an abnormal startup sequence on the vehicle bus. The authorization state is determined to be invalid, the platform places the vehicle in a protected immobilized state, and one or more tamper alerts are sent. Subsequent authenticated reactivation is permitted only after verification of a trusted credential and a valid reactivation condition."),
      para("In a further embodiment relating to predictive intelligence, the system analyses historical crime data and identifies that a driver's regular evening commute route passes through an intersection with elevated hijacking risk between 18:00 and 20:00. The system generates a pre-journey notification recommending an alternative route during those hours and increases detection sensitivity when the driver approaches that area."),
      para("In a further embodiment relating to evidence preservation, during a hijacking incident the system autonomously captures vehicle location breadcrumbs at increased frequency, records ambient audio, logs all tamper events and communication attempts, cryptographically secures all captured data, and synchronises the evidence package to secure cloud storage. Following the incident, the system generates an automated incident reconstruction report suitable for insurance claims and law enforcement investigation."),
      para("In a further embodiment relating to signal jamming, a signal jammer causes simultaneous GNSS degradation and cellular collapse while vehicle motion sensors indicate continued movement. The system flags a signal interference event, switches to a Bluetooth relay fallback pathway, stores forensic records locally, derives interim movement estimates from inertial and vehicle-bus data, and transmits delayed-burst alerts once a usable communication window is detected."),
      para("In a further embodiment relating to occupant duress, the driver's wearable detects a sudden elevation in heart rate and skin conductance concurrent with a route deviation toward a known crime hotspot. The system correlates the physiological duress indicators with the route and location signals, classifies the condition as high-risk, and escalates alerts without requiring any action from the driver."),
      para("In a further embodiment relating to cargo integrity, a logistics vehicle's cargo door sensor detects an unauthorised opening while the vehicle is stopped at an unscheduled location in an industrial area at 22:00. The system correlates the cargo breach with the unscheduled stop, high-risk location, and time-of-day risk factor, generates a critical alert to the fleet control room, and captures timestamped evidence of the cargo breach event."),
      para("In a further embodiment relating to multi-vehicle coordination, a convoy of three fleet vehicles is operating on a cross-border route. The lead vehicle detects signal jamming and route deviation. The system relays the alert through the second vehicle's cellular connection via Bluetooth, enabling the fleet control room to receive the alert despite the primary vehicle's communications being blocked. The trailing vehicles autonomously capture witness GPS and sensor data correlated with the incident."),
      divider(),

      // ADVANTAGES
      heading("Advantages of the Invention"),
      bullet("improved early detection of hijack or coercive diversion by combining behavioural learning with route monitoring"),
      bullet("reduced false positives through multi-signal correlation across vehicle, handset, wearable, and context data"),
      bullet("continued emergency capability under degraded communication conditions through adaptive pathway selection"),
      bullet("support for discreet activation and silent escalation where a driver cannot safely press a panic button"),
      bullet("support for protected immobilization and authenticated reactivation in unauthorized startup or tamper scenarios"),
      bullet("proactive threat avoidance through predictive intelligence and dynamic route recommendations"),
      bullet("tamper-resilient forensic evidence with cryptographic integrity for insurance and legal proceedings"),
      bullet("autonomous geofenced sensitivity adjustment reducing false positives while maintaining vigilance in high-risk zones"),
      bullet("enhanced resilience against communication jamming through interference detection, fallback channels, and delayed-burst recovery"),
      bullet("passive occupant duress detection using physiological and behavioural indicators without requiring driver action"),
      bullet("cargo integrity monitoring with correlation to vehicle security events for logistics and commercial fleet protection"),
      bullet("multi-vehicle coordinated response enabling relay communication, witness data capture, and convoy integrity monitoring"),
      bullet("self-improving detection models that autonomously increase accuracy with each journey and incident processed"),
      bullet("network intelligence effects in fleet and community deployments where each vehicle strengthens collective security"),
      bullet("broad applicability to consumer, family, school transport, fleet, logistics, insurer, and security use cases"),
      divider(),

      // CLAIMS
      heading("Claims"),

      h2("System Claims:"),
      claimPara("1. A vehicle security platform comprising: an in-vehicle electronic device; an artificial intelligence processor associated with the in-vehicle electronic device; a journey-monitoring module; and a communication module configured for one or more communication pathways, wherein the artificial intelligence processor is configured to detect anomalous or distress-related conditions associated with a vehicle journey."),
      claimPara("2. The platform of claim 1, wherein the artificial intelligence processor is configured to learn driver-specific behavioural patterns from historical driving data."),
      claimPara("3. The platform of claim 1 or claim 2, wherein the historical driving data includes one or more of route history, timing history, braking behaviour, acceleration behaviour, stop patterns, or trip durations."),
      claimPara("4. The platform of any one of the preceding claims, wherein the platform is configured to compare real-time vehicle movement with an intended, selected, shared, or inferred journey."),
      claimPara("5. The platform of any one of the preceding claims, wherein a journey-monitoring module classifies route deviations as benign, irregular, or high-risk according to context."),
      claimPara("6. The platform of any one of the preceding claims, wherein the platform computes a threat score using two or more contextual signals."),
      claimPara("7. The platform of claim 6, wherein the contextual signals include one or more of route deviation, driver behaviour deviation, communication interference, hotspot context, wearable removal, handset-offline state, driver-vehicle separation, distress phrase detection, tamper signals, occupant duress indicators, cargo integrity violations, or startup-sequence anomalies."),
      claimPara("8. The platform of any one of the preceding claims, further comprising a communication orchestration engine configured to select, sequence, combine, or rank multiple communication pathways."),
      claimPara("9. The platform of claim 8, wherein the communication pathways include one or more of cellular transmission, Bluetooth relay, mesh communication, sub-GHz radio transmission, Wi-Fi transmission, satellite transmission, or store-and-forward delivery."),
      claimPara("10. The platform of any one of the preceding claims, wherein the platform is configured to initiate covert emergency communication without requiring visible user interaction."),
      claimPara("11. The platform of any one of the preceding claims, further comprising a wearable-device integration layer configured to receive one or more wearable-device signals."),
      claimPara("12. The platform of claim 11, wherein the wearable-device signals include one or more of pairing state, connection state, location, motion, body-contact state, biometric state, or user input state."),
      claimPara("13. The platform of claim 11 or claim 12, wherein a correlation engine combines wearable-device signals with vehicle route data and handset status data to determine whether an anomalous or distress-related condition exists."),
      claimPara("14. The platform of claim 13, wherein the anomalous or distress-related condition includes a handset-offline event that occurs together with route deviation or wearable change."),
      claimPara("15. The platform of claim 13 or claim 14, wherein the anomalous or distress-related condition includes a driver-vehicle separation event."),
      claimPara("16. The platform of any one of claims 11 to 15, wherein the wearable device is configured to initiate covert emergency activation by gesture, button sequence, voice input, or equivalent user action."),
      claimPara("17. The platform of any one of the preceding claims, wherein a voice-recognition module detects a predefined distress phrase and initiates covert emergency mode."),
      claimPara("18. The platform of any one of the preceding claims, wherein the response policy engine executes a staged escalation sequence including increased monitoring, trusted-contact alerts, covert tracking, or responder escalation."),
      claimPara("19. The platform of claim 18, wherein the selected stage is determined according to threat score, communication availability, route context, driver profile, or authorization state."),
      claimPara("20. The platform of any one of the preceding claims, wherein the platform consumes hotspot or route-risk data and adjusts threat scoring or route recommendations accordingly."),
      claimPara("21. The platform of any one of the preceding claims, wherein the artificial intelligence processor maintains separate behavioural profiles for different drivers of the same vehicle."),
      claimPara("22. The platform of any one of the preceding claims, wherein the platform continues at least partial operation when the handset is offline or unavailable."),

      h2("Authorization and Immobilization Claims:"),
      claimPara("23. The platform of any one of the preceding claims, further comprising a secure authorization layer configured to determine an authorization state for vehicle startup, operability, lockout, or reactivation based on one or more trusted credentials and one or more anomaly or tamper indicators."),
      claimPara("24. The platform of claim 23, wherein the trusted credentials include one or more of a key transponder, an OEM immobilizer credential, a handset token, a wearable token, a cryptographic secret, a biometric confirmation, a server-issued code, or a one-time authorization token."),
      claimPara("25. The platform of claim 23 or claim 24, wherein the anomaly or tamper indicators include one or more of missing credential state, startup-sequence anomaly, ECU anomaly, CAN bus anomaly, bypass attempt, unauthorized ignition pattern, firmware anomaly, software tampering, or physical tamper input."),
      claimPara("26. The platform of any one of claims 23 to 25, wherein, when the authorization state is absent, invalid, or compromised, the platform places the vehicle in a protected immobilized state in which startup or one or more selected vehicle functions are inhibited while alerting, logging, or monitoring capabilities are maintained."),
      claimPara("27. The platform of claim 26, wherein the protected immobilized state is recoverable and is removed only after authenticated reactivation."),
      claimPara("28. The platform of claim 27, wherein authenticated reactivation requires verification of one or more reactivation conditions including one or more of presentation of a valid trusted credential, owner confirmation, service-agent confirmation, trusted-device confirmation, server-side authorization, or one-time token validation."),

      h2("Predictive Threat Intelligence Claims:"),
      claimPara("29. The platform of any one of the preceding claims, further comprising a predictive threat intelligence module configured to generate proactive risk assessments by correlating historical incident data, geographic crime patterns, temporal risk profiles, and driver behavioural baselines."),
      claimPara("30. The platform of claim 29, wherein the predictive module generates pre-journey risk notifications and alternative route recommendations when elevated risk is identified on a planned or inferred route."),
      claimPara("31. The platform of claim 29 or claim 30, wherein the predictive module identifies recurring temporal risk windows — specific times and locations with historically elevated crime rates — and autonomously adjusts detection sensitivity during those windows."),
      claimPara("32. The platform of any one of claims 29 to 31, further comprising a fleet or community intelligence capability wherein anonymised threat intelligence is aggregated across multiple vehicles to generate real-time risk maps benefiting all participants."),

      h2("Forensic Evidence Claims:"),
      claimPara("33. The platform of any one of the preceding claims, further comprising a tamper-resilient evidence preservation module configured to cryptographically hash and timestamp forensic data captured during security incidents to establish chain-of-custody integrity."),
      claimPara("34. The platform of claim 33, wherein the evidence module correlates data from multiple sources including vehicle telemetry, handset location, wearable data, communication logs, and cargo sensor data to construct a comprehensive incident timeline."),
      claimPara("35. The platform of claim 33 or claim 34, wherein the evidence module autonomously generates structured incident reports comprising chronological timelines, geographic track data, threat score progression, and response actions taken."),
      claimPara("36. The platform of any one of claims 33 to 35, wherein evidence packages are structured to meet insurance claim documentation requirements including timestamped proof of vehicle location, unauthorized access, immobilization activation, and emergency communication attempts."),
      claimPara("37. The platform of any one of claims 33 to 36, wherein forensic evidence is synchronised to secure cloud storage using end-to-end encryption and opportunistic connectivity windows."),

      h2("Geofenced Anomaly Claims:"),
      claimPara("38. The platform of any one of the preceding claims, further comprising a geofenced behavioural anomaly engine that autonomously adjusts detection thresholds for route deviation, speed anomalies, and stop duration based on real-time geographic risk context."),
      claimPara("39. The platform of claim 38, wherein the geofenced engine autonomously learns and updates geofence boundaries based on aggregated incident data and emerging crime patterns."),
      claimPara("40. The platform of claim 38 or claim 39, wherein the geofenced engine reduces false positive rates in low-risk environments while maintaining heightened sensitivity in high-risk zones."),

      h2("Anti-Jamming Communication Resilience Claims:"),
      claimPara("41. The platform of any one of the preceding claims, further comprising an anti-jamming communication resilience layer comprising: an interference detection module configured to detect or infer a signal interference event from degradation in one or more communication or location channels; and a failover module configured to preserve local decision support and to select, sequence, combine, or defer one or more transmissions over available primary or fallback pathways."),
      claimPara("42. The platform of claim 41, wherein the interference detection module correlates radio degradation with motion, route, or telemetry data to distinguish deliberate signal interference from ordinary signal loss."),
      claimPara("43. The platform of claim 41 or claim 42, wherein the system preserves a local evidence record and performs dead-reckoning from inertial sensors or vehicle-bus inputs during at least part of a signal interference event."),
      claimPara("44. The platform of any one of claims 41 to 43, wherein the system performs delayed-burst alert transmission by storing alerts locally during communication denial and transmitting compressed critical data when a temporary connectivity window is detected."),

      h2("Occupant Duress Detection Claims:"),
      claimPara("45. The platform of any one of the preceding claims, further comprising an occupant duress detection module configured to identify physiological or behavioural indicators of coercion or distress from one or more wearable or in-vehicle sensors without requiring deliberate occupant action."),
      claimPara("46. The platform of claim 45, wherein the physiological indicators include one or more of elevated heart rate, heart rate variability changes, skin conductance changes, or body temperature anomalies detected from a wearable device."),
      claimPara("47. The platform of claim 45 or claim 46, further comprising a voice stress analysis capability configured to detect stress indicators including pitch elevation, speech rate changes, or tremor patterns from in-vehicle or phone audio."),
      claimPara("48. The platform of any one of claims 45 to 47, wherein occupant duress indicators are correlated with route deviation, location risk, and time-of-day risk factors to produce a combined threat score."),

      h2("Cargo and Asset Protection Claims:"),
      claimPara("49. The platform of any one of the preceding claims, further comprising a cargo integrity monitoring module configured to detect cargo-related anomalies including unauthorised door openings, weight changes, temperature deviations, or seal-break events and to correlate cargo anomalies with vehicle security events."),
      claimPara("50. The platform of claim 49, wherein a cargo anomaly detected during an unscheduled stop in a high-risk area generates an elevated threat score relative to the same cargo anomaly detected at a designated delivery point."),
      claimPara("51. The platform of claim 49 or claim 50, wherein the evidence preservation module captures timestamped cargo sensor data and includes cargo chain-of-custody records in forensic evidence packages for cargo theft insurance claims."),

      h2("Multi-Vehicle Coordinated Response Claims:"),
      claimPara("52. The platform of any one of the preceding claims, further comprising a multi-vehicle coordination engine configured to coordinate security response actions across multiple vehicles on the same network."),
      claimPara("53. The platform of claim 52, wherein a vehicle generating a high-threat alert transmits a proximity warning to nearby fleet vehicles, enabling relay communication when the affected vehicle's primary communication is jammed."),
      claimPara("54. The platform of claim 52 or claim 53, wherein nearby fleet vehicles autonomously capture witness data including GPS positions, sensor readings, and environmental observations correlated with a proximate security event."),
      claimPara("55. The platform of any one of claims 52 to 54, further comprising a convoy integrity monitoring capability that detects unexpected vehicle separation from a convoy and escalates the event when combined with communication loss or route deviation."),

      h2("Autonomous Self-Improving Intelligence Claims:"),
      claimPara("56. The platform of any one of the preceding claims, further comprising a self-improving intelligence pipeline wherein detection models are autonomously retrained using accumulated journey data, verified incident outcomes, and operator corrections without human-initiated training cycles."),
      claimPara("57. The platform of claim 56, further comprising an autonomous pattern discovery module that analyses the aggregate intelligence dataset to autonomously detect emerging threat patterns including new crime corridors, shifting temporal risk profiles, and previously unidentified behavioural indicators that were not predefined by human operators."),
      claimPara("58. The platform of claim 56 or claim 57, wherein the system autonomously refines detection thresholds, threat scoring weights, and geofence boundaries based on accumulated data, creating a compounding intelligence advantage that increases in value with each journey and vehicle added to the network."),

      h2("Method Claims:"),
      claimPara("59. A computer-implemented method of monitoring a vehicle journey, the method comprising: learning one or more behavioural patterns associated with a driver; comparing live vehicle movement with an intended, selected, shared, or inferred journey; computing a threat score from two or more contextual signals; and executing one or more response actions according to the threat score."),
      claimPara("60. The method of claim 59, further comprising correlating vehicle data with handset data, wearable-device data, and optionally cargo sensor data to determine whether an anomalous or distress-related condition exists."),
      claimPara("61. The method of claim 59 or claim 60, further comprising selecting one or more communication pathways according to expected reliability, latency, stealth, or communication availability."),
      claimPara("62. A computer-implemented method of controlling vehicle startup authorization, the method comprising: determining an authorization state from one or more trusted credentials and one or more anomaly or tamper indicators; inhibiting startup or placing the vehicle into a protected immobilized state when the authorization state is absent, invalid, or compromised; and permitting authenticated reactivation only after verified satisfaction of one or more reactivation conditions."),
      claimPara("63. A computer-implemented method of generating predictive vehicle threat intelligence, the method comprising: aggregating historical vehicle crime data by geographic area, time, and incident type; correlating aggregated data with a driver's planned or inferred route; generating a pre-journey risk assessment; and adjusting detection sensitivity based on the predicted risk profile."),
      claimPara("64. A computer-implemented method of preserving tamper-resilient forensic evidence during a vehicle security incident, the method comprising: capturing forensic data from multiple vehicle and device sensors; cryptographically hashing and timestamping captured data to establish integrity; correlating multi-source data to construct an incident timeline; and generating a structured evidence package suitable for insurance claims or legal proceedings."),
      claimPara("65. A computer-implemented method of maintaining emergency communication capability during a signal interference event, the method comprising: detecting or inferring degradation of one or more communication or location channels; preserving local anomaly evaluation and evidence capture during the degradation; selecting or sequencing one or more fallback communication pathways; and transmitting, storing, or deferring one or more alerts or evidence packages until a transmission condition is satisfied."),
      claimPara("66. A computer-implemented method of detecting occupant duress without deliberate occupant action, the method comprising: monitoring physiological or behavioural signals from one or more wearable or in-vehicle sensors; detecting anomalous physiological patterns indicative of coercion or distress; correlating detected duress indicators with vehicle route, location risk, and time-of-day risk factors; and contributing the correlated duress assessment to a threat score computation."),
      claimPara("67. A non-transitory computer-readable medium carrying instructions which, when executed by one or more processors of an in-vehicle device, handset, wearable device, or remote platform, cause performance of the method of any one of claims 59 to 66."),
      claimPara("68. A vehicle security system substantially as herein described with reference to any one or more of the accompanying drawings."),
      divider(),

      // END
      new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "End of Specification", bold: true, font: "Calibri", size: 22, color: DARK }),
      ]}),
      new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "AI AntiHijack — Confidential | Provisional Patent Specification | CIPC Submission | 2026/03/12", font: "Calibri", size: 16, color: GREY, italics: true }),
      ]}),

    ],
  }],
});

async function generate() {
  const buffer = await Packer.toBuffer(doc);
  const path = "docs/AI_AntiHijack_Patent_CIPC_Submission.docx";
  fs.writeFileSync(path, buffer);
  const stats = fs.statSync(path);
  console.log(`DOCX saved: ${path}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB`);
}

generate().catch(console.error);
