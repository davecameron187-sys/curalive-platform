# CuraLive Platform — Patent Submission Brief

**Document Classification:** Confidential — Patent Filing Support Material
**Prepared:** 18 March 2026
**Applicant:** CuraLive (Pty) Ltd
**Inventors:** David Cameron et al.
**Filing Jurisdiction:** South Africa (CIPC), with PCT international phase intended
**Production URL:** https://curalive-platform.replit.app

---

## 1. TITLE OF INVENTION

**"Integrated Real-Time Investor Event Intelligence Platform with Autonomous AI Moderation, Self-Evolving Machine Learning, and Multi-Modal Compliance Monitoring"**

---

## 2. FIELD OF THE INVENTION

The present invention relates to financial technology and investor relations platforms. More particularly, the invention relates to an integrated system and method for conducting, monitoring, analysing, and generating intelligence from live investor events — including earnings calls, Annual General Meetings (AGMs), capital markets days, and webcasts — using real-time artificial intelligence, autonomous moderation, multi-carrier telephony, and self-evolving machine learning algorithms.

---

## 3. BACKGROUND AND PROBLEM STATEMENT

Existing investor relations platforms provide basic webcasting and audio conferencing. They lack:

1. **Real-time AI intelligence** — No existing platform fuses live transcription, sentiment analysis, evasiveness detection, market impact forecasting, and compliance monitoring into a single unified pipeline operating in real-time during investor events.
2. **Autonomous moderation for regulated events** — Current systems require manual human moderation. No system provides autonomous, regulation-aware intervention with legally defensible audit trails.
3. **Self-improving AI without human labelling** — Existing ML systems require human-labelled training data. No investor event platform implements autonomous quality scoring, evidence decay, and self-proposal of new AI capabilities.
4. **Shadow intelligence from third-party platforms** — No system deploys silent AI agents into third-party conferencing platforms (Zoom, Teams, Webex) to extract intelligence without requiring integration or cooperation from those platforms.
5. **Multi-modal compliance fusion** — No platform combines text analysis, vocal tone assessment, behavioural pattern detection, and selective disclosure risk scoring into a single compliance risk score for regulated financial communications.

---

## 4. SUMMARY OF THE INVENTION

CuraLive is a comprehensive real-time investor event intelligence platform comprising 18 novel interconnected subsystems:

| # | Subsystem | Novel Capability |
|---|-----------|-----------------|
| 1 | Shadow Bridge & Silent Intelligence Deployment | Passive AI agent injection into third-party meetings |
| 2 | AI Automated Moderator (aiAm) | Autonomous regulation-aware event moderation with kill-switch |
| 3 | Module M — Self-Evolution Engine | Zero-human-input AI self-improvement with evidence decay |
| 4 | Intelligence Suite — 11 Advanced AI Algorithms | Evasiveness, market impact, compliance, sentiment fusion, RAG briefings + 6 CIP modules |
| 5 | Operator Control Console (OCC) | Real-time multi-participant conference management |
| 6 | Webcasting Engine | End-to-end event lifecycle with RTMP/HLS/WebRTC |
| 7 | Multi-Carrier Telephony with Autonomous Failover | Dual-carrier (Twilio/Telnyx) with health-based switching |
| 8 | Adaptive Intelligence Thresholds | Operator-to-AI feedback loop with dynamic calibration |
| 9 | Autonomous Intervention Engine | Real-time signal monitoring with automated corrective actions |
| 10 | Health Guardian | AI-powered infrastructure monitoring with root cause attribution |
| 11 | EventEchoPipeline | Compliance-aware automated content transformation |
| 12 | Enterprise Security Architecture | Zero Trust, RBAC, immutable audit chain, threat hunting |
| 13 | Real-Time Materiality Risk Oracle | MNPI detection + auto-drafted SENS/8-K filings + one-click OCC approval |
| 14 | Investor Intention Decoder | Hidden agenda detection via dynamic investor graph + multi-agent LLM ensemble |
| 15 | Cross-Event Consistency Guardian | Persistent vector store of executive statements + live contradiction scoring |
| 16 | Predictive Volatility Simulator | Monte-Carlo simulations refreshed every 30s with LSTM/transformer time-series |
| 17 | Autonomous Regulatory Intervention Engine | Reinforcement learning from regulatory outcomes for self-evolving compliance |
| 18 | Event Integrity Digital Twin & Certificate | SHA-256 hash chain digital twin + blockchain-verified Clean Disclosure Certificate |

---

## 5. DETAILED DESCRIPTION OF IMPLEMENTED SUBSYSTEMS

### 5.1 Shadow Bridge — Silent Intelligence Deployment

**Implementation:** `server/routers/shadowModeRouter.ts`, `server/webhooks/recallWebhook.ts`, `client/src/pages/ShadowMode.tsx`

**Method:**
1. Operator provides a meeting URL (Zoom, Microsoft Teams, Google Meet, or Webex) or a PSTN conference bridge number.
2. The system deploys a named AI agent (via Recall.ai API) that joins the meeting as a silent participant.
3. Real-time audio is captured and streamed through the platform's transcription pipeline.
4. The Shadow Session mirrors the live event state, enabling parallel analysis (sentiment, compliance, evasiveness) without disrupting the original meeting.
5. All intelligence is extracted passively — the third-party platform requires no integration, API access, or awareness.

**Novel Claims:**
- Method for deploying a silent AI participant into a third-party video conferencing session to extract real-time investor event intelligence without platform integration.
- System for creating a parallel "Shadow Session" that mirrors a live event for secondary AI analysis.
- Automatic Tagged Metrics generation from passive observation of third-party meetings.

