import { useLocation } from "wouter";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "../_core/trpc";

export default function CustomerProfile() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const { data: sessionMemory, isLoading: memoryLoading } =
    trpc.customerDashboard.getSessionMemory.useQuery(undefined, {
      enabled: !!user,
    });

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <button
        onClick={() => navigate("/customer/dashboard")}
        className="mb-6 text-sm text-gray-400 hover:text-white"
      >
        ← Back to Dashboard
      </button>
      <h1 className="text-xl font-semibold mb-6">Profile</h1>
      <div className="space-y-4 text-sm mb-10">
        <div>
          <span className="text-gray-400">Email</span>
          <p className="text-white mt-1">{user.email ?? "—"}</p>
        </div>
        <div>
          <span className="text-gray-400">Role</span>
          <p className="text-white mt-1">{user.role ?? "—"}</p>
        </div>
        <div>
          <span className="text-gray-400">Org</span>
          <p className="text-white mt-1">{user.orgId ?? "—"}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Session History</h2>
      {memoryLoading ? (
        <p className="text-gray-400 text-sm">Loading session history...</p>
      ) : !sessionMemory || sessionMemory.length === 0 ? (
        <p className="text-gray-400 text-sm">No sessions recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-2 pr-6">Session</th>
                <th className="pb-2 pr-6">Surfaced</th>
                <th className="pb-2 pr-6">Actioned</th>
                <th className="pb-2 pr-6">Ignored</th>
                <th className="pb-2 pr-6">Highest Severity</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {sessionMemory.map((row: any) => (
                <tr key={row.session_id} className="border-b border-gray-900 hover:bg-gray-900">
                  <td className="py-3 pr-6 text-white">{row.event_name ?? `Session ${row.session_id}`}</td>
                  <td className="py-3 pr-6 text-white">{row.signals_surfaced}</td>
                  <td className="py-3 pr-6 text-white">{row.signals_actioned}</td>
                  <td className="py-3 pr-6 text-white">{row.signals_ignored}</td>
                  <td className="py-3 pr-6">
                    {row.highest_severity_seen ? (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          row.highest_severity_seen === "critical"
                            ? "bg-red-900 text-red-300"
                            : row.highest_severity_seen === "high"
                              ? "bg-orange-900 text-orange-300"
                              : row.highest_severity_seen === "medium"
                                ? "bg-yellow-900 text-yellow-300"
                                : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {row.highest_severity_seen}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-3 text-gray-400">
                    {row.session_closed_at ? new Date(row.session_closed_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
