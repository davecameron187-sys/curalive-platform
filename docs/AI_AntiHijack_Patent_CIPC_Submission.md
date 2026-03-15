# PROVISIONAL PATENT SPECIFICATION

## AI AntiHijack — CIPC Submission

---

### Title of the Invention

System and Method for Artificial Intelligence-Based Anti-Hijack Detection, Journey Integrity Monitoring, Secure Vehicle Authorization, Protected Immobilization, Authenticated Reactivation, Multi-Device Correlation, Adaptive Emergency Communication, and Predictive Threat Intelligence

---

### Applicant

David Cameron
41 Rooigras Avenue
73 Tiffani Gardens
Bassonia
2090
Johannesburg
+27 84 444 6001
Republic of South Africa

---

### Abstract

A system and method for protecting a vehicle and its occupant by learning driver-specific behaviour, monitoring planned, shared, selected, or inferred journeys, correlating signals from an in-vehicle device, a handset, and optionally a wearable device, and detecting anomalous conditions indicative of hijacking, coercion, theft, tampering, or unauthorized startup. The system may determine an authorization state based on one or more trusted credentials and tamper-related signals, place the vehicle in a protected immobilized state when authorization is absent, invalid, or compromised, and permit authenticated reactivation only after verified satisfaction of one or more reactivation conditions. An adaptive communication orchestration engine dynamically selects, ranks, or combines multiple communication pathways including cellular, Bluetooth, Wi-Fi, mesh, sub-GHz, or store-and-forward channels to maintain emergency capability under degraded or jammed communication conditions. A predictive threat intelligence module analyses historical incident data, hotspot patterns, and behavioural baselines to generate proactive route-risk assessments and pre-journey safety recommendations. The system further includes a geofenced behavioural anomaly engine capable of autonomously adjusting detection sensitivity based on real-time geographic risk context, and a tamper-resilient evidence preservation module that cryptographically secures forensic data for post-incident investigation and insurance claim support.

---

### Field of the Invention

The present invention relates to vehicle security systems, journey monitoring systems, intelligent authorization systems, and emergency communication platforms.

More specifically, the invention relates to artificial intelligence systems capable of learning driver behaviour, monitoring journey integrity, correlating signals from a vehicle, a mobile handset, and optionally a wearable device, detecting unauthorized startup or tampering conditions, and initiating adaptive anti-hijack and emergency response actions.

The invention further relates to secure authorization and immobilization methods in which valid operation of a vehicle is conditioned upon the existence of a verified authorization state and the absence of tamper-related anomalies.

The invention further relates to predictive threat intelligence methods wherein historical crime data, geographic risk profiles, and driver behavioural baselines are correlated to generate proactive safety assessments and dynamic route recommendations.

---

### Definitions

**Vehicle Device**
An in-vehicle electronic device installed in or associated with a vehicle and configured to collect, process, transmit, or store vehicle-related data.

**Driver Behaviour Profile**
A data-driven representation of normal or expected behaviour of a specific driver, including route choices, timing patterns, speed tendencies, stop tendencies, acceleration tendencies, or any combination thereof.

**Journey Integrity**
The degree to which live vehicle movement corresponds with an intended, selected, shared, or inferred journey.

**Threat Score**
A computed risk value derived from one or more contextual signals and used to classify the likelihood or severity of distress, hijack, tamper, theft, coercion, or unauthorized activity.

**Communication Pathway**
Any channel, interface, network, or relay mechanism by which the platform may transmit or receive data, including cellular, Bluetooth, Wi-Fi, mesh, sub-GHz, or equivalent pathways.

**Communication Orchestration Engine**
A computational module configured to evaluate available communication pathways and select, rank, combine, or sequence pathways for one or more transmissions.

**Trusted Device**
A mobile phone, wearable, vehicle component, key credential, tag, or other authorised device recognised by the platform as being associated with an authorised user.

**Wearable Device**
A smartwatch, smart band, biometric wearable, or other body-associated electronic device capable of providing one or more signals relating to presence, pairing, body contact, motion, biometrics, user input, or location.

**Correlation Engine**
A module configured to combine signals from two or more sources, including vehicle, phone, wearable, cloud, key, or route context, in order to classify a condition or determine a response.

**Covert Emergency Mode**
An operating state in which one or more security actions are activated without requiring visible driver interaction.

**Driver-Vehicle Separation Event**
A detected condition in which the vehicle and a trusted device associated with the driver diverge geographically or behaviourally beyond an expected threshold.

**High-Risk Zone**
A geographic or contextual condition associated with increased vulnerability to vehicle crime, hijacking, isolation risk, or other security threats.

**Authorization State**
A machine-determined state indicating whether one or more valid authorization conditions exist for vehicle startup, operability, reactivation, or continued use.

**Trusted Credential**
A key transponder, OEM immobilizer credential, secure token, paired handset, paired wearable, cryptographic secret, server-issued authorization code, or other credential recognised as satisfying at least part of an authorization condition.

**Protected Immobilized State**
A recoverable secured state in which startup or selected vehicle functions are inhibited, while preserving tamper records, alert functionality, or reactivation controls.

**Authenticated Reactivation**
A controlled process by which a protected immobilized state is removed after verified presentation of one or more trusted credentials, tokens, confirmations, or service authorizations.

**Startup Sequence Anomaly**
An irregular ignition, ECU, CAN bus, credential, or related sequence indicative of bypass, tampering, unauthorized activation, or abnormal startup behaviour.

