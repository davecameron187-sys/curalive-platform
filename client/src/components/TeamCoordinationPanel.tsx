import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Users, Send, UserPlus, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamCoordinationPanelProps {
  sessionId: number;
}

export function TeamCoordinationPanel({ sessionId }: TeamCoordinationPanelProps) {
  const [message, setMessage] = useState("");

  const { data: operators, refetch: refetchOps } = trpc.operations.getSessionOperators.useQuery({ sessionId });
  const joinSession = trpc.operations.joinSessionAsOperator.useMutation({ onSuccess: () => refetchOps() });
  const leaveSession = trpc.operations.leaveSession.useMutation({ onSuccess: () => refetchOps() });
  const initiateHandoff = trpc.operations.initiateHandoff.useMutation({ onSuccess: () => refetchOps() });

  const { data: messages, refetch: refetchMsgs } = trpc.sessionMessages.getSessionMessages.useQuery(
    { sessionId, fromRole: "operator", limit: 30 },
    { refetchInterval: 5000 }
  );

  const sendMessage = trpc.sessionMessages.sendMessage.useMutation({
    onSuccess: () => { setMessage(""); refetchMsgs(); },
  });

  return (
    <div className="space-y-4">
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-slate-200">Active Operators</h4>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => joinSession.mutate({ sessionId })} className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20 gap-1 text-xs">
              <UserPlus className="w-3 h-3" /> Join
            </Button>
            <Button size="sm" onClick={() => leaveSession.mutate({ sessionId })} variant="ghost" className="text-slate-500 hover:text-red-400 gap-1 text-xs">
              <LogOut className="w-3 h-3" /> Leave
            </Button>
          </div>
        </div>

        {operators && operators.length > 0 ? (
          <div className="space-y-2">
            {operators.map((op: any) => (
              <div key={op.id} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-slate-300">{op.name || `Operator #${op.operator_id}`}</span>
                  <span className="text-[10px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">{op.role}</span>
                </div>
                <Button size="sm" variant="ghost" className="text-[10px] text-slate-500 hover:text-amber-400"
                  onClick={() => initiateHandoff.mutate({ sessionId, toOperatorId: op.operator_id, reason: "Handoff requested" })}>
                  Handoff
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No operators currently active on this session.</p>
        )}
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-violet-400" />
          Internal Team Chat
        </h4>

        <div className="max-h-[200px] overflow-y-auto space-y-2 mb-3">
          {messages && Array.isArray(messages) && messages.length > 0 ? (
            messages.map((msg: any, i: number) => (
              <div key={msg.id || i} className="bg-white/[0.02] rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium text-violet-400">{msg.from_name}</span>
                  <span className="text-[10px] text-slate-600">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="text-xs text-slate-300">{msg.message}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No team messages yet.</p>
          )}
        </div>

        <form onSubmit={e => { e.preventDefault(); if (!message.trim()) return; sendMessage.mutate({ sessionId, fromRole: "operator", fromName: "Operator", message: message.trim() }); }} className="flex gap-2">
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Internal team message..." className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" maxLength={2000} />
          <Button type="submit" size="sm" disabled={!message.trim() || sendMessage.isPending} className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3">
            <Send className="w-3 h-3" />
          </Button>
        </form>
      </div>
    </div>
  );
}