**PSTN Shadow Bridge Extension:**
- When a PSTN conference bridge number is provided, the system places an outbound Twilio/Telnyx call to the bridge.
- The call audio is streamed via WebSocket to OpenAI Whisper for real-time speech-to-text.
- The resulting transcript feeds into the same intelligence pipeline as web-based Shadow Mode.
- This enables intelligence extraction from legacy audio-only conference calls that have no web component.

---

### 5.2 AI Automated Moderator (aiAm)

**Implementation:** `server/_core/aiAmAutoMuting.ts`, `server/routers/aiAm.ts`, `server/_core/aiAmAuditTrail.ts`, `server/_core/aiAmReportGenerator.ts`

**Method:**
1. Real-time transcription segments are continuously analysed by a multi-agent AI pipeline.
2. Each agent specialises in a specific domain: **Compliance Agent** (regulatory violations, forward-looking statements), **IR Agent** (sentiment management, messaging consistency), and **Toxicity Agent** (inappropriate content, personal attacks).
3. When a violation is detected, agents fire in a deterministic sequence — Compliance first (redaction/logging), then IR (sentiment management), then Toxicity (content filtering).
4. The system can autonomously mute speakers, redact content, and dispatch alerts without human intervention.
5. Every action generates a cryptographically chained audit trail entry (SHA-256 hash with previous-entry linking) ensuring immutability and legal defensibility.

**Novel Claims:**
- Multi-agent AI moderation system with deterministic sequential firing for regulated financial events.
- Autonomous speaker muting triggered by real-time compliance violation detection during live investor events.
- Immutable, cryptographically chained audit trail for AI-driven moderation actions, suitable for FINRA/SEC/JSE regulatory review.
- Automated generation of compliance certificates and incident reports in PDF format.

---

### 5.3 Module M — Self-Evolution Engine

**Implementation:** `server/services/AiEvolutionService.ts`, `docs/CIP-Module-M-AI-Self-Evolution-Engine.md`

**Method:**
1. The system continuously scores its own AI outputs across three dimensions:
   - **Depth** — Volume and richness of generated intelligence.
   - **Breadth** — Completeness of coverage across all event dimensions.
   - **Specificity** — Detection of transcript-specific content versus generic LLM boilerplate.
2. An exponential time-decay function (default 14-day half-life) is applied to weakness observations, ensuring only current, recurring gaps are prioritised.
3. When sufficient evidence accumulates, the system autonomously proposes new AI capabilities through a 5-stage lifecycle:
   - **Emerging** → **Proposed** → **Approved** → **Building** → **Live**
4. Promotion through the first three stages occurs without human intervention when confidence and evidence thresholds are met.
5. The system writes its own prompts and tool definitions for newly proposed capabilities.

**Novel Claims:**
- Zero-human-input AI self-improvement pipeline for investor event intelligence platforms.
- Algorithmic quality scoring method combining depth, breadth, and specificity metrics for AI output evaluation.
- Evidence decay function with configurable half-life for prioritising current AI weaknesses over historical ones.
- Autonomous AI capability proposal and promotion pipeline with confidence-gated stage transitions.

---

### 5.4 Intelligence Suite — Five Advanced AI Algorithms

**Implementation:** Five service modules + five tRPC routers + five database tables + unified frontend

#### 5.4.1 Evasive Answer Detection

**Files:** `server/services/EvasiveAnswerDetectionService.ts`, `server/routers/evasiveAnswerRouter.ts`

**Method:**
1. Accepts a Q&A exchange pair (analyst question + executive response) along with speaker role context.
2. Uses LLM with structured JSON output to analyse the response across multiple evasiveness indicators:
   - Hedging language detection (e.g., "we believe", "roughly speaking")
   - Topic shift detection (whether the response addresses the actual question)
   - Temporal deflection ("we'll address that next quarter")
   - Authority deflection ("I'll let our CFO speak to that")
   - Jargon flooding (excessive technical language to obscure meaning)
   - Non-answer patterns (responding with a question, pivoting to unrelated strengths)
3. Produces a Directness Index (0-100) and Evasiveness Score (0.000-1.000).
4. Supports batch analysis of entire Q&A sessions.
5. Results are persisted in `evasiveness_logs` table with event/session correlation.

**Novel Claims:**
- NLP-based evasiveness scoring system specifically calibrated for executive responses during regulated investor events.
- Directness Index metric combining hedging phrase detection, topic shift analysis, and authority deflection patterns.
- Batch evasiveness analysis pipeline for complete earnings call Q&A sessions.

#### 5.4.2 Predictive Market Impact Forecasting

**Files:** `server/services/MarketImpactPredictorService.ts`, `server/routers/marketImpactPredictorRouter.ts`

**Method:**
1. Ingests sentiment scores, topic keywords, evasiveness data, company ticker, event type, and transcript excerpts.
2. Uses LLM with structured output to predict:
   - **Predicted Volatility** (0-10 scale)
   - **Direction** (positive/negative/neutral)
   - **Confidence** (0.000-1.000)
   - **Time Horizon** (e.g., "2-3 days")
   - **Risk Factors** and **Catalysts** as structured arrays
3. Incorporates historical comparison reasoning.
4. Results stored in `market_impact_predictions` table.

**Novel Claims:**
- Real-time market impact prediction from live investor event signals (sentiment, evasiveness, topics) using LLM reasoning.
- Multi-factor volatility forecasting combining call tone, content analysis, and historical pattern matching.

#### 5.4.3 Multi-Modal Compliance Risk Scoring

**Files:** `server/services/MultiModalComplianceService.ts`, `server/routers/multiModalComplianceRouter.ts`

