/**
 * Admin SMS Retry Queue Dashboard
 * Monitor and manage SMS retry queue with real-time updates
 */
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw,
  Trash2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface RetryRecord {
  id: number;
  eventId: string;
  phoneNumber: string;
  message: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryTime: Date;
  status: "pending" | "sent" | "failed" | "exhausted";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QueueStats {
  pending: number;
  sent: number;
  failed: number;
  exhausted: number;
  total: number;
}

export default function AdminSMSRetryQueue() {
  const [retries, setRetries] = useState<RetryRecord[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    sent: 0,
    failed: 0,
    exhausted: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Mutations
  const getQueueMutation = trpc.smsRetry.getQueue.useMutation();
  const getStatsMutation = trpc.smsRetry.getStats.useMutation();
  const processRetryMutation = trpc.smsRetry.processRetry.useMutation();
  const manualRetryMutation = trpc.smsRetry.manualRetry.useMutation();
  const clearOldMutation = trpc.smsRetry.clearOldRetries.useMutation();

  // Load queue and stats
  const loadQueueData = async () => {
    setIsLoading(true);
    try {
      const [queueData, statsData] = await Promise.all([
        getQueueMutation.mutateAsync(),
        getStatsMutation.mutateAsync(),
      ]);

      setRetries(queueData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load queue data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and set up polling
  useEffect(() => {
    loadQueueData();

    // Poll every 30 seconds
    const interval = setInterval(loadQueueData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter retries based on selected status
  const filteredRetries =
    selectedStatus === "all"
      ? retries
      : retries.filter((r) => r.status === selectedStatus);

  // Handle manual retry
  const handleManualRetry = async (retryId: number) => {
    try {
      await manualRetryMutation.mutateAsync(retryId);
      await loadQueueData();
    } catch (error) {
      console.error("Failed to manually retry:", error);
    }
  };

  // Handle process all pending
  const handleProcessAll = async () => {
    try {
      await processRetryMutation.mutateAsync();
      await loadQueueData();
    } catch (error) {
      console.error("Failed to process retries:", error);
    }
  };

  // Handle clear old retries
  const handleClearOld = async () => {
    if (confirm("Clear all retries older than 30 days?")) {
      try {
        await clearOldMutation.mutateAsync();
        await loadQueueData();
      } catch (error) {
        console.error("Failed to clear old retries:", error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded text-xs font-semibold">Pending</span>;
      case "sent":
        return <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs font-semibold">Sent</span>;
      case "failed":
        return <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs font-semibold">Failed</span>;
      case "exhausted":
        return <span className="px-2 py-1 bg-gray-900/30 text-gray-400 rounded text-xs font-semibold">Exhausted</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SMS Retry Queue</h1>
          <p className="text-slate-400">Monitor and manage SMS delivery retries</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-700 border-slate-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-slate-400">Total</div>
              </div>
              <TrendingUp className="w-8 h-8 text-slate-500" />
            </div>
          </Card>

          <Card className="bg-yellow-900/30 border-yellow-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                <div className="text-sm text-yellow-300">Pending</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="bg-green-900/30 border-green-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.sent}</div>
                <div className="text-sm text-green-300">Sent</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="bg-red-900/30 border-red-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                <div className="text-sm text-red-300">Failed</div>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="bg-gray-700 border-gray-600 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-300">{stats.exhausted}</div>
                <div className="text-sm text-gray-400">Exhausted</div>
              </div>
              <Trash2 className="w-8 h-8 text-gray-500" />
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            onClick={loadQueueData}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleProcessAll}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Process All Pending
          </Button>
          <Button
            onClick={handleClearOld}
            variant="outline"
            className="border-slate-500 text-slate-300 hover:bg-slate-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Old (30+ days)
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "pending", "sent", "failed", "exhausted"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                selectedStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({
                status === "all"
                  ? stats.total
                  : stats[status as keyof QueueStats]
              })
            </button>
          ))}
        </div>

        {/* Queue Table */}
        <Card className="bg-slate-800 border-slate-700 overflow-hidden">
          {filteredRetries.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No SMS retries in this category</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Event</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Attempts</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Next Retry</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredRetries.map((retry) => (
                    <tr key={retry.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-300">{retry.phoneNumber}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{retry.eventId}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {retry.attemptCount}/{retry.maxAttempts}
                      </td>
                      <td className="px-6 py-4 text-sm">{getStatusBadge(retry.status)}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {new Date(retry.nextRetryTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {retry.status === "pending" || retry.status === "failed" ? (
                          <Button
                            onClick={() => handleManualRetry(retry.id)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Info */}
        <div className="mt-8 bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-sm text-slate-300">
          <p className="font-semibold text-slate-200 mb-2">Retry Strategy:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Attempt 1: Retry after 1 minute</li>
            <li>Attempt 2: Retry after 5 minutes</li>
            <li>Attempt 3: Retry after 25 minutes</li>
            <li>After max attempts: Mark as exhausted and notify owner</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
