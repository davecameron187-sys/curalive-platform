# Chorus.AI Event Room — Design Brainstorm

## Approach A — "Mission Control Dark"
<response>
<idea>
**Design Movement:** Aerospace HUD / Dark Command Center
**Core Principles:**
- Dark navy/charcoal background with glowing data panels
- Data-dense but visually organized — every pixel earns its place
- Neon coral (#FF6B6B) as the primary accent, electric teal for secondary data
- Information hierarchy enforced through luminosity, not color

**Color Philosophy:** Deep space palette — #0B1120 background, #FF6B6B coral for live indicators, #00D4AA teal for positive sentiment, #1E293B for panel surfaces. Conveys seriousness and technological sophistication.

**Layout Paradigm:** Asymmetric split — 60% left for video player, 40% right for intelligence panel. Header is a slim dark bar. No centered layouts.

**Signature Elements:**
- Pulsing "LIVE" badge with glow animation
- Scrolling transcript with highlighted active line
- Sentiment arc gauge (D3.js half-circle)

**Interaction Philosophy:** Hover reveals depth — panels subtly lift on hover. Clicking a transcript line seeks the video. Q&A cards expand inline.

**Animation:** Transcript lines fade-in from bottom. Sentiment gauge animates on value change. Live badge pulses every 2s.

**Typography System:** Space Grotesk (headings, data labels) + Inter (body, transcript). Bold 700 for key metrics, 400 for transcript text.
</idea>
<text>Dark aerospace command center with coral accent, asymmetric split layout, glowing data panels.</text>
<probability>0.08</probability>
</response>

## Approach B — "Precision White Studio"
<response>
<idea>
**Design Movement:** Swiss International Typographic Style meets SaaS Dashboard
**Core Principles:**
- Pure white background, sharp typographic hierarchy
- Thin 1px borders instead of shadows for panel separation
- Coral (#FF6B6B) used only for live/active states — maximum restraint
- Grid-locked layout with deliberate column rhythm

**Color Philosophy:** Surgical restraint — #FFFFFF background, #1E293B text, #FF6B6B live indicator only, #F1F5F9 panel fills. Communicates precision and professionalism.

**Layout Paradigm:** Three-column grid: video (left, 55%), transcript (center, 25%), Q&A (right, 20%). Top navigation bar with event metadata.

**Signature Elements:**
- Thin horizontal rule separating sections
- Monospace font for transcript timestamps
- Minimal pill badges for speaker identification

**Interaction Philosophy:** Understated — subtle background shifts on hover, no dramatic animations. Confidence through restraint.

**Animation:** Transcript lines slide in from right. Sentiment bar transitions smoothly. Minimal.

**Typography System:** Montserrat (headings) + Fira Code (timestamps/code) + Merriweather (body). Mirrors the presentation deck's typography.
</idea>
<text>Swiss precision white studio with three-column grid, monospace timestamps, surgical color restraint.</text>
<probability>0.06</probability>
</response>

## Approach C — "Broadcast Studio Dark" ← SELECTED
<response>
<idea>
**Design Movement:** Professional Broadcast Control Room + Modern SaaS
**Core Principles:**
- Dark slate (#0F172A) background with warm panel surfaces (#1E293B)
- Coral (#FF6B6B) as the brand accent for all live/active states
- Generous but structured whitespace within panels
- Depth through layered panel elevation (subtle box-shadows)

**Color Philosophy:** Premium broadcast aesthetic — dark enough to feel serious, warm enough to feel approachable. Coral pops against dark backgrounds for instant attention. Green (#10B981) for positive sentiment, amber for neutral, red for negative.

**Layout Paradigm:** Two-panel split: left 58% for the video player + event metadata, right 42% for the intelligence sidebar (tabs: Transcript, Q&A, Polls). Sticky top header with event title and live status.

**Signature Elements:**
- Animated "LIVE" dot with pulse ring
- Transcript with speaker name chips and highlighted current line
- Sentiment score ring (circular progress)

**Interaction Philosophy:** Fluid and purposeful — tab switching is instant, transcript auto-scrolls but pauses on manual scroll, Q&A cards can be upvoted.

**Animation:** Smooth tab transitions, transcript line entrance animations, live badge pulse.

**Typography System:** Space Grotesk (UI labels, headings) + Inter (transcript, body). Consistent with a professional broadcast feel.
</idea>
<text>Broadcast studio dark with warm slate panels, coral accents, two-panel split, tabbed intelligence sidebar.</text>
<probability>0.09</probability>
</response>

---

## Decision: Approach C — "Broadcast Studio Dark"

This design best mirrors the Chorus.AI brand established in the presentation deck (dark slate + coral), feels appropriate for a board demo of a live event platform, and provides the clearest UX for the two-panel Event Room concept.