**Tamper Event**
Any detected physical, electrical, logical, software, firmware, or communication-layer interference with the vehicle, the vehicle device, the ECU, wiring, sensors, or associated components.

**Secure Authorization Layer**
A hardware, software, or hybrid subsystem configured to determine the authorization state and control startup, lockout, or reactivation behaviour.

**Predictive Threat Intelligence**
Analytical insights generated from historical incident data, geographic crime patterns, temporal risk profiles, and driver behavioural baselines, used to forecast elevated risk conditions before they materialise.

**Geofenced Behavioural Anomaly**
An anomalous driver or vehicle behaviour that is classified differently depending on the geographic context in which it occurs, enabling location-aware threat sensitivity adjustment.

**Tamper-Resilient Evidence Record**
A cryptographically secured, timestamped record of forensic data including location breadcrumbs, audio captures, tamper logs, and communication attempts, preserved for post-incident investigation, insurance claims, or legal proceedings.

---

### Background of the Invention

Vehicle hijacking, coercive vehicle diversion, vehicle theft, signal interference, and unauthorized startup remain significant safety and asset-protection risks in many regions.

Conventional vehicle tracking systems typically rely on GPS and cellular communication, often require manual panic-button activation, and frequently become less effective when a driver cannot safely interact with a device or when a communication jammer is present.

Known immobilizer and key-based systems generally verify only a limited startup credential and may not correlate route context, vehicle telemetry, trusted-device presence, or startup-sequence anomalies to determine whether a broader threat condition exists.

Known family-tracking applications may provide route visibility but do not generally learn each driver over time, correlate signals from vehicle, handset, and wearable devices, classify route deviations under threat conditions, or control a protected immobilization and authenticated reactivation workflow.

Existing vehicle security systems do not generate predictive threat intelligence based on historical crime data correlated with driver-specific behavioural patterns, geographic risk profiles, and temporal risk windows. There is no known prior art describing a system that proactively adjusts detection sensitivity and route recommendations based on predictive risk assessments generated from aggregated incident intelligence.

Furthermore, existing systems do not provide tamper-resilient forensic evidence preservation with cryptographic integrity verification suitable for insurance claim substantiation and legal proceedings. There is no known prior art describing a vehicle security platform that autonomously generates court-admissible evidence packages from multi-source sensor data captured during a security incident.

There is accordingly a need for a more capable anti-hijack platform that may learn behaviour over time, monitor journey integrity, detect unauthorized startup or tampering conditions, correlate multi-device signals, survive degraded communications, execute controlled responses including protected immobilization and authenticated reactivation, generate predictive threat intelligence, and preserve tamper-resilient forensic evidence.

---

### Summary of the Invention

According to a first aspect of the invention, there is provided a vehicle security platform comprising an in-vehicle electronic device, an artificial intelligence processor associated with the in-vehicle electronic device, a journey-monitoring module, and a communication module configured for one or more communication pathways.

According to a further aspect, the artificial intelligence processor is configured to learn driver-specific behavioural patterns from historical journey and driving data and to construct one or more driver behaviour profiles.

According to a further aspect, the platform is configured to monitor journey integrity by comparing real-time movement with an intended, selected, shared, or inferred route and to classify route deviations according to context.

According to a further aspect, the platform is configured to correlate signals from the vehicle, a mobile handset, and optionally one or more wearable devices to determine whether an anomalous, distress, tamper, or hijack-related condition exists.

According to a still further aspect, the platform is configured to determine an authorization state based on one or more trusted credentials, startup sequence signals, trusted-device presence, or tamper-related signals, and to place the vehicle in a protected immobilized state when authorization is absent, invalid, or compromised.

According to a still further aspect, the platform is configured to permit authenticated reactivation only after verified satisfaction of one or more reactivation conditions, optionally including owner verification, service-agent verification, server authorization, or one-time token validation.

According to another aspect, the platform is configured to dynamically select, rank, or combine communication pathways and to execute one or more staged response actions including silent verification, covert alerts, trusted-contact escalation, tamper logging, tracking transmission, or responder escalation.

According to a further aspect, the platform is configured to generate predictive threat intelligence by correlating historical incident data, geographic crime patterns, and driver behavioural baselines to produce proactive route-risk assessments and pre-journey safety recommendations.

According to a further aspect, the platform is configured to autonomously generate tamper-resilient evidence records comprising cryptographically secured forensic data for post-incident investigation and insurance claim support.

---

### System Overview

The anti-hijack platform may include the following modules and components:

- hidden in-vehicle AI device for local capture, processing, and decision support
- edge artificial intelligence engine for behavioural modelling, anomaly detection, authorization-state determination, scoring, and policy execution
- driver application for route setup, trip sharing, alert preferences, and review of events
- trusted-contact application or portal for live route following and escalation visibility
- cloud or remote platform for alert routing, logging, analytics, authorized reactivation management, and optional responder integration
- wearable integration layer for receipt of one or more wearable-device signals
- communication orchestration engine for multi-path transmission and fallback logic
- secure authorization layer for startup validation, protected lockout, and authenticated reactivation
- response policy engine for stage-based action selection
- optional vehicle-audio or voice interface for route-risk prompts or covert trigger recognition
- predictive threat intelligence module for proactive risk assessment and route recommendation
- geofenced anomaly sensitivity engine for location-aware detection threshold adjustment
- tamper-resilient evidence preservation module for cryptographically secured forensic data capture
- incident reconstruction engine for automated post-event timeline generation

---

### Brief Description of the Drawings

