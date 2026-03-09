import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, ArrowLeft, Plus, Clock, CheckCircle2, XCircle, Loader2, Trash2, CalendarDays } from "lucide-react";

const EVENT_TYPES = [
  { value: "earnings_call", label: "Earnings Call" },
  { value: "investor_day", label: "Investor Day" },
  { value: "roadshow", label: "Roadshow" },
  { value: "webcast", label: "Webcast" },
  { value: "audio_bridge", label: "Audio Bridge" },
  { value: "board_briefing", label: "Board Briefing" },
];

const PLATFORMS = [
  { value: "pstn", label: "PSTN / Audio Bridge" },
  { value: "rtmp", label: "RTMP Stream" },
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "webex", label: "Cisco Webex" },
];

export default function EventScheduler() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"schedule" | "templates" | "availability">("schedule");
  const [form, setForm] = useState({
    eventId: "",
    scheduledStart: "",
    scheduledEnd: "",
    timezone: "Africa/Johannesburg",
    setupMinutes: 30,
    teardownMinutes: 15,
  });
  const [templateForm, setTemplateForm] = useState({
    templateName: "",
    eventType: "earnings_call" as any,
    defaultDurationMinutes: 60,
    defaultPlatform: "pstn" as any,
    maxAttendees: 500,
    requiresRegistration: true,
    complianceEnabled: true,
  });

  const { data: upcoming, refetch: refetchUpcoming } = trpc.scheduling.listUpcoming.useQuery({});
  const { data: templates, refetch: refetchTemplates } = trpc.scheduling.listTemplates.useQuery();

  const createEvent = trpc.scheduling.createEvent.useMutation({
    onSuccess: () => { toast.success("Event scheduled"); refetchUpcoming(); setForm(f => ({ ...f, eventId: "", scheduledStart: "", scheduledEnd: "" })); },
    onError: (e) => toast.error(e.message),
  });

  const confirmEvent = trpc.scheduling.confirmEvent.useMutation({
    onSuccess: () => { toast.success("Event confirmed"); refetchUpcoming(); },
    onError: (e) => toast.error(e.message),
  });

  const cancelEvent = trpc.scheduling.cancelEvent.useMutation({
    onSuccess: () => { toast.success("Event cancelled"); refetchUpcoming(); },
    onError: (e) => toast.error(e.message),
  });

  const createTemplate = trpc.scheduling.createTemplate.useMutation({
    onSuccess: () => { toast.success("Template created"); refetchTemplates(); },
    onError: (e) => toast.error(e.message),
  });

  const schedules = upcoming ?? [];
  const tmplList = templates ?? [];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Event Scheduler</h1>
          <p className="text-xs text-slate-400">Schedule events, manage templates & operator availability</p>
        </div>
      </div>

      <div className="flex border-b border-slate-800">
        {[
          { id: "schedule", label: "Schedule Event" },
          { id: "templates", label: "Templates" },
          { id: "availability", label: "Operator Availability" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? "border-teal-500 text-teal-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {activeTab === "schedule" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Schedule New Event</h2>
              {[
                { label: "Event ID / Reference", key: "eventId", type: "text", placeholder: "e.g. CC-9921" },
                { label: "Start Date & Time", key: "scheduledStart", type: "datetime-local", placeholder: "" },
                { label: "End Date & Time", key: "scheduledEnd", type: "datetime-local", placeholder: "" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    placeholder={placeholder}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Setup (min)</label>
                  <input type="number" value={form.setupMinutes} onChange={(e) => setForm(f => ({ ...f, setupMinutes: +e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Teardown (min)</label>
                  <input type="number" value={form.teardownMinutes} onChange={(e) => setForm(f => ({ ...f, teardownMinutes: +e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <button
                onClick={() => { if (!form.eventId || !form.scheduledStart || !form.scheduledEnd) { toast.error("Fill in all fields"); return; } createEvent.mutate(form); }}
                disabled={createEvent.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded text-sm font-medium text-white transition-colors"
              >
                {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Schedule Event
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-white mb-2">Upcoming Events ({schedules.length})</h2>
              {schedules.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No upcoming events scheduled</p>
                </div>
              ) : schedules.map((s) => (
                <div key={s.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">{s.eventId}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      s.status === "confirmed" ? "bg-emerald-500/20 text-emerald-300" :
                      s.status === "cancelled" ? "bg-red-500/20 text-red-300" :
                      "bg-amber-500/20 text-amber-300"
                    }`}>{s.status}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(s.scheduledStart).toLocaleString()} — {new Date(s.scheduledEnd).toLocaleTimeString()}</span>
                  </div>
                  {s.status === "tentative" && (
                    <div className="flex gap-2">
                      <button onClick={() => confirmEvent.mutate({ scheduleId: s.id })}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700/50 hover:bg-emerald-700 border border-emerald-600/30 rounded text-xs text-emerald-300 transition-colors">
                        <CheckCircle2 className="w-3 h-3" /> Confirm
                      </button>
                      <button onClick={() => cancelEvent.mutate({ scheduleId: s.id })}
                        className="flex items-center gap-1 px-2.5 py-1 bg-red-700/30 hover:bg-red-700/50 border border-red-600/30 rounded text-xs text-red-300 transition-colors">
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Create Template</h2>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Template Name</label>
                <input value={templateForm.templateName} onChange={(e) => setTemplateForm(f => ({ ...f, templateName: e.target.value }))}
                  placeholder="e.g. Standard Earnings Call"
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Event Type</label>
                <select value={templateForm.eventType} onChange={(e) => setTemplateForm(f => ({ ...f, eventType: e.target.value as any }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500">
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Default Platform</label>
                <select value={templateForm.defaultPlatform} onChange={(e) => setTemplateForm(f => ({ ...f, defaultPlatform: e.target.value as any }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500">
                  {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Duration (min)</label>
                  <input type="number" value={templateForm.defaultDurationMinutes}
                    onChange={(e) => setTemplateForm(f => ({ ...f, defaultDurationMinutes: +e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Max Attendees</label>
                  <input type="number" value={templateForm.maxAttendees}
                    onChange={(e) => setTemplateForm(f => ({ ...f, maxAttendees: +e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <button
                onClick={() => { if (!templateForm.templateName) { toast.error("Enter a template name"); return; } createTemplate.mutate(templateForm); }}
                disabled={createTemplate.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded text-sm font-medium text-white transition-colors">
                <Plus className="w-4 h-4" /> Save Template
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-white mb-2">Saved Templates ({tmplList.length})</h2>
              {tmplList.map((t) => (
                <div key={t.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-white">{t.templateName}</p>
                  <p className="text-xs text-slate-400 mt-1">{EVENT_TYPES.find(e => e.value === t.eventType)?.label} · {t.defaultDurationMinutes}min · {t.maxAttendees} max attendees</p>
                </div>
              ))}
              {tmplList.length === 0 && <p className="text-xs text-slate-500 text-center py-8">No templates yet</p>}
            </div>
          </div>
        )}

        {activeTab === "availability" && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
            <Clock className="w-12 h-12 mx-auto mb-3 text-teal-400 opacity-50" />
            <h3 className="text-sm font-semibold text-white mb-2">Operator Availability</h3>
            <p className="text-xs text-slate-400">Set your weekly availability schedule and date-specific overrides. Full availability grid coming in the next release.</p>
          </div>
        )}
      </div>
    </div>
  );
}