**Method:**
1. Fuses three independent signal modalities:
   - **Text Risk** — Analysis of transcript language for regulatory violations
   - **Tone Risk** — Vocal sentiment indicators suggesting discomfort or deception
   - **Behavioural Risk** — Patterns such as topic avoidance, excessive hedging, or inconsistent messaging
2. Produces a composite overall risk score plus individual modality scores.
3. Detects specific violation types: selective disclosure, insider trading indicators, forward-looking statement violations.
4. Supports multi-jurisdictional analysis: JSE (South Africa), SEC (United States), FCA (United Kingdom), and multi-jurisdictional.
5. Generates structured recommendations and insider trading indicators.
6. Results persisted in `compliance_risk_scores` table.

**Novel Claims:**
- Multi-modal compliance risk scoring system fusing text, tone, and behavioural signals for real-time regulatory violation detection during investor events.
- Cross-jurisdictional compliance analysis engine supporting simultaneous JSE, SEC, and FCA regulatory frameworks.
- Selective disclosure risk detection algorithm combining speaker behaviour patterns with content analysis.

#### 5.4.4 Real-Time External Sentiment Aggregation

**Files:** `server/services/ExternalSentimentService.ts`, `server/routers/externalSentimentRouter.ts`

**Method:**
1. Takes company information, event context, internal call sentiment, and key discussion topics.
2. Uses LLM to synthesise external market signals and generate:
   - **Aggregated External Sentiment** (-1.000 to +1.000)
   - **Social Mention Count** (estimated volume)
   - **Crowd Reaction** classification (bullish/bearish/mixed/confused/cautious)
   - **Divergence from Call** — How far external perception differs from the call's internal sentiment
   - **Top Themes** with representative posts, sentiment classification, and volume
   - **Early Warnings** for the IR team
   - **Influencer Sentiment** analysis
   - **Media Reactions** breakdown
3. Results stored in `external_sentiment_snapshots` table.

**Novel Claims:**
- System for computing divergence between internal investor event sentiment and external market/social sentiment in real-time.
- Early warning generation for IR teams based on sentiment divergence analysis.
- Crowd reaction classification algorithm for investor events.

#### 5.4.5 Personalised IR Briefing Generation (RAG Pipeline)

**Files:** `server/services/PersonalizedBriefingService.ts`, `server/routers/personalizedBriefingRouter.ts`

**Method:**
1. Accepts stakeholder type (CEO, CFO, IR Head, Board Member, Analyst, Compliance Officer, Investor), company/event context, transcript data, and optional cross-algorithm inputs (sentiment, evasiveness, market impact, compliance data).
2. Constructs a stakeholder-specific prompt incorporating role-relevant priorities:
   - CEOs receive strategic messaging focus and board communication recommendations
   - CFOs receive financial metric analysis and guidance implications
   - IR Heads receive media strategy and analyst relationship management
   - Compliance Officers receive regulatory risk assessment and remediation priorities
3. Generates structured briefing with:
   - Executive Summary
   - Key Findings (with importance levels and action-required flags)
   - Risk Alerts (with severity and mitigation recommendations)
   - Action Items (with owners, deadlines, and priority levels)
   - Stakeholder Impact assessment
   - Appendix with confidence level and source references
4. Results stored in `ir_briefings` table.

**Novel Claims:**
- RAG-based personalised briefing generation system that produces role-specific intelligence reports from investor event data.
- Cross-algorithm input fusion for briefing generation, combining evasiveness, sentiment, market impact, and compliance signals.
- Stakeholder-type-specific prompt engineering for IR briefing personalisation.

---

### 5.5 Operator Control Console (OCC)

**Implementation:** `client/src/pages/OCC.tsx`, `server/db.occ.ts`, `server/routers/occ.ts`

**Method:**
1. Provides real-time management of multi-participant conference calls with sub-second status updates via Ably pub/sub.
2. Displays participant states: speaking, muted, waiting, in lounge, on hold.
3. Manages Q&A queues with operator-controlled participant promotion and demotion.
4. Supports pre-recorded audio file playback into live conference streams.
5. Integrates with the AI Automated Moderator for automated intervention controls.
6. Includes a participant "Lounge" system for managing waiting callers before they are brought live.

**Novel Claims:**
- Integrated operator console combining real-time conferencing management with AI-powered moderation controls for regulated investor events.
- Participant lounge system with queue management and operator-controlled promotion for investor event telephony.

---

### 5.6 Webcasting Engine

**Implementation:** `server/routers/webcastRouter.ts`, `server/routers/muxRouter.ts`, `client/src/pages/CreateEventWizard.tsx`, `client/src/pages/WebcastStudio.tsx`, `client/src/pages/AttendeeEventRoom.tsx`, `client/src/pages/OnDemandWatch.tsx`, `client/src/pages/WebcastReport.tsx`

**Full Event Lifecycle:**
1. **Creation** — 6-step guided wizard: Event Type → Details → Branding → Agenda & Speakers → Registration Settings → AI Applications selection.
2. **Registration** — Public landing pages with industry-specific templates (healthcare: CPD accreditation; financial services: regulatory disclaimers). Generates unique attendee passes with personal join links and calendar invites (.ics).
3. **Live Broadcast** — RTMP ingest from OBS/vMix/hardware encoders via Mux. HLS playback for attendees with sub-100ms delivery. Multi-language real-time translation (9+ languages including English, French, Swahili, isiZulu).
4. **Attendee Experience** — Interactive tabbed interface: Live Video, Transcript (with auto-scroll), Q&A (submit/upvote), Polls (live results), Event Info. Mobile-optimised with swipeable panels.
5. **Operator Studio** — Q&A moderation (approve/dismiss), live polling (launch/close with instant broadcasting), operator-to-attendee chat, AI-assisted broadcast quality controls.
6. **Post-Event** — On-demand playback with video chapters, searchable transcripts, downloadable certificates (CME/CPD accreditation). On-demand library with gated access and vertical-specific filtering.
7. **Reporting** — Attendance analytics, engagement metrics, poll breakdowns, AI-generated executive summaries, automated content generation (press releases, social posts, recaps).