Figure 1 illustrates an example overall platform architecture.

Figure 2 illustrates an example communication architecture with multiple fallback channels.

Figure 3 illustrates an example artificial intelligence detection pipeline.

Figure 4 illustrates an example learning feedback loop for driver behavioural modelling.

Figure 5 illustrates an example in-vehicle device hardware architecture.

Figure 6 illustrates an example wearable, phone, and vehicle correlation engine.

Figure 7 illustrates an example voice-trigger emergency workflow.

Figure 8 illustrates an example journey-monitoring and risk-reclassification workflow.

Figure 9 illustrates an example response policy engine with staged escalation.

Figure 10 illustrates an example anomaly scenario involving route deviation and trusted-device changes.

Figure 11 illustrates an example startup authorization, protected lockout, and authenticated reactivation flow.

Figure 12 illustrates an example predictive threat intelligence pipeline.

Figure 13 illustrates an example tamper-resilient evidence preservation and forensic reconstruction workflow.

---

### Detailed Description of the Invention


**1. In-Vehicle AI Device (refer FIG 1 and FIG 5)**

The system includes a concealed or otherwise installed in-vehicle electronic device configured to capture location, motion, telemetry, and communication-related data. The device may be OEM integrated, ECU associated, or implemented as a hardened secondary module. The device may include one or more processors, secure storage, one or more radios, one or more sensors, optional backup power, and one or more interfaces to vehicle systems including CAN, OBD, or equivalent interfaces.


**2. Driver Behaviour Learning (refer FIG 3 and FIG 4)**

The artificial intelligence processor records historical journey data and constructs driver-specific behavioural profiles. Learning may include route preferences, departure timing, arrival timing, stop tendencies, braking style, acceleration style, typical trip durations, and normal contexts of use. Profiles may be maintained separately for multiple authorised drivers.


**3. Journey Monitoring and Live Route Following (refer FIG 1, FIG 3 and FIG 8)**

A driver may define an intended journey in a mobile application, including home, school, work, or a custom route, or the system may infer an expected route from prior behaviour. The platform may share journey progress with one or more trusted contacts. Real-time movement may be compared with the expected route or destination progress in order to classify a journey state.


**4. Route Deviation and Irregular Movement Detection (refer FIG 3, FIG 8 and FIG 10)**

The platform analyses route deviations, abnormal detours, prolonged stationary periods, repeated circling, movement into isolated or high-risk areas, unusual speed changes, or inconsistent arrival behaviour. Deviations may be classified as benign, irregular, suspicious, or high-risk according to context such as traffic, route-risk data, and behavioural history.


**5. Wearable and Handset Correlation Layer (refer FIG 6 and FIG 10)**

In some embodiments the platform integrates signals from a mobile handset and one or more wearable devices associated with a driver. Wearable-device signals may include location, motion, body-contact state, pairing state, biometric information, user gesture, button input, or voice input. The correlation engine may determine that a condition is more likely serious when route deviation is combined with handset loss, wearable removal, separation, or a biometrically unusual state.


**6. Threat Detection and Scoring (refer FIG 3, FIG 6 and FIG 10)**

The platform computes a threat score based on weighted combinations of signals. Example contributing signals may include route deviation, behaviour deviation, communication interference, hotspot context, wearable removal, handset-offline state, driver-vehicle separation, distress phrase detection, tamper signals, or startup-sequence anomalies. The threat score may be used to select a response stage.


**7. Communication Orchestration (refer FIG 2)**

The communication orchestration engine evaluates available communication pathways and selects, sequences, or combines one or more pathways according to expected reliability, latency, stealth, power cost, and threat context. Pathways may include cellular communication, Bluetooth relay to nearby devices, Wi-Fi offload, mesh or sub-GHz transmission, store-and-forward delivery, or cloud-assisted routing.


**8. Voice Activated Emergency Mode (refer FIG 7)**

The system may include a voice-recognition component capable of detecting a predefined distress phrase such as "activate hijack mode" or another covert phrase. Upon detection the platform may silently increase monitoring, initiate covert emergency mode, or cause one or more communications or tracking actions to occur without visible driver interaction.


**9. Secure Authorization and Protected Immobilization Layer (refer FIG 11)**

The platform may determine an authorization state for startup, operability, or reactivation based on one or more trusted credentials and one or more anomaly or tamper indicators. Trusted credentials may include a key transponder, OEM immobilizer credential, secure handset token, wearable token, or cryptographic secret. Tamper indicators may include missing credential state, abnormal startup sequence, unauthorized ignition pattern, ECU or CAN anomalies, bypass attempts, or physical tamper signals.

When the authorization state is absent, invalid, or compromised, the platform may place the vehicle in a protected immobilized state. In the protected immobilized state the platform may inhibit startup, inhibit selected vehicle functions, maintain tamper logs, preserve alert capability, and initiate one or more notifications. The protected immobilized state is preferably recoverable rather than destructive.

The platform may permit authenticated reactivation only after verified satisfaction of one or more reactivation conditions. Such conditions may include return of a valid credential, owner confirmation, trusted-device confirmation, service-agent confirmation, server-side approval, one-time token validation, or a combination thereof. In preferred embodiments, reactivation events are logged and previously used reactivation tokens are invalidated after use.


**10. Response Policy Engine (refer FIG 9)**

The response policy engine may execute staged actions. A first stage may increase monitoring or logging. A second stage may request a discreet verification or confirmation event. A third stage may alert one or more trusted contacts. A fourth stage may trigger covert tracking, communication escalation, or responder notification. In authorization-related conditions, the selected stage may include startup inhibition, protected immobilization, or authenticated reactivation workflow management.


