# PATENT EXTENSION APPLICATION — CIPC (Companies and Intellectual Property Commission)

## Extension to Provisional Patent Specification

**Application Reference:** [Original CIPC Provisional Patent Number — to be inserted]
**Applicant:** David [Surname] / CuraLive (Pty) Ltd
**Date of Original Filing:** [Original filing date]
**Extension Filing Date:** 15 March 2026
**Title of Invention:** Autonomous AI Compliance Monitoring System with Predictive Fraud Detection for Real-Time Investor Event Platforms

---

## SECTION 1: PREAMBLE

This document constitutes an extension to the provisional patent specification originally filed with the Companies and Intellectual Property Commission (CIPC) of South Africa. The extension introduces substantive new claims relating to autonomous AI-powered compliance monitoring, predictive fraud detection, and real-time remediation capabilities integrated within a live investor events and webcasting platform.

The original provisional patent covered the core CuraLive platform architecture for real-time investor event management, including the Agentic Brain AI system, operator console, and live communication infrastructure. This extension adds the following novel inventions:

1. An autonomous compliance engine that continuously monitors platform activity against ISO 27001 and SOC 2 Type II frameworks without human intervention
2. A predictive fraud detection system using AI-assessed threat analysis with multi-signal pattern recognition
3. An automated remediation pipeline that identifies, assesses, and proposes mitigations for security threats in real time
4. A cross-system health-compliance correlation engine linking operational health monitoring with compliance framework assessment

---

## SECTION 2: FIELD OF THE INVENTION

The present invention relates to the field of artificial intelligence systems applied to cybersecurity compliance and fraud detection within financial technology platforms, and more particularly to autonomous, continuously-operating AI systems that perform real-time compliance monitoring against international regulatory frameworks (ISO 27001, SOC 2) while simultaneously conducting predictive fraud detection across investor event communication platforms.

---

## SECTION 3: BACKGROUND

### 3.1 Problem Statement

Real-time investor events platforms handle sensitive financial communications between public companies, institutional investors, analysts, and regulatory bodies. These platforms must maintain continuous compliance with international security frameworks (ISO/IEC 27001:2022, AICPA SOC 2 Type II) while protecting against evolving threat vectors including:

- Registration fraud and bot-driven manipulation
- Unauthorized access to privileged financial communications
- Data exfiltration of material non-public information (MNPI)
- Policy violations in cross-border data handling
- Social engineering targeting event participants

Current compliance solutions require manual periodic audits, are reactive rather than predictive, and operate independently from the operational health of the platform. No existing system provides continuous AI-driven compliance assessment integrated with predictive threat detection and automated remediation within a live investor events context.

### 3.2 Prior Art Limitations

Existing compliance monitoring tools (e.g., Vanta, Drata, Secureframe) provide:
- Periodic automated compliance checks against SOC 2 and ISO 27001
- Evidence collection and audit trail management
- Dashboard-based compliance status reporting

However, these tools:
- Do not perform real-time threat detection during live events
- Cannot correlate operational health signals with compliance posture
- Lack AI-powered predictive fraud detection
- Do not provide autonomous remediation recommendations
- Are not purpose-built for the unique risk profile of live financial communications platforms

---

## SECTION 4: SUMMARY OF THE INVENTION

The invention comprises a multi-layered autonomous compliance system ("Compliance Engine") with the following novel components:

### 4.1 Autonomous Compliance Monitoring Layer

A continuously-operating service that assesses platform activity against 16+ ISO 27001 Annex A controls and 18+ SOC 2 Trust Service Criteria in real time. Unlike batch compliance tools, this system:

- Evaluates every significant platform event against applicable controls
- Maintains a living compliance score updated at configurable intervals (default: 5 minutes)
- Seeds and maintains framework-specific control mappings with automated status assessment
- Generates framework-specific compliance evidence without manual intervention

### 4.2 Multi-Signal Threat Detection Engine

A threat detection engine that monitors multiple data streams simultaneously:

- **Registration Pattern Analysis**: Detects volumetric anomalies (>5 registrations per email in 24 hours), IP-based mass registration campaigns (>10 unique emails from single IP in 1 hour), and credential stuffing patterns
- **Access Pattern Analysis**: Identifies unusual session activity exceeding baseline thresholds (>50 sessions per hour per user), privilege escalation attempts, and role-based access violations
- **Data Exfiltration Detection**: Monitors bulk export activity, abnormal download patterns, and data access velocity anomalies

### 4.3 AI-Powered Threat Assessment

Upon detection of potential threats, the system invokes a large language model (LLM) to:

- Assess detected threats against the specific risk profile of investor events
- Adjust severity ratings based on contextual analysis (not just rule-based thresholds)
- Generate human-readable reasoning for each threat assessment
- Recommend specific remediation actions tailored to the threat type and platform context

