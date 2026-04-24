// @ts-nocheck
import { useState } from "react";
import { trpc } from "../lib/trpc";

export default function CustomerDashboard() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const sessionsQuery = trpc.customerDashboard.getSessions.useQuery();

  const feedQuery = trpc.customerDashboard.getFeed.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: !!selectedSessionId }
  );

  const governanceQuery = trpc.customerDashboard.getGovernance.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: !!selectedSessionId }
  );

  const recordAction = trpc.customerDashboard.recordAction.useMutation();

  const sessions = sessionsQuery.data ?? [];
  const feedItems = feedQuery.data ?? [];
  const decisions = governanceQuery.data ?? [];

  return (
    <div className="flex h-screen bg-gray-950 text-white">

      {/* Left Panel — Session List */}
      <div className="w-1/4 border-r border-gray-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Sessions</h2>
        </div>
        {sessionsQuery.isLoading && (
          <div className="p-4 text-gray-400 text-sm">Loading sessions...</div>
        )}
        {sessions.length === 0 && !sessionsQuery.isLoading && (
          <div className="p-4 text-gray-400 text-sm">No sessions found.</div>
        )}
        {sessions.map((session: any) => (
          <div
            key={session.id}
            onClick={() => setSelectedSessionId(session.session_id)}
            className={`p-4 cursor-pointer border-b border-gray-800 hover:bg-gray-800 transition-colors ${
              selectedSessionId === session.session_id ? "bg-gray-800 border-l-2 border-l-blue-500" : ""
            }`}
          >
            <div className="font-medium text-sm text-white">{session.event_name}</div>
            <div className="text-xs text-gray-400 mt-1">{session.client_name}</div>
            <div className={`text-xs mt-1 ${session.status === "active" ? "text-green-400" : "text-gray-500"}`}>
              {session.status}
            </div>
          </div>
        ))}
      </div>

      {/* Centre Panel — Intelligence Feed */}
      <div className="w-2/4 flex flex-col border-r border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Intelligence Feed</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!selectedSessionId && (
            <div className="text-gray-400 text-sm">Select a session to view intelligence.</div>
          )}
          {feedQuery.isLoading && (
            <div className="text-gray-400 text-sm">Loading feed...</div>
          )}
          {feedItems.map((item: any) => (
            <div key={item.id} className="bg-gray-900 border border-gray-700 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  item.severity === "high" ? "bg-red-900 text-red-300" :
                  item.severity === "medium" ? "bg-yellow-900 text-yellow-300" :
                  "bg-gray-700 text-gray-300"
                }`}>
                  {item.feed_type}
                </span>
                <span className="text-xs text-gray-500">
                  {item.created_at ? new Date(item.created_at).toLocaleTimeString() : ""}
                </span>
              </div>
              <div className="text-sm font-medium text-white mb-1">{item.title}</div>
              <div className="text-xs text-gray-400">{item.body}</div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => recordAction.mutate({
                    sessionId: Number(item.session_id),
                    targetType: "feed_item",
                    targetId: item.id,
                    actionType: "acknowledge"
                  })}
                  className="text-xs px-3 py-1 bg-blue-800 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => recordAction.mutate({
                    sessionId: Number(item.session_id),
                    targetType: "feed_item",
                    targetId: item.id,
                    actionType: "follow_up"
                  })}
                  className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Follow Up
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Governance */}
      <div className="w-1/4 overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Governance</h2>
        </div>
        <div className="p-4 space-y-3">
          {!selectedSessionId && (
            <div className="text-gray-400 text-sm">Select a session to view governance.</div>
          )}
          {governanceQuery.isLoading && (
            <div className="text-gray-400 text-sm">Loading...</div>
          )}
          {decisions.map((d: any) => (
            <div key={d.id} className="bg-gray-900 border border-gray-700 rounded p-3">
              <div className="text-xs text-gray-400 mb-1">{d.decision_type}</div>
              <div className={`text-sm font-medium ${
                d.decision === "authorised" ? "text-green-400" :
                d.decision === "pending_review" ? "text-yellow-400" :
                "text-red-400"
              }`}>
                {d.decision}
              </div>
              {d.reasoning && (
                <div className="text-xs text-gray-500 mt-2">{d.reasoning}</div>
              )}
              {d.confidence_score && (
                <div className="text-xs text-gray-600 mt-1">
                  Confidence: {Math.round(d.confidence_score * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