**11. Route Risk Intelligence (refer FIG 8)**

The platform may consume hotspot data, congestion data, route isolation indicators, historical incident patterns, or similar context in order to generate route-risk scores. Such scores may adjust recommendations, alert timing, or threat classification.


**12. Learning Feedback and Model Update (refer FIG 4)**

Behavioural models may be updated over time using additional journey history, verified false positives, verified incidents, operator feedback, or trusted-contact confirmation. Updated behavioural models may improve classification accuracy and reduce false positives.


**13. Predictive Threat Intelligence Module (refer FIG 12)**

The system includes a predictive threat intelligence module that generates proactive risk assessments before and during journeys. The predictive module operates as follows:

- **Historical Incident Correlation**: The system aggregates anonymised historical vehicle crime data including hijacking incidents, theft hotspots, and carjacking patterns by geographic area, time of day, day of week, and seasonal trends. This data is correlated with the driver's planned or inferred route to generate a pre-journey risk assessment.

- **Dynamic Risk Scoring**: During a journey, the predictive module continuously recalculates risk based on real-time signals including current geographic position relative to known hotspots, time-of-day risk factors, traffic density changes, and deviation from safe corridors. The dynamic risk score may trigger preemptive escalation of monitoring sensitivity before an incident is detected.

- **Proactive Route Recommendations**: When the predictive module identifies an elevated risk corridor on a planned route, it may generate alternative route recommendations that maintain journey efficiency while reducing exposure to high-risk zones. Recommendations may be presented to the driver via the mobile application or voice interface.

- **Temporal Risk Windows**: The module identifies recurring temporal patterns in crime data — for example, elevated hijacking risk during specific hours at specific intersections — and adjusts detection thresholds and alert readiness during those windows without requiring manual configuration.

- **Fleet and Community Intelligence**: In fleet or community deployments, anonymised threat intelligence may be aggregated across multiple vehicles to generate real-time risk maps that benefit all participants, creating a network effect where each additional vehicle improves the collective intelligence available to all users.


**14. Tamper-Resilient Evidence Preservation Module (refer FIG 13)**

The system includes a tamper-resilient evidence preservation module that autonomously captures, secures, and preserves forensic data during and after security incidents. The evidence module operates as follows:

- **Cryptographic Evidence Integrity**: All forensic data captured during a security incident — including location breadcrumbs, audio recordings, tamper logs, communication attempts, and sensor readings — is cryptographically hashed and timestamped to establish chain-of-custody integrity. Evidence records cannot be modified after capture without invalidating the cryptographic hash.

- **Multi-Source Evidence Correlation**: The module correlates evidence from multiple sources including vehicle telemetry, handset location history, wearable data, communication logs, and external data feeds to construct a comprehensive incident timeline.

- **Automated Incident Reconstruction**: Following a security incident, the module autonomously generates a structured incident report comprising a chronological timeline of events, geographic track data, threat score progression, communication attempts, response actions taken, and tamper events detected.

- **Insurance Claim Support**: Evidence packages generated by the module are structured to meet common insurance claim documentation requirements, including timestamped proof of vehicle location, proof of unauthorized access or tamper, proof of immobilization activation, and proof of communication attempts to emergency services.

- **Secure Cloud Synchronisation**: Forensic evidence is synchronised to secure cloud storage when communication pathways are available, ensuring evidence survival even if the in-vehicle device is physically destroyed or removed. Evidence synchronisation uses end-to-end encryption and may utilise opportunistic connectivity windows.


**15. Geofenced Behavioural Anomaly Engine**

The system includes a geofenced behavioural anomaly engine that autonomously adjusts detection sensitivity and threat classification based on real-time geographic context. The engine operates as follows:

- **Location-Aware Sensitivity**: Detection thresholds for route deviation, speed anomalies, and stop duration are adjusted based on the current geographic risk profile. The same behaviour that is classified as benign in a low-risk area may be classified as suspicious or high-risk in a known crime hotspot.

- **Dynamic Geofence Learning**: The system autonomously learns and updates geofence boundaries based on aggregated incident data, emerging crime patterns, and community intelligence feeds. Geofences are not limited to predefined static boundaries but evolve as risk landscapes change.

- **Context-Aware False Positive Reduction**: By incorporating geographic context into anomaly classification, the engine reduces false positive rates in low-risk environments while maintaining heightened sensitivity in high-risk zones, resulting in a more accurate and less intrusive user experience.


**16. Alternative Embodiments and Implementations**

The invention may be implemented wholly on-device, wholly in a remote platform, or in hybrid form. The artificial intelligence may be rule-based, statistical, machine-learning based, deep-learning based, or hybrid. Authorization determination may rely on one or more credentials, one or more device states, one or more behavioural models, or one or more tamper signals. The secure authorization layer may be OEM integrated, implemented as a hardened secondary module, or implemented in part through cloud coordination.

The predictive threat intelligence module may consume data from public crime databases, private security intelligence feeds, insurance industry incident databases, community reporting platforms, or equivalent data sources.

The tamper-resilient evidence preservation module may store evidence locally on secure storage within the in-vehicle device, in secure cloud storage, or in both locations simultaneously.

The specific examples described in this specification are provided for illustrative purposes and should not be interpreted as limiting the scope of the invention to any particular technology, platform, deployment model, or implementation approach.

---

### Example Embodiments

