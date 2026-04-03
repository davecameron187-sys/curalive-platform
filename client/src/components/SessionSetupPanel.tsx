import { useState } from "react";
import { trpc } from "../lib/trpc";

interface SessionSetupPanelProps {
  sessionId: number;
  onConfigSaved?: () => void;
}

const TIER_OPTIONS = [
  { value: "essential", label: "Essential", desc: "Core intelligence + transcript" },
  { value: "intelligence", label: "Intelligence", desc: "Essential + compliance + Q&A routing" },
  { value: "enterprise", label: "Enterprise", desc: "Full suite + presenter screen" },
  { value: "agm", label: "AGM", desc: "Enterprise + AGM intelligence + dissent analysis" },
];

export function SessionSetupPanel({ sessionId, onConfigSaved }: SessionSetupPanelProps) {
  const [tier, setTier] = useState<"essential" | "intelligence" | "enterprise" | "agm">("intelligence");
  const [recipientRows, setRecipientRows] = useState([{ name: "", email: "", role: "IR", sendLive: true, sendReport: true }]);

  const updateConfig = trpc.sessionConfig.updateSessionConfig.useMutation({
    onSuccess: () => onConfigSaved?.(),
  });

  const handleAddRecipient = () => {
    setRecipientRows(r => [...r, { name: "", email: "", role: "IR", sendLive: true, sendReport: true }]);
  };

  const handleSave = () => {
    const validRecipients = recipientRows
      .filter(r => r.email.includes("@") && r.name.trim())
      .map(r => ({ name: r.name.trim(), email: r.email.trim(), role: r.role, sendLive: r.sendLive, sendReport: r.sendReport }));

    updateConfig.mutate({
      sessionId,
      tier,
      recipients: validRecipients.length > 0 ? validRecipients : undefined,
    });
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Session Configuration</h3>

      <div className="space-y-5">
        <div>
          <label className="text-xs text-gray-400 block mb-2">Intelligence Tier</label>
          <div className="grid grid-cols-2 gap-2">
            {TIER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTier(opt.value as any)}
                className={`text-left p-3 rounded-lg border text-xs transition-colors ${
                  tier === opt.value
                    ? "border-purple-500 bg-purple-900/20 text-white"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                <p className="font-semibold mb-1">{opt.label}</p>
                <p className="text-[10px] opacity-75">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">Client Recipients</label>
          <div className="space-y-2">
            {recipientRows.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input value={r.name} onChange={e => { const rows = [...recipientRows]; rows[i].name = e.target.value; setRecipientRows(rows); }} placeholder="Name" className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                <input value={r.email} onChange={e => { const rows = [...recipientRows]; rows[i].email = e.target.value; setRecipientRows(rows); }} placeholder="email@company.com" className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                <input value={r.role} onChange={e => { const rows = [...recipientRows]; rows[i].role = e.target.value; setRecipientRows(rows); }} placeholder="Role" className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              </div>
            ))}
          </div>
          <button onClick={handleAddRecipient} className="text-[10px] text-purple-400 mt-2 hover:text-purple-300">+ Add recipient</button>
        </div>

        <button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {updateConfig.isPending ? "Saving..." : "Save Configuration"}
        </button>

        {updateConfig.isSuccess && (
          <p className="text-xs text-green-400 text-center">Configuration saved successfully.</p>
        )}
      </div>
    </div>
  );
}
