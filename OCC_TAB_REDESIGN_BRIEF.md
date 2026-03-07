# Operator Console (OCC) - Tab-Based Redesign Brief for Replit

## Overview
Redesign the operator console from a cluttered multi-window interface to a clean, organized **tab-based interface** that allows operators to manage events in one place with easy visibility and control.

---

## Design Principles

1. **Single Dashboard** - All operator functions in one view with organized tabs
2. **Easy Navigation** - Tab-based switching between different operational contexts
3. **Clear Hierarchy** - Running call controls prominent, admin functions secondary
4. **Minimal Clutter** - Only show what's needed for current task
5. **Consistent Styling** - Use the existing dark theme (CuraLive brand colors)

---

## Tab Structure

### **PRIMARY TABS** (Main Operator Functions)

#### **Tab 1: Running Calls** 🎯 (DEFAULT/ACTIVE)
**Purpose:** Core call management interface for active events

**Essential Controls (Organized in sections):**

**Call Management Section:**
- **Answer** - Accept incoming call
- **Join Mon** - Join as Monitor (listen-only)
- **Join T/L** - Join as Talk/Listen (full participant)
- **Hold** - Place call on hold
- **Disconnect** - End call/disconnect participant

**Audio Controls Section:**
- **Record** - Start/stop recording
- **Mute** - Mute current participant
- **Mute All** - Mute all participants
- **Stop Ringing** - Cancel outgoing call

**Advanced Call Section:**
- **Dial Out** - Initiate outbound call
- **Green Room** - Access speaker prep area

**Display Elements:**
- Current event name and status (LIVE/PENDING/COMPLETED)
- Active participant list with state indicators
- Call timer (duration)
- Participant count
- Recording status indicator
- Quick stats (connected, muted, parked, etc.)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Running Calls Tab (ACTIVE)                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Event: Q4 2025 Earnings Call | Status: LIVE        │
│ Duration: 42:18 | Participants: 247 | Recording: ON│
│                                                     │
│ ┌─ Call Management ─┬─ Audio Controls ─┬─ Advanced ┐│
│ │ [Answer]         │ [Record]          │ [Dial Out]││
│ │ [Join Mon]       │ [Mute]            │ [Green Rm]││
│ │ [Join T/L]       │ [Mute All]        │           ││
│ │ [Hold]           │ [Stop Ringing]    │           ││
│ │ [Disconnect]     │                   │           ││
│ └──────────────────┴───────────────────┴───────────┘│
│                                                     │
│ Participant List:                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ John Smith        | Connected | [Mute] [More] │ │
│ │ Sarah Johnson     | Muted     | [Unmute][More]│ │
│ │ Michael Brown     | Speaking  | [Mute] [More] │ │
│ │ Emily Davis       | Waiting   | [Connect][More]│ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

#### **Tab 2: Post Event**
**Purpose:** Handle post-event operations and reporting

**Features:**
- Event summary
- Recording status and download link
- Attendee report
- Q&A transcript
- Sentiment analysis summary
- Export options (PDF, CSV)
- Archive event

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Post Event Tab                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Event Summary:                                      │
│ • Total Attendees: 247                              │
│ • Duration: 1h 42m 18s                              │
│ • Recording: Available [Download]                   │
│                                                     │
│ [View Transcript] [View Q&A] [Export Report]        │
│                                                     │
│ Sentiment Analysis:                                 │
│ • Positive: 78% | Neutral: 18% | Negative: 4%      │
│                                                     │
│ [Archive Event] [Delete Event] [Schedule Similar]   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

#### **Tab 3: Simulate Call**
**Purpose:** Test and simulate call scenarios

**Features:**
- Create test call
- Add test participants
- Simulate participant actions (mute, unmute, speak, etc.)
- Test audio/video quality
- Dial-in number testing
- PSTN simulation

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Simulate Call Tab                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Test Scenario Setup:                                │
│ Event: [Select Event] ▼                             │
│ Participants: [1] [2] [3] [4] [5]                   │
│                                                     │
│ [Start Simulation] [Add Participant] [End Test]     │
│                                                     │
│ Test Log:                                           │
│ • 14:32:15 - Test call initiated                    │
│ • 14:32:18 - Participant 1 joined                   │
│ • 14:32:22 - Participant 2 joined                   │
│ • 14:32:25 - Audio quality: Excellent              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

#### **Tab 4: Settings**
**Purpose:** System-wide operator console settings

**Features:**
- Audio device selection
- Network settings
- Notification preferences
- Display preferences (theme, font size)
- Keyboard shortcuts
- Auto-save preferences
- Reset to defaults

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Settings Tab                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Audio Settings:                                     │
│ • Microphone: [Built-in Microphone] ▼               │
│ • Speaker: [Built-in Speaker] ▼                     │
│ • Volume: [████████░░] 80%                          │
│                                                     │
│ Notifications:                                      │
│ ☑ Sound alerts on incoming calls                    │
│ ☑ Desktop notifications                             │
│ ☑ Email on critical events                          │
│                                                     │
│ Display:                                            │
│ • Theme: [Dark] ▼                                   │
│ • Font Size: [Normal] ▼                             │
│                                                     │
│ [View Keyboard Shortcuts] [Reset to Defaults]       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

