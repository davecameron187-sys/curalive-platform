# Operator Console (OCC) Redesign Brief for Replit

## Overview
Redesign the Operator Console to match the original layout with vertical sidebar tabs on the left side. The console should have:
- **Left Sidebar**: Vertical tabs (Running Calls, Post Event, Simulate Call, Settings, Operator Settings)
- **Top Section**: Conference Overview table with all running/pending/completed calls
- **Middle Section**: Conference Control Panel with operator controls
- **Bottom Section**: Participant list with controls

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Top Menu Bar (Logo, Window Launcher, Operator State)           │
├─────────────────────────────────────────────────────────────────┤
│  Live Call Counter Dashboard (8 metric cards)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────┐ ┌─────────────────────────────────────────────────┐ │
│  │Running │ │ CONFERENCE OVERVIEW                             │ │
│  │ Calls  │ ├─────────────────────────────────────────────────┤ │
│  │        │ │ Tabs: Running | Pending | Completed | Alarms   │ │
│  │Post    │ ├─────────────────────────────────────────────────┤ │
│  │Event   │ │ TABLE: Call-ID | Subject | Reseller | Start... │ │
│  │        │ │ CC-9921 | Q4 2025 | CuraLive | 10:20 | [Open CCP]│
│  │Sim     │ └─────────────────────────────────────────────────┘ │
│  │Call    │                                                      │
│  │        │ ┌─────────────────────────────────────────────────┐ │
│  │Settings│ │ CONFERENCE CONTROL PANEL — Q4 2025 (CC-9921)   │ │
│  │        │ ├─────────────────────────────────────────────────┤ │
│  │Op      │ │ [Record] [Lock] [Mute] [Disconnect] [Dial Out]  │ │
│  │Setgs   │ ├─────────────────────────────────────────────────┤ │
│  │        │ │ Search: [Search by name, company, phone...]     │ │
│  │        │ ├─────────────────────────────────────────────────┤ │
│  │        │ │ Filters: All | Mod | Part | Unmuted | Muted...  │ │
│  │        │ ├─────────────────────────────────────────────────┤ │
│  │        │ │ PARTICIPANT TABLE:                               │ │
│  │        │ │ [✓] | Role | Name | Company | Phone | State     │ │
│  │        │ │ [✓] | Mod | Sarah | CuraLive | +27... | Speaking│
│  │        │ │ [✓] | Part | James | CuraLive | +27... | Muted  │ │
│  │        │ └─────────────────────────────────────────────────┘ │
│  │        │                                                      │
│  └────────┘                                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Requirements

### 1. Left Sidebar Tabs (CRITICAL)
- **Position**: Fixed on the left side, vertical layout
- **Tabs** (in order):
  - Running Calls (default active)
  - Post Event
  - Simulate Call
  - Settings
  - Operator Settings
