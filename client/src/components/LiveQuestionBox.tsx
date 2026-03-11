import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { nanoid } from "nanoid";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  needsEscalation?: boolean;
  timestamp: Date;
}

const CONVERSATION_ID_KEY = "curalive_support_conv_id";
const MESSAGES_KEY = "curalive_support_messages";

function getConversationId(): string {
  let id = localStorage.getItem(CONVERSATION_ID_KEY);
  if (!id) {
    id = nanoid();
    localStorage.setItem(CONVERSATION_ID_KEY, id);
  }
  return id;
}

function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-40)));
  } catch {}
}

const SUGGESTED = [
  "How does Shadow Mode work?",
  "What is the CICI index?",
  "How does CuraLive handle disclosure risk?",
  "What integrations are available?",
];

export default function LiveQuestionBox() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [conversationId] = useState(getConversationId);
  const [hasNew, setHasNew] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ask = trpc.supportChat.ask.useMutation({
    onSuccess: (data) => {
      const reply: Message = {
        id: nanoid(),
        role: "assistant",
        content: data.answer,
        needsEscalation: data.needsEscalation,
        timestamp: new Date(),
      };
      setMessages(prev => {
        const next = [...prev, reply];
        saveMessages(next);
        return next;
      });
      if (!open) setHasNew(true);
    },
    onError: () => {
      toast.error("Support assistant unavailable. Please try again.");
    },
  });

  useEffect(() => {
    if (open) {
      setHasNew(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ask.isPending]);

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || ask.isPending) return;

    const userMsg: Message = {
      id: nanoid(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages(prev => {
      const next = [...prev, userMsg];
      saveMessages(next);
      return next;
    });
    setInput("");
    ask.mutate({ message: msg, conversationId });
  }

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem(MESSAGES_KEY);
  }

  return (
    <>
      {/* Floating toggle button */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {!open && hasNew && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg"
            >
              New response
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(v => !v)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-13 h-13 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-xl flex items-center justify-center transition-colors"
          aria-label="Open CuraLive Support"
          style={{ width: 52, height: 52 }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
          {hasNew && !open && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
          )}
        </motion.button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-[72px] right-5 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: "min(520px, 80vh)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#0a0c12]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">CuraLive Support</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium">AI · Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-[10px] text-slate-600 hover:text-slate-400 px-2 py-1 rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="w-3 h-3 text-violet-400" />
                    </div>
                    <div className="bg-white/[0.05] border border-white/[0.07] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed max-w-[85%]">
                      Hi — I'm the CuraLive support assistant. Ask me anything about the platform, features, integrations, or compliance.
                    </div>
                  </div>
                  <div className="pl-8 space-y-1.5">
                    <p className="text-[10px] text-slate-700 mb-2">Try asking:</p>
                    {SUGGESTED.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="block w-full text-left text-[11px] text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl px-3 py-2 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="w-3 h-3 text-violet-400" />
                    </div>
                  )}
                  <div className={`max-w-[82%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white rounded-tr-sm"
                          : "bg-white/[0.05] border border-white/[0.07] text-slate-300 rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.needsEscalation && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2.5 py-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Escalated to team
                      </div>
                    )}
                    <span className="text-[9px] text-slate-700">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}

              {ask.isPending && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-3 h-3 text-violet-400" />
                  </div>
                  <div className="bg-white/[0.05] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/[0.07] bg-[#0a0c12]">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-violet-500/40 transition-colors">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
                  placeholder="Ask about CuraLive…"
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-700 outline-none"
                  maxLength={800}
                  disabled={ask.isPending}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || ask.isPending}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors shrink-0"
                >
                  {ask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[9px] text-slate-800 text-center mt-1.5">Powered by CuraLive · AI responses may not reflect commercial terms</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