#### **Tab 5: Operator Settings** ⚙️
**Purpose:** Personal operator preferences and customization

**Features:**
- Personal profile (name, avatar, role)
- Availability status
- Call routing preferences
- Column visibility for participant table
- Metrics to display on dashboard
- Keyboard shortcuts customization
- Language/timezone settings
- Auto-save preferences to database

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Operator Settings Tab                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Profile:                                            │
│ • Name: [David Chen]                                │
│ • Role: [Senior Operator] ▼                         │
│ • Status: [Present & Ready] ▼                       │
│                                                     │
│ Display Preferences:                                │
│ ☑ Show participant phone numbers                    │
│ ☑ Show call duration                                │
│ ☑ Show participant location                         │
│ ☑ Compact participant list                          │
│                                                     │
│ Dashboard Metrics:                                  │
│ ☑ Live Calls                                        │
│ ☑ Pending Events                                    │
│ ☑ Total Participants                                │
│ ☑ Alerts/Requests                                   │
│ ☑ Recording Status                                  │
│                                                     │
│ [Save Preferences] [Reset to Defaults]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Guide for Replit

### **Step 1: Update OCC.tsx Structure**

Replace the current multi-window layout with a tab-based structure:

```typescript
type OCCTab = "running_calls" | "post_event" | "simulate_call" | "settings" | "operator_settings";

export default function OCC() {
  const [activeTab, setActiveTab] = useState<OCCTab>("running_calls");
  
  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200 flex flex-col">
      {/* Top Bar with Logo and Operator Info */}
      <TopBar />
      
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "running_calls" && <RunningCallsTab />}
        {activeTab === "post_event" && <PostEventTab />}
        {activeTab === "simulate_call" && <SimulateCallTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "operator_settings" && <OperatorSettingsTab />}
      </div>
    </div>
  );
}
```

### **Step 2: Create Tab Components**

Create separate component files for each tab:
- `RunningCallsTab.tsx` - Main call management
- `PostEventTab.tsx` - Post-event operations
- `SimulateCallTab.tsx` - Call simulation
- `SettingsTab.tsx` - System settings
- `OperatorSettingsTab.tsx` - Personal preferences

### **Step 3: Tab Navigation Component**

Create a clean tab bar at the top of content area:

```typescript
function TabNavigation({ activeTab, setActiveTab }) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-[#111827] border-b border-slate-700 shrink-0">
      {[
        { id: "running_calls", label: "Running Calls", icon: Phone },
        { id: "post_event", label: "Post Event", icon: CheckCircle2 },
        { id: "simulate_call", label: "Simulate Call", icon: Activity },
        { id: "settings", label: "Settings", icon: Settings },
        { id: "operator_settings", label: "Operator Settings", icon: User },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === tab.id
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="text-sm font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
```

### **Step 4: Running Calls Tab (Priority)**

This is the main tab. Structure it with:

1. **Header Section** - Event info, status, timer
2. **Control Buttons** - Organized in 3 sections (Call Management, Audio, Advanced)
3. **Participant List** - Clean table with state indicators
4. **Status Bar** - Quick stats and recording indicator

### **Step 5: Preserve All Backend Logic**

- Keep all existing tRPC procedures
- Keep all participant state management
- Keep all call handling logic
- Only change the UI/layout presentation

### **Step 6: Styling Guidelines**

- Use existing dark theme colors
- Tab active state: `bg-blue-600`
- Tab inactive: `text-slate-400 hover:bg-slate-800`
- Buttons: Blue for primary actions, slate for secondary
- Spacing: Use consistent padding (px-4, py-2, gap-2)
- Icons: Use lucide-react icons consistent with existing design

---

## Implementation Checklist

- [ ] Update OCC.tsx main structure with tab state
- [ ] Create TabNavigation component
- [ ] Create RunningCallsTab component with all controls
- [ ] Create PostEventTab component
- [ ] Create SimulateCallTab component
- [ ] Create SettingsTab component
- [ ] Create OperatorSettingsTab component
- [ ] Test tab switching
- [ ] Test all controls in Running Calls tab
- [ ] Verify all backend logic still works
- [ ] Test on different screen sizes
- [ ] Push to GitHub

---

## Estimated Time: 3-4 hours

**Breakdown:**
- Tab structure setup: 30 mins
- Running Calls tab: 90 mins (most complex)
- Other tabs: 60 mins
- Testing & refinement: 30 mins

---

## Key Notes

1. **Running Calls is the primary tab** - Operators spend most time here
2. **Keep it simple** - Only show essential controls
3. **Preserve backend** - No changes to tRPC or database logic
4. **Responsive design** - Works on different screen sizes
5. **Keyboard shortcuts** - Consider adding shortcuts for power users (future enhancement)

---

## Questions?

If you have questions while implementing:
1. Check the original OCC.tsx for reference on how controls work
2. Refer to the layout diagrams above for visual guidance
3. Test frequently in the Replit preview
4. Push to GitHub when ready for Manus sync

Good luck! 🚀
