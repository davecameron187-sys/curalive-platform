import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Video, Users, Clock, Calendar, Plus, X, Loader2, ChevronLeft,
  UserCheck, UserX, Circle, CheckCircle2, AlertCircle, ExternalLink,
  Copy, Play, Pause, StopCircle, Eye, EyeOff, Building2, Phone,
  Mail, Briefcase, MoreVertical, Trash2, ArrowRight, Lock, Unlock,
  RefreshCw, Globe, Zap
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type MeetingStatus = "scheduled" | "waiting_room_open" | "in_progress" | "completed" | "cancelled";
type InvestorStatus = "not_arrived" | "in_waiting_room" | "admitted" | "completed" | "no_show";
type MeetingType = "1x1" | "group" | "large_group";
type Platform = "zoom" | "teams" | "webex" | "mixed";

const MEETING_STATUS_CONFIG: Record<MeetingStatus, { label: string; color: string; dot: string }> = {
  scheduled: { label: "Scheduled", color: "text-slate-400", dot: "bg-slate-500" },
  waiting_room_open: { label: "Waiting Room Open", color: "text-amber-400", dot: "bg-amber-400 animate-pulse" },
  in_progress: { label: "In Progress", color: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" },
  completed: { label: "Completed", color: "text-blue-400", dot: "bg-blue-400" },
  cancelled: { label: "Cancelled", color: "text-red-400", dot: "bg-red-400" },
};

const INVESTOR_STATUS_CONFIG: Record<InvestorStatus, { label: string; color: string; bg: string }> = {
  not_arrived: { label: "Not Arrived", color: "text-slate-400", bg: "bg-slate-800" },
  in_waiting_room: { label: "In Waiting Room", color: "text-amber-400", bg: "bg-amber-900/20 border border-amber-700/30" },
  admitted: { label: "Admitted", color: "text-emerald-400", bg: "bg-emerald-900/20 border border-emerald-700/30" },
  completed: { label: "Completed", color: "text-blue-400", bg: "bg-blue-900/20 border border-blue-700/30" },
  no_show: { label: "No Show", color: "text-red-400", bg: "bg-red-900/20 border border-red-700/30" },
};

const PLATFORM_BADGES: Record<Platform, { label: string; color: string }> = {
  zoom: { label: "Zoom", color: "bg-blue-600" },
  teams: { label: "Teams", color: "bg-purple-600" },
  webex: { label: "Webex", color: "bg-green-700" },
  mixed: { label: "Mixed", color: "bg-slate-600" },
};

// ─── Add Meeting Modal ────────────────────────────────────────────────────────
function AddMeetingModal({ roadshowId, onClose, onAdded }: { roadshowId: string; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    meetingDate: "",
    startTime: "10:00",
    endTime: "10:30",
    meetingType: "1x1" as MeetingType,
    platform: "zoom" as Platform,
    videoLink: "",
    meetingId: "",
    passcode: "",
    timezone: "Europe/London",
  });

  const addMutation = trpc.liveVideo.addMeeting.useMutation({
    onSuccess: () => { toast.success("Meeting slot added"); onAdded(); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Add Meeting Slot</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Date *</label>
              <input type="date" value={form.meetingDate} onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Start Time *</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">End Time *</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Meeting Type</label>
              <select value={form.meetingType} onChange={e => setForm(f => ({ ...f, meetingType: e.target.value as MeetingType }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="1x1">1:1 Meeting</option>
                <option value="group">Group (2–10)</option>
                <option value="large_group">Large Group (10+)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Platform</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="zoom">Zoom</option>
                <option value="teams">Teams</option>
                <option value="webex">Webex</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Video Join Link</label>
              <input value={form.videoLink} onChange={e => setForm(f => ({ ...f, videoLink: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="https://zoom.us/j/..." />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Meeting ID</label>
              <input value={form.meetingId} onChange={e => setForm(f => ({ ...f, meetingId: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="123 456 7890" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Passcode</label>
              <input value={form.passcode} onChange={e => setForm(f => ({ ...f, passcode: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Optional" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-slate-800">
          <button
            onClick={() => { if (!form.meetingDate) { toast.error("Date is required"); return; } addMutation.mutate({ roadshowId, ...form }); }}
            disabled={addMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Slot
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Investor Modal ───────────────────────────────────────────────────────
function AddInvestorModal({ roadshowId, meetingId, onClose, onAdded }: { roadshowId: string; meetingId: number; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: "", institution: "", email: "", phone: "", jobTitle: "" });

  const addMutation = trpc.liveVideo.addInvestor.useMutation({
    onSuccess: () => { toast.success("Investor added"); onAdded(); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Add Investor</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. Sarah Chen" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Institution *</label>
            <input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. BlackRock" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Job Title</label>
            <input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. Portfolio Manager" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="investor@fund.com" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="+44 20 7000 0000" />
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-slate-800">
          <button
            onClick={() => { if (!form.name || !form.institution) { toast.error("Name and Institution required"); return; } addMutation.mutate({ roadshowId, meetingId, ...form }); }}
            disabled={addMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Investor
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────
function MeetingCard({ meeting, investors, roadshowId, onRefetch }: {
  meeting: any;
  investors: any[];
  roadshowId: string;
  onRefetch: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAddInvestor, setShowAddInvestor] = useState(false);
  const [, navigate] = useLocation();

  const statusCfg = MEETING_STATUS_CONFIG[meeting.status as MeetingStatus] || MEETING_STATUS_CONFIG.scheduled;
  const platBadge = PLATFORM_BADGES[meeting.platform as Platform] || { label: meeting.platform, color: "bg-slate-600" };
  const meetingInvestors = investors.filter(inv => inv.meetingId === meeting.id);

  const updateStatus = trpc.liveVideo.updateMeetingStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); onRefetch(); },
    onError: (err) => toast.error(err.message),
  });

  const updateInvestor = trpc.liveVideo.updateInvestorStatus.useMutation({
    onSuccess: () => onRefetch(),
    onError: (err) => toast.error(err.message),
  });

  const removeInvestor = trpc.liveVideo.removeInvestor.useMutation({
    onSuccess: () => { toast.success("Investor removed"); onRefetch(); },
    onError: (err) => toast.error(err.message),
  });

  const waitingCount = meetingInvestors.filter(i => i.waitingRoomStatus === "in_waiting_room").length;

  return (
    <div className={`bg-slate-900 border rounded-xl transition-all ${
      meeting.status === "in_progress" ? "border-emerald-500/40" :
      meeting.status === "waiting_room_open" ? "border-amber-500/40" :
      "border-slate-800"
    }`}>
      {/* Meeting Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
          <span className="text-sm font-mono font-bold text-white">{meeting.startTime}</span>
          <span className="text-slate-600 text-xs">–</span>
          <span className="text-xs text-slate-500 font-mono">{meeting.endTime}</span>
        </div>
        <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${platBadge.color} flex-shrink-0`}>{platBadge.label}</span>
        <span className="text-[10px] text-slate-500 flex-shrink-0">{meeting.meetingType === "1x1" ? "1:1" : meeting.meetingType === "group" ? "Group" : "Large Group"}</span>
        <div className="flex-1 min-w-0">
          {meetingInvestors.length > 0 && (
            <span className="text-xs text-slate-400 truncate">
              {meetingInvestors.map(i => i.institution).join(", ")}
            </span>
          )}
        </div>
        {waitingCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-900/30 border border-amber-700/30 px-2 py-0.5 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {waitingCount} waiting
          </span>
        )}
        <span className={`text-[11px] font-semibold flex-shrink-0 ${statusCfg.color}`}>{statusCfg.label}</span>
        <span className="text-slate-600 text-xs flex-shrink-0">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-800 px-4 py-4 space-y-4">
          {/* Operator Controls */}
          <div className="flex flex-wrap gap-2">
            {meeting.status === "scheduled" && (
              <button
                onClick={() => updateStatus.mutate({ meetingDbId: meeting.id, status: "waiting_room_open" })}
                className="flex items-center gap-1.5 bg-amber-700/20 hover:bg-amber-700/40 text-amber-400 border border-amber-700/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <Unlock className="w-3 h-3" /> Open Waiting Room
              </button>
            )}
            {meeting.status === "waiting_room_open" && (
              <>
                <button
                  onClick={() => updateStatus.mutate({ meetingDbId: meeting.id, status: "in_progress" })}
                  className="flex items-center gap-1.5 bg-emerald-700/20 hover:bg-emerald-700/40 text-emerald-400 border border-emerald-700/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Play className="w-3 h-3" /> Start Meeting
                </button>
                <button
                  onClick={() => updateStatus.mutate({ meetingDbId: meeting.id, status: "scheduled" })}
                  className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Lock className="w-3 h-3" /> Close Waiting Room
                </button>
              </>
            )}
            {meeting.status === "in_progress" && (
              <button
                onClick={() => updateStatus.mutate({ meetingDbId: meeting.id, status: "completed" })}
                className="flex items-center gap-1.5 bg-blue-700/20 hover:bg-blue-700/40 text-blue-400 border border-blue-700/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <StopCircle className="w-3 h-3" /> End Meeting
              </button>
            )}
            {meeting.videoLink && (
              <a
                href={meeting.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Join Link
              </a>
            )}
            {meeting.videoLink && (
              <button
                onClick={() => { navigator.clipboard.writeText(meeting.videoLink); toast.success("Link copied"); }}
                className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <Copy className="w-3 h-3" /> Copy Link
              </button>
            )}
            <button
              onClick={() => navigate(`/live-video/roadshow/${roadshowId}/present/${meeting.id}`)}
              className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <Eye className="w-3 h-3" /> Slide Presenter
            </button>
          </div>

          {/* Video Link Details */}
          {(meeting.meetingId || meeting.passcode) && (
            <div className="flex gap-4 text-xs text-slate-500">
              {meeting.meetingId && <span>Meeting ID: <span className="text-slate-300 font-mono">{meeting.meetingId}</span></span>}
              {meeting.passcode && <span>Passcode: <span className="text-slate-300 font-mono">{meeting.passcode}</span></span>}
            </div>
          )}

          {/* Investor Waiting Room */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Investors / Waiting Room
                {meetingInvestors.length > 0 && <span className="ml-2 text-slate-500">({meetingInvestors.length})</span>}
              </h4>
              <button
                onClick={() => setShowAddInvestor(true)}
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Investor
              </button>
            </div>

            {meetingInvestors.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-slate-800 rounded-lg">
                <p className="text-xs text-slate-600">No investors assigned. Add investors to this slot.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {meetingInvestors.map(investor => {
                  const statusCfg = INVESTOR_STATUS_CONFIG[investor.waitingRoomStatus as InvestorStatus] || INVESTOR_STATUS_CONFIG.not_arrived;
                  return (
                    <div key={investor.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${statusCfg.bg}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">{investor.name}</span>
                          <span className={`text-[10px] font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {investor.institution}{investor.jobTitle ? ` · ${investor.jobTitle}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {investor.waitingRoomStatus === "not_arrived" && (
                          <button
                            onClick={() => updateInvestor.mutate({ investorId: investor.id, waitingRoomStatus: "in_waiting_room" })}
                            title="Mark as arrived in waiting room"
                            className="p-1.5 text-amber-400 hover:bg-amber-900/30 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {investor.waitingRoomStatus === "in_waiting_room" && (
                          <button
                            onClick={() => updateInvestor.mutate({ investorId: investor.id, waitingRoomStatus: "admitted" })}
                            title="Admit to meeting"
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold transition-colors"
                          >
                            <UserCheck className="w-3 h-3" /> Admit
                          </button>
                        )}
                        {investor.waitingRoomStatus === "admitted" && (
                          <button
                            onClick={() => updateInvestor.mutate({ investorId: investor.id, waitingRoomStatus: "completed" })}
                            title="Mark meeting completed"
                            className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(investor.waitingRoomStatus === "not_arrived" || investor.waitingRoomStatus === "in_waiting_room") && (
                          <button
                            onClick={() => updateInvestor.mutate({ investorId: investor.id, waitingRoomStatus: "no_show" })}
                            title="Mark as no-show"
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm(`Remove ${investor.name}?`)) removeInvestor.mutate({ investorId: investor.id }); }}
                          className="p-1.5 text-slate-600 hover:text-red-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showAddInvestor && (
        <AddInvestorModal
          roadshowId={roadshowId}
          meetingId={meeting.id}
          onClose={() => setShowAddInvestor(false)}
          onAdded={onRefetch}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoadshowDetail() {
  const { roadshowId } = useParams<{ roadshowId: string }>();
  const [, navigate] = useLocation();
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.liveVideo.getRoadshow.useQuery(
    { roadshowId: roadshowId! },
    { enabled: !!roadshowId, refetchInterval: 10000 }
  );

  const updateStatus = trpc.liveVideo.updateRoadshowStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Roadshow not found</p>
          <button onClick={() => navigate("/live-video")} className="text-blue-400 hover:text-blue-300 text-sm">← Back to Live Video Meetings</button>
        </div>
      </div>
    );
  }

  const { roadshow, meetings, investors } = data;

  // Group meetings by date
  const meetingsByDate: Record<string, typeof meetings> = {};
  for (const m of meetings) {
    if (!meetingsByDate[m.meetingDate]) meetingsByDate[m.meetingDate] = [];
    meetingsByDate[m.meetingDate].push(m);
  }
  const dates = Object.keys(meetingsByDate).sort();
  const displayDates = selectedDate ? [selectedDate] : dates;

  const totalInvestors = investors.length;
  const waitingInvestors = investors.filter(i => i.waitingRoomStatus === "in_waiting_room").length;
  const admittedInvestors = investors.filter(i => i.waitingRoomStatus === "admitted").length;
  const completedMeetings = meetings.filter(m => m.status === "completed").length;
  const activeMeetings = meetings.filter(m => m.status === "in_progress").length;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/live-video")} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" /> Live Video
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-semibold text-white truncate max-w-xs">{roadshow.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="p-1.5 text-slate-500 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            {roadshow.status === "draft" && (
              <button
                onClick={() => updateStatus.mutate({ roadshowId: roadshow.roadshowId, status: "active" })}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <Play className="w-3 h-3" /> Activate
              </button>
            )}
            {roadshow.status === "active" && (
              <button
                onClick={() => updateStatus.mutate({ roadshowId: roadshow.roadshowId, status: "completed" })}
                className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <StopCircle className="w-3 h-3" /> Complete
              </button>
            )}
            <button
              onClick={() => setShowAddMeeting(true)}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Slot
            </button>
          </div>
        </div>
      </header>

      <div className="pt-14">
        {/* Roadshow Info Bar */}
        <div className="border-b border-border bg-slate-900/50">
          <div className="container py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    roadshow.status === "active" ? "text-emerald-400" :
                    roadshow.status === "completed" ? "text-blue-400" :
                    roadshow.status === "draft" ? "text-slate-400" : "text-red-400"
                  }`}>{roadshow.status}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{roadshow.serviceType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                </div>
                <h1 className="text-xl font-bold text-white">{roadshow.title}</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {roadshow.issuer}{roadshow.bank ? ` · ${roadshow.bank}` : ""}
                  {roadshow.startDate ? ` · ${roadshow.startDate}${roadshow.endDate && roadshow.endDate !== roadshow.startDate ? ` – ${roadshow.endDate}` : ""}` : ""}
                  {` · ${roadshow.timezone}`}
                </p>
              </div>
              {/* Live Stats */}
              <div className="flex gap-3 flex-shrink-0">
                {activeMeetings > 0 && (
                  <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl px-4 py-2 text-center">
                    <p className="text-lg font-bold text-emerald-400">{activeMeetings}</p>
                    <p className="text-[10px] text-emerald-600">Live Now</p>
                  </div>
                )}
                {waitingInvestors > 0 && (
                  <div className="bg-amber-900/30 border border-amber-700/30 rounded-xl px-4 py-2 text-center">
                    <p className="text-lg font-bold text-amber-400">{waitingInvestors}</p>
                    <p className="text-[10px] text-amber-600">Waiting</p>
                  </div>
                )}
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center">
                  <p className="text-lg font-bold text-white">{meetings.length}</p>
                  <p className="text-[10px] text-slate-500">Slots</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center">
                  <p className="text-lg font-bold text-white">{totalInvestors}</p>
                  <p className="text-[10px] text-slate-500">Investors</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-center">
                  <p className="text-lg font-bold text-blue-400">{completedMeetings}</p>
                  <p className="text-[10px] text-slate-500">Done</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-6">
          {/* Date Tabs */}
          {dates.length > 1 && (
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedDate(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedDate === null ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                All Days ({dates.length})
              </button>
              {dates.map(date => {
                const dayMeetings = meetingsByDate[date] || [];
                const hasWaiting = dayMeetings.some(m => investors.filter(i => i.meetingId === m.id && i.waitingRoomStatus === "in_waiting_room").length > 0);
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedDate === date ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {hasWaiting && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                    {date}
                    <span className="text-slate-500">({dayMeetings.length})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Meeting Schedule */}
          {meetings.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-4">No meeting slots yet. Add your first slot to build the schedule.</p>
              <button
                onClick={() => setShowAddMeeting(true)}
                className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Add First Slot
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {displayDates.map(date => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-bold text-white">{date}</h3>
                    <span className="text-xs text-slate-500">{meetingsByDate[date]?.length || 0} meetings</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                    {(meetingsByDate[date] || []).map(meeting => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        investors={investors}
                        roadshowId={roadshowId!}
                        onRefetch={refetch}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Operator Notes */}
          {roadshow.notes && (
            <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Operator Notes</h4>
              <p className="text-sm text-slate-300 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{roadshow.notes}</p>
            </div>
          )}
        </div>
      </div>

      {showAddMeeting && (
        <AddMeetingModal
          roadshowId={roadshowId!}
          onClose={() => setShowAddMeeting(false)}
          onAdded={refetch}
        />
      )}
    </div>
  );
}
