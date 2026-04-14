import { useMemo } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface ComplianceAlert {
  id: string;
  severity: "warning" | "error";
  message: string;
  timestamp: number;
  speakerId?: string;
}

export interface ComplianceDashboardProps {
  alerts: ComplianceAlert[];
  complianceScore?: number;
  onAlertClick?: (alert: ComplianceAlert) => void;
}

export function ComplianceDashboard({
  alerts,
  complianceScore = 100,
  onAlertClick,
}: ComplianceDashboardProps) {
  const stats = useMemo(() => {
    const errors = alerts.filter((a) => a.severity === "error").length;
    const warnings = alerts.filter((a) => a.severity === "warning").length;

    return {
      errors,
      warnings,
      total: alerts.length,
    };
  }, [alerts]);

  const getScoreColor = () => {
    if (complianceScore >= 90) return "text-green-400";
    if (complianceScore >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = () => {
    if (complianceScore >= 90) return "bg-green-900/20 border-green-700";
    if (complianceScore >= 70) return "bg-yellow-900/20 border-yellow-700";
    return "bg-red-900/20 border-red-700";
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Compliance Monitor</h3>
        <div
          className={`px-3 py-1 rounded-full border ${getScoreBgColor()} ${getScoreColor()}`}
        >
          <span className="text-sm font-semibold">{complianceScore}% Score</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400 mt-1">Total Alerts</div>
        </div>
        <div className="bg-red-900/20 border border-red-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
          <div className="text-xs text-red-300 mt-1">Errors</div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.warnings}</div>
          <div className="text-xs text-yellow-300 mt-1">Warnings</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-300">Recent Alerts</h4>
        {alerts.length === 0 ? (
          <div className="bg-slate-800 rounded p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">No compliance violations detected</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                onClick={() => onAlertClick?.(alert)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  alert.severity === "error"
                    ? "bg-red-900/20 border border-red-700 hover:bg-red-900/30"
                    : "bg-yellow-900/20 border border-yellow-700 hover:bg-yellow-900/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  {alert.severity === "error" ? (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(alert.timestamp)}
                      {alert.speakerId && ` • ${alert.speakerId}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compliance Categories */}
      <div className="bg-slate-800 rounded p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-300">Categories</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Financial Compliance</span>
            <span className="text-white font-semibold">
              {alerts.filter((a) => a.message.includes("Forward-looking")).length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Data Protection</span>
            <span className="text-white font-semibold">
              {alerts.filter((a) => a.message.includes("Personal")).length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Content Compliance</span>
            <span className="text-white font-semibold">
              {alerts.filter((a) => a.message.includes("Inappropriate")).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
