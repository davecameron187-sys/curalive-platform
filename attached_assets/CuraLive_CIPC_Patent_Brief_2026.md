# CuraLive — CIPC Provisional Patent Application Brief
**Prepared for:** Grok (xAI) — CIPC Filing Preparation  
**Date:** March 2026  
**Status:** Confidential — For Patent Counsel Use Only  
**Applicant:** CuraLive (Pty) Ltd  
**Subject:** Method for Agentic Intelligence Optimisation in Real-Time Regulated Financial Events

---

## 1. INVENTION TITLE

**"Method and System for Agentic Bundle Optimisation, Autonomous Intervention, and Proprietary Intelligence Tagging in Real-Time Regulated Investor Events"**

---

## 2. FIELD OF THE INVENTION

This invention relates to artificial intelligence systems applied to real-time financial communications events, including investor earnings calls, CEO town halls, capital markets days, and annual general meetings. More specifically, it relates to a method for autonomously scoring, recommending, and activating feature bundles during live regulated events; a method for firing autonomous AI agents in response to real-time event signals without human input; and a method for storing and querying structured intelligence tags generated during live events to build a compounding proprietary dataset.

---

## 3. BACKGROUND — THE PROBLEM BEING SOLVED

Current platforms for managing investor events (earnings calls, webcasts, AGMs) are passive tools. They dial participants in, record audio, and provide basic transcription. They do not:

- Intelligently recommend which communication features to activate based on the event type, the operator's role, and the primary challenge they are managing
- Fire autonomous corrective agents when real-time signals (sentiment drops, compliance risks, Q&A overloads) cross defined thresholds during a live regulated event
- Retain structured, queryable intelligence across events to improve future recommendations
- Build a proprietary dataset of investor behaviour patterns that compounds in value with each event run

The result is that human operators must make all decisions in real time under pressure, compliance risks go undetected until after the event, and no learning occurs between events. CuraLive's invention solves all three problems with a single integrated system.

---

## 4. SUMMARY OF THE INVENTION

The invention comprises three interconnected components, each independently patentable and collectively forming a system with no known prior art in the capital markets events space:

### Component 1: Agentic Event Brain — Bundle Scoring and Optimisation Method
### Component 2: Autonomous Intervention Engine — Real-Time Agentic Action Method
### Component 3: Tagged Metrics Intelligence Database — Compounding Data Asset Method

---

## 5. DETAILED DESCRIPTION OF EACH COMPONENT

---

### COMPONENT 1: AGENTIC EVENT BRAIN

#### 5.1 Overview

The Agentic Event Brain is a proprietary scoring algorithm that takes three structured inputs from an operator before or during a live event, applies a weighted multi-axis scoring formula with domain-specific coefficients, maps the resulting score to an optimal feature bundle, invokes a large language model (GPT-4o) to generate a personalised action plan, and logs the complete analysis to a persistent database. The logged data feeds Component 3 (Cross-Event Memory) to improve future recommendations.

#### 5.2 Input Parameters

The system collects three inputs:

- **Input A — Operator Role:** The functional role of the operator managing the event.  
  Values: `investor_relations` | `compliance` | `operations` | `executive` | `communications`

- **Input B — Primary Challenge:** The dominant operational or strategic challenge the operator is managing.  
  Values: `audience_engagement` | `compliance_risk` | `technical_quality` | `information_security` | `scalability` | `content_repurposing`

- **Input C — Event Type:** The category of the live event being managed.  
  Values: `earnings_call` | `agm` | `capital_markets_day` | `ceo_town_hall` | `board_meeting` | `product_launch`

#### 5.3 The Scoring Algorithm — Proprietary Method

The scoring formula applies five weighted factors:

```
score = (role_match × 0.30) + (challenge_weight × 0.40) + (event_factor × 0.30) + (data_pattern × 0.20) + alignment_bonus
```

**Factor 1 — Role Match (weight: 0.30)**  
Maps the operator's role to bundle affinity. Example weights:
- `investor_relations` → IR Bundle: 0.95, Compliance Bundle: 0.75, Operations Bundle: 0.55
- `compliance` → Compliance Bundle: 0.95, IR Bundle: 0.70, Operations Bundle: 0.65
- `operations` → Operations Bundle: 0.90, IR Bundle: 0.60, Compliance Bundle: 0.55

