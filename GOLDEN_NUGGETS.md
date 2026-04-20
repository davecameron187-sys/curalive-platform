# CuraLive — Golden Nuggets Register
**Last updated:** 20 April 2026
**Maintained by:** Claude (Chief Architect)
**Purpose:** Strategic IP and innovation register. Every build session must reference this document before writing code. New nuggets identified during builds must be added before session close.

---

## THE GOLDEN NUGGET PROCESS — NON-NEGOTIABLE

Before every build session:
1. Review this document
2. Ask: does what we're building today connect to or enhance any nugget?
3. Build with that connection in mind
4. If a new nugget is discovered during the build — add it here before closing

**The test for a golden nugget:**
- Is it non-obvious? (Would a competitor miss it?)
- Does it use existing architecture in a new way?
- Does it compound over time? (Gets smarter/stickier with scale)
- Does it strengthen the PCT filing?
- Is it irreplicable without years of data or the specific architecture?

If yes to all five — it's a nugget. Lock it in.

---

## NUGGET 1 — Temporal Accountability Ledger

**What it is:**
A structured, immutable record that maps every material statement made in a live event against what was previously disclosed, what is being said now with what certainty level, and what will need to be disclosed as a result.

**Why it's non-obvious:**
Every existing compliance tool operates in the present tense — it flags what's happening now. The Temporal Ledger operates in all three tenses simultaneously: past disclosure, present statement, future obligation. Nobody else has connected these three dimensions in real time.

**How it uses existing architecture:**
- Analysis engine detects materiality and certainty language — already built
- PSIL flags escalation triggers — already built
- Memory Graph holds cross-event statement history — already built
- Disclosure Consistency Engine scores delta between prior and current disclosure — already built
- No new engines — new orchestration layer only

**Patent families strengthened:**
- Family 4 (Multi-Dimensional Analysis) — temporal correlation across statements
- Family 7 (Autonomous Compliance Intervention) — obligation generation
- Family 9 (Organisational Memory Graph) — prior statement retrieval
- Family 11 (Autonomous Policy Synthesis) — disclosure pattern learning

**New claim:**
"A system that maintains a temporal accountability record mapping each material statement to prior disclosures, current certainty levels, and generated disclosure obligations, updated in real time during a regulated corporate communication event."

**How it compounds:**
Every event adds to the temporal record. After 50 events, the system knows the exact gap between what an executive says and what gets filed. That predictive power is impossible to replicate without the data.

**Build status:** Planned — next phase
**Priority:** HIGH

---

## NUGGET 2 — Communication Governance Certificate

**What it is:**
A structured, signed, exportable document automatically generated at session end that proves every material statement was detected, every detection was reviewed by a human operator, every operator decision was timestamped, and every PSIL intervention was actioned — with a cryptographic hash guaranteeing integrity.

**Why it's non-obvious:**
Every other platform produces reports. A report is read. A Certificate is filed. The shift from reporting to certification changes the buyer from a compliance officer to a General Counsel — and changes the product from a tool to legal infrastructure.

**How it uses existing architecture:**
- Operator Action Log already captures every decision with timestamps
- Governance Gateway already records every authorisation decision
- Compliance Intervention Module already structures every flag
- PSIL already records every state change
- Memory Graph provides prior statement delta
- New: Certificate Generator service assembles and signs — ~150 lines

**Patent families strengthened:**
- Family 5 (Operator Interface) — operator decision record
- Family 7 (Autonomous Compliance Intervention) — flag-to-decision chain
- Embodiment 1 (Governance Gateway) — gateway decision provenance
- Embodiment 4 (Memory Graph) — cross-event delta

**New claim:**
"A system that generates a structured, cryptographically signed Communication Governance Certificate upon conclusion of a regulated corporate communication event, wherein the certificate records the complete chain of custody from AI signal detection through deterministic governance gateway evaluation to human operator decision for each material statement identified during the event."

**How it compounds:**
Each certificate becomes evidence. After 3 years of certificates, an organisation has an auditable history of every governance decision made in every regulated communication. That archive is the product. Regulators will require it. Competitors cannot produce it retroactively.

**Build status:** Planned — next immediate build
**Priority:** CRITICAL — demo-defining feature

**Golden Nugget within the nugget:**
The Certificate hash chain — each certificate references the prior event's certificate hash, creating a tamper-evident chain of governance records across all events. One line of additional code. Massive legal defensibility implication.

