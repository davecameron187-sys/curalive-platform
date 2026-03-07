# Operator Console (OCC) — Hybrid Redesign Brief for Replit

## Overview
Combine the best of two designs:
- **Conference Overview** from the original console (top section with table)
- **Operator Console layout** from the new redesign (below the overview)
- **Smaller sidebar tabs** on the left side
- Remove ASSISTED/UNASSISTED filter tabs
- Remove Parties/Operators section below operator console

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Top Menu Bar (Logo, Window Launcher, Operator State)           │
├─────────────────────────────────────────────────────────────────┤
│  Live Call Counter Dashboard (8 metric cards)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SECTION 1: CONFERENCE OVERVIEW (Collapsible)                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Conference Overview                              [+] [↻] [×] │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ Tabs: Running | Pending | Completed | Alarms               │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ TABLE:                                                       │ │
│  │ Call-ID | Subject | Reseller | Start | Duration | # | ...  │ │
│  │ CC-9921 | Q4 2025 Earnings | CuraLive Inc. | 10:20 | 42:18 │ │
│  │ [Open CCP] [Split View]                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  SECTION 2: OPERATOR CONSOLE (Collapsible)                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Conference Control Panel — Q4 2025 Earnings Call (CC-9921)  │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ [Record] [Lock] [Mute Parts] [Mute All] [Disconnect] ...   │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ Search: [Search by name, company, phone, location...]      │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ Filters: All | Mod | Part | Unmuted | Muted | Parked ...  │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ PARTICIPANT TABLE:                                           │ │
│  │ [checkbox] | Role | Name | Company | Phone | State | ...   │ │
│  │ [  ] | Moderator | Sarah Nkosi | CuraLive | +27... | Connected │
│  │ [  ] | Host | James Dlamini | CuraLive | +27... | Speaking │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  SECTION 3: SIDEBAR TABS (Left side, smaller)                   │
│  ┌──────────┐                                                    │
│  │ Running  │ ← Active tab                                       │
│  │ Post Evt │                                                    │
│  │ Sim Call │                                                    │
│  │ Settings │                                                    │
│  │ Op Setgs │                                                    │
│  └──────────┘                                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Changes from New Redesign

