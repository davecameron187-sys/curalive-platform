# Operator Settings Panel - Implementation Brief for Replit

## Overview
Build a customizable settings panel that allows operators to personalize their OCC (Operator Call Centre) console experience. All preferences are saved per-operator and persist across sessions.

---

## Database Schema

### New Table: `operator_preferences`

```sql
CREATE TABLE operator_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  visible_columns TEXT NOT NULL,
  visible_metrics TEXT NOT NULL,
  compact_mode BOOLEAN DEFAULT false,
  show_advanced_features BOOLEAN DEFAULT false,
  sidebar_collapsed BOOLEAN DEFAULT false,
  enable_keyboard_shortcuts BOOLEAN DEFAULT true,
  enable_auto_refresh BOOLEAN DEFAULT true,
  auto_refresh_interval INT DEFAULT 5,
  enable_sound_alerts BOOLEAN DEFAULT true,
  enable_desktop_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP
);
```

### Column Descriptions

| Column | Type | Purpose |
|--------|------|---------|
| `visible_columns` | TEXT (JSON) | Array of conference table columns to show: `["callId", "subject", "start", "duration", "participants", "status", "actions"]` |
| `visible_metrics` | TEXT (JSON) | Array of dashboard metrics to display: `["liveCalls", "pending", "participants", "alerts"]` |
| `compact_mode` | BOOLEAN | Reduce padding/spacing in UI for more density |
| `show_advanced_features` | BOOLEAN | Show advanced tabs (Connection, History, Audio, QA) by default |
| `sidebar_collapsed` | BOOLEAN | Remember sidebar state |
| `enable_keyboard_shortcuts` | BOOLEAN | Enable keyboard shortcuts (M=Mute, U=Unmute, etc.) |
| `enable_auto_refresh` | BOOLEAN | Auto-refresh conference data |
| `auto_refresh_interval` | INT | Refresh interval in seconds (5-30) |
| `enable_sound_alerts` | BOOLEAN | Play sound on alerts |
| `enable_desktop_notifications` | BOOLEAN | Show browser notifications |

---

## Implementation Steps

### Step 1: Database Setup

1. **Update `drizzle/schema.ts`** - Add the `operatorPreferences` table definition:

```typescript
export const operatorPreferences = mysqlTable("operator_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  visibleColumns: text("visible_columns").notNull(),
  visibleMetrics: text("visible_metrics").notNull(),
  compactMode: boolean("compact_mode").default(false).notNull(),
  showAdvancedFeatures: boolean("show_advanced_features").default(false).notNull(),
  sidebarCollapsed: boolean("sidebar_collapsed").default(false).notNull(),
  enableKeyboardShortcuts: boolean("enable_keyboard_shortcuts").default(true).notNull(),
  enableAutoRefresh: boolean("enable_auto_refresh").default(true).notNull(),
  autoRefreshInterval: int("auto_refresh_interval").default(5).notNull(),
  enableSoundAlerts: boolean("enable_sound_alerts").default(true).notNull(),
  enableDesktopNotifications: boolean("enable_desktop_notifications").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type OperatorPreferences = typeof operatorPreferences.$inferSelect;
export type InsertOperatorPreferences = typeof operatorPreferences.$inferInsert;
```

2. **Run migration:**
```bash
pnpm db:push
```

---

### Step 2: Backend - Database Helpers

**File:** `server/db.ts`

Add these helper functions:

