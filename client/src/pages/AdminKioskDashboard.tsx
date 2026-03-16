/**
 * Admin Kiosk Dashboard
 * Real-time monitoring of active kiosk sessions with performance analytics
 */
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";

interface KioskSession {
  id: number;
  kioskId: string;
  eventId: string;
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  duplicates: number;
  startTime: number;
  lastActivityTime: number;
  isActive: boolean;
}

interface KioskMetrics {
  kioskId: string;
  scanRate: number; // scans per minute
  errorRate: number; // percentage
  uptime: number; // percentage
  averageResponseTime: number; // ms
}

export default function AdminKioskDashboard() {
  const { user } = useAuth();
  const [kiosks, setKiosks] = useState<KioskSession[]>([]);
  const [metrics, setMetrics] = useState<Map<string, KioskMetrics>>(new Map());
  const [selectedKiosk, setSelectedKiosk] = useState<KioskSession | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch kiosk sessions
  const getSessionsQuery = trpc.checkin.getCheckInSession.useQuery(
    { id: 1 },
    { enabled: false }
  );

  // Fetch all active sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // In a real implementation, this would fetch all active sessions
        // For now, we'll use mock data
        const mockSessions: KioskSession[] = [
          {
            id: 1,
            kioskId: "kiosk-001",
            eventId: "event-q4-2025",
            totalScans: 245,
            successfulScans: 238,
            failedScans: 5,
            duplicates: 2,
            startTime: Date.now() - 3600000,
            lastActivityTime: Date.now() - 30000,
            isActive: true,
          },
          {
            id: 2,
            kioskId: "kiosk-002",
            eventId: "event-q4-2025",
            totalScans: 189,
            successfulScans: 185,
            failedScans: 3,
            duplicates: 1,
            startTime: Date.now() - 5400000,
            lastActivityTime: Date.now() - 45000,
            isActive: true,
          },
          {
            id: 3,
            kioskId: "kiosk-003",
            eventId: "event-q4-2025",
            totalScans: 312,
            successfulScans: 305,
            failedScans: 4,
            duplicates: 3,
            startTime: Date.now() - 7200000,
            lastActivityTime: Date.now() - 60000,
            isActive: true,
          },
        ];

        setKiosks(mockSessions);

        // Calculate metrics for each kiosk
        const metricsMap = new Map<string, KioskMetrics>();
        mockSessions.forEach((session) => {
          const uptimeMs = Date.now() - session.startTime;
          const uptimePercent = 98 + Math.random() * 2; // 98-100%
          const errorRate =
            ((session.failedScans + session.duplicates) / session.totalScans) *
            100;
          const scanRate = (session.totalScans / (uptimeMs / 60000)).toFixed(1);

          metricsMap.set(session.kioskId, {
            kioskId: session.kioskId,
            scanRate: parseFloat(scanRate as string),
            errorRate: parseFloat(errorRate.toFixed(2)),
            uptime: parseFloat(uptimePercent.toFixed(1)),
            averageResponseTime: 150 + Math.random() * 100,
          });
        });

        setMetrics(metricsMap);
      } catch (error) {
        console.error("Failed to fetch kiosk sessions:", error);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRestartKiosk = async (kioskId: string) => {
    if (confirm(`Are you sure you want to restart ${kioskId}?`)) {
      try {
        // In a real implementation, this would call a tRPC procedure
        console.log(`Restarting kiosk: ${kioskId}`);
        // Show success message
      } catch (error) {
        console.error("Failed to restart kiosk:", error);
      }
    }
  };

  // Calculate aggregate statistics
  const totalScans = kiosks.reduce((sum, k) => sum + k.totalScans, 0);
  const totalSuccessful = kiosks.reduce((sum, k) => sum + k.successfulScans, 0);
  const totalFailed = kiosks.reduce((sum, k) => sum + k.failedScans, 0);
  const totalDuplicates = kiosks.reduce((sum, k) => sum + k.duplicates, 0);

  const scanDistribution = [
    { name: "Successful", value: totalSuccessful, fill: "#10b981" },
    { name: "Failed", value: totalFailed, fill: "#ef4444" },
    { name: "Duplicates", value: totalDuplicates, fill: "#f59e0b" },
  ];

  const scanTrendData = [
    { time: "12:00", scans: 45 },
    { time: "12:15", scans: 52 },
    { time: "12:30", scans: 48 },
    { time: "12:45", scans: 61 },
    { time: "13:00", scans: 55 },
    { time: "13:15", scans: 67 },
    { time: "13:30", scans: 72 },
  ];

  const kioskPerformanceData = kiosks.map((k) => ({
    kioskId: k.kioskId,
    scans: k.totalScans,
    errorRate: metrics.get(k.kioskId)?.errorRate || 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Kiosk Dashboard
            </h1>
            <p className="text-slate-400">
              Real-time monitoring of active check-in kiosks
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-700 border-slate-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Active Kiosks</p>
              <p className="text-3xl font-bold text-white">{kiosks.length}</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-slate-700 border-slate-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Scans</p>
              <p className="text-3xl font-bold text-white">{totalScans}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-slate-700 border-slate-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Success Rate</p>
              <p className="text-3xl font-bold text-green-400">
                {totalScans > 0
                  ? ((totalSuccessful / totalScans) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-slate-700 border-slate-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Error Rate</p>
              <p className="text-3xl font-bold text-red-400">
                {totalScans > 0
                  ? (((totalFailed + totalDuplicates) / totalScans) * 100).toFixed(
                      1
                    )
                  : 0}
                %
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Scan Trend */}
        <Card className="bg-slate-700 border-slate-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Scan Trend (Last Hour)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scanTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                }}
              />
              <Line
                type="monotone"
                dataKey="scans"
                stroke="#3b82f6"
                dot={{ fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Scan Distribution */}
        <Card className="bg-slate-700 border-slate-600 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Scan Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scanDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {scanDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Kiosk Performance */}
      <Card className="bg-slate-700 border-slate-600 p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">
          Kiosk Performance
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={kioskPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis stroke="#94a3b8" dataKey="kioskId" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
              }}
            />
            <Legend />
            <Bar dataKey="scans" fill="#3b82f6" name="Total Scans" />
            <Bar dataKey="errorRate" fill="#ef4444" name="Error Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Kiosk Sessions Table */}
      <Card className="bg-slate-700 border-slate-600 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Active Kiosk Sessions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead className="border-b border-slate-600">
              <tr>
                <th className="text-left py-3 px-4">Kiosk ID</th>
                <th className="text-left py-3 px-4">Event</th>
                <th className="text-right py-3 px-4">Total Scans</th>
                <th className="text-right py-3 px-4">Success</th>
                <th className="text-right py-3 px-4">Failed</th>
                <th className="text-right py-3 px-4">Scan Rate</th>
                <th className="text-right py-3 px-4">Uptime</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {kiosks.map((kiosk) => {
                const metric = metrics.get(kiosk.kioskId);
                return (
                  <tr
                    key={kiosk.id}
                    className="border-b border-slate-600 hover:bg-slate-600/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-white">
                      {kiosk.kioskId}
                    </td>
                    <td className="py-3 px-4">{kiosk.eventId}</td>
                    <td className="py-3 px-4 text-right">{kiosk.totalScans}</td>
                    <td className="py-3 px-4 text-right text-green-400">
                      {kiosk.successfulScans}
                    </td>
                    <td className="py-3 px-4 text-right text-red-400">
                      {kiosk.failedScans}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {metric?.scanRate.toFixed(1)} /min
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`${
                          (metric?.uptime || 0) > 99
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {metric?.uptime.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => setSelectedKiosk(kiosk)}
                          size="sm"
                          variant="outline"
                          className="border-slate-500 text-slate-300 hover:bg-slate-600"
                        >
                          Details
                        </Button>
                        <Button
                          onClick={() => handleRestartKiosk(kiosk.kioskId)}
                          size="sm"
                          variant="outline"
                          className="border-slate-500 text-slate-300 hover:bg-slate-600"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Selected Kiosk Details */}
      {selectedKiosk && (
        <Card className="bg-slate-700 border-slate-600 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Kiosk Details: {selectedKiosk.kioskId}
            </h3>
            <Button
              onClick={() => setSelectedKiosk(null)}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-600 rounded p-4">
              <p className="text-slate-400 text-sm mb-1">Total Scans</p>
              <p className="text-2xl font-bold text-white">
                {selectedKiosk.totalScans}
              </p>
            </div>
            <div className="bg-slate-600 rounded p-4">
              <p className="text-slate-400 text-sm mb-1">Successful</p>
              <p className="text-2xl font-bold text-green-400">
                {selectedKiosk.successfulScans}
              </p>
            </div>
            <div className="bg-slate-600 rounded p-4">
              <p className="text-slate-400 text-sm mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-400">
                {selectedKiosk.failedScans}
              </p>
            </div>
            <div className="bg-slate-600 rounded p-4">
              <p className="text-slate-400 text-sm mb-1">Duplicates</p>
              <p className="text-2xl font-bold text-yellow-400">
                {selectedKiosk.duplicates}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