---

## NUGGET 3 — Communication Genome

**What it is:**
A longitudinal communication intelligence profile for each speaker, built from every session they appear in, that aggregates sentiment trajectories, evasion patterns, PSIL history, certainty language patterns, and governance outcomes to produce a predictive risk profile and pre-event operator briefing.

**Why it's non-obvious:**
Every compliance tool looks at what's happening now. The Communication Genome looks at who this person has been across every regulated communication they've ever participated in — and uses that to predict what they will do next. It transforms Shadow Mode from a monitoring tool into a pre-event intelligence briefing system.

**How it uses existing architecture:**
- Sentiment Analysis Pipeline already produces per-speaker scores — already built
- Evasive Answer Detection already scores per response — already built
- PSIL already records per-speaker intervention history — already built
- Memory Graph already stores speaker entities and trajectories — already built
- Benchmarking Engine already produces sector comparisons — already built
- New: Genome View in Pre-Event tab — one new query + one new UI panel

**Patent families strengthened:**
- Family 4 (Multi-Dimensional Analysis) — longitudinal cross-dimensional speaker profile
- Family 6 (Cross-Event Benchmarking) — speaker vs sector peer comparison
- Embodiment 4 (Organisational Memory Graph) — speaker entity longitudinal traversal
- Embodiment 3 (Predictive Risk) — genome-informed pre-event risk scoring

**New claim:**
"A system that generates and maintains a longitudinal communication intelligence profile for each identified speaker across multiple regulated corporate communication events, wherein the profile aggregates sentiment trajectories, evasion patterns, compliance signal history, PSIL intervention records, and governance decision outcomes to produce a predictive risk indicator and pre-event operator briefing for subsequent events involving the same speaker."

**How it compounds:**
The Genome gets more accurate with every event. After 10 events with the same executive, the prediction quality is high. After 50, it's exceptional. A competitor starting today would need years of data to match it. The data moat is the product.

**Sector-level extension:**
Anonymised Genomes aggregated across organisations produce sector-level communication risk profiles — "Mining sector CFOs exhibit statistically significant evasion patterns on water usage disclosures." This is a research product, a regulatory intelligence product, and a data licensing opportunity simultaneously.

**Build status:** Planned — Phase 3
**Priority:** HIGH — PCT-strengthening, demo-defining

---

## NUGGET 4 — AI Services Layer

**What it is:**
Every AI capability inside CuraLive — sentiment engine, evasion detector, materiality oracle, PSIL, intelligence pipeline, Genome, Certificate Generator — exposed as independently licensable API services that third parties can consume without running Shadow Mode.

**Why it's non-obvious:**
CuraLive is being built as a platform. But the AI services inside it are a product in their own right. Law firms, IR agencies, compliance consultancies, and other communication platforms need these capabilities but don't need the full Shadow Mode infrastructure. An API layer makes CuraLive a B2B AI provider, not just a SaaS platform.

**How it uses existing architecture:**
All AI services already exist as modular server-side services. The layer is an API gateway and authentication wrapper around what's already built. No new AI development required.

**Patent families strengthened:**
- All families — API exposure of patented capabilities creates additional infringement surface
- Particularly Family 4 (Analysis Engine) and Family 7 (Compliance Intervention) as licensable endpoints

**New claim:**
"A system wherein one or more analytical pipelines of the multi-dimensional communication analysis engine are exposed through an authenticated application programming interface, enabling third-party systems to submit communication signal data and receive structured communication intelligence outputs without requiring integration of the full platform architecture."

**How it compounds:**
Every third-party integration creates a new data source feeding the benchmarking engine and the Memory Graph. The more APIs are consumed, the smarter the core platform gets. Network effects from API adoption compound the data moat.

**Revenue model:**
- Per-call pricing for API access
- Volume licensing for enterprise integrations
- White-label licensing for IR agencies and compliance platforms

**Build status:** Planned — Phase 4 (post-Shadow Mode completion)
**Priority:** MEDIUM now, CRITICAL at scale

---

## NUGGET 5 — Operator Cognitive Load Optimisation

**What it is:**
A dynamic intelligence prioritisation layer that learns which types of alerts each individual operator acts on, ignores, or dismisses — and progressively filters the intelligence feed to surface only what that operator needs to see, in the order they need to see it.