```typescript
import { operatorPreferences } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Default preferences for new operators
const DEFAULT_PREFERENCES = {
  visibleColumns: ["callId", "subject", "start", "duration", "participants", "status", "actions"],
  visibleMetrics: ["liveCalls", "pending", "participants", "alerts"],
  compactMode: false,
  showAdvancedFeatures: false,
  sidebarCollapsed: false,
  enableKeyboardShortcuts: true,
  enableAutoRefresh: true,
  autoRefreshInterval: 5,
  enableSoundAlerts: true,
  enableDesktopNotifications: false,
};

export async function getOperatorPreferences(userId: number) {
  const db = await getDb();
  if (!db) return DEFAULT_PREFERENCES;
  
  const prefs = await db
    .select()
    .from(operatorPreferences)
    .where(eq(operatorPreferences.userId, userId))
    .limit(1);
  
  if (!prefs.length) {
    // Create default preferences for new operator
    await db.insert(operatorPreferences).values({
      userId,
      visibleColumns: JSON.stringify(DEFAULT_PREFERENCES.visibleColumns),
      visibleMetrics: JSON.stringify(DEFAULT_PREFERENCES.visibleMetrics),
      compactMode: DEFAULT_PREFERENCES.compactMode,
      showAdvancedFeatures: DEFAULT_PREFERENCES.showAdvancedFeatures,
      sidebarCollapsed: DEFAULT_PREFERENCES.sidebarCollapsed,
      enableKeyboardShortcuts: DEFAULT_PREFERENCES.enableKeyboardShortcuts,
      enableAutoRefresh: DEFAULT_PREFERENCES.enableAutoRefresh,
      autoRefreshInterval: DEFAULT_PREFERENCES.autoRefreshInterval,
      enableSoundAlerts: DEFAULT_PREFERENCES.enableSoundAlerts,
      enableDesktopNotifications: DEFAULT_PREFERENCES.enableDesktopNotifications,
    });
    return DEFAULT_PREFERENCES;
  }
  
  return {
    visibleColumns: JSON.parse(prefs[0].visibleColumns || "[]"),
    visibleMetrics: JSON.parse(prefs[0].visibleMetrics || "[]"),
    compactMode: prefs[0].compactMode,
    showAdvancedFeatures: prefs[0].showAdvancedFeatures,
    sidebarCollapsed: prefs[0].sidebarCollapsed,
    enableKeyboardShortcuts: prefs[0].enableKeyboardShortcuts,
    enableAutoRefresh: prefs[0].enableAutoRefresh,
    autoRefreshInterval: prefs[0].autoRefreshInterval,
    enableSoundAlerts: prefs[0].enableSoundAlerts,
    enableDesktopNotifications: prefs[0].enableDesktopNotifications,
  };
}

export async function updateOperatorPreferences(userId: number, updates: Partial<typeof DEFAULT_PREFERENCES>) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: any = {};
  if (updates.visibleColumns) updateData.visibleColumns = JSON.stringify(updates.visibleColumns);
  if (updates.visibleMetrics) updateData.visibleMetrics = JSON.stringify(updates.visibleMetrics);
  if (updates.compactMode !== undefined) updateData.compactMode = updates.compactMode;
  if (updates.showAdvancedFeatures !== undefined) updateData.showAdvancedFeatures = updates.showAdvancedFeatures;
  if (updates.sidebarCollapsed !== undefined) updateData.sidebarCollapsed = updates.sidebarCollapsed;
  if (updates.enableKeyboardShortcuts !== undefined) updateData.enableKeyboardShortcuts = updates.enableKeyboardShortcuts;
  if (updates.enableAutoRefresh !== undefined) updateData.enableAutoRefresh = updates.enableAutoRefresh;
  if (updates.autoRefreshInterval !== undefined) updateData.autoRefreshInterval = updates.autoRefreshInterval;
  if (updates.enableSoundAlerts !== undefined) updateData.enableSoundAlerts = updates.enableSoundAlerts;
  if (updates.enableDesktopNotifications !== undefined) updateData.enableDesktopNotifications = updates.enableDesktopNotifications;
  
  await db
    .update(operatorPreferences)
    .set(updateData)
    .where(eq(operatorPreferences.userId, userId));
}

export async function resetOperatorPreferences(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(operatorPreferences)
    .set({
      visibleColumns: JSON.stringify(DEFAULT_PREFERENCES.visibleColumns),
      visibleMetrics: JSON.stringify(DEFAULT_PREFERENCES.visibleMetrics),
      compactMode: DEFAULT_PREFERENCES.compactMode,
      showAdvancedFeatures: DEFAULT_PREFERENCES.showAdvancedFeatures,
      sidebarCollapsed: DEFAULT_PREFERENCES.sidebarCollapsed,
      enableKeyboardShortcuts: DEFAULT_PREFERENCES.enableKeyboardShortcuts,
      enableAutoRefresh: DEFAULT_PREFERENCES.enableAutoRefresh,
      autoRefreshInterval: DEFAULT_PREFERENCES.autoRefreshInterval,
      enableSoundAlerts: DEFAULT_PREFERENCES.enableSoundAlerts,
      enableDesktopNotifications: DEFAULT_PREFERENCES.enableDesktopNotifications,
    })
    .where(eq(operatorPreferences.userId, userId));
}
```