The AI assessment uses a specialized system prompt that contextualizes the analysis for the investor events domain, differentiating between benign high-activity patterns (e.g., legitimate institutional investor access) and genuine threats.

### 4.4 Predictive Analytics Engine

A forward-looking analysis system that:

- Analyzes upcoming event capacity against historical registration patterns to predict infrastructure stress
- Identifies recurring threat patterns and extrapolates future occurrence probability
- Calculates time-horizon-specific risk probabilities (e.g., "73% probability of recurring access anomaly within 48 hours")
- Generates preventive action recommendations before incidents materialize

### 4.5 Cross-System Health-Compliance Correlation

The Compliance Engine operates alongside the platform's Health Guardian service, enabling:

- Correlation between operational degradation events and compliance control failures
- Escalation of health incidents that impact compliance-relevant services
- Unified risk scoring that combines operational health and compliance posture
- Automated evidence generation linking operational metrics to compliance framework controls

### 4.6 Automated Remediation Pipeline

For each detected threat, the system:

1. Records the threat with full evidence chain (JSON-structured)
2. Assigns AI-assessed severity and confidence score
3. Generates specific remediation recommendations
4. Tracks remediation lifecycle (detected → investigating → confirmed → mitigated / false_positive)
5. Links remediation actions to affected compliance framework controls
6. Maintains complete audit trail for compliance evidence

---

## SECTION 5: DETAILED DESCRIPTION OF PREFERRED EMBODIMENT

### 5.1 System Architecture

The Compliance Engine is implemented as a server-side service (`ComplianceEngineService`) that operates within the platform's Node.js/Express backend environment. Key architectural decisions:

- **Event-driven activation**: Scans triggered at configurable intervals (default 300 seconds) and on-demand via authenticated API calls
- **Non-blocking analysis**: All threat detection analyses run concurrently using Promise.all() parallelization
- **Persistent threat storage**: Threats persisted to MySQL database with structured evidence (JSON), enabling historical analysis and pattern recognition
- **Framework control seeding**: On first activation, the engine seeds ISO 27001 (16 Annex A controls) and SOC 2 (18 Trust Service Criteria) with initial assessment status
- **Graceful degradation**: AI assessment failures fall back to rule-based severity classification; database unavailability is handled without service interruption

### 5.2 Threat Detection Algorithms

#### 5.2.1 Registration Fraud Detection

```
Input: attendee_registrations table, 24-hour rolling window
Process:
  1. Group registrations by email address
  2. Flag emails with count > 5 as potential fraud
  3. Calculate confidence: min(0.95, 0.5 + count × 0.05)
  4. Escalate to "critical" if count > 10
  5. Cross-reference IP addresses for mass registration patterns
  6. Flag single-IP clusters with >10 unique emails as coordinated campaigns
Output: Array of DetectedThreat objects with evidence
```

#### 5.2.2 Access Anomaly Detection

```
Input: sessions table, 1-hour rolling window, joined with users table
Process:
  1. Count sessions per user in the window
  2. Flag users with >50 sessions as anomalous
  3. Cross-reference user role for privilege context
  4. Escalate admin/operator anomalies to higher severity
Output: Array of DetectedThreat objects with user context
```

#### 5.2.3 Data Exfiltration Detection

```
Input: ai_am_audit_log table, 1-hour rolling window
Process:
  1. Filter actions containing "export", "download", or "bulk"
  2. Flag if action count > 20 in the window
  3. Calculate baseline deviation from 30-day average
Output: Array of DetectedThreat objects with audit evidence
```

### 5.3 AI Assessment Pipeline

The AI assessment pipeline uses the following structured approach:

1. **Context Preparation**: Detected threats are serialized to a structured format including type, title, description, current severity, and confidence
2. **Domain-Specific Prompting**: A system prompt establishes the AI as a "cybersecurity compliance analyst for CuraLive, a real-time investor events platform"
3. **Structured Output**: The AI returns a JSON array with adjusted severity, reasoning, and urgent action recommendations
4. **Validation and Integration**: AI outputs are parsed, validated against the severity enum, and merged back into threat records
5. **Fallback Handling**: If AI assessment fails, rule-based severity classifications remain unchanged

### 5.4 Predictive Analysis Methodology

The predictive engine operates on two primary signals:

1. **Capacity Stress Prediction**:
   - Counts upcoming events in a 7-day window
   - Calculates average registrations per event over 30 days
   - Computes stress probability: min(0.9, 0.3 + upcoming_events × 0.05)
   - Generates preventive scaling recommendations

2. **Threat Recurrence Prediction**:
   - Analyzes 7-day threat history by type, excluding resolved threats
   - Identifies patterns with >3 occurrences
   - Calculates recurrence probability: min(0.85, 0.4 + count × 0.1)
   - Recommends automated countermeasures for recurring patterns

