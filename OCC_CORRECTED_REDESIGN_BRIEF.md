# Operator Console (OCC) - Corrected Redesign Brief for Replit

## Overview

Based on the reference images provided, the operator console should have a **three-section layout**:

1. **Top Section** - Conference Overview Table (with ASSISTED/UNASSISTED tabs)
2. **Middle Section** - Participant/Party Details (for selected conference)
3. **Right Sidebar** - Quick Action Buttons

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ASSISTED | UNASSISTED  [Search Box]                  [Tabs: Post Event] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Conference Overview Table                              Right Sidebar     │
│  ┌─────────────────────────────────────────────────┐   ┌──────────────┐ │
│  │ Idx │ Conference Name │ Summit │ Act │ Idle │ Hold│   │ F3 Call      │ │
│  │ 28  │ MUSIC MOUNTAIN  │ Virgilio│ 1  │ 74  │ 1  │   │ F4 Op Join   │ │
│  │ 3177│ GER...          │ Virgilio│ 0  │ 0   │ 0  │   │ F5 Join      │ │
│  │ 3473│ GER 10:00 Henkel│ Virgilio│ 2  │ 0   │ 0  │   │ F6 Hold      │ │
│  │ 1013│ GER DEMO View QA│ Virgilio│ 0  │ 2   │ 0  │   │ F7 TL/Mon    │ │
│  │ 32  │ GER Switchboard │ Virgilio│ 0  │ 3   │ 0  │   │ F8 Disconnect│ │
│  │     │                 │         │    │     │    │   │ F9 Voting    │ │
│  └─────────────────────────────────────────────────────┘   │ F10 Q&A      │ │
│                                                             │              │ │
│  Participant/Party Details (for selected conference)       │ [More Buttons]
│  ┌─────────────────────────────────────────────────┐       └──────────────┘ │
│  │ Parties | Operators                             │                        │
│  │ Name: Irene du Plessis                          │                        │
│  │ Phone: SIP:irene_sip@sip.linphone.org           │                        │
│  │ DNIS: WS04:PC:6772                              │                        │
│  │ Status: Hold  Mode: Hold  Port: 1-3-1-465      │                        │
│  │ [Find] [Edit] [Gain] [Details] [Play] [Record] │                        │
│  └─────────────────────────────────────────────────┘                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Section Details

### 1. Top Navigation Bar
- **ASSISTED / UNASSISTED tabs** - Filter conferences by type
- **Search box** - Quick search for conference by name
- **Tab buttons** - Post Event, Simulate Call, Settings, Operator Settings

### 2. Conference Overview Table (Top-Left, ~60% width)

**Columns:**
- Idx (Index/ID)
- Conference Name
- Summit (Summit name/location)
- Act (Active participants)
- Idle (Idle participants)
- Hold (On hold)
- Info (Additional info/notes)

**Features:**
- Clickable rows to select a conference
- Visual highlighting for selected conference
- Scrollable if many conferences
- Shows both ASSISTED and UNASSISTED conferences

### 3. Right Sidebar (~35% width)

**Quick Action Buttons (in order):**
1. F3 Call / Answer
2. F4 Op Join
3. F5 Join
4. F6 Hold
5. F7 TL/Mon (Talk/Listen Monitor)
6. F8 Disconnect
7. F9 Voting
8. F10 Q&A
9. Additional buttons: Mute, Mute All, Stop Ringing, Dial Out, Green Room

**Button Styling:**
- Each button shows keyboard shortcut (F3, F4, etc.)
- Buttons are large and easily clickable
- Disabled state when not applicable
- Visual feedback on hover/click

### 4. Participant/Party Details (Bottom-Left, ~60% width)

**Tabs:**
- Parties
- Operators

**Fields:**
- Name
- Phone (SIP URI)
- DNIS Description
- Add'l Info
- Mode (Hold, Active, etc.)
- Status
- Port
- HD (High Definition)

**Action Buttons:**
- Find
- Edit
- Gain
- Details
- Play
- Record
- Remove
- Dir (Directory)
- Xfer (Transfer)
- Transcribe

---

## Implementation Steps

### Phase 1: Layout Structure
1. Create main container with 3 sections:
   - Top navigation bar
   - Two-column layout: conference table (left) + sidebar (right)
   - Participant details below

### Phase 2: Conference Overview Table
1. Create table component with columns: Idx, Conference Name, Summit, Act, Idle, Hold, Info
2. Add ASSISTED/UNASSISTED tabs above table
3. Add search/filter functionality
4. Implement row selection (highlight selected conference)
5. Connect to backend data (mock data for now)

### Phase 3: Right Sidebar
1. Create button grid with 9+ quick action buttons
2. Add keyboard shortcut labels (F3, F4, etc.)
3. Style buttons for easy visibility
4. Add hover/active states
5. Connect buttons to backend actions (mock for now)

### Phase 4: Participant Details
1. Create tabs: Parties | Operators
2. Add form fields for participant info
3. Add action buttons below
4. Connect to selected conference data

### Phase 5: Additional Tabs
1. Add tab navigation for:
   - Post Event
   - Simulate Call
   - Settings
   - Operator Settings
2. Create placeholder content for each tab

### Phase 6: Styling & Polish
1. Apply dark theme consistent with existing design
2. Ensure responsive layout
3. Add visual hierarchy
4. Test on different screen sizes

---

## Data Structure (Mock)

```typescript
interface Conference {
  idx: number;
  name: string;
  summit: string;
  active: number;
  idle: number;
  hold: number;
  info?: string;
}

interface Participant {
  name: string;
  phone: string;
  dnis: string;
  addlInfo?: string;
  mode: 'Hold' | 'Active' | 'Idle';
  status: string;
  port: string;
  hd: boolean;
}
```

---

## Testing Checklist

- [ ] Conference table displays all conferences
- [ ] ASSISTED/UNASSISTED tabs filter correctly
- [ ] Clicking conference row selects it (visual feedback)
- [ ] Participant details update when conference selected
- [ ] All quick action buttons are visible and clickable
- [ ] Keyboard shortcuts work (F3, F4, etc.)
- [ ] Search/filter works
- [ ] Tabs (Post Event, etc.) are clickable
- [ ] Layout is responsive on different screen sizes
- [ ] Dark theme applied consistently
- [ ] No TypeScript errors
- [ ] No console errors

---

## Estimated Time

- Phase 1-2: 45 mins
- Phase 3: 30 mins
- Phase 4: 30 mins
- Phase 5: 15 mins
- Phase 6: 30 mins

**Total: ~2.5 hours**

---

## Notes

- Keep all backend logic from original OCC.tsx
- Only redesign the UI/layout
- Use existing tRPC procedures
- Preserve all data flows
- Focus on operator workflow: select conference → see participants → perform actions
