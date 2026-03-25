import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Calendar, ArrowLeft, Plus, Clock, CheckCircle2, XCircle, Loader2, 
  Settings, Users, Shield, BarChart3, Globe, Check, ChevronRight, ChevronLeft,
  FileText, Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const EVENT_TYPES = [
  { value: "earnings_call", label: "Earnings Call", icon: BarChart3, color: "text-blue-400" },
  { value: "investor_day", label: "Investor Day", icon: Users, color: "text-purple-400" },
  { value: "roadshow", label: "Roadshow", icon: Globe, color: "text-emerald-400" },
  { value: "webcast", label: "Webcast", icon: Monitor, color: "text-orange-400" },
  { value: "audio_bridge", label: "Audio Bridge", icon: Clock, color: "text-cyan-400" },
  { value: "board_briefing", label: "Board Briefing", icon: Shield, color: "text-rose-400" },
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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    templateId: "",
    eventId: "",
    scheduledStart: "",
    scheduledEnd: "",
    timezone: "Africa/Johannesburg",
    platform: "pstn",
    setupMinutes: 30,
    teardownMinutes: 15,
    operatorId: "",
    features: {
      transcription: true,
      qa: true,
      sentiment: true,
      polls: false,
      compliance: true
    }
  });

  const { data: templates } = trpc.scheduling.listTemplates.useQuery();
  const { data: operators } = trpc.scheduling.getAvailableOperators.useQuery({
    start: form.scheduledStart || new Date().toISOString(),
    end: form.scheduledEnd || new Date().toISOString()
  });

  const createEvent = trpc.scheduling.createEvent.useMutation({
    onSuccess: () => { 
      toast.success("Event scheduled successfully");
      navigate("/events/calendar");
    },
    onError: (e) => toast.error(e.message),
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 6));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-6">Step 1: Select Event Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EVENT_TYPES.map(type => (
                <Card 
                  key={type.value} 
                  className={`p-4 cursor-pointer border-2 transition-all hover:border-teal-500/50 bg-slate-800/50 ${form.templateId === type.value ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700'}`}
                  onClick={() => { setForm(f => ({ ...f, templateId: type.value })); nextStep(); }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-slate-900 ${type.color}`}>
                      <type.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{type.label}</p>
                      <p className="text-xs text-slate-400 mt-1">Standardised workflow for {type.label.toLowerCase()} events</p>
                    </div>
                    {form.templateId === type.value && <Check className="w-5 h-5 text-teal-500" />}
                  </div>
                </Card>
              ))}
            </div>
            <div className="pt-6 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-4">Or use a custom saved template</p>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500">
                <option value="">Select a saved template...</option>
                {templates?.map(t => <option key={t.id} value={t.id}>{t.templateName}</option>)}
              </select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">Step 2: Event Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event ID / Reference</label>
                <input 
                  type="text" 
                  value={form.eventId}
                  onChange={(e) => setForm(f => ({ ...f, eventId: e.target.value }))}
                  placeholder="e.g. Q4-EARNINGS-2026"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={form.scheduledStart}
                    onChange={(e) => setForm(f => ({ ...f, scheduledStart: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">End Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={form.scheduledEnd}
                    onChange={(e) => setForm(f => ({ ...f, scheduledEnd: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Timezone</label>
                <select 
                  value={form.timezone}
                  onChange={(e) => setForm(f => ({ ...f, timezone: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</option>
                  <option value="Europe/London">Europe/London (GMT+0/1)</option>
                  <option value="America/New_York">America/New_York (GMT-5/4)</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">Step 3: Platform Configuration</h2>
            <div className="grid grid-cols-1 gap-4">
              {PLATFORMS.map(p => (
                <Card 
                  key={p.value}
                  className={`p-4 cursor-pointer border-2 transition-all bg-slate-800/50 ${form.platform === p.value ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700 hover:border-slate-600'}`}
                  onClick={() => setForm(f => ({ ...f, platform: p.value }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{p.label}</p>
                      <p className="text-xs text-slate-500 mt-1">Automatic resource allocation for {p.label}</p>
                    </div>
                    {form.platform === p.value && <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                  </div>
                </Card>
              ))}
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex gap-3">
                <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-xs text-blue-200">System will automatically provision dial-in numbers and access codes once confirmed.</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">Step 4: Feature Selection</h2>
            <div className="space-y-3">
              {[
                { id: "transcription", label: "Real-time AI Transcription", desc: "Whisper-based live text feed" },
                { id: "qa", label: "Interactive Q&A", desc: "Moderated participant questions" },
                { id: "sentiment", label: "Live Sentiment Analysis", desc: "AI-powered audience sentiment tracking" },
                { id: "polls", label: "Audience Polling", desc: "Live multiple-choice and rating polls" },
                { id: "compliance", label: "Compliance Monitoring", desc: "Flagging of material statements" },
              ].map(feature => (
                <div key={feature.id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div>
                    <p className="font-bold text-white">{feature.label}</p>
                    <p className="text-xs text-slate-400">{feature.desc}</p>
                  </div>
                  <button 
                    onClick={() => setForm(f => ({ ...f, features: { ...f.features, [feature.id]: !(f.features as any)[feature.id] } }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${ (form.features as any)[feature.id] ? 'bg-teal-600' : 'bg-slate-700' }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ (form.features as any)[feature.id] ? 'right-1' : 'left-1' }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">Step 5: Operator Assignment</h2>
            <div className="grid grid-cols-1 gap-3">
              <Card className="p-4 border-teal-500 bg-teal-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">SM</div>
                    <div>
                      <p className="font-bold text-white">System Managed</p>
                      <p className="text-xs text-teal-300">Auto-allocate based on availability</p>
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-teal-500" />
                </div>
              </Card>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-4 mb-2">Available Operators</p>
              {operators?.map(op => (
                <Card 
                  key={op.id}
                  className={`p-4 cursor-pointer border transition-all ${form.operatorId === op.id.toString() ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700 bg-slate-800/30'}`}
                  onClick={() => setForm(f => ({ ...f, operatorId: op.id.toString() }))}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                      {op.name?.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{op.name}</p>
                      <p className="text-xs text-slate-400">Operator · Available</p>
                    </div>
                    {form.operatorId === op.id.toString() && <Check className="w-5 h-5 text-teal-500" />}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">Step 6: Summary & Confirm</h2>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
               <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-700 pb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Event</p>
                      <h3 className="text-2xl font-black text-white">{form.eventId || "Untitled Event"}</h3>
                      <Badge className="bg-teal-500 mt-2">{EVENT_TYPES.find(t => t.value === form.templateId)?.label}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Platform</p>
                      <p className="text-white font-bold">{PLATFORMS.find(p => p.value === form.platform)?.label}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 py-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Schedule</p>
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="w-4 h-4 text-teal-500" />
                        <span className="text-sm font-medium">{new Date(form.scheduledStart).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white mt-1">
                        <Clock className="w-4 h-4 text-teal-500" />
                        <span className="text-sm font-medium">{new Date(form.scheduledStart).toLocaleTimeString()} — {new Date(form.scheduledEnd).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Operator</p>
                      <div className="flex items-center gap-2 text-white">
                        <Users className="w-4 h-4 text-teal-500" />
                        <span className="text-sm font-medium">{form.operatorId ? operators?.find(o => o.id.toString() === form.operatorId)?.name : "Auto-Allocated"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-3">Enabled Features</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(form.features).filter(([_, enabled]) => enabled).map(([id]) => (
                        <Badge key={id} variant="outline" className="border-teal-500/50 text-teal-400 bg-teal-500/5 px-3 py-1 capitalize">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
               </div>
               <div className="bg-teal-600/10 p-4 border-t border-teal-500/20">
                 <p className="text-xs text-teal-200">Confirmation will immediately notify the assigned operator and block resources.</p>
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0d14]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Event Scheduler</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">New Professional Event Wizard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="border-slate-700 text-slate-400" onClick={() => navigate("/events/calendar")}>
             <Calendar className="w-4 h-4 mr-2" /> View Calendar
           </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pt-12">
        <div className="mb-12">
          <div className="flex justify-between mb-4">
             {Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className={`flex flex-col items-center gap-2 flex-1 relative ${i < step ? 'text-teal-400' : 'text-slate-600'}`}>
                 <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold z-10 transition-all ${i + 1 === step ? 'border-teal-500 bg-teal-500/10 scale-110 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : i + 1 < step ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-800 bg-slate-900'}`}>
                   {i + 1 < step ? <Check className="w-5 h-5" /> : i + 1}
                 </div>
                 <span className="text-[10px] uppercase font-bold tracking-tighter">Step {i + 1}</span>
                 {i < 5 && <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 ${i + 1 < step ? 'bg-teal-500' : 'bg-slate-800'}`} />}
               </div>
             ))}
          </div>
        </div>

        <div className="min-h-[400px] mb-8">
          {renderStep()}
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-slate-800">
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white"
            onClick={prevStep}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous Step
          </Button>
          
          <div className="flex gap-3">
             <Button 
               variant="outline" 
               className="border-slate-700 bg-transparent text-slate-400 hover:bg-slate-800"
               onClick={() => navigate("/")}
             >
               Cancel
             </Button>
             {step < 6 ? (
               <Button 
                 className="bg-teal-600 hover:bg-teal-500 min-w-[120px]"
                 onClick={nextStep}
                 disabled={step === 2 && (!form.eventId || !form.scheduledStart || !form.scheduledEnd)}
               >
                 Next Step <ChevronRight className="w-4 h-4 ml-2" />
               </Button>
             ) : (
               <Button 
                 className="bg-teal-600 hover:bg-teal-500 min-w-[140px]"
                 onClick={() => createEvent.mutate(form)}
                 disabled={createEvent.isPending}
               >
                 {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                 Confirm & Schedule
               </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