**Novel Claims:**
- End-to-end investor event lifecycle engine with integrated AI intelligence at every stage.
- Attendee pass generation system with personal join links for regulated investor events.
- AI application selector during event creation that activates specific intelligence modules for the event.

---

### 5.7 Multi-Carrier Telephony with Autonomous Failover

**Implementation:** `server/webphone/carrierManager.ts`, `server/webphone/twilio.ts`, `server/webphone/telnyx.ts`, `server/routers/webphoneRouter.ts`, `server/services/ConferenceDialoutService.ts`

**Method:**
1. Dual-carrier architecture using Twilio (primary) and Telnyx (secondary) for voice communications.
2. Carrier Manager continuously monitors primary carrier health metrics.
3. Upon detecting degradation in the primary carrier, automatically fails over to the secondary carrier — either autonomously or via manual operator trigger.
4. WebRTC-based operator webphone supporting inbound/outbound calls with caller ID management, session logging, and automatic recording.
5. Conference Dial-Out supports up to 200 participants per session, dialling out to bring participants into a Twilio-hosted conference bridge.
6. Includes automated number purchasing and assignment via Telnyx API for failover numbers.

**Novel Claims:**
- Autonomous multi-carrier telephony failover system for investor event conferencing with health-based switching between voice carriers.
- Conference dial-out system supporting up to 200 participants with real-time status tracking for investor events.

---

### 5.8 Adaptive Intelligence Thresholds

**Implementation:** `server/routers/adaptiveIntelligenceRouter.ts`

**Method:**
1. Every operator correction (dismissing a false compliance flag, overriding a sentiment score, adjusting a risk classification) is captured as a weighted training signal.
2. The system calculates a "Learned Value" by blending default AI thresholds with a weighted average of operator corrections.
3. Calibration progresses through maturity stages: **Learning → Adapting → Calibrated → Self-Evolving**.
4. Stage transitions are automatic based on accumulated correction volume and consistency.
5. The AI adapts specifically to each company's or sector's communication style over time.

**Novel Claims:**
- Operator-to-AI feedback loop that dynamically recalibrates AI intelligence thresholds based on domain expert corrections.
- Maturity stage progression system for AI calibration (Learning → Adapting → Calibrated → Self-Evolving) with automatic stage transitions.

---

### 5.9 Autonomous Intervention Engine

**Implementation:** `client/src/pages/AutonomousIntervention.tsx`, `server/routers/autonomousInterventionRouter.ts`

**Method:**
1. Monitors 6+ real-time signal categories during live events:
   - Sentiment Drop Alert (sudden negative sentiment shift)
   - Q&A Overload (question queue exceeding capacity)
   - Compliance Breach Detection (real-time regulatory violation)
   - Speaker Pace Anomaly (unusual speaking rate indicating stress/discomfort)
   - Engagement Collapse (attendee drop-off or attention loss)
   - Technical Quality Degradation (audio/video quality issues)
2. When a threshold is breached, the engine autonomously executes corrective actions:
   - Dispatches operator alerts
   - Triggers AI-AM muting protocols
   - Adjusts Q&A queue prioritisation
   - Generates real-time compliance interventions
3. Every intervention generates a FINRA/JSE-compliant audit log entry at the moment of action, providing a legally defensible record of mid-call moderation.

**Novel Claims:**
- Autonomous real-time intervention system for investor events that monitors multi-dimensional signals and takes corrective action without human initiation.
- Automated creation of regulation-compliant audit log entries at the moment of autonomous AI intervention during live financial events.

---

### 5.10 Health Guardian — AI Infrastructure Monitor

**Implementation:** `client/src/pages/HealthGuardian.tsx`, `server/routers/healthGuardianRouter.ts`

**Method:**
1. Continuously monitors 6+ infrastructure services: Database, AI Engine, Telephony, Webcasting, Real-time Messaging, and Transcription.
2. Uses AI-powered root cause analysis to determine whether issues originate from:
   - Platform-side failures (server, database, API)
   - Participant-side issues (local ISP, browser compatibility, device limitations)
3. **Attribution Intelligence** distinguishes between platform and participant responsibility — critical for SLA compliance in high-value webcasts.
4. Automatically generates professional incident reports for clients, proving when connectivity issues originated from the user's side.
5. Tracks latency, uptime, and error rates with pulsing visual indicators and historical incident timelines.

**Novel Claims:**
- AI-powered infrastructure health monitoring with attribution intelligence that distinguishes between platform-side and participant-side failures.
- Automated client-facing incident report generation with root cause attribution for SLA dispute resolution.

---

### 5.11 EventEchoPipeline — Compliance-Aware Content Transformation

**Implementation:** `server/services/EventEchoPipeline.ts`, `server/routers/socialMedia.ts`

**Method:**
1. Captures live event signals: sentiment peaks, key quotes, financial highlights, and audience engagement metrics.
2. Transforms these signals into platform-optimised content (LinkedIn, Twitter/X, press releases) using a "Social Amplification" engine.
3. **Regulatory Speech Guarding** — A specific pipeline step ensures generated content does not include:
   - Forward-looking statements prohibited by securities regulation
   - Material non-public information (MNPI)
   - Selective disclosure violations (Regulation FD / JSE Listings Requirements)
4. Supports the Podcast Converter (`server/services/PodcastConverterService.ts`) which transforms event transcripts into podcast-style scripts.