**Factor 2 — Challenge Weight (weight: 0.40 — highest weight in system)**  
Maps the primary challenge to bundle relevance. Example weights:
- `audience_engagement` → IR Bundle: 0.95, Content Bundle: 0.80
- `compliance_risk` → Compliance Bundle: 0.95, IR Bundle: 0.70
- `technical_quality` → Operations Bundle: 0.90, Webcasting Bundle: 0.85
- `information_security` → Security Bundle: 0.95, Compliance Bundle: 0.75
- `scalability` → Operations Bundle: 0.95, Webcasting Bundle: 0.80
- `content_repurposing` → Content Bundle: 0.95, IR Bundle: 0.70

**Factor 3 — Event Factor (weight: 0.30)**  
Maps event type to bundle relevance. Example weights:
- `earnings_call` → IR Bundle: 1.00, Compliance Bundle: 0.85 (highest-stakes event type, assigned maximum factor)
- `agm` → Compliance Bundle: 0.90, IR Bundle: 0.85
- `board_meeting` → Security Bundle: 0.90, Compliance Bundle: 0.80
- `ceo_town_hall` → IR Bundle: 0.80, Webcasting Bundle: 0.75

**Factor 4 — Data Pattern (weight: 0.20)**  
Pulled from Cross-Event Memory (Component 3). If prior analyses exist for this bundle, the historical average confidence score is applied as a weight modifier. Default value: 0.70 (where no prior data exists).

**Factor 5 — Alignment Bonus**  
Added where two or more inputs strongly converge on the same bundle. Formula: if role_match > 0.85 AND challenge_weight > 0.85 for the same bundle, add 0.10 bonus.

**Score Interpretation:**
- 85–100: Premium bundle activation recommended with full feature suite
- 70–84: Standard bundle with targeted add-ons
- 55–69: Foundational bundle with specific feature recommendations
- Below 55: Cross-bundle hybrid approach recommended

#### 5.4 GPT-4o Integration

The computed score, bundle recommendation, and all three inputs are passed to GPT-4o with a structured prompt that includes:
- The scoring result and confidence level
- The operator's specific challenge context
- FINRA/regulatory compliance requirements relevant to the event type
- Cross-event memory data (average past score, dominant challenges, peak performance)

GPT-4o returns: a 3-step personalised action plan, an ROI projection, top 3 feature recommendations within the bundle, and a cross-bundle interconnection alert where relevant.

#### 5.5 Cross-Event Memory Integration

Every analysis result is stored in the `agentic_analyses` database table with fields: bundle, role, challenge, event type, score, recommendation summary, timestamp. Before computing a new score, the system queries all prior analyses for the same bundle and surfaces:
- Average confidence score across all past analyses
- Peak score achieved
- Dominant challenge (most frequently occurring)
- Analysis count
- Timestamp of last run

This memory panel is displayed to the operator alongside the new recommendation, creating a learning loop that improves with every event.

---

### COMPONENT 2: AUTONOMOUS INTERVENTION ENGINE

#### 5.6 Overview

The Autonomous Intervention Engine monitors real-time event signals during a live regulated financial event and fires autonomous AI agents when predefined threshold conditions are met — without any human input. Each intervention is logged to the `autonomous_interventions` database table with full audit trail, enabling post-event compliance review.

#### 5.7 The Six Live Intervention Rules

**Rule 1 — Sentiment Drop Alert**  
- Threshold: Live sentiment score falls below 70%  
- Severity: Warning  
- Domain: Investor Relations  
- Autonomous Action: IR agent queues an audience re-engagement poll and surfaces 3 talking points for the presenter  
- Compliance significance: Prevents material negative sentiment going unaddressed during a regulated event

**Rule 2 — Q&A Queue Overload**  
- Threshold: Pending Q&A queue exceeds 10 questions  
- Severity: Warning  
- Domain: Operations & Efficiency  
- Autonomous Action: Auto-triage agent re-ranks queue by investor tier (institutional > retail > analyst) and flags top 3 for immediate moderator attention

**Rule 3 — Compliance Risk Detected**  
- Threshold: A material forward-looking or legally sensitive statement triggers compliance flagging  
- Severity: Critical  
- Domain: Compliance & Risk  
- Autonomous Action: Compliance agent auto-redacts the statement, creates a timestamped FINRA-compliant audit log entry, and notifies the legal team  
- **Patent significance: This is the most defensible claim. No existing platform creates a FINRA audit log entry autonomously mid-call without human input.**