---

### Step 3: Backend - tRPC Procedures

**File:** `server/routers.ts`

Add these procedures in the `appRouter`:

```typescript
import { getOperatorPreferences, updateOperatorPreferences, resetOperatorPreferences } from "./db";
import { z } from "zod";

// In your appRouter definition, add:

operatorSettings: {
  // Get current operator's preferences
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
      return await getOperatorPreferences(ctx.user.id);
    }),

  // Update operator's preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      visibleColumns: z.array(z.string()).optional(),
      visibleMetrics: z.array(z.string()).optional(),
      compactMode: z.boolean().optional(),
      showAdvancedFeatures: z.boolean().optional(),
      sidebarCollapsed: z.boolean().optional(),
      enableKeyboardShortcuts: z.boolean().optional(),
      enableAutoRefresh: z.boolean().optional(),
      autoRefreshInterval: z.number().min(5).max(30).optional(),
      enableSoundAlerts: z.boolean().optional(),
      enableDesktopNotifications: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
      await updateOperatorPreferences(ctx.user.id, input);
      return { success: true };
    }),

  // Reset to default preferences
  resetPreferences: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
      await resetOperatorPreferences(ctx.user.id);
      return { success: true };
    }),
},
```

---

### Step 4: Frontend - OperatorSettings Component

**File:** `client/src/components/OperatorSettings.tsx`

