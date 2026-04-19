import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageCircle, X, Send, Loader2, AlertTriangle,
  ChevronDown, MapPin, Lock, CalendarDays,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  needsEscalation?: boolean;
  timestamp: Date;
}

const CONVERSATION_ID_KEY = "curalive_support_conv_id";
const MESSAGES_KEY = "curalive_support_messages";
const AUTO_OPENED_KEY = "curalive_support_auto_opened";

function getConversationId(): string {
  let id = localStorage.getItem(CONVERSATION_ID_KEY);
  if (!id) { id = nanoid(); localStorage.setItem(CONVERSATION_ID_KEY, id); }
  return id;
}
function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch { return []; }
}
function saveMessages(messages: Message[]) {
  try { localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-40))); } catch {}
}
function hasAutoOpened(path: string): boolean {
  try { return JSON.parse(localStorage.getItem(AUTO_OPENED_KEY) ?? "[]").includes(path); } catch { return false; }
}
function markAutoOpened(path: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(AUTO_OPENED_KEY) ?? "[]");
    if (!existing.includes(path)) { existing.push(path); localStorage.setItem(AUTO_OPENED_KEY, JSON.stringify(existing)); }
  } catch {}
}

type PageCtx = { label: string | null; welcome: string; suggestions: string[]; autoOpen?: boolean };

const PAGE_CONTEXT: Record<string, PageCtx> = {
  "/shadow-mode": {
    label: "Live Event Monitor",
    welcome: "You're in Shadow Mode — live event monitoring. Ask me anything about what you're seeing right now.",
    suggestions: ["How do I flag a disclosure risk?", "What does a sentiment shift mean?", "How do I prioritise investor questions?", "What triggers a compliance alert?"],
    autoOpen: true,
  },
  "/call-preparation": {
    label: "Call Preparation",
    welcome: "You're preparing for an investor event. I can help you understand the AI briefing, predicted questions, or difficulty scores.",
    suggestions: ["How are questions predicted?", "What is a difficulty score?", "How should I use the talking points?", "What are high-risk disclosure areas?"],
    autoOpen: true,
  },
  "/intelligence-terminal": {
    label: "Intelligence Terminal",
    welcome: "You're in the Intelligence Terminal. Ask me about any metric, index, or dataset you're seeing here.",
    suggestions: ["How is the CICI calculated?", "What is market reaction correlation?", "How is sector difficulty scored?", "What does avoidance rate mean?"],
  },
  "/intelligence-report": {
    label: "Intelligence Reports",
    welcome: "You're viewing Investor Intelligence Reports. Ask me about communication grades, risk flags, or how reports are generated.",
    suggestions: ["How is the communication grade calculated?", "What triggers a risk flag?", "How are exec scores determined?", "Who should receive these reports?"],
  },
  "/investor-questions": {
    label: "Question Intelligence",
    welcome: "You're in the Investor Question Intelligence database. Ask me about scoring, avoidance detection, or the global concern tracker.",
    suggestions: ["How is difficulty scored?", "What is avoidance detection?", "How does the concern tracker work?", "What does investor sentiment mean?"],
  },
  "/benchmarks": {
    label: "Benchmarks",
    welcome: "You're viewing sector benchmarks and the CICI index. Ask me how scores are calculated or what they mean.",
    suggestions: ["What is the CICI index?", "How are sector benchmarks calculated?", "What is a strong communication score?", "How does the data flywheel work?"],
  },
  "/market-reaction": {
    label: "Market Reaction",
    welcome: "You're viewing market reaction correlations — communication patterns linked to market outcomes.",
    suggestions: ["How does avoidance affect market reaction?", "Which topics predict positive outcomes?", "How is prediction confidence scored?", "How many events build a reliable signal?"],
  },
  "/communication-index": {
    label: "CICI Publisher",
    welcome: "You're publishing the CICI index. Ask me about the index components, scoring, or how it's used.",
    suggestions: ["What are the four CICI sub-indices?", "When should I publish a snapshot?", "How is the CICI calculated?", "Who references the CICI?"],
  },
  "/bastion": {
    label: "Bastion Capital",
    welcome: "You're on the Bastion Capital integration page. Ask me about the partnership or what data Bastion accesses.",
    suggestions: ["What does Bastion Capital do?", "How does the Bastion integration work?", "What data does Bastion access?", "Who do I contact at Bastion?"],
  },
  "/lumi": {
    label: "Lumi Global",
    welcome: "You're on the Lumi Global integration page. Ask me about audience engagement features.",
    suggestions: ["What does Lumi Global provide?", "How does Lumi integrate with CuraLive?", "What attendee features does Lumi enable?", "How do I set up Lumi for an event?"],
  },
  "/archive-upload": {
    label: "Archive Upload",
    welcome: "You're uploading a past event transcript. Ask me what formats are supported or how uploaded data feeds the intelligence features.",
    suggestions: ["What file formats can I upload?", "How does archive data feed the platform?", "Which intelligence features use uploaded transcripts?", "How long does processing take?"],
  },
};