**Why it's non-obvious:**
Every platform shows everything and lets the human filter. CuraLive inverts this — the system learns the operator's cognitive patterns and pre-filters for them. This is not just UX improvement. It's a patentable human-AI collaboration pattern that gets more accurate with every session that operator runs.

**How it uses existing architecture:**
- Operator Action Log already records every operator response to every alert
- Intelligence Feed already delivers prioritised outputs
- Governance Gateway already controls what surfaces
- New: Learning layer that analyses operator action patterns and adjusts feed priority weighting

**Patent families strengthened:**
- Family 5 (Operator Interface) — personalised intelligence presentation
- Embodiment 1 (Governance Gateway) — operator-adaptive threshold configuration
- Embodiment 6 (Policy Synthesis) — operator behaviour patterns as policy inputs

**New claim:**
"A system wherein the presentation priority of analytical outputs in the operator intelligence interface is dynamically adjusted based on historical operator response patterns, such that outputs associated with action types the operator has historically acted upon are surfaced with higher priority than outputs the operator has historically dismissed."

**How it compounds:**
The longer an operator uses CuraLive, the more personalised and efficient their intelligence feed becomes. Switching cost grows with every session. The operator's cognitive profile is a CuraLive asset that cannot be exported to a competitor.

**Build status:** Planned — Phase 3
**Priority:** MEDIUM — stickiness multiplier

---

## NUGGET 6 — Disclosure Obligation Engine

**What it is:**
A jurisdiction-aware engine that automatically generates structured disclosure obligation records from material statements detected during a live event — specifying the filing type required, the regulatory body, the timeframe, and the specific statement that triggered the obligation.

**Why it's non-obvious:**
Compliance tools flag risk. The Disclosure Obligation Engine goes one step further — it tells you exactly what you have to do about it, in which jurisdiction, by when. This transforms a warning into an actionable compliance workflow trigger.

**How it uses existing architecture:**
- Materiality Risk Oracle already identifies material statements — already built
- Compliance Intervention Module already identifies regulatory jurisdictions — already built
- Memory Graph already holds prior disclosure records — already built
- New: Obligation record generator + jurisdiction rule set configuration

**Patent families strengthened:**
- Family 7 (Autonomous Compliance Intervention) — obligation generation as escalation output
- Family 9 (Memory Graph) — obligation history per organisation
- Embodiment 6 (Policy Synthesis) — obligation patterns as policy inputs

**New claim:**
"A system that generates structured disclosure obligation records from material statements detected during regulated corporate communication events, wherein each obligation record specifies the applicable regulatory filing type, the implicated regulatory jurisdiction, the required filing timeframe, and a reference to the statement that triggered the obligation."

**How it compounds:**
Every obligation generated and resolved adds to the Memory Graph. Over time, the system knows each organisation's obligation history, resolution patterns, and compliance track record. That history is valuable to regulators, auditors, and insurers.

**Build status:** Planned — Phase 2 (concurrent with Certificate)
**Priority:** HIGH — directly feeds the Certificate

---

## MASTER BUILD SEQUENCE

Based on dependency and impact:

| Phase | Nugget | Why This Order |
|---|---|---|
| Phase 1 | History tab fix + webhook pipeline confirmation | Foundation must work |
| Phase 2 | Disclosure Obligation Engine | Feeds the Certificate |
| Phase 2 | Communication Governance Certificate | Demo-defining, PCT-critical |
| Phase 3 | Temporal Accountability Ledger | Requires Certificate foundation |
| Phase 3 | Operator Cognitive Load Optimisation | Stickiness multiplier |
| Phase 4 | Communication Genome | Requires multi-event data |
| Phase 4 | AI Services Layer | Requires stable core platform |

---

## RULES FOR ADDING NEW NUGGETS

When a new nugget is identified during a build session:

1. Give it a number and a name
2. Write the five fields: what it is, why non-obvious, existing architecture mapping, patent families, how it compounds
3. Add it to the Master Build Sequence in the right phase
4. Update the brief to reference it
5. Push both documents to GitHub before closing the session

**The standard:** If you can't answer all five fields, it's not a nugget yet. Keep thinking.

---

*This document is the strategic IP register for CuraLive. It is reviewed at the start of every build session and updated whenever a new nugget is identified. It feeds directly into the PCT patent filing.*