In one embodiment, a driver begins a monitored journey from home to work, shares the trip with a trusted contact, and the system tracks expected route progression. The vehicle then deviates toward a high-risk area, threat score increases, and the platform sends covert alerts while maintaining tracking.

In another embodiment, the vehicle continues moving while the driver's mobile handset unexpectedly goes offline and the driver's wearable indicates removal or loss of body contact. The correlation engine classifies the condition as high-risk and the response policy engine escalates alerts.

In a further embodiment, the vehicle route continues toward an unexpected destination while the wearable location diverges from the vehicle route, thereby indicating a potential driver-vehicle separation event. The platform escalates notifications and preserves location breadcrumbs for both vehicle and associated trusted-device data.

In yet another embodiment, the driver speaks a predefined covert phrase while the vehicle is stopped at an unexpected location. The platform triggers covert emergency mode and transmits alerts through one or more selected communication pathways.

In a further embodiment relating to startup security, a startup attempt occurs in the absence of a valid trusted credential and in the presence of an abnormal startup sequence on the vehicle bus. The authorization state is determined to be invalid, the platform places the vehicle in a protected immobilized state, and one or more tamper alerts are sent. Subsequent authenticated reactivation is permitted only after verification of a trusted credential and a valid reactivation condition.

In a further embodiment relating to predictive intelligence, the system analyses historical crime data and identifies that a driver's regular evening commute route passes through an intersection with elevated hijacking risk between 18:00 and 20:00. The system generates a pre-journey notification recommending an alternative route during those hours and increases detection sensitivity when the driver approaches that area.

In a further embodiment relating to evidence preservation, during a hijacking incident the system autonomously captures vehicle location breadcrumbs at increased frequency, records ambient audio, logs all tamper events and communication attempts, cryptographically secures all captured data, and synchronises the evidence package to secure cloud storage. Following the incident, the system generates an automated incident reconstruction report suitable for insurance claims and law enforcement investigation.

---

### Advantages of the Invention

- improved early detection of hijack or coercive diversion by combining behavioural learning with route monitoring
- reduced false positives through multi-signal correlation across vehicle, handset, wearable, and context data
- continued emergency capability under degraded communication conditions through adaptive pathway selection
- support for discreet activation and silent escalation where a driver cannot safely press a panic button
- support for protected immobilization and authenticated reactivation in unauthorized startup or tamper scenarios
- proactive threat avoidance through predictive intelligence and dynamic route recommendations
- tamper-resilient forensic evidence with cryptographic integrity for insurance and legal proceedings
- autonomous geofenced sensitivity adjustment reducing false positives while maintaining vigilance in high-risk zones
- network intelligence effects in fleet and community deployments where each vehicle strengthens collective security
- broad applicability to consumer, family, school transport, fleet, insurer, and security use cases

---

### Claims


**System Claims:**

1. A vehicle security platform comprising: an in-vehicle electronic device; an artificial intelligence processor associated with the in-vehicle electronic device; a journey-monitoring module; and a communication module configured for one or more communication pathways, wherein the artificial intelligence processor is configured to detect anomalous or distress-related conditions associated with a vehicle journey.

2. The platform of claim 1, wherein the artificial intelligence processor is configured to learn driver-specific behavioural patterns from historical driving data.

3. The platform of claim 1 or claim 2, wherein the historical driving data includes one or more of route history, timing history, braking behaviour, acceleration behaviour, stop patterns, or trip durations.

4. The platform of any one of the preceding claims, wherein the platform is configured to compare real-time vehicle movement with an intended, selected, shared, or inferred journey.

5. The platform of any one of the preceding claims, wherein a journey-monitoring module classifies route deviations as benign, irregular, or high-risk according to context.

6. The platform of any one of the preceding claims, wherein the platform computes a threat score using two or more contextual signals.

7. The platform of claim 6, wherein the contextual signals include one or more of route deviation, driver behaviour deviation, communication interference, hotspot context, wearable removal, handset-offline state, driver-vehicle separation, distress phrase detection, tamper signals, or startup-sequence anomalies.

8. The platform of any one of the preceding claims, further comprising a communication orchestration engine configured to select, sequence, combine, or rank multiple communication pathways.

9. The platform of claim 8, wherein the communication pathways include one or more of cellular transmission, Bluetooth relay, mesh communication, sub-GHz radio transmission, Wi-Fi transmission, or store-and-forward delivery.

10. The platform of any one of the preceding claims, wherein the platform is configured to initiate covert emergency communication without requiring visible user interaction.

11. The platform of any one of the preceding claims, further comprising a wearable-device integration layer configured to receive one or more wearable-device signals.

12. The platform of claim 11, wherein the wearable-device signals include one or more of pairing state, connection state, location, motion, body-contact state, biometric state, or user input state.

13. The platform of claim 11 or claim 12, wherein a correlation engine combines wearable-device signals with vehicle route data and handset status data to determine whether an anomalous or distress-related condition exists.

14. The platform of claim 13, wherein the anomalous or distress-related condition includes a handset-offline event that occurs together with route deviation or wearable change.

15. The platform of claim 13 or claim 14, wherein the anomalous or distress-related condition includes a driver-vehicle separation event.

16. The platform of any one of claims 11 to 15, wherein the wearable device is configured to initiate covert emergency activation by gesture, button sequence, voice input, or equivalent user action.

17. The platform of any one of the preceding claims, wherein a voice-recognition module detects a predefined distress phrase and initiates covert emergency mode.