const FALLBACK: PageCtx = {
  label: null,
  welcome: "Hi — I'm the CuraLive support assistant. Ask me anything about the platform, features, integrations, or compliance.",
  suggestions: ["How does Shadow Mode work?", "What is the CICI index?", "How does CuraLive handle disclosure risk?", "What integrations are available?"],
  autoOpen: false,
};

// Extract event context from URL patterns like /operator/:slug, /post-event/:slug
function extractEventFromPath(path: string): { eventId: string | null; eventName: string | null } {
  const patterns = [
    /^\/operator\/([^/]+)/,
    /^\/post-event\/([^/]+)/,
    /^\/event\/([^/]+)/,
    /^\/webcast\/([^/]+)/,
    /^\/training\/([^/]+)/,
  ];
  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match) {
      const slug = match[1];
      const name = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      return { eventId: slug, eventName: name };
    }
  }
  return { eventId: null, eventName: null };
}

function getPageCtx(path: string): PageCtx {
  const exact = PAGE_CONTEXT[path];
  if (exact) return exact;
  for (const [key, ctx] of Object.entries(PAGE_CONTEXT)) {
    if (path.startsWith(key)) return ctx;
  }
  return FALLBACK;
}

export default function LiveQuestionBox() {
  const [location] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const ctx = getPageCtx(location);
  const { eventId, eventName } = extractEventFromPath(location);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [conversationId] = useState(getConversationId);
  const [hasNew, setHasNew] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevLocation = useRef(location);

  const ask = trpc.supportChat.ask.useMutation({
    onSuccess: (data) => {
      const reply: Message = {
        id: nanoid(), role: "assistant",
        content: data.answer, needsEscalation: data.needsEscalation, timestamp: new Date(),
      };
      setMessages(prev => { const next = [...prev, reply]; saveMessages(next); return next; });
      if (!open) setHasNew(true);
      if (data.needsEscalation) toast.info("Your query has been escalated to the CuraLive team.");
    },
    onError: (err: any) => {
      if (err?.data?.code === "UNAUTHORIZED") {
        toast.error("Please log in to use the support assistant.");
      } else {
        toast.error("Support assistant unavailable. Please try again.");
      }
    },
  });

  useEffect(() => {
    if (open) { setHasNew(false); setTimeout(() => inputRef.current?.focus(), 200); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ask.isPending]);

  // Auto-open on key pages — first visit only, authenticated users only
  useEffect(() => {
    if (location === prevLocation.current && prevLocation.current !== "") return;
    prevLocation.current = location;

    const pageCtx = getPageCtx(location);
    if (pageCtx.autoOpen && isAuthenticated && !hasAutoOpened(location) && messages.length === 0) {
      const timer = setTimeout(() => { setOpen(true); markAutoOpened(location); }, 1400);
      return () => clearTimeout(timer);
    }
  }, [location, isAuthenticated]);

  const send = useCallback((text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || ask.isPending) return;

    const userMsg: Message = { id: nanoid(), role: "user", content: msg, timestamp: new Date() };
    setMessages(prev => { const next = [...prev, userMsg]; saveMessages(next); return next; });
    setInput("");
    ask.mutate({
      message: msg,
      conversationId,
      currentPage: location,
      eventId: eventId ?? undefined,
      eventName: eventName ?? undefined,
    });
  }, [input, ask, conversationId, location, eventId, eventName]);

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem(MESSAGES_KEY);
  }

  const activeEventLabel = eventName ?? (ctx.label ?? null);

  return (
    <>
      {/* Floating toggle button */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {!open && hasNew && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
              New response
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(v => !v)}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
          className="relative rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-xl flex items-center justify-center transition-colors"
          aria-label="Open CuraLive Support" style={{ width: 52, height: 52 }}
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
            className="fixed bottom-[72px] right-5 z-50 w-[390px] max-w-[calc(100vw-24px)] bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: "min(560px, 84vh)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#0a0c12]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">CuraLive Support</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                      <span className={`text-[10px] font-medium ${isAuthenticated ? "text-emerald-400" : "text-slate-600"}`}>
                        {isAuthenticated ? (user?.name ? user.name.split(" ")[0] : "AI") + " · Online" : "Not signed in"}
                      </span>
                    </div>
                    {activeEventLabel && isAuthenticated && (
                      <>
                        <span className="text-slate-800">·</span>
                        <div className="flex items-center gap-1">
                          {eventId ? <CalendarDays className="w-2.5 h-2.5 text-violet-400/60" /> : <MapPin className="w-2.5 h-2.5 text-violet-400/60" />}
                          <span className="text-[10px] text-violet-400/70 font-medium truncate max-w-[120px]">{activeEventLabel}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && isAuthenticated && (
                  <button onClick={clearHistory} className="text-[10px] text-slate-600 hover:text-slate-400 px-2 py-1 rounded transition-colors">Clear</button>
                )}
                <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Auth gate */}
            {!authLoading && !isAuthenticated ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-violet-600/15 border border-violet-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Sign in required</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The CuraLive support assistant is available to authenticated users only. Please sign in to continue.
                  </p>
                </div>
                <a href="/api/oauth/login"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors">
                  Sign In
                </a>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <div className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageCircle className="w-3 h-3 text-violet-400" />
                        </div>
                        <div className="bg-white/[0.05] border border-white/[0.07] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-slate-300 leading-relaxed max-w-[85%]">
                          {eventName
                            ? `Hi${user?.name ? ` ${user.name.split(" ")[0]}` : ""} — I can see you're working on "${eventName}". Ask me anything about this event or the platform.`
                            : ctx.welcome.replace("Hi —", `Hi${user?.name ? ` ${user.name.split(" ")[0]}` : ""} —`)
                          }
                        </div>
                      </div>
                      <div className="pl-8 space-y-1.5">
                        <p className="text-[10px] text-slate-700 mb-2">
                          {eventId ? "Questions for this event:" : ctx.label ? "Questions for this page:" : "Try asking:"}
                        </p>
                        {(eventId
                          ? ["What should I watch for in this event?", "How do I log a difficult question?", "How do I generate a post-event report?", "How does the co-pilot monitor this call?"]
                          : ctx.suggestions
                        ).map(s => (
                          <button key={s} onClick={() => send(s)}
                            className="block w-full text-left text-[11px] text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] rounded-xl px-3 py-2 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pb-1">
                      {ctx.suggestions.slice(0, 2).map(s => (
                        <button key={s} onClick={() => send(s)} disabled={ask.isPending}
                          className="text-[10px] text-violet-400/70 bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/20 hover:text-violet-300 rounded-full px-2.5 py-1 transition-colors disabled:opacity-40">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageCircle className="w-3 h-3 text-violet-400" />
                        </div>
                      )}
                      <div className={`max-w-[82%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.role === "user" ? "bg-violet-600 text-white rounded-tr-sm" : "bg-white/[0.05] border border-white/[0.07] text-slate-300 rounded-tl-sm"}`}>
                          {msg.content}
                        </div>
                        {msg.needsEscalation && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2.5 py-1">
                            <AlertTriangle className="w-2.5 h-2.5" />Escalated to team
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
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
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
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder={eventName ? `Ask about ${eventName}…` : ctx.label ? `Ask about ${ctx.label}…` : "Ask about CuraLive…"}
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
                  <p className="text-[9px] text-slate-800 text-center mt-1.5">Powered by CuraLive · Responses are AI-generated and may not reflect commercial terms</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
