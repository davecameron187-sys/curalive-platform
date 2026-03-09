import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Settings, X, RotateCcw, Check } from "lucide-react";
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

interface OperatorPreferencesState {
  visibleColumns: string[];
  visibleMetrics: string[];
  compactMode: boolean;
  showAdvancedFeatures: boolean;
  sidebarCollapsed: boolean;
  enableKeyboardShortcuts: boolean;
  enableAutoRefresh: boolean;
  autoRefreshInterval: number;
  enableSoundAlerts: boolean;
  enableDesktopNotifications: boolean;
}

export default function OperatorSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<OperatorPreferencesState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch preferences
  const { data: prefs, isLoading } = trpc.operatorSettings.getPreferences.useQuery();
  const updateMut = trpc.operatorSettings.updatePreferences.useMutation();
  const resetMut = trpc.operatorSettings.resetPreferences.useMutation();

  // Initialize preferences when loaded
  useEffect(() => {
    if (prefs) {
      setPreferences(prefs as OperatorPreferencesState);
      setHasChanges(false);
    }
  }, [prefs]);

  // Handle column toggle
  const handleToggleColumn = (columnId: string) => {
    if (!preferences) return;
    const newColumns = preferences.visibleColumns.includes(columnId)
      ? preferences.visibleColumns.filter((c) => c !== columnId)
      : [...preferences.visibleColumns, columnId];
    setPreferences({ ...preferences, visibleColumns: newColumns });
    setHasChanges(true);
  };

  // Handle metric toggle
  const handleToggleMetric = (metricId: string) => {
    if (!preferences) return;
    const newMetrics = preferences.visibleMetrics.includes(metricId)
      ? preferences.visibleMetrics.filter((m) => m !== metricId)
      : [...preferences.visibleMetrics, metricId];
    setPreferences({ ...preferences, visibleMetrics: newMetrics });
    setHasChanges(true);
  };

  // Handle boolean toggle
  const handleToggleBool = (key: keyof OperatorPreferencesState) => {
    if (!preferences) return;
    if (typeof preferences[key] !== "boolean") return;
    setPreferences({ ...preferences, [key]: !preferences[key] });
    setHasChanges(true);
  };

  // Handle number input
  const handleNumberChange = (key: keyof OperatorPreferencesState, value: number) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
    setHasChanges(true);
  };

  // Save preferences
  const handleSave = async () => {
    if (!preferences) return;
    setIsSaving(true);
    try {
      await updateMut.mutateAsync({
        visibleColumns: preferences.visibleColumns,
        visibleMetrics: preferences.visibleMetrics,
        compactMode: preferences.compactMode,
        showAdvancedFeatures: preferences.showAdvancedFeatures,
        sidebarCollapsed: preferences.sidebarCollapsed,
        enableKeyboardShortcuts: preferences.enableKeyboardShortcuts,
        enableAutoRefresh: preferences.enableAutoRefresh,
        autoRefreshInterval: preferences.autoRefreshInterval,
        enableSoundAlerts: preferences.enableSoundAlerts,
        enableDesktopNotifications: preferences.enableDesktopNotifications,
      });
      toast.success("Settings saved successfully");
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm("Reset all settings to defaults? This cannot be undone.")) return;
    try {
      await resetMut.mutateAsync();
      toast.success("Settings reset to defaults");
      setHasChanges(false);
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to reset settings:", err);
      toast.error("Failed to reset settings");
    }
  };

  if (isLoading) return null;

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded border transition-colors ${
          hasChanges
            ? "border-amber-600 bg-amber-900/20 hover:bg-amber-900/40 text-amber-300"
            : "border-slate-600 hover:bg-slate-700 text-slate-300"
        }`}
        title="Operator Settings"
      >
        <Settings className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs font-medium">Settings</span>
        {hasChanges && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
      </button>

      {/* Settings Panel Modal */}
      {isOpen && preferences && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-[#0f172a]">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Operator Settings</h2>
                <p className="text-xs text-slate-400 mt-1">Customize your console experience</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Column Visibility Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-200">Conference Table Columns</h3>
                  <p className="text-xs text-slate-500">({preferences.visibleColumns.length}/{AVAILABLE_COLUMNS.length} visible)</p>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/30 rounded-lg border border-slate-800">
                  {AVAILABLE_COLUMNS.map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 cursor-pointer group hover:bg-slate-800/50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={preferences.visibleColumns.includes(col.id)}
                        onChange={() => handleToggleColumn(col.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors">
                        {col.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Metric Visibility Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-200">Dashboard Metrics</h3>
                  <p className="text-xs text-slate-500">({preferences.visibleMetrics.length}/{AVAILABLE_METRICS.length} visible)</p>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/30 rounded-lg border border-slate-800">
                  {AVAILABLE_METRICS.map((metric) => (
                    <label
                      key={metric.id}
                      className="flex items-center gap-2 cursor-pointer group hover:bg-slate-800/50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={preferences.visibleMetrics.includes(metric.id)}
                        onChange={() => handleToggleMetric(metric.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors">
                        {metric.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Layout Preferences Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Layout & Display</h3>
                <div className="space-y-2 p-4 bg-slate-900/30 rounded-lg border border-slate-800">
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.compactMode}
                      onChange={() => handleToggleBool("compactMode")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors font-medium">
                        Compact Mode
                      </span>
                      <p className="text-[11px] text-slate-500">Reduce padding and spacing for a denser layout</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.showAdvancedFeatures}
                      onChange={() => handleToggleBool("showAdvancedFeatures")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors font-medium">
                        Show Advanced Features
                      </span>
                      <p className="text-[11px] text-slate-500">Display advanced tabs by default</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Feature Preferences Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Features</h3>
                <div className="space-y-2 p-4 bg-slate-900/30 rounded-lg border border-slate-800">
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.enableKeyboardShortcuts}
                      onChange={() => handleToggleBool("enableKeyboardShortcuts")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors font-medium">
                        Keyboard Shortcuts
                      </span>
                      <p className="text-[11px] text-slate-500">Enable M=Mute, U=Unmute, C=Connect, etc.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.enableAutoRefresh}
                      onChange={() => handleToggleBool("enableAutoRefresh")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors font-medium">
                        Auto-refresh Data
                      </span>
                      <p className="text-[11px] text-slate-500">Automatically refresh conference data</p>
                    </div>
                  </label>

                  {/* Auto-refresh Interval Slider */}
                  {preferences.enableAutoRefresh && (
                    <div className="ml-6 mt-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-slate-400 font-medium">Refresh Interval</label>
                        <span className="text-xs font-mono text-blue-400 bg-slate-900 px-2 py-1 rounded">
                          {preferences.autoRefreshInterval}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        step="1"
                        value={preferences.autoRefreshInterval}
                        onChange={(e) => handleNumberChange("autoRefreshInterval", parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>5s</span>
                        <span>30s</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Preferences Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                <div className="space-y-2 p-4 bg-slate-900/30 rounded-lg border border-slate-800">
                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.enableSoundAlerts}
                      onChange={() => handleToggleBool("enableSoundAlerts")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors font-medium">
                        Sound Alerts
                      </span>
                      <p className="text-[11px] text-slate-500">Play sound on important events</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.enableDesktopNotifications}
                      onChange={() => handleToggleBool("enableDesktopNotifications")}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors font-medium">
                        Desktop Notifications
                      </span>
                      <p className="text-[11px] text-slate-500">Show browser notifications (requires permission)</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-[#0f172a] sticky bottom-0 gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded transition-colors"
                title="Reset all settings to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setPreferences(prefs as OperatorPreferencesState);
                    setHasChanges(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-300 border border-slate-600 rounded hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded transition-colors ${
                    isSaving || !hasChanges
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                      : "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
