import { useState } from "react";
import { Eye, Radio, FileText } from "lucide-react";

export type ConsoleMode = "monitor" | "active" | "review";

interface ConsoleModeSwitcherProps {
  mode: ConsoleMode;
  onModeChange: (mode: ConsoleMode) => void;
}

const MODES = [
  { value: "monitor" as const, label: "Monitor", desc: "Read-only observation", icon: Eye, color: "text-blue-400", activeBg: "bg-blue-500/10 border-blue-500/30" },
  { value: "active" as const, label: "Active", desc: "Full operator controls", icon: Radio, color: "text-emerald-400", activeBg: "bg-emerald-500/10 border-emerald-500/30" },
  { value: "review" as const, label: "Review", desc: "Post-session analysis", icon: FileText, color: "text-amber-400", activeBg: "bg-amber-500/10 border-amber-500/30" },
];

export function ConsoleModeSwitcher({ mode, onModeChange }: ConsoleModeSwitcherProps) {
  return (
    <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-lg p-1">
      {MODES.map(m => {
        const Icon = m.icon;
        const isActive = mode === m.value;
        return (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            title={m.desc}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? `${m.activeBg} ${m.color} border`
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] border border-transparent"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