18. The platform of any one of the preceding claims, wherein the response policy engine executes a staged escalation sequence including increased monitoring, trusted-contact alerts, covert tracking, or responder escalation.

19. The platform of claim 18, wherein the selected stage is determined according to threat score, communication availability, route context, driver profile, or authorization state.

20. The platform of any one of the preceding claims, wherein the platform consumes hotspot or route-risk data and adjusts threat scoring or route recommendations accordingly.

21. The platform of any one of the preceding claims, wherein the artificial intelligence processor maintains separate behavioural profiles for different drivers of the same vehicle.

22. The platform of any one of the preceding claims, wherein the platform continues at least partial operation when the handset is offline or unavailable.


**Authorization and Immobilization Claims:**

23. The platform of any one of the preceding claims, further comprising a secure authorization layer configured to determine an authorization state for vehicle startup, operability, lockout, or reactivation based on one or more trusted credentials and one or more anomaly or tamper indicators.

24. The platform of claim 23, wherein the trusted credentials include one or more of a key transponder, an OEM immobilizer credential, a handset token, a wearable token, a cryptographic secret, a server-issued code, or a one-time authorization token.

25. The platform of claim 23 or claim 24, wherein the anomaly or tamper indicators include one or more of missing credential state, startup-sequence anomaly, ECU anomaly, CAN bus anomaly, bypass attempt, unauthorized ignition pattern, firmware anomaly, software tampering, or physical tamper input.

26. The platform of any one of claims 23 to 25, wherein, when the authorization state is absent, invalid, or compromised, the platform places the vehicle in a protected immobilized state in which startup or one or more selected vehicle functions are inhibited while alerting, logging, or monitoring capabilities are maintained.

27. The platform of claim 26, wherein the protected immobilized state is recoverable and is removed only after authenticated reactivation.

28. The platform of claim 27, wherein authenticated reactivation requires verification of one or more reactivation conditions including one or more of presentation of a valid trusted credential, owner confirmation, service-agent confirmation, trusted-device confirmation, server-side authorization, or one-time token validation.


**Predictive Threat Intelligence Claims:**

29. The platform of any one of the preceding claims, further comprising a predictive threat intelligence module configured to generate proactive risk assessments by correlating historical incident data, geographic crime patterns, temporal risk profiles, and driver behavioural baselines.

30. The platform of claim 29, wherein the predictive module generates pre-journey risk notifications and alternative route recommendations when elevated risk is identified on a planned or inferred route.

31. The platform of claim 29 or claim 30, wherein the predictive module identifies recurring temporal risk windows — specific times and locations with historically elevated crime rates — and autonomously adjusts detection sensitivity during those windows.

32. The platform of any one of claims 29 to 31, further comprising a fleet or community intelligence capability wherein anonymised threat intelligence is aggregated across multiple vehicles to generate real-time risk maps benefiting all participants.


**Forensic Evidence Claims:**

33. The platform of any one of the preceding claims, further comprising a tamper-resilient evidence preservation module configured to cryptographically hash and timestamp forensic data captured during security incidents to establish chain-of-custody integrity.

34. The platform of claim 33, wherein the evidence module correlates data from multiple sources including vehicle telemetry, handset location, wearable data, and communication logs to construct a comprehensive incident timeline.

35. The platform of claim 33 or claim 34, wherein the evidence module autonomously generates structured incident reports comprising chronological timelines, geographic track data, threat score progression, and response actions taken.

36. The platform of any one of claims 33 to 35, wherein evidence packages are structured to meet insurance claim documentation requirements including timestamped proof of vehicle location, unauthorized access, immobilization activation, and emergency communication attempts.

37. The platform of any one of claims 33 to 36, wherein forensic evidence is synchronised to secure cloud storage using end-to-end encryption and opportunistic connectivity windows.


**Geofenced Anomaly Claims:**

38. The platform of any one of the preceding claims, further comprising a geofenced behavioural anomaly engine that autonomously adjusts detection thresholds for route deviation, speed anomalies, and stop duration based on real-time geographic risk context.

39. The platform of claim 38, wherein the geofenced engine autonomously learns and updates geofence boundaries based on aggregated incident data and emerging crime patterns.

40. The platform of claim 38 or claim 39, wherein the geofenced engine reduces false positive rates in low-risk environments while maintaining heightened sensitivity in high-risk zones.


**Method Claims:**

41. A computer-implemented method of monitoring a vehicle journey, the method comprising: learning one or more behavioural patterns associated with a driver; comparing live vehicle movement with an intended, selected, shared, or inferred journey; computing a threat score from two or more contextual signals; and executing one or more response actions according to the threat score.

42. The method of claim 41, further comprising correlating vehicle data with handset data and wearable-device data to determine whether an anomalous or distress-related condition exists.

43. The method of claim 41 or claim 42, further comprising selecting one or more communication pathways according to expected reliability, latency, stealth, or communication availability.

44. A computer-implemented method of controlling vehicle startup authorization, the method comprising: determining an authorization state from one or more trusted credentials and one or more anomaly or tamper indicators; inhibiting startup or placing the vehicle into a protected immobilized state when the authorization state is absent, invalid, or compromised; and permitting authenticated reactivation only after verified satisfaction of one or more reactivation conditions.

45. A computer-implemented method of generating predictive vehicle threat intelligence, the method comprising: aggregating historical vehicle crime data by geographic area, time, and incident type; correlating aggregated data with a driver's planned or inferred route; generating a pre-journey risk assessment; and adjusting detection sensitivity based on the predicted risk profile.

