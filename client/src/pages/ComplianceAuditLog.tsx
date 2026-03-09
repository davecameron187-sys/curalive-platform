import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, ArrowLeft, Download, Filter, Clock, CheckCircle2, FileText, AlertTriangle, Search, User, Calendar, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ACTION_COLORS: Record<string, string> = {
  flagged: "text-red-400 bg-red-500/10 border-red-500/20",
  reviewed: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  disclosed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  certificate_generated: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  exported: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

const ACTION_ICONS: Record<string, any> = {
  flagged: AlertTriangle,
  reviewed: Clock,
  approved: CheckCircle2,
  disclosed: FileText,
  certificate_generated: ShieldCheck,
  exported: Download,
};

export default function ComplianceAuditLog() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const { data: log, isLoading } = trpc.compliance.getAuditLog.useQuery({ limit: 500 });

  const entries = log ?? [];

  const filtered = entries.filter(e => {
    const matchSearch = !search || 
      (e.eventId ?? "").toLowerCase().includes(search.toLowerCase()) || 
      (e.details ?? "").toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === "all" || e.action === filterAction;
    
    let matchDate = true;
    if (dateRange !== "all") {
      const entryDate = new Date(e.createdAt);
      const now = new Date();
      if (dateRange === "today") {
        matchDate = entryDate.toDateString() === now.toDateString();
      } else if (dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchDate = entryDate >= weekAgo;
      } else if (dateRange === "month") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        matchDate = entryDate >= monthAgo;
      }
    }
    
    return matchSearch && matchAction && matchDate;
  });

  function exportLog() {
    const csvHeaders = "Timestamp,Event ID,Action,User ID,Details";
    const csvRows = filtered.map(e => {
      const timestamp = e.createdAt ? new Date(e.createdAt).toISOString() : "";
      const eventId = e.eventId ?? "";
      const action = e.action;
      const userId = e.userId ?? "System";
      const details = (e.details ?? "").replace(/"/g, '""');
      return `"${timestamp}","${eventId}","${action}","${userId}","${details}"`;
    });
    
    const csvContent = [csvHeaders, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `compliance_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0d14]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Compliance Audit Log</h1>
            <p className="text-xs text-slate-400">Master regulatory trail across all CuraLive events</p>
          </div>
        </div>
        <Button
          onClick={exportLog}
          variant="outline"
          size="sm"
          className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          disabled={filtered.length === 0}
        >
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {["flagged", "reviewed", "approved", "disclosed", "certificate_generated", "exported"].map(action => {
            const Icon = ACTION_ICONS[action] ?? AlertTriangle;
            const count = entries.filter(e => e.action === action).length;
            const colors = ACTION_COLORS[action]?.split(" ")[0] || "text-slate-400";
            return (
              <Card key={action} className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6 text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${ACTION_COLORS[action]?.split(" ").slice(1).join(" ")}`}>
                    <Icon className={`w-4 h-4 ${colors}`} />
                  </div>
                  <div className="text-xl font-bold text-white">{count}</div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mt-1">
                    {action.replace(/_/g, " ")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters & Table */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search by event ID, user, or details..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/50" 
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select 
                  value={filterAction} 
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 min-w-[140px]"
                >
                  <option value="all">All Actions</option>
                  <option value="flagged">Flagged</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="disclosed">Handled</option>
                  <option value="certificate_generated">Certificates</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 min-w-[140px]"
                >
                  <option value="all">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 font-medium border-b border-slate-800">
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Authorised By</th>
                    <th className="px-6 py-4">Outcome / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-6 py-4 bg-slate-800/10 h-12"></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-20">
                           <ShieldCheck className="w-12 h-12" />
                           <p className="text-lg font-medium">No audit entries found</p>
                           <p className="text-sm">Try adjusting your filters or search terms</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((entry) => {
                      const Icon = ACTION_ICONS[entry.action] ?? AlertTriangle;
                      const statusClass = ACTION_COLORS[entry.action] ?? "text-slate-400 bg-slate-500/10";
                      
                      return (
                        <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-slate-200 font-medium">
                                {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "—"}
                              </span>
                              <span className="text-slate-500 text-[10px] font-mono">
                                {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString() : "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div 
                              onClick={() => entry.eventId && navigate(`/post-event/${entry.eventId}/compliance`)}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 ${entry.eventId ? 'cursor-pointer hover:bg-slate-700' : ''}`}
                            >
                              {entry.eventId ? (
                                <>
                                  <ExternalLink className="w-3 h-3" />
                                  {entry.eventId}
                                </>
                              ) : "Global"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={`${statusClass} border uppercase text-[10px] font-bold tracking-tighter px-2 py-0.5`}>
                              <Icon className="w-3 h-3 mr-1.5" />
                              {entry.action.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-slate-400">
                              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                <User className="w-3 h-3" />
                              </div>
                              <span className="text-xs">
                                {entry.userId ? `User ID: ${entry.userId}` : "System AI"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-2 max-w-md">
                              <Info className="w-3.5 h-3.5 text-slate-600 mt-0.5 flex-shrink-0" />
                              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                {entry.details}
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
              <span>Showing {filtered.length} of {entries.length} audit entries</span>
              <span className="uppercase tracking-widest font-bold">Confidential — For Internal Audit Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
