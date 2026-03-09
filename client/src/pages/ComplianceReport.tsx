import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ShieldCheck, ArrowLeft, AlertTriangle, CheckCircle2, Clock,
  FileText, Loader2, Search, RefreshCw, Download, Info, ShieldAlert,
  CheckCircle, XCircle, AlertCircle, ChevronRight, FileDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RISK_COLORS: Record<string, string> = {
  low: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-red-500/15 text-red-300 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  flagged: "bg-red-500/10 text-red-300",
  reviewed: "bg-amber-500/10 text-amber-300",
  approved: "bg-emerald-500/10 text-emerald-300",
  disclosed: "bg-slate-500/10 text-slate-400",
};

const STATUS_ICONS: Record<string, any> = {
  flagged: AlertTriangle,
  reviewed: Clock,
  approved: CheckCircle2,
  disclosed: FileText,
};

export default function ComplianceReport() {
  const { id: eventId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<any>(null);

  const { data: flags, refetch } = trpc.compliance.getFlaggedStatements.useQuery(
    { eventId: eventId ?? "" },
    { enabled: !!eventId }
  );

  const scanTranscript = trpc.compliance.scanTranscript.useMutation({
    onMutate: () => setGenerating(true),
    onSuccess: (data) => {
      toast.success(`${data.flaggedCount} statements flagged for review`);
      refetch();
      setGenerating(false);
    },
    onError: (e) => { toast.error(e.message); setGenerating(false); },
  });

  const reviewStatement = trpc.compliance.reviewStatement.useMutation({
    onSuccess: () => { 
      toast.success("Marked as reviewed"); 
      refetch();
      setSelectedFlag(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const approveStatement = trpc.compliance.approveStatement.useMutation({
    onSuccess: () => { 
      toast.success("Statement approved"); 
      refetch();
      setSelectedFlag(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectStatement = trpc.compliance.rejectStatement.useMutation({
    onSuccess: () => {
      toast.success("Statement marked as disclosed/handled");
      refetch();
      setSelectedFlag(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const generateCert = trpc.compliance.generateComplianceCertificate.useMutation({
    onSuccess: (data) => {
      const certJson = JSON.stringify(data.certificate, null, 2);
      const blob = new Blob([certJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-certificate-${eventId}.json`;
      a.click();
      toast.success("Compliance Certificate generated and downloaded");
    },
    onError: (e) => toast.error(e.message),
  });

  const allFlags = flags ?? [];
  const filtered = allFlags.filter(f => {
    const matchSearch = !search || f.statementText.toLowerCase().includes(search.toLowerCase()) || (f.speakerName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRisk = filterRisk === "all" || f.riskLevel === filterRisk;
    const matchStatus = filterStatus === "all" || f.complianceStatus === filterStatus;
    return matchSearch && matchRisk && matchStatus;
  });

  const stats = {
    total: allFlags.length,
    high: allFlags.filter(f => f.riskLevel === "high").length,
    medium: allFlags.filter(f => f.riskLevel === "medium").length,
    low: allFlags.filter(f => f.riskLevel === "low").length,
    approved: allFlags.filter(f => f.complianceStatus === "approved").length,
    pending: allFlags.filter(f => f.complianceStatus === "flagged").length,
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0d14]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/post-event/${eventId}`)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Compliance Review</h1>
            <p className="text-xs text-slate-400">Event: {eventId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allFlags.length > 0 && (
            <Button
              onClick={() => generateCert.mutate({ eventId: eventId ?? "", eventTitle: eventId })}
              disabled={generateCert.isPending}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {generateCert.isPending ? "Generating..." : "Generate Certificate"}
            </Button>
          )}
          <Button
            onClick={() => scanTranscript.mutate({ eventId: eventId ?? "" })}
            disabled={generating}
            size="sm"
            className="bg-red-700/60 hover:bg-red-700 border border-red-600/40 text-red-200"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {generating ? "Scanning..." : "Scan Transcript"}
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Compliance Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <p className="text-[10px] text-slate-500 mt-1">Identified by AI Scan</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.high}</div>
              <p className="text-[10px] text-slate-500 mt-1">Requires Immediate Action</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
              <p className="text-[10px] text-slate-500 mt-1">Awaiting Compliance Officer</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">{stats.approved}</div>
              <p className="text-[10px] text-slate-500 mt-1">Cleared Statements</p>
            </CardContent>
          </Card>
        </div>

        {allFlags.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-16 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No statements scanned yet</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-6">Use the AI-powered scanner to identify potentially non-compliant statements, forward-looking guidance, or material omissions from the transcript.</p>
            <Button
              onClick={() => scanTranscript.mutate({ eventId: eventId ?? "" })}
              disabled={generating}
              className="bg-red-700/60 hover:bg-red-700 border border-red-600/40 text-red-100"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              {generating ? "Scanning Transcript..." : "Run Compliance Scan"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
              <h2 className="text-lg font-semibold text-white">Flagged Statements</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="bg-slate-900 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                </div>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                >
                  <option value="all">All Risk</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="flagged">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="disclosed">Handled</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 text-slate-400 font-medium">
                      <th className="px-4 py-3 border-b border-slate-700">Timestamp</th>
                      <th className="px-4 py-3 border-b border-slate-700">Speaker</th>
                      <th className="px-4 py-3 border-b border-slate-700 w-1/3">Statement</th>
                      <th className="px-4 py-3 border-b border-slate-700">Risk Level</th>
                      <th className="px-4 py-3 border-b border-slate-700">Status</th>
                      <th className="px-4 py-3 border-b border-slate-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filtered.map((flag) => {
                      const StatusIcon = STATUS_ICONS[flag.complianceStatus] ?? AlertTriangle;
                      return (
                        <tr key={flag.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-4 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                            {flag.timestamp || "—"}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-700">
                                {flag.speakerName?.substring(0, 2).toUpperCase() || "UN"}
                              </div>
                              <span className="text-slate-300 font-medium">{flag.speakerName || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="line-clamp-2 text-slate-300 italic">"{flag.statementText}"</p>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className={`${RISK_COLORS[flag.riskLevel]} border uppercase text-[10px] font-bold tracking-tighter`}>
                              {flag.riskLevel}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className={`flex items-center gap-1.5 text-xs font-semibold ${STATUS_COLORS[flag.complianceStatus]}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span className="capitalize">{flag.complianceStatus}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFlag(flag)}
                              className="text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                              Review
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="p-12 text-center">
                  <ShieldCheck className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-20" />
                  <p className="text-slate-500 text-sm">No statements matching your current filters</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
        <DialogContent className="sm:max-w-[650px] bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Statement Compliance Review
            </DialogTitle>
          </DialogHeader>
          
          {selectedFlag && (
            <div className="space-y-6 py-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                   <Badge variant="outline" className={`${RISK_COLORS[selectedFlag.riskLevel]} border uppercase text-[10px]`}>
                    {selectedFlag.riskLevel} Risk
                  </Badge>
                </div>
                <p className="text-base italic text-slate-200 leading-relaxed pr-10">
                  "{selectedFlag.statementText}"
                </p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800/50 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                      {selectedFlag.speakerName?.substring(0, 2).toUpperCase() || "UN"}
                    </div>
                    {selectedFlag.speakerName || "Unknown Speaker"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedFlag.timestamp || "No Timestamp"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> AI Risk Analysis
                  </label>
                  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 text-xs text-slate-300 leading-relaxed h-full">
                    {selectedFlag.flagReason || "This statement contains forward-looking financial information that may require a safe harbour disclaimer to remain compliant with JSE listing requirements."}
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Recommended Action
                  </label>
                  <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/20 text-xs text-amber-200/80 leading-relaxed h-full">
                    <p className="font-semibold text-amber-400 mb-1">Compliance Check Required</p>
                    Ensure this statement was accompanied by the standard cautionary announcement and verify against the approved script.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                   <FileText className="w-4 h-4 text-slate-500" />
                   <div>
                     <p className="text-[10px] text-slate-500 uppercase font-bold">Regulation Reference</p>
                     <p className="text-xs text-slate-300">JSE Listing Requirements, Section 3.4(b) - Forecasts</p>
                   </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[10px] h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                  View Regulation
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              {selectedFlag?.complianceStatus === "flagged" && (
                <Button 
                  className="bg-amber-600 hover:bg-amber-700 text-white border-none flex-1"
                  onClick={() => reviewStatement.mutate({ flagId: selectedFlag.id })}
                >
                  <Clock className="w-4 h-4 mr-2" /> Mark Reviewed
                </Button>
              )}
              {selectedFlag?.complianceStatus === "reviewed" && (
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex-1"
                  onClick={() => approveStatement.mutate({ flagId: selectedFlag.id })}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve Statement
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                onClick={() => setSelectedFlag(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                className="bg-red-900/40 hover:bg-red-900 text-red-200 border-red-900/50"
                onClick={() => rejectStatement.mutate({ flagId: selectedFlag.id })}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject/Disclose
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