**Novel Claims:**
- Compliance-aware social content generation pipeline that transforms investor event signals into platform-optimised posts while enforcing regulatory speech guardrails.
- Automated forward-looking statement filtering for social media content derived from regulated investor events.

---

### 5.12 Enterprise Security Architecture

**Implementation:** Multiple security dashboards, RBAC system, and audit infrastructure.

#### 5.12.1 Zero Trust Architecture
**Files:** `client/src/pages/ZeroTrustDashboard.tsx`
- Device posture monitoring and trust scoring
- Microsegmentation with flow policies between services
- Continuous authentication with MFA, behavioural biometrics, and session risk scoring

#### 5.12.2 Role-Based Access Control (RBAC)
**Files:** `server/routers/rbac.ts`
- Hierarchy-based role system: Admin (3) → Operator (2) → User (1)
- Granular permissions: `canOperateConsole`, `canViewComplianceReports`, `canManageUsers`, `canExportReports`
- Protected procedures (`protectedProcedure`, `adminProcedure`) enforced at the router level

#### 5.12.3 Immutable Audit Chain
**Files:** `server/_core/aiAmAuditTrail.ts`
- SHA-256 hash-based integrity verification
- Chain of custody linking (each entry references the previous entry's hash)
- Captures violations, acknowledgments, muting actions, and alert dispatches
- Export capability for CSV/JSON for regulatory review

#### 5.12.4 Advanced Threat Hunting
**Files:** `client/src/pages/AdvancedThreatHunting.tsx`
- Hunting campaign management (e.g., Lateral Movement Detection)
- Indicator of Compromise (IOC) tracking (IPs, domains, file hashes)
- YARA rule deployment and monitoring

#### 5.12.5 Compliance Frameworks
**Files:** `client/src/pages/SOC2Dashboard.tsx`, `client/src/pages/ISO27001Dashboard.tsx`
- SOC 2 Type II control monitoring with gap analysis
- ISO 27001 control assessment with AI-generated remediation roadmaps
- Automated compliance certificate generation in PDF format

### 5.13 Real-Time Materiality Risk Oracle (CIP Module 1)

**Implementation:** `server/services/MaterialityRiskOracleService.ts`, `server/routers/materialityRiskRouter.ts`

**Method:**
1. During a live earnings call, the system continuously ingests audio transcription and scores every executive statement for "material non-public information" (MNPI) risk.
2. A parallel NLP pipeline executes simultaneously: an evasion model and a materiality classifier trained on historical SEC enforcement actions, JSE queries, and FCA outcomes.
3. When the materiality score exceeds a configurable threshold, the system auto-generates a draft SENS/8-K/RNS regulatory filing using RAG over the issuer's prior filings.
4. The draft filing, risk score, MNPI indicators, and suggested corrective language are published via Ably pub/sub to the OCC operator console with one-click approval.
5. All flagged statements are logged to `materiality_risk_logs` with full audit trail.

**Novel Elements:**
- No existing tool performs real-time materiality scoring + auto-drafting + live operator intervention during the call.
- Parallel evasion NLP + materiality classifier + RAG over issuer filings + Ably pub/sub alert to OCC.
- Multi-jurisdictional support: SEC Reg FD, JSE Listings Requirements 3.4, FCA MAR, EU MAR.

---

### 5.14 Investor Intention Decoder (CIP Module 2)

**Implementation:** `server/services/InvestorIntentionDecoderService.ts`, `server/routers/investorIntentRouter.ts`

**Method:**
1. Analyses investor questions for underlying intent using linguistic patterns combined with a dynamic graph database of historical investor behaviour.
2. A multi-agent LLM ensemble classifies each question against 8 investor archetypes: ACTIVIST_PRESSURE, SHORT_SELLER_SIGNAL, RETAIL_CONFUSION, ANALYST_FISHING, SUPPORTIVE_SHAREHOLDER, COMPETITOR_INTELLIGENCE, REGULATORY_PROBE, LITIGATION_SETUP.
3. Displays "Intent Profile" badges (e.g., "Activist Pressure", "Short Signal") in the Q&A queue with aggression scores (0-100).
4. Predicts follow-up questions and recommends response strategies for management.
5. Maintains a persistent memory graph of investor-question vectors across events for longitudinal analysis.

**Novel Elements:**
- No live system decodes investor psychology/intent with persistent memory graph during calls.
- Dynamic graph database of investor-question vectors + multi-agent LLM ensemble per investor archetype.
- Real-time intent badge + aggression score delivery via pub/sub to operator Q&A queue.

---

### 5.15 Cross-Event Consistency Guardian (CIP Module 3)

**Implementation:** `server/services/CrossEventConsistencyService.ts`, `server/routers/crossEventConsistencyRouter.ts`

**Method:**
1. Maintains a persistent vector store of every executive statement across all prior events (current call + prior quarters + peer companies).
2. When a new statement is made, the system performs real-time similarity/contradiction scoring against the historical corpus.
3. Contradictions are flagged with severity levels (critical/high/medium/low) and confidence scores.
4. RAG-powered corrective language is generated and surfaced to the OCC console before the executive completes their response.
5. Cross-references against regulatory requirements (SEC Rule 10b5-1, Regulation FD, JSE Listing Requirements, GDPR).
6. All consistency checks are logged to `consistency_check_logs` with messaging drift analysis.

**Novel Elements:**
- No live tool maintains cross-event messaging memory at scale with pre-emptive correction.
- Persistent vector store of historical statements + real-time contradiction scoring + RAG corrective generation.
- Proactive correction surfaced before response completion — not post-event.

---

### 5.16 Predictive Volatility Simulator (CIP Module 4)

**Implementation:** `server/services/VolatilitySimulatorService.ts`, `server/routers/volatilitySimulatorRouter.ts`

**Method:**
1. While the call is live, the system runs 100+ micro-simulations using Monte-Carlo methods based on partial transcript data, sentiment vectors, and guidance tone.
2. A continuously updated LSTM/transformer time-series model produces probability distributions of short-term price impact.
3. Three forecast scenarios are generated: base case, bull case, and bear case — each with price move percentage, probability, and key drivers.
4. The system produces a 95% confidence interval for expected price movement and a trading desk recommendation.
5. Simulations refresh every 30 seconds as new transcript data arrives.
6. Results are published to the OCC console and can be displayed on the speaker's teleprompter.

**Novel Elements:**
- No system simulates forward market outcomes in real time using partial live transcript data.
- Monte-Carlo simulations refreshed every 30 seconds using live-updated time-series model.
- Alternative phrasing engine suggests lower-volatility wording while maintaining semantic equivalence.

---

### 5.17 Autonomous Regulatory Intervention Engine (CIP Module 5)

**Implementation:** `server/services/RegulatoryInterventionService.ts`, `server/routers/regulatoryInterventionRouter.ts`

**Method:**
1. Extends Module M's self-evolution capability with a closed-loop reinforcement learning system.
2. Ingests post-event regulatory outcomes (SEC comment letters, JSE queries, enforcement actions) as training signals.
3. Autonomously adjusts detection thresholds, classifier parameters, and response templates based on historical outcomes.
4. Proposes classifier updates with expected improvement metrics and deployment recommendations.
5. Operates through 5 evolution stages: observing → learning → adapting → calibrated → autonomous.
6. Generates new response templates per jurisdiction as regulatory landscape evolves.
7. Deploys updated models before the next issuer event — no human retraining required.

**Novel Elements:**
- Self-evolving agents exist in research; none applied to live investor comms with regulatory feedback loops.
- Closed-loop reinforcement learning with regulatory outcomes as training signals.
- Autonomous deployment of updated models before next event with confidence-gated stages.

---

### 5.18 Event Integrity Digital Twin & Certificate (CIP Module 6)

**Implementation:** `server/services/EventIntegrityTwinService.ts`, `server/routers/eventIntegrityRouter.ts`

**Method:**
1. Creates a live digital twin of the entire event comprising transcript segments, sentiment scores, compliance scores, and operator actions.
2. Each segment is cryptographically linked using SHA-256 hash chaining — each segment's hash includes the previous segment's hash, creating an immutable chain of custody.
3. At event conclusion, the system generates a comprehensive integrity assessment including:
   - Integrity score (0-1.000)
   - Certificate grade (AAA through NR)
   - Disclosure completeness percentage
   - Regulatory compliance rating
   - Consistency rating across all segments
4. A formal "Clean Disclosure Certificate" is generated — suitable for publication to investors, exchanges, and regulatory bodies.
5. The certificate includes the twin hash (SHA-256 of the complete chain), genesis hash, final hash, and chain length for independent verification.
6. All certificates are logged to `event_integrity_twins` with full cryptographic proof.

**Novel Elements:**
- No live event platform issues real-time, immutable regulatory-grade integrity certificates.
- Cryptographic hash chain of every segment + final certificate publication.
- Certificate grades (AAA-NR) based on disclosure completeness, regulatory compliance, and messaging consistency.

---

## 6. PARTNER INTEGRATION ARCHITECTURE

### 6.1 Bastion Capital Partners Integration

**Implementation:** `server/services/BastionBookingService.ts`, `server/services/BastionInvestorAiService.ts`

**Capabilities:**
- Investor Intelligence booking system for earnings calls
- Co-branded confirmation emails (Bastion x CuraLive)
- Live Intelligence Dashboard accessible via secure `dashboardToken` (no-login access)
- Five AI intelligence modules:
  1. Earnings Sentiment Decoder
  2. Forward Guidance Tracker
  3. Analyst Question Intelligence
  4. Management Credibility Scorer
  5. Market-Moving Statement Detector

### 6.2 Lumi Global Integration (AGM Governance)

**Implementation:** `server/services/LumiBookingService.ts`, `server/routers/agmGovernanceRouter.ts`, `server/services/AgmGovernanceAiService.ts`

**Capabilities:**
- AGM Intelligence booking and management
- Resolution tracking and outcome prediction
- Jurisdiction-specific quorum monitoring (Companies Act 71, JSE Listings Requirements)
- Real-time governance observation during shareholder meetings
- Post-AGM Governance Report generation

---

## 7. ENTERPRISE BILLING ENGINE

**Implementation:** `server/routers/billing.ts`, `server/db.billing.ts`, `server/billingPdf.ts`

- Full billing lifecycle: Clients → Quotes (multi-version) → Invoices → Payments → Ageing Reports
- Multi-currency support: ZAR, USD, EUR with FX rate tracking
- Automated PDF generation for quotes and invoices
- Payment method tracking: EFT/Bank transfers
- Overdue invoice monitoring and ageing analysis

---

## 8. SUSTAINABILITY INTELLIGENCE

**Implementation:** `server/services/SustainabilityOptimizer.ts`, `client/src/pages/SustainabilityDashboard.tsx`

- Calculates CO2 savings from virtual events versus physical travel
- Generates Sustainability Scores (A+ to D)
- Produces event-specific sustainability badges and certificates
- ESG reporting integration for corporate sustainability disclosures

---

## 9. BENCHMARKING ENGINE

**Implementation:** `client/src/pages/Benchmarks.tsx`, `client/src/pages/BenchmarkingDashboard.tsx`

- Compares event performance against industry standards
- Metrics: engagement rates, sentiment distribution, Q&A activity, attendance rates
- Sector-specific benchmarking (Financial Services, Healthcare, Mining, etc.)
- Historical trend analysis across events

---

## 10. TECHNOLOGY STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite + TailwindCSS 4 | Single-page application |
| Backend | Express + tRPC | Type-safe API layer |
| Database | MySQL + Drizzle ORM | Relational data persistence |
| Real-time | Ably | Pub/sub messaging, presence |
| Video | Mux | RTMP ingest, HLS delivery |
| Telephony (Primary) | Twilio | WebRTC, PSTN, conference bridges |
| Telephony (Secondary) | Telnyx | SIP failover, number provisioning |
| AI/LLM | OpenAI GPT-4o / Gemini 2.5 Flash | Structured intelligence generation |
| Transcription | OpenAI Whisper | Speech-to-text |
| Meeting Bots | Recall.ai | Third-party meeting intelligence |
| Authentication | OAuth 2.0 / Clerk | Identity management |

---

## 11. DATABASE SCHEMA (INTELLIGENCE SUITE TABLES)

```sql
-- Evasive Answer Detection
CREATE TABLE evasiveness_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  session_id INT NOT NULL,
  question_text TEXT,
  response_text TEXT,
  score DECIMAL(4,3),
  directness_index INT,
  explanation TEXT,
  flags JSON,
  hedging_phrases JSON,
  topic_shift_detected TINYINT(1),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Predictive Market Impact
CREATE TABLE market_impact_predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  session_id INT NOT NULL,
  predicted_volatility DECIMAL(4,2),
  direction VARCHAR(20),
  confidence DECIMAL(4,3),
  reasoning TEXT,
  risk_factors JSON,
  catalysts JSON,
  time_horizon VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Multi-Modal Compliance Risk
CREATE TABLE compliance_risk_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  session_id INT NOT NULL,
  overall_risk DECIMAL(4,3),
  text_risk DECIMAL(4,3),
  tone_risk DECIMAL(4,3),
  behavioral_risk DECIMAL(4,3),
  selective_disclosure_risk DECIMAL(4,3),
  regulatory_flags JSON,
  violations JSON,
  recommendations JSON,
  insider_trading_indicators JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- External Sentiment Aggregation
CREATE TABLE external_sentiment_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  session_id INT NOT NULL,
  aggregated_sentiment DECIMAL(4,3),
  social_mentions INT,
  sentiment_breakdown JSON,
  top_themes JSON,
  crowd_reaction VARCHAR(20),
  divergence_from_call DECIMAL(4,3),
  early_warnings JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Personalised IR Briefings
CREATE TABLE ir_briefings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  session_id INT NOT NULL,
  stakeholder_type VARCHAR(50),
  title VARCHAR(500),
  executive_summary TEXT,
  briefing_data JSON,
  confidence_level DECIMAL(4,3),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 12. CLAIMS SUMMARY

### Independent Claims

**Claim 1:** A computer-implemented method for providing real-time intelligence during investor events, comprising: deploying a silent AI agent into a third-party conferencing session; extracting audio and generating real-time transcription; simultaneously executing sentiment analysis, evasiveness detection, compliance risk scoring, market impact prediction, and external sentiment aggregation on said transcription; and generating personalised stakeholder briefings from the fused intelligence signals.

**Claim 2:** A self-evolving AI system for investor event intelligence, comprising: autonomous quality scoring of AI outputs using depth, breadth, and specificity metrics; an evidence decay function for prioritising current AI weaknesses; and an autonomous capability proposal pipeline with confidence-gated stage transitions from Emerging through Live status without human intervention.

**Claim 3:** A multi-modal compliance monitoring system for regulated financial communications, comprising: simultaneous text analysis, vocal tone assessment, and behavioural pattern detection; production of a composite compliance risk score; detection of selective disclosure violations and insider trading indicators; and cross-jurisdictional regulatory analysis supporting multiple financial regulatory frameworks simultaneously.

**Claim 4:** An autonomous moderation system for regulated investor events, comprising: a multi-agent AI pipeline with deterministic sequential firing; autonomous speaker muting triggered by real-time compliance violation detection; and generation of cryptographically chained, immutable audit trail entries at the moment of each moderation action.

**Claim 5:** An adaptive AI calibration system for investor event intelligence, comprising: capturing operator corrections as weighted training signals; calculating learned threshold values by blending default settings with operator feedback; and automatic progression through maturity stages from Learning to Self-Evolving based on accumulated correction volume and consistency.

**Claim 6 (CIP):** A computer-implemented method for real-time protection against selective disclosure during a live investor communication event, comprising: (a) continuous ingestion of an audio transcription stream; (b) simultaneous execution of an evasion NLP model and a materiality classifier trained on historical enforcement actions; (c) generation of a draft regulatory filing (SENS/8-K/RNS) using retrieval-augmented generation when the materiality risk score exceeds a configurable threshold; (d) publishing the risk score, MNPI indicators, and draft filing via pub/sub to an operator console with one-click approval; and (e) logging all flagged statements with full cryptographic audit trail.

**Claim 7 (CIP):** A system for real-time investor intent classification during a live event, comprising: (a) a dynamic graph database storing vector embeddings of historical questions per investor; (b) a multi-agent LLM ensemble that classifies each question against eight investor archetypes including activist pressure, short-seller signal, and litigation setup; (c) calculation of an aggression score predicting follow-up hostility; (d) pub/sub delivery of an intent badge, aggression score, and response strategy to the operator Q&A queue; and (e) persistent longitudinal investor behaviour tracking across events.

**Claim 8 (CIP):** A method of maintaining live semantic consistency of executive messaging during investor events, comprising: (a) maintaining a persistent vector store of historical executive statements across all prior events and peer companies; (b) real-time similarity and contradiction scoring on each new utterance; (c) generating corrective phrasing via retrieval-augmented generation; (d) surfacing contradiction alerts and suggested corrections to the OCC console before the executive completes their response; and (e) cross-referencing all statements against multi-jurisdictional regulatory requirements.

**Claim 9 (CIP):** A real-time simulation engine for investor events, comprising: (a) continuous ingestion of partial transcript vectors and sentiment scores from a live event; (b) execution of 100+ parallel Monte-Carlo forecast simulations using a continuously updated LSTM/transformer time-series model; (c) generation of base case, bull case, and bear case scenarios with probability distributions; (d) production of a 95% confidence interval for predicted price movement; (e) refreshing all simulations every 30 seconds as new transcript data arrives; and (f) publishing probability distributions and trading recommendations to the OCC console.

**Claim 10 (CIP):** A self-evolving compliance system for live investor communications, comprising: (a) a closed-loop reinforcement learning pipeline ingesting post-event regulatory feedback including SEC comment letters, JSE queries, and enforcement actions as training signals; (b) automatic adjustment of detection thresholds, classifier parameters, and response templates based on historical regulatory outcomes; (c) progression through five evolution stages from observing to autonomous with confidence-gated transitions; (d) generation of jurisdiction-specific response templates as the regulatory landscape evolves; and (e) autonomous deployment of updated models before the next issuer event without human retraining.

**Claim 11 (CIP):** A method for certifying live event integrity, comprising: (a) maintaining a cryptographically linked digital twin of transcript segments, sentiment scores, compliance scores, and operator actions using SHA-256 hash chaining where each segment includes the prior segment's hash; (b) scoring overall event integrity across disclosure completeness, regulatory compliance, and messaging consistency dimensions; (c) assigning a certificate grade from AAA through NR based on the integrity assessment; (d) generating a formal "Clean Disclosure Certificate" suitable for publication to investors, exchanges, and regulatory bodies; and (e) providing the twin hash, genesis hash, final hash, and chain length for independent cryptographic verification.

---

## 13. FIGURES AND DRAWINGS

The following diagrams should accompany the patent application:

1. **System Architecture Diagram** — Overall platform architecture showing all 18 subsystems and their interconnections.
2. **Shadow Bridge Data Flow** — Sequence diagram showing silent agent deployment, audio capture, transcription, and intelligence pipeline.
3. **Module M Self-Evolution Lifecycle** — State diagram showing the 5-stage capability lifecycle (Emerging → Live) with evidence decay curves.
4. **Intelligence Suite Pipeline** — Data flow diagram showing how the 5 AI algorithms receive inputs and produce outputs.
5. **Multi-Modal Compliance Fusion** — Diagram showing text, tone, and behavioural signal fusion into composite risk score.
6. **Autonomous Intervention Decision Tree** — Flow chart showing signal monitoring, threshold detection, and corrective action execution.
7. **Adaptive Intelligence Feedback Loop** — Diagram showing operator correction capture, threshold recalculation, and maturity stage progression.
8. **Multi-Carrier Failover Architecture** — Sequence diagram showing Twilio/Telnyx health monitoring and autonomous switching.
9. **Immutable Audit Chain Structure** — Diagram showing SHA-256 hash linking between sequential audit entries.
10. **Webcast Lifecycle** — End-to-end flow from event creation through live broadcast to post-event reporting.
11. **Materiality Risk Oracle Pipeline** — Data flow from live transcription through parallel evasion NLP + materiality classifier to auto-drafted regulatory filing and OCC one-click approval.
12. **Investor Intention Decoder Architecture** — Dynamic graph database of investor vectors feeding multi-agent LLM ensemble with intent badge output to Q&A queue.
13. **Cross-Event Consistency Guardian** — Persistent vector store queried in real-time with contradiction scoring and RAG corrective language generation.
14. **Predictive Volatility Simulator** — Monte-Carlo simulation engine with LSTM/transformer model, scenario generation, and OCC probability distribution display.
15. **Autonomous Regulatory Intervention Engine** — Closed-loop reinforcement learning architecture with regulatory outcome ingestion, threshold adjustment, and autonomous deployment.
16. **Event Integrity Digital Twin** — SHA-256 hash chain construction, integrity scoring, certificate grade assignment, and Clean Disclosure Certificate generation.

---

## 14. PRIOR ART DIFFERENTIATION

| Existing Solution | CuraLive Differentiation |
|-------------------|-------------------------|
| Zoom/Teams/Webex | No integrated AI intelligence; CuraLive deploys into these platforms silently |
| Bloomberg Terminal | Financial data only; no live event intelligence or moderation |
| Notivize/Lumi AGM platforms | Basic voting/registration; no AI analysis or autonomous moderation |
| Otter.ai / Rev.com | Transcription only; no multi-modal compliance or market impact prediction |
| Sentieo / AlphaSense | Document analysis; not real-time event intelligence |
| Traditional IR platforms | Manual processes; no self-evolving AI or autonomous intervention |

---

## 15. COMMERCIAL DEPLOYMENT STATUS

- **Production URL:** https://curalive-platform.replit.app
- **GitHub Repository:** github.com/davecameron187-sys/curalive-platform
- **Development Status:** Fully implemented and operational
- **Primary Market:** JSE-listed companies, South African investor relations
- **Expansion Markets:** SEC-regulated (US), FCA-regulated (UK), multi-jurisdictional
- **Partner Integrations:** Bastion Capital Partners, Lumi Global

---

*This brief has been prepared from the implemented production codebase as of 18 March 2026. All described features are fully coded, tested, and operational in the production environment.*

**END OF PATENT SUBMISSION BRIEF**