**Rule 4 — Positive Sentiment Spike**  
- Threshold: Sentiment rises above 85% for 60+ consecutive seconds  
- Severity: Positive signal  
- Domain: Content & Marketing  
- Autonomous Action: Content agent queues a LinkedIn Pulse highlight from the positive segment for post-event publication

**Rule 5 — Low Participant Engagement**  
- Threshold: Active participant ratio drops below 60%  
- Severity: Warning  
- Domain: Investor Relations  
- Autonomous Action: Engagement agent launches an interactive poll and notifies the moderator of the engagement drop with recommended recovery actions

**Rule 6 — High-Value Event Detected**  
- Threshold: Event classified as Premium tier (earnings call or capital markets day) with 200+ participants  
- Severity: Informational  
- Domain: All bundles  
- Autonomous Action: System activates all Premium bundle features automatically — full transcription, sentiment monitoring, compliance flags, engagement analytics, and post-event report generation

#### 5.8 The Agentic Chain Reaction — Key Patent Claim

The critical novel mechanism is the **chain reaction**: when Rule 3 (Compliance Risk) fires, it does not operate in isolation. The system automatically evaluates whether Rule 1 (Sentiment Drop) conditions are also met within the same 30-second window. If so, both agents fire in sequence — the compliance agent first (to protect the legal record), then the IR agent (to manage investor sentiment). This sequential agent orchestration in response to compounding real-time signals, with no human input, is novel.

#### 5.9 Intervention Lifecycle

Each intervention passes through three states managed by the system:
1. **Triggered** — threshold crossed, agent action initiated
2. **Active Now** — action in progress, visible to operator for acknowledgement  
3. **Historical** — acknowledged and archived to `autonomous_interventions` table with full audit trail: rule name, trigger time, acknowledgement time, operator ID, bundle context, action taken

---

### COMPONENT 3: TAGGED METRICS INTELLIGENCE DATABASE

#### 5.10 Overview

The Tagged Metrics system captures, classifies, and stores structured intelligence records from every live event. Each record (a "tagged metric") is classified by tag type, assigned a severity level, linked to an event and bundle, and stored with full metadata. This creates a queryable proprietary dataset that compounds in value with every event run.

#### 5.11 Tag Types and Classification

Six tag types are defined, each with distinct scoring semantics:

| Tag Type | Description | Domain |
|---|---|---|
| `sentiment` | Numeric sentiment score (0–100) at point of capture | Investor Relations |
| `compliance` | Risk score (0.0–1.0) for material statement detection | Compliance & Risk |
| `scaling` | Peak concurrent participant count at time of capture | Operations |
| `engagement` | Active participant ratio percentage at time of capture | Investor Relations |
| `qa` | Q&A queue depth at time of capture | Operations |
| `intervention` | Count of autonomous interventions fired during event | All |

#### 5.12 Severity Classification

Each tag is assigned a severity on ingestion using deterministic rules:
- `positive` — metric indicates healthy event performance
- `neutral` — metric within normal range, no action required
- `negative` — metric indicates underperformance requiring attention
- `critical` — metric indicates material risk or compliance exposure

#### 5.13 The Compounding Data Asset

The novel claim of Component 3 is not the individual records but the **compounding intelligence effect**. As more events are processed:
- Average sentiment scores per event type become baselines for anomaly detection
- Compliance risk scores build sector-specific risk profiles per company/bundle
- Engagement patterns reveal investor behaviour signatures per communication type
- Intervention histories identify which autonomous actions most effectively resolved which signal types

This produces a dataset with no external equivalent — it is generated exclusively by running live regulated events through the CuraLive platform. No competitor can acquire or replicate it without running the same events.

---

## 6. PATENT CLAIMS — RECOMMENDED STRUCTURE FOR CIPC APPLICATION

### Primary Claim (Method Patent)

**Claim 1:** A computer-implemented method for optimising feature bundle selection in real-time investor events, comprising:
- receiving three operator inputs: functional role, primary challenge, and event type;
- applying a weighted multi-axis scoring formula comprising role_match (weight 0.30), challenge_weight (weight 0.40), event_factor (weight 0.30), data_pattern (weight 0.20), and an alignment bonus;
- mapping the computed score to a recommended feature bundle;
- invoking a large language model with the scored inputs and historical event memory to generate a personalised action plan;
- storing the complete analysis to a persistent database;
- querying prior analyses for the same bundle to compute cross-event memory metrics and surface them alongside the new recommendation.