### 5.5 Risk Score Calculation

The composite risk score (0–100) is calculated as:

```
risk_score = min(100, critical_threats × 25 + high_threats × 10 + total_threats × 2)
```

This weighted formula ensures critical threats dominate the risk assessment while maintaining sensitivity to threat volume.

---

## SECTION 6: CLAIMS

### Claim 1 — Autonomous Compliance Monitoring System
A computer-implemented method for continuous autonomous monitoring of a real-time investor events platform against international compliance frameworks (ISO 27001, SOC 2), comprising:
(a) maintaining a database of framework-specific controls with real-time status assessment;
(b) evaluating platform activity against said controls at configurable intervals without human initiation;
(c) generating compliance scores and evidence automatically;
(d) persisting all assessments as structured audit evidence suitable for third-party audit consumption.

### Claim 2 — Multi-Signal Predictive Fraud Detection
A system for detecting and predicting fraudulent activity on a live investor events platform, comprising:
(a) concurrent analysis of multiple data signals including registration patterns, session activity, and data access velocity;
(b) AI-powered severity assessment using domain-specific language model prompting;
(c) predictive analysis calculating future threat probabilities based on historical pattern recognition;
(d) automated remediation recommendations specific to the investor events domain.

### Claim 3 — Cross-System Health-Compliance Correlation
A method for correlating operational health monitoring data with compliance framework control assessments, comprising:
(a) parallel operation of a Health Guardian service and a Compliance Engine service;
(b) unified risk scoring combining operational health metrics and compliance posture;
(c) automated escalation of operational degradation events that impact compliance-relevant platform services;
(d) generation of compliance evidence linking operational metrics to specific framework controls.

### Claim 4 — AI-Assessed Threat Severity Pipeline
A computer-implemented method for AI-powered assessment of detected security threats, comprising:
(a) serialization of detected threats into structured analysis format;
(b) invocation of a large language model with domain-specific system prompting;
(c) structured JSON output parsing for severity adjustment, reasoning, and remediation;
(d) graceful fallback to rule-based assessment upon AI system failure;
(e) persistent storage of both rule-based and AI-assessed findings as audit evidence.

### Claim 5 — Automated Remediation Lifecycle Management
A system for managing the lifecycle of detected compliance threats from detection through remediation, comprising:
(a) automated threat detection with structured evidence capture;
(b) assignment of AI-assessed confidence scores and severity ratings;
(c) generation of context-specific remediation recommendations;
(d) lifecycle state management (detected → investigating → confirmed → mitigated / false_positive);
(e) linkage of remediation actions to affected compliance framework controls;
(f) maintenance of complete audit trails for compliance evidence purposes.

---

## SECTION 7: ABSTRACT

An autonomous AI-powered compliance monitoring and predictive fraud detection system for real-time investor events platforms. The system continuously monitors platform activity against ISO 27001 and SOC 2 frameworks, detects threats using multi-signal analysis of registration patterns, access anomalies, and data exfiltration indicators, and employs large language model assessment for severity determination and remediation recommendation. A predictive analytics engine identifies recurring threat patterns and forecasts future incidents, while cross-system correlation with operational health monitoring provides unified risk assessment. The system operates autonomously without human intervention, generates structured compliance evidence suitable for third-party audits, and manages the full threat lifecycle from detection through remediation with complete audit trails.

---

## SECTION 8: DRAWINGS REFERENCE

The following figures would accompany this specification if formal drawings are required:

- **Figure 1**: System architecture diagram showing Compliance Engine integration with Health Guardian, Agentic Brain, and platform infrastructure
- **Figure 2**: Threat detection data flow — from raw data signals through pattern analysis, AI assessment, and remediation pipeline
- **Figure 3**: Predictive analysis algorithm flowchart
- **Figure 4**: Compliance framework control mapping — ISO 27001 Annex A and SOC 2 Trust Service Criteria coverage
- **Figure 5**: Risk score calculation methodology
- **Figure 6**: User interface — Compliance Engine Dashboard with threat feed, framework status, and predictive alerts

---

## SECTION 9: APPLICANT DECLARATION

I/We, the undersigned, hereby declare that:

1. The invention described herein is novel and not disclosed in any prior art known to the applicant.
2. This extension specification adds substantive new claims to the original provisional patent filing.
3. The implementation described herein has been reduced to practice in the CuraLive platform.
4. The applicant claims priority from the original provisional patent filing date.

**Applicant Signature:** ______________________________

**Date:** 15 March 2026

**Prepared by:** CuraLive Engineering Division

---

*This document is prepared for filing with the Companies and Intellectual Property Commission (CIPC) of South Africa in accordance with the Patents Act 57 of 1978 and the Patent Regulations.*
