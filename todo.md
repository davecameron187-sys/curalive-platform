
## Round 4 — Cross-Device Sync, Live Charts & Share Link

- [x] Animated real-time Chart.js bar chart for poll results in Moderator Console
- [x] Share Event Link button in Event Room (copy-to-clipboard shareable attendee URL)
- [x] Cross-device sync test page (/sync-test) + vitest for Ably channel pub/sub

## Round 5 — High Impact Board Demo Features

- [x] AI-Generated Event Summary (LLM) on Post-Event page
- [x] Live Audience Poll Overlay in Event Room attendee view
- [x] Download Transcript as PDF on Post-Event page

## Round 6 — Database, Email & Security

- [ ] Attendee registration persisted to database (name, email, company, event, joined_at)
- [ ] Operator Console shows real attendee list from database
- [ ] Send AI Summary to IR Contacts (server-side email via notification API)
- [ ] Event password protection (access code on Registration + server-side validation)

## Round 7 — Intelligent Webcast Features (Bastion Partnership)

- [ ] Live closed captions overlay on Event Room video player (toggle CC button)
- [ ] Enhanced live sentiment panel with sparkline trend chart and keyword highlights
- [ ] Q&A moderation upgrades: category tags, analyst/retail labels, priority scoring
- [ ] Multi-language transcript selector (EN, FR, PT, SW) in Event Room
- [ ] Enhanced AI post-event summary: financial highlights extraction + branded PDF export

## Round 8 — Top Quick Win AI Features

- [ ] #1 Live Rolling Summary — EventRoom: rolling 2–3 sentence "what you missed" summary updating every 60s
- [ ] #10 Speaking-Pace Coach — Presenter: WPM detector with colour-coded pace indicator
- [ ] #13 Audience Sentiment Feed — Presenter: live sentiment score shown in teleprompter
- [ ] #15 Silence/Anomaly Detector — Operator: alert when audio gap > 10s detected
- [ ] #5 AI Q&A Auto-Triage — Moderator: server LLM pass to auto-classify questions (approved/duplicate/off-topic)
- [ ] #6 Toxicity/Compliance Filter — Moderator: flag abusive/price-sensitive questions before queue
- [ ] #14 AI Event Brief Generator — Operator: paste press release → LLM generates event brief + talking points
- [ ] #19 AI Press Release Draft — PostEvent: one-click SENS/RNS-style press release from transcript
- [ ] #25 Automated Follow-Up Email Draft — PostEvent: draft personalised follow-up emails per IR contact

## Round 9 — Market Coverage & White-Label

- [ ] Add Africa/UAE/Mauritius dial-in numbers to OperatorConsole
- [ ] Build White-Label Configuration panel (logo, brand colours, subdomain preview)
- [ ] Add RTL layout support for Arabic in EventRoom transcript and CC overlay