### Secondary Claims

**Claim 2:** A computer-implemented method for autonomous agent intervention during regulated financial events, comprising:
- monitoring real-time event signals including sentiment score, Q&A queue depth, participant engagement ratio, and compliance risk score;
- comparing each signal against predefined threshold values;
- upon threshold breach, automatically initiating a corresponding AI agent action without human input;
- creating a timestamped audit log entry for each intervention;
- evaluating compounding signal conditions within a defined time window to initiate sequential multi-agent chain reactions.

**Claim 3:** The method of Claim 2, wherein a compliance risk signal breach automatically creates a FINRA-compliant audit log entry and initiates a second agent action for investor sentiment management within a 30-second evaluation window, without requiring human acknowledgement of the first action before the second fires.

**Claim 4:** A computer-implemented method for building a compounding proprietary intelligence dataset from live regulated financial events, comprising:
- classifying event signals into six tag types: sentiment, compliance, scaling, engagement, qa, and intervention;
- assigning deterministic severity classifications to each tag on ingestion;
- storing each classified record with event ID, bundle context, source agent identifier, and timestamp;
- enabling cross-event query of stored records to compute baseline performance metrics per event type, per bundle, and per operator role.

---

## 7. PRIOR ART DIFFERENTIATION

The following existing products/services are known to the applicant and are distinguished from this invention:

| Prior Art | How CuraLive Differs |
|---|---|
| **Chorus.ai / Gong** | Sales call analytics, no capital markets domain, no autonomous compliance agent, no FINRA audit log creation, no bundle scoring method |
| **Notified (West Corporation)** | Passive event hosting, no AI scoring, no autonomous intervention, no cross-event learning |
| **Nasdaq IR Solutions** | IR data platform, no live event intelligence layer, no agentic actions, no compliance auto-intervention |
| **Microsoft Copilot in Teams** | General-purpose meeting summarisation, no financial event domain specificity, no threshold-triggered autonomous agents, no FINRA compliance logic |
| **Zoom AI Companion** | Post-meeting summaries, no live intervention, no scoring algorithm, no capital markets calibration |

No known prior patent or product combines the scoring algorithm, the autonomous compliance intervention with audit log creation, and the compounding tagged metrics dataset in a capital markets events context.

---

## 8. COMMERCIAL CONTEXT

**Industry:** Financial communications / investor relations technology  
**Addressable market:** Every publicly listed company conducting quarterly earnings calls, AGMs, capital markets days, or investor days — estimated 50,000+ companies globally  
**Revenue model:** SaaS bundles (IR Bundle, Compliance Bundle, Operations Bundle, Webcasting Bundle, Content Bundle, Security Bundle)  
**Target acquirers:** Microsoft (Nuance/Teams integration), Zoom (enterprise communications), Nasdaq (IR technology stack), Bloomberg (financial data layer)  
**Acquisition readiness:** 4 of 7 core intelligence features live with proprietary database accumulating records  
**Patent pending status:** Supports acquisition valuation and prevents feature replication by competitors during commercial scale-up

---

## 9. TECHNICAL STACK (FOR PATENT COUNSEL REFERENCE)

- **Backend:** Node.js / Express / tRPC
- **AI:** GPT-4o via OpenAI API (production) / Google Gemini (development)
- **Database:** MySQL via Drizzle ORM — tables: `agentic_analyses`, `autonomous_interventions`, `tagged_metrics`
- **Frontend:** React / Vite / TypeScript
- **Real-time:** Ably WebSocket channels for live event signal monitoring
- **Deployment:** Cloud-hosted, production-ready

---

## 10. INVENTOR DECLARATION (TO BE COMPLETED BY PATENT COUNSEL)

This invention was conceived and reduced to practice by the founding team of CuraLive (Pty) Ltd. The system described herein is original work with no prior assignment of rights. The applicant has not publicly disclosed the algorithm weights, prompt structures, or intervention threshold logic in any publication, conference, or open-source repository.

---

*Document prepared by: CuraLive Engineering Team*  
*Date: March 2026*  
*Classification: Strictly Confidential — Attorney-Client Privilege Applies*