46. A computer-implemented method of preserving tamper-resilient forensic evidence during a vehicle security incident, the method comprising: capturing forensic data from multiple vehicle and device sensors; cryptographically hashing and timestamping captured data to establish integrity; correlating multi-source data to construct an incident timeline; and generating a structured evidence package suitable for insurance claims or legal proceedings.

47. A non-transitory computer-readable medium carrying instructions which, when executed by one or more processors of an in-vehicle device, handset, wearable device, or remote platform, cause performance of the method of any one of claims 41 to 46.

48. A vehicle security system substantially as herein described with reference to any one or more of the accompanying drawings.

---

### Drawings


**FIG 1 — Overall Platform Architecture**

```
+-----------------------------------+
| Vehicle Journey                   |
| (Planned / Shared / Inferred)     |
+----------------+------------------+
                 |
                 v
+-----------------------------------+
| Multi-Source Signal Capture       |
| • Vehicle Telemetry (CAN/OBD)    |
| • GPS / Location                 |
| • Handset Signals                |
| • Wearable Signals               |
| • Audio / Voice                  |
+----------------+------------------+
                 |
                 v
+-----------------------------------+
| AI Detection & Scoring Engine    |
| • Behaviour Anomaly Detection    |
| • Route Deviation Analysis       |
| • Threat Score Computation       |
| • Authorization State Check      |
+----------------+------------------+
                 |
                 v
+-----------------------------------+
| Response Policy Engine           |
| • Staged Escalation              |
| • Protected Immobilization       |
| • Evidence Preservation          |
+-----------------------------------+
```


**FIG 2 — Communication Architecture**

```
+-----------------------------------+
| Communication Orchestration      |
| Engine                           |
+---+-------+-------+-------+-----+
    |       |       |       |
+---v-+ +---v-+ +---v-+ +---v-+
|Cell-| |Blue-| |Mesh | |Store|
|ular | |tooth| |/Sub | |& Fwd|
|     | |Relay| |GHz  | |     |
+--+--+ +--+--+ +--+--+ +--+--+
   |       |       |       |
   +-------+-------+-------+
                |
                v
   +----------------------------+
   | Alert Delivery             |
   | • Trusted Contacts         |
   | • Emergency Responders     |
   | • Cloud Platform           |
   +----------------------------+
```


**FIG 3 — AI Detection Pipeline**

```
+---------------------------+
| Raw Sensor Signals        |
| (Vehicle + Phone +        |
|  Wearable + Audio)        |
+-----------+---------------+
            |
            v
+---------------------------+
| Signal Preprocessing &    |
| Feature Extraction        |
+-----------+---------------+
            |
            v
+---------------------------+
| Behavioural Model         |
| Comparison                |
+-----------+---------------+
            |
            v
+---------------------------+     +---------------------------+
| Threat Score Engine       | <-- | Route Risk Intelligence   |
+-----------+---------------+     +---------------------------+
            |
            v
+---------------------------+
| Response Classification   |
| (Benign / Irregular /     |
|  Suspicious / High-Risk)  |
+---------------------------+
```


**FIG 4 — Behaviour Learning Feedback Loop**

```
+----------+     +---------+     +---------+
| Journey  | --> | AI      | --> | Driver  |
| History  |     | Learning|     | Profile |
+----^-----+     | Engine  |     +----+----+
     |           +---------+          |
     |                                v
+----+------+                    +----+----+
| Improved  | <----------------- | False   |
| Profiles  |                    | Positive|
+-----------+                    | Review  |
                                 +---------+
```


**FIG 5 — In-Vehicle Device Hardware Architecture**

```
+=========================================+
|        IN-VEHICLE AI DEVICE             |
+=========================================+
|                                         |
| +----------+  +----------+  +--------+ |
| | Main CPU |  | Secure   |  | Backup | |
| | (AI Edge)|  | Storage  |  | Power  | |
| +----+-----+  +----------+  +--------+ |
|      |                                  |
| +----+-----+  +----------+  +--------+ |
| | CAN/OBD  |  | Cellular |  | BLE /  | |
| | Interface|  | Radio    |  | Mesh   | |
| +----------+  +----------+  +--------+ |
|                                         |
| +----------+  +----------+  +--------+ |
| | GPS      |  | Accel /  |  | Audio  | |
| | Module   |  | Gyro     |  | Capture| |
| +----------+  +----------+  +--------+ |
|                                         |
+=========================================+
```


**FIG 6 — Wearable, Phone, and Vehicle Correlation Engine**

```
+----------+     +----------+     +----------+
| Vehicle  |     | Handset  |     | Wearable |
| Signals  |     | Signals  |     | Signals  |
+----+-----+     +----+-----+     +----+-----+
     |                |                |
     +----------------+----------------+
                      |
                      v
           +---------------------+
           | Correlation Engine  |
           | • Location Match    |
           | • Presence Check    |
           | • Biometric State   |
           | • Separation Detect |
           +----------+----------+
                      |
                      v
           +---------------------+
           | Condition           |
           | Classification      |
           | (Normal / Anomalous |
           |  / Distress)        |
           +---------------------+
```


**FIG 7 — Voice Trigger Emergency Workflow**

```
+---------------------------+
| Ambient Audio Capture     |
+-----------+---------------+
            |
            v
+---------------------------+
| Voice Recognition Engine  |
| (Distress Phrase Detect)  |
+-----------+---------------+
            |
            v
+---------------------------+
| Covert Emergency Mode     |
| • Silent monitoring       |
| • Stealth alerts          |
| • No visible UI change    |
+-----------+---------------+
            |
            v
+---------------------------+
| Communication Escalation  |
+---------------------------+
```