### 1. Conference Overview Section (KEEP)
- **Location**: Top of the workspace (below dashboard)
- **Content**: Table with columns:
  - Checkbox (for recording indicator)
  - Call-ID
  - Subject
  - Reseller
  - Start time
  - Duration
  - Participant count (#)
  - Mod Code
  - Part Code
  - Dial-In
  - Status
  - Actions (Open CCP, Split View)
- **Tabs**: Running, Pending, Completed, Alarms
- **NO ASSISTED/UNASSISTED TABS** ← Remove these
- **Interaction**: Click row or "Open CCP" button to open Conference Control Panel below

### 2. Operator Console Section (KEEP from new design)
- **Location**: Below Conference Overview
- **Header**: "Conference Control Panel — [Conference Name] ([Call ID])"
- **Conference Bar** (action buttons):
  - Record (toggle with red indicator when recording)
  - Lock (toggle)
  - Mute Participants Only
  - Mute All
  - Disconnect
  - Dial Out
  - Capacity warning
  - Q&A Raised Hands badge
  - Info: Dial-In, Mod Code, Part Code, Timer
- **Search Bar**: Search by name, company, phone, location
- **Filter Bar**: All, Mod, Part, Unmuted, Muted, Parked, Connected, Waiting, Web, Speak Req
- **Participant Table**:
  - Checkbox for multi-select
  - Role
  - Name
  - Company
  - Phone
  - Location
  - State (with color coding)
  - Actions (inline buttons or dropdown)
- **Multi-Select Action Bar** (when items selected):
  - Unmute, Mute, Park, Disconnect buttons

### 3. Sidebar Tabs (LEFT SIDE, SMALLER)
- **Location**: Left sidebar
- **Tab Size**: Make smaller than current (reduce padding/font)
- **Tabs**:
  - Running Calls (default active)
  - Post Event
  - Simulate Call
  - Settings
  - Operator Settings
- **Styling**: Vertical tabs with minimal padding
- **NO ASSISTED/UNASSISTED TABS** ← Remove these

### 4. Remove These Sections
- ❌ ASSISTED/UNASSISTED filter tabs (from new design)
- ❌ Parties and Operators section below operator console
- ❌ Any participant detail rows/cards below the participant table

## Implementation Steps

### Step 1: Update OCC.tsx Layout Structure
1. Keep the top menu bar (unchanged)
2. Keep the live call counter dashboard (unchanged)
3. **Add Conference Overview section** (collapsible, with toggle state)
   - Use the table structure from the new design
   - Show Running/Pending/Completed/Alarms tabs
   - Remove ASSISTED/UNASSISTED tabs
4. **Keep Operator Console section** (collapsible, with toggle state)
   - Conference bar with all action buttons
   - Search and filter bars
   - Participant table with multi-select
5. **Add sidebar tabs** (left side, smaller styling)
   - Running Calls, Post Event, Simulate Call, Settings, Operator Settings
   - Make tab text and padding smaller

### Step 2: State Management
```typescript
// Add these state variables
const [showOverview, setShowOverview] = useState(true);  // Toggle conference overview
const [showCCP, setShowCCP] = useState(true);            // Toggle operator console
const [activeTab, setActiveTab] = useState("running");   // Sidebar tab: running | post_event | simulate | settings | op_settings
const [overviewTab, setOverviewTab] = useState("running"); // Conference overview tab
```

### Step 3: Component Structure
```
OCC.tsx
├── Top Menu Bar
├── Live Call Counter Dashboard
├── Conference Overview Section (if showOverview)
│   ├── Header with toggle buttons
│   ├── Tab bar (Running, Pending, Completed, Alarms)
│   └── Conference table with Open CCP button
├── Operator Console Section (if showCCP)
│   ├── CCP Header
│   ├── Conference Bar (action buttons)
│   ├── Search Bar
│   ├── Filter Bar
│   └── Participant Table
└── Sidebar Tabs (Left side)
    ├── Running Calls (active)
    ├── Post Event
    ├── Simulate Call
    ├── Settings
    └── Operator Settings
```

### Step 4: Styling Notes
- **Conference Overview**: Use the same dark theme (#0a0d14, #111827, #0f172a) from new design
- **Operator Console**: Keep the same styling as new design
- **Sidebar Tabs**: Make them smaller:
  - Reduce padding: `px-2 py-1` instead of `px-3 py-2`
  - Reduce font size: `text-xs` instead of `text-sm`
  - Keep vertical orientation (stack on left side)
- **Colors**: Keep the blue/emerald/amber/red color scheme from new design

### Step 5: Interactions
- **Open CCP button** in conference table: Sets `activeCCPConferenceId` and shows operator console
- **Conference Overview collapse**: Toggle `showOverview` state
- **Operator Console collapse**: Toggle `showCCP` state
- **Sidebar tabs**: Switch `activeTab` state (for future tab content switching)
- **Multi-select participants**: Use checkbox state to enable action bar

### Step 6: Remove These Elements
- ❌ ASSISTED/UNASSISTED filter tabs
- ❌ Parties and Operators section (remove the entire section below participant table)
- ❌ Any participant detail rows that were in the new design

## Database & Backend
- **No changes needed** — all tRPC procedures remain the same
- Backend logic for participants, conferences, actions all unchanged
- Only UI/UX layout changes

## Testing Checklist
- [ ] Conference Overview table displays all running/pending/completed conferences
- [ ] "Open CCP" button opens the operator console for selected conference
- [ ] Participant table displays correctly with search and filters working
- [ ] Multi-select action bar appears when participants are selected
- [ ] Sidebar tabs are visible and smaller than before
- [ ] Conference overview can be collapsed/expanded
- [ ] Operator console can be collapsed/expanded
- [ ] All action buttons (Record, Lock, Mute, Disconnect, etc.) work
- [ ] No TypeScript errors
- [ ] Responsive layout on different screen sizes

## Files to Modify
- `client/src/pages/OCC.tsx` — Main component file

## Notes
- This is a **UI/UX redesign only** — no backend changes
- All existing functionality is preserved
- The hybrid design combines the best of both the original and new versions
- Sidebar tabs are for future tab content switching (not implemented yet)