- **Styling**:
  - Width: ~80-100px (narrow)
  - Tab height: ~60-70px
  - Padding: minimal (px-2 py-2)
  - Font size: small (text-xs or text-[10px])
  - Icons above text labels
  - Active tab: blue background (#3b82f6 or similar)
  - Inactive tabs: slate/gray background
  - Hover effect on inactive tabs
  - Text labels should be abbreviated if needed (e.g., "Op Setgs" instead of "Operator Settings")

### 2. Conference Overview Section
- **Location**: Top of main content area (right of sidebar)
- **Header**: "Conference Overview" with collapse/expand buttons
- **Tabs**: Running, Pending, Completed, Alarms
  - **NO ASSISTED/UNASSISTED TABS** ← Important: Remove these
- **Table Columns**:
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
  - Actions (Open CCP, Split View buttons)
- **Interactions**:
  - Click "Open CCP" button to open Conference Control Panel for that call
  - Click row to select/highlight
  - Sortable columns (optional)

### 3. Conference Control Panel Section
- **Location**: Below Conference Overview
- **Header**: "Conference Control Panel — [Conference Name] ([Call ID])"
- **Conference Bar** (action buttons):
  - Record (toggle, red indicator when recording)
  - Lock (toggle)
  - Mute Participants Only
  - Mute All
  - Disconnect
  - Dial Out
  - Capacity warning
  - Q&A Raised Hands badge
  - Info display: Dial-In, Mod Code, Part Code, Timer
- **Search Bar**: Search by name, company, phone, location
- **Filter Bar**: All, Mod, Part, Unmuted, Muted, Parked, Connected, Waiting, Web, Speak Req
  - **NO ASSISTED/UNASSISTED TABS** ← Important: Remove these
- **Participant Table**:
  - Checkbox for multi-select
  - Role (Moderator, Participant, Host, etc.)
  - Name
  - Company
  - Phone
  - Location
  - State (with color coding: green=speaking, blue=connected, amber=muted, purple=parked, red=waiting)
  - Actions (inline buttons: Unmute, Mute, Park, Disconnect, History, etc.)
- **Multi-Select Action Bar** (appears when items selected):
  - Unmute, Mute, Park, Disconnect buttons

### 4. Feature Tabs (Below Participant Table)
- **Tabs**: Monitoring, Connection, History, Audio Files, Chat, Notes, Q&A Queue, CuraLive Direct
- **Content**: Feature-specific controls and information
- **Styling**: Horizontal tab bar with underline indicator for active tab

### 5. Remove These Sections
- ❌ ASSISTED/UNASSISTED filter tabs (from conference overview and control panel)
- ❌ Parties and Operators section (if it exists below participant table)
- ❌ Any participant detail rows/cards below the participant table

## Implementation Checklist

### Layout Structure
- [ ] Create left sidebar with 5 vertical tabs
- [ ] Make sidebar fixed width (~80-100px)
- [ ] Make main content area flex-1 to fill remaining space
- [ ] Add activeTab state to track which tab is selected
- [ ] Implement tab switching on click

### Conference Overview
- [ ] Display conference table with all columns
- [ ] Implement Running/Pending/Completed/Alarms tabs
- [ ] Remove ASSISTED/UNASSISTED tabs
- [ ] Add "Open CCP" button for each row
- [ ] Implement row click to open Conference Control Panel

### Conference Control Panel
- [ ] Display conference bar with action buttons
- [ ] Implement search bar with real-time filtering
- [ ] Implement filter bar with all filter options
- [ ] Remove ASSISTED/UNASSISTED tabs
- [ ] Display participant table with all columns
- [ ] Implement multi-select checkboxes
- [ ] Show multi-select action bar when items selected
- [ ] Implement participant actions (mute, unmute, park, disconnect, etc.)

### Feature Tabs
- [ ] Display feature tabs below participant table
- [ ] Implement tab switching
- [ ] Display feature-specific content for each tab

### Styling
- [ ] Use dark theme (#0a0d14, #111827, #0f172a)
- [ ] Use blue/emerald/amber/red color scheme
- [ ] Ensure proper contrast for readability
- [ ] Make responsive (mobile-friendly if needed)
- [ ] Add hover effects on interactive elements

### Testing
- [ ] Conference Overview displays correctly
- [ ] "Open CCP" button opens Conference Control Panel
- [ ] Sidebar tabs are clickable and switch state
- [ ] Search and filters work correctly
- [ ] Multi-select and action buttons work
- [ ] Feature tabs display correct content
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Responsive layout on different screen sizes

## State Management

```typescript
// Sidebar tab state
const [activeTab, setActiveTab] = useState<"running" | "post_event" | "simulate" | "settings" | "op_settings">("running");

// Conference Overview state
const [overviewTab, setOverviewTab] = useState<"running" | "pending" | "completed" | "alarms">("running");

// Conference Control Panel state
const [activeCCPConferenceId, setActiveCCPConferenceId] = useState<number | null>(null);
const [selectedParticipantIds, setSelectedParticipantIds] = useState<number[]>([]);
const [filterMode, setFilterMode] = useState<FilterMode>("all");
const [participantSearch, setParticipantSearch] = useState("");

// Feature tabs state
const [featureTab, setFeatureTab] = useState<FeatureTab>("monitoring");
```

## Component Structure

```
OCC.tsx
├── Top Menu Bar (unchanged)
├── Live Call Counter Dashboard (unchanged)
├── Main Workspace Container (flex layout)
│   ├── Left Sidebar Tabs
│   │   ├── Running Calls (icon + label)
│   │   ├── Post Event (icon + label)
│   │   ├── Simulate Call (icon + label)
│   │   ├── Settings (icon + label)
│   │   └── Operator Settings (icon + label)
│   └── Main Content Area
│       ├── Conference Overview Section
│       │   ├── Header with collapse/expand
│       │   ├── Tab bar (Running, Pending, Completed, Alarms)
│       │   └── Conference table
│       ├── Conference Control Panel Section
│       │   ├── CCP Header
│       │   ├── Conference Bar (action buttons)
│       │   ├── Search Bar
│       │   ├── Filter Bar
│       │   ├── Participant Table
│       │   └── Multi-Select Action Bar
│       └── Feature Tabs Section
│           ├── Tab bar (Monitoring, Connection, History, etc.)
│           └── Feature content (conditional)
└── Footer (unchanged)
```

## Files to Modify
- `client/src/pages/OCC.tsx` — Main component file

## Important Notes
- This is a **UI/UX redesign only** — no backend changes
- All existing functionality is preserved
- The sidebar tabs are for navigation/organization (currently just switch state)
- Future: Sidebar tabs can display different content for each tab
- Keep the dark theme consistent throughout
- Ensure all action buttons work correctly
- Test multi-select and batch operations thoroughly

## Color Reference
- Background: `#0a0d14`, `#111827`, `#0f172a`
- Active Tab: `bg-blue-600/40 border-blue-500/60 text-blue-300`
- Inactive Tab: `bg-slate-800/40 border-slate-700 text-slate-400`
- Accent Colors: Blue (#3b82f6), Emerald (#10b981), Amber (#f59e0b), Red (#ef4444)

## Sidebar Tab Abbreviations
- Running Calls → "Running" or "Run Calls"
- Post Event → "Post Evt"
- Simulate Call → "Sim Call"
- Settings → "Settings"
- Operator Settings → "Op Setgs"

## Success Criteria
✅ Sidebar tabs visible on left side with vertical layout
✅ Conference Overview table displays all calls
✅ "Open CCP" button opens Conference Control Panel
✅ Participant table displays with search and filters
✅ Multi-select and action buttons work
✅ No ASSISTED/UNASSISTED tabs visible
✅ No Parties/Operators section visible
✅ All TypeScript errors resolved
✅ Responsive layout maintained