**FIG 8 — Journey Monitoring and Risk Reclassification**

```
+---------------------------+
| Journey Start             |
| (Planned / Shared /       |
|  Inferred from history)   |
+-----------+---------------+
            |
            v
+---------------------------+
| Live Position vs Expected |
| Route Comparison          |
+-----------+---------------+
            |
    +-------+-------+
    |               |
+---v---+     +-----v-----+
| On    |     | Deviation  |
| Route |     | Detected   |
+-------+     +-----+-----+
                    |
                    v
          +-------------------+
          | Context Analysis  |
          | • Traffic         |
          | • Hotspot Data    |
          | • Time of Day     |
          | • Behaviour Hist  |
          +--------+----------+
                   |
     +-------------+-------------+
     |             |             |
+----v----+ +-----v-----+ +----v----+
| Benign  | | Suspicious| | High    |
| (normal)| | (monitor) | | Risk    |
+---------+ +-----------+ | (alert) |
                           +---------+
```


**FIG 9 — Response Policy Escalation**

```
+---------------------------+
| Threat Score Input        |
+-----------+---------------+
            |
            v
+---------------------------+
| Stage 1: Increase         |
| Monitoring & Logging      |
+-----------+---------------+
            |
            v
+---------------------------+
| Stage 2: Discreet         |
| Verification Request      |
+-----------+---------------+
            |
            v
+---------------------------+
| Stage 3: Trusted Contact  |
| Alert                     |
+-----------+---------------+
            |
            v
+---------------------------+
| Stage 4: Responder        |
| Escalation / Covert Track |
| / Protected Immobilization|
+---------------------------+
```


**FIG 10 — Example Distress Scenario**

```
+---------------------------+     +---------------------------+
| Vehicle deviates toward   |     | Handset goes offline      |
| high-risk area            |     | simultaneously            |
+-----------+---------------+     +-----------+---------------+
            |                                 |
            +----------------+----------------+
                             |
                             v
              +-----------------------------+
              | Correlation Engine:         |
              | Route deviation +           |
              | handset loss +              |
              | wearable body-contact lost  |
              | = HIGH RISK classification  |
              +-------------+---------------+
                            |
                            v
              +-----------------------------+
              | Response Policy:            |
              | • Covert alert to trusted   |
              |   contacts                  |
              | • High-frequency tracking   |
              | • Evidence preservation     |
              | • Responder escalation      |
              +-----------------------------+
```


**FIG 11 — Startup Authorization / Protected Lockout / Authenticated Reactivation**

```
+---------------------------+
| Startup Attempt Detected  |
+-----------+---------------+
            |
            v
+---------------------------+
| Authorization Check       |
| • Trusted credential?     |
| • Normal startup seq?     |
| • Tamper signals?         |
| • Trusted device present? |
+-----------+---------------+
            |
    +-------+-------+
    |               |
+---v---+     +-----v-----------+
| VALID |     | INVALID /       |
| Start |     | COMPROMISED     |
| OK    |     +--------+--------+
+-------+              |
                        v
              +-------------------+
              | Protected         |
              | Immobilized State |
              | • Startup blocked |
              | • Tamper logged   |
              | • Alerts sent     |
              +--------+----------+
                       |
                       v
              +-------------------+
              | Authenticated     |
              | Reactivation      |
              | • Owner confirm   |
              | • Token validate  |
              | • Server approve  |
              +-------------------+
```


**FIG 12 — Predictive Threat Intelligence Pipeline**

```
+---------------------------+     +---------------------------+
| Historical Crime Data     |     | Driver Route / Schedule   |
| (Hotspots, Incidents,     |     | (Planned or Inferred)     |
|  Temporal Patterns)       |     |                           |
+-----------+---------------+     +-----------+---------------+
            |                                 |
            +----------------+----------------+
                             |
                             v
              +-----------------------------+
              | Predictive Risk Engine      |
              | • Geographic correlation    |
              | • Temporal pattern match    |
              | • Behavioural baseline      |
              +-------------+---------------+
                            |
                            v
              +-----------------------------+
              | Pre-Journey Risk Assessment |
              | • Risk score per segment    |
              | • Alternative routes        |
              | • Sensitivity adjustment    |
              +-----------------------------+
```


**FIG 13 — Tamper-Resilient Evidence Preservation and Forensic Reconstruction**

```
+---------------------------+
| Security Incident         |
| Detected                  |
+-----------+---------------+
            |
            v
+---------------------------+
| Multi-Source Data Capture  |
| • Location breadcrumbs    |
| • Audio recording         |
| • Tamper event logs       |
| • Communication attempts  |
| • Sensor readings         |
+-----------+---------------+
            |
            v
+---------------------------+
| Cryptographic Hashing &   |
| Timestamping              |
| (Chain of custody)        |
+-----------+---------------+
            |
            v
+---------------------------+
| Secure Cloud Sync         |
| (End-to-end encrypted,    |
|  opportunistic windows)   |
+-----------+---------------+
            |
            v
+---------------------------+
| Automated Incident Report |
| • Chronological timeline  |
| • Geographic track        |
| • Threat score history    |
| • Evidence package        |
+---------------------------+
```

---

End of Specification

AI AntiHijack — Confidential | Provisional Patent Specification | CIPC Submission | 2026