```typescript
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Settings, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_COLUMNS = [
  { id: "callId", label: "Call ID" },
  { id: "subject", label: "Subject" },
  { id: "start", label: "Start Time" },
  { id: "duration", label: "Duration" },
  { id: "participants", label: "Participants" },
  { id: "status", label: "Status" },
  { id: "actions", label: "Actions" },
  { id: "reseller", label: "Reseller" },
  { id: "modCode", label: "Moderator Code" },
  { id: "partCode", label: "Participant Code" },
  { id: "dialIn", label: "Dial-In Number" },
];

const AVAILABLE_METRICS = [
  { id: "liveCalls", label: "Live Calls" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "participants", label: "Participants" },
  { id: "alerts", label: "Alerts" },
  { id: "lounge", label: "Lounge" },
];

export default function OperatorSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: prefs, isLoading } = trpc.operatorSettings.getPreferences.useQuery();
  const updateMut = trpc.operatorSettings.updatePreferences.useMutation();
  const resetMut = trpc.operatorSettings.resetPreferences.useMutation();

  useEffect(() => {
    if (prefs) setPreferences(prefs);
  }, [prefs]);

  const handleToggleColumn = (columnId: string) => {
    if (!preferences) return;
    const newColumns = preferences.visibleColumns.includes(columnId)
      ? preferences.visibleColumns.filter((c: string) => c !== columnId)
      : [...preferences.visibleColumns, columnId];
    setPreferences({ ...preferences, visibleColumns: newColumns });
  };

  const handleToggleMetric = (metricId: string) => {
    if (!preferences) return;
    const newMetrics = preferences.visibleMetrics.includes(metricId)
      ? preferences.visibleMetrics.filter((m: string) => m !== metricId)
      : [...preferences.visibleMetrics, metricId];
    setPreferences({ ...preferences, visibleMetrics: newMetrics });
  };

  const handleToggleBool = (key: string) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleSave = async () => {
    if (!preferences) return;
    setIsSaving(true);
    try {
      await updateMut.mutateAsync(preferences);
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset all settings to defaults?")) return;
    try {
      await resetMut.mutateAsync();
      toast.success("Settings reset to defaults");
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to reset settings");
    }
  };

  if (isLoading) return null;

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-slate-600 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
        title="Operator Settings"
      >
        <Settings className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Settings</span>
      </button>

      {/* Settings Panel Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-[#0f172a]">
              <h2 className="text-lg font-semibold">Operator Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Column Visibility */}
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Conference Table Columns</h3>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_COLUMNS.map(col => (
                    <label key={col.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.visibleColumns?.includes(col.id) || false}
                        onChange={() => handleToggleColumn(col.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                      />
                      <span className="text-xs text-slate-300">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Metric Visibility */}
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Dashboard Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_METRICS.map(metric => (
                    <label key={metric.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.visibleMetrics?.includes(metric.id) || false}
                        onChange={() => handleToggleMetric(metric.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                      />
                      <span className="text-xs text-slate-300">{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Layout Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Layout & Display</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.compactMode || false}
                      onChange={() => handleToggleBool("compactMode")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                    />
                    <span className="text-xs text-slate-300">Compact Mode (reduce spacing)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.showAdvancedFeatures || false}
                      onChange={() => handleToggleBool("showAdvancedFeatures")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                    />
                    <span className="text-xs text-slate-300">Show Advanced Features by default</span>
                  </label>
                </div>
              </div>

              {/* Feature Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Features</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.enableKeyboardShortcuts || false}
                      onChange={() => handleToggleBool("enableKeyboardShortcuts")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                    />
                    <span className="text-xs text-slate-300">Enable Keyboard Shortcuts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.enableAutoRefresh || false}
                      onChange={() => handleToggleBool("enableAutoRefresh")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                    />
                    <span className="text-xs text-slate-300">Auto-refresh data</span>
                  </label>
                  {preferences?.enableAutoRefresh && (
                    <div className="ml-6 flex items-center gap-2">
                      <label className="text-xs text-slate-400">Refresh interval (seconds):</label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={preferences?.autoRefreshInterval || 5}
                        onChange={(e) => setPreferences({ ...preferences, autoRefreshInterval: parseInt(e.target.value) })}
                        className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Preferences */}
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Notifications</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.enableSoundAlerts || false}
                      onChange={() => handleToggleBool("enableSoundAlerts")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                    />
                    <span className="text-xs text-slate-300">Sound Alerts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.enableDesktopNotifications || false}
                      onChange={() => handleToggleBool("enableDesktopNotifications")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                    />
                    <span className="text-xs text-slate-300">Desktop Notifications</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-[#0f172a] sticky bottom-0">
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Defaults
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs text-slate-300 border border-slate-600 rounded hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs text-white bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

### Step 5: Integrate into OCC Header

**File:** `client/src/pages/OCC.tsx`

1. **Import the component:**
```typescript
import OperatorSettings from "@/components/OperatorSettings";
```

2. **Add to the top menu bar** (in the right section with Break/Logout buttons):
```typescript
{/* Right: Operator state */}
<div className="flex items-center gap-3">
  {/* ... existing code ... */}
  
  {/* Add OperatorSettings component here */}
  <OperatorSettings />
  
  <button
    onClick={() => setOperatorState(s => s === "present" ? "break" : "present")}
    className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-slate-600 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
  >
    <Coffee className="w-3.5 h-3.5" />
    {operatorState === "break" ? "Resume" : "Break"}
  </button>
  {/* ... rest of code ... */}
