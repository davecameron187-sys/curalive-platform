import { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, Users, Flag, Activity } from "lucide-react";

interface CollapsibleBottomTrayProps {
  sessionId: number;
  children: React.ReactNode;
  title?: string;
  defaultOpen?: boolean;
}

export function CollapsibleBottomTray({ sessionId, children, title = "Operator Toolkit", defaultOpen = false }: CollapsibleBottomTrayProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activePanel, setActivePanel] = useState<string>("flags");

  const panels = [
    { id: "flags", label: "Flags", icon: Flag },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "team", label: "Team", icon: Users },
    { id: "analytics", label: "Live Stats", icon: Activity },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${isOpen ? "h-[45vh]" : "h-11"}`}>
      <div className="h-full bg-[#0d0d14] border-t border-white/10 flex flex-col shadow-2xl">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between px-4 py-2 hover:bg-white/[0.02] transition-colors shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">{title}</span>
            {!isOpen && (
              <div className="flex gap-1">
                {panels.map(p => {
                  const Icon = p.icon;
                  return <Icon key={p.id} className="w-3.5 h-3.5 text-slate-600" />;
                })}
              </div>
            )}
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
        </button>

        {isOpen && (
          <>
            <div className="flex gap-1 px-3 pt-2 shrink-0">
              {panels.map(p => {
                const Icon = p.icon;
                return (
                  <button key={p.id} onClick={() => setActivePanel(p.id)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t font-medium transition-colors ${activePanel === p.id ? "bg-white/[0.05] text-white border-b-2 border-violet-500" : "text-slate-500 hover:text-slate-300"}`}>
                    <Icon className="w-3 h-3" />
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