</div>
```

---

### Step 6: Apply Preferences to Console Display

**File:** `client/src/pages/OCC.tsx`

1. **Load preferences on mount:**
```typescript
const { data: operatorPrefs } = trpc.operatorSettings.getPreferences.useQuery();

useEffect(() => {
  if (operatorPrefs) {
    // Apply preferences to state
    setVisibleColumns(operatorPrefs.visibleColumns);
    setVisibleMetrics(operatorPrefs.visibleMetrics);
    setCompactMode(operatorPrefs.compactMode);
    // ... etc
  }
}, [operatorPrefs]);
```

2. **Use visible columns in conference table:**
```typescript
// In the table header
<thead>
  <tr className="border-b border-slate-700 text-slate-400 bg-[#0d1526]">
    {visibleColumns.includes("callId") && <th className="text-left px-3 py-2">Call-ID</th>}
    {visibleColumns.includes("subject") && <th className="text-left px-3 py-2">Subject</th>}
    {/* ... etc for each column ... */}
  </tr>
</thead>
```

3. **Use visible metrics in dashboard:**
```typescript
// Filter the stats array based on visibleMetrics
const statsToShow = [
  { label: "Live Calls", value: runningConfs.length, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Activity, id: "liveCalls" },
  { label: "Pending", value: pendingConfs.length, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Clock, id: "pending" },
  // ... etc
].filter(stat => visibleMetrics.includes(stat.id));
```

---

## Testing Checklist

- [ ] Database table creates successfully with `pnpm db:push`
- [ ] tRPC procedures work (test with Postman or browser console)
- [ ] OperatorSettings component renders in OCC header
- [ ] Column toggles work and persist
- [ ] Metric toggles work and persist
- [ ] Layout preferences apply to console display
- [ ] Reset button restores defaults
- [ ] Settings load on page refresh
- [ ] Different operators have different preferences
- [ ] Auto-refresh interval slider works (5-30 seconds)
- [ ] Sound and desktop notification toggles work

---

## File Checklist

- [ ] `drizzle/schema.ts` - Add operatorPreferences table
- [ ] `server/db.ts` - Add preference helper functions
- [ ] `server/routers.ts` - Add operatorSettings tRPC procedures
- [ ] `client/src/components/OperatorSettings.tsx` - Create new component
- [ ] `client/src/pages/OCC.tsx` - Integrate component and apply preferences
- [ ] Run `pnpm db:push` to create table
- [ ] Run `pnpm test` to verify tests pass

---

## Implementation Order

1. **Database & Backend** (30 mins)
   - Update schema
   - Add db helpers
   - Add tRPC procedures
   - Run migration

2. **Frontend Component** (45 mins)
   - Create OperatorSettings component
   - Test toggles and save functionality
   - Test modal open/close

3. **Integration** (30 mins)
   - Add to OCC header
   - Load preferences on mount
   - Apply to table columns
   - Apply to dashboard metrics

4. **Testing & Refinement** (30 mins)
   - Test all checkboxes
   - Test persistence across sessions
   - Test reset functionality
   - Test on mobile/tablet

**Total estimated time: 2.5 hours**

---

## Tips for Success

- **Test frequently** - Save and check the preview after each section
- **Use browser DevTools** - Check Network tab to see tRPC calls
- **Start with schema** - Get the database right first
- **Test backend first** - Use browser console to test tRPC before building UI
- **Build UI incrementally** - Get the modal working, then add toggles
- **Test persistence** - Refresh page and verify settings load
- **Test as different operators** - Create multiple test accounts if possible

---

## Rollback Plan

If something breaks:
1. All backend logic can be reverted by removing the schema changes
2. Frontend can be reverted by removing the OperatorSettings component
3. No data loss - just revert the files and run `pnpm db:push` again

---

## Notes

- All preferences are per-operator (linked via `user_id`)
- JSON columns store arrays as strings (parse/stringify in code)
- Default preferences are defined in `server/db.ts`
- Settings are auto-created for new operators
- No need to modify existing OCC logic - just filter what's displayed
