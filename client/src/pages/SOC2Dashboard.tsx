import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Paperclip,
  Upload,
  Trash2,
  ExternalLink,
  FileDown,
  FileUp,
  Calendar,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_CONFIG = {
  compliant: { label: "Compliant", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle, iconClass: "text-emerald-400" },
  partial: { label: "Partial", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: AlertTriangle, iconClass: "text-amber-400" },
  non_compliant: { label: "Non-Compliant", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle, iconClass: "text-red-400" },
  not_applicable: { label: "N/A", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Shield, iconClass: "text-slate-400" },
};

const FREQ_OPTIONS = ["Continuous", "Monthly", "Quarterly", "Semi-Annual", "Annual"];

// ─── Owner Assignment Dialog ─────────────────────────────────────────────────
function OwnerDialog({ control, onClose }: { control: any; onClose: () => void }) {
  const [ownerName, setOwnerName] = useState(control.ownerName || "");
  const [freq, setFreq] = useState(control.testingFrequency || "Annual");
  const utils = trpc.useUtils();

  const assignMutation = trpc.soc2.assignOwner.useMutation({
    onSuccess: () => {
      utils.soc2.getControls.invalidate();
      utils.soc2.getStats.invalidate();
      utils.soc2.getCategories.invalidate();
      toast.success(`Owner assigned: ${ownerName}`);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Assign Owner — {control.controlId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Owner Name / Role</label>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. CISO, IT Manager, Legal"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Testing Frequency</label>
            <Select value={freq} onValueChange={setFreq}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQ_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => assignMutation.mutate({ id: control.id, ownerName, testingFrequency: freq })}
            disabled={!ownerName.trim() || assignMutation.isPending}
          >
            {assignMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Evidence Upload Panel ────────────────────────────────────────────────────
function EvidencePanel({ controlDbId }: { controlDbId: number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const utils = trpc.useUtils();

  const { data: files = [], isLoading } = trpc.soc2.getEvidenceFiles.useQuery({ controlId: controlDbId });

  const uploadMutation = trpc.soc2.uploadEvidence.useMutation({
    onSuccess: () => {
      utils.soc2.getEvidenceFiles.invalidate({ controlId: controlDbId });
      toast.success("Evidence uploaded");
      setExpiryDate("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.soc2.deleteEvidence.useMutation({
    onSuccess: () => {
      utils.soc2.getEvidenceFiles.invalidate({ controlId: controlDbId });
      toast.success("Evidence removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error("File too large (max 16 MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        controlId: controlDbId,
        fileName: file.name,
        fileBase64: base64,
        mimeType: file.type || "application/octet-stream",
        expiresAt: expiryDate ? new Date(expiryDate).getTime() : undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Paperclip className="w-3 h-3" /> Evidence Files
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="text-xs bg-secondary border border-border rounded px-1.5 py-0.5 text-foreground h-6"
              title="Evidence expiry date (optional)"
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2 gap-1"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.csv,.xlsx"
        />
      </div>
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading...</div>
      ) : files.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">No evidence files attached yet</div>
      ) : (
        <div className="space-y-1">
          {files.map((f: any) => {
            const isExpired = f.expiresAt && f.expiresAt < Date.now();
            const isExpiringSoon = f.expiresAt && f.expiresAt >= Date.now() && f.expiresAt < Date.now() + 30 * 24 * 60 * 60 * 1000;
            return (
            <div key={f.id} className="flex items-center gap-2 text-xs">
              <Paperclip className={`w-3 h-3 flex-shrink-0 ${isExpired ? "text-red-400" : isExpiringSoon ? "text-amber-400" : "text-muted-foreground"}`} />
              <a
                href={f.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate flex-1 flex items-center gap-1"
              >
                {f.fileName} <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
              </a>
              {f.expiresAt && (
                <span className={`flex-shrink-0 flex items-center gap-0.5 ${isExpired ? "text-red-400" : isExpiringSoon ? "text-amber-400" : "text-muted-foreground"}`}>
                  <Calendar className="w-2.5 h-2.5" />
                  {isExpired ? "Exp." : "Exp"} {new Date(f.expiresAt).toLocaleDateString()}
                </span>
              )}
              <span className="text-muted-foreground flex-shrink-0">
                {new Date(f.uploadedAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => deleteMutation.mutate({ evidenceId: f.id })}
                className="text-muted-foreground hover:text-red-400 flex-shrink-0 transition-colors"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Bulk CSV Import Dialog ───────────────────────────────────────────────────
function BulkImportDialog({ onClose }: { onClose: () => void }) {
  const [result, setResult] = useState<{ updated: number; skipped: number; errors: string[]; total: number } | null>(null);
  const utils = trpc.useUtils();

  const importMutation = trpc.soc2.bulkImportCSV.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.soc2.getControls.invalidate();
      utils.soc2.getStats.invalidate();
      utils.soc2.getCategories.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = btoa(reader.result as string);
      importMutation.mutate({ csvBase64: base64 });
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2"><FileUp className="w-4 h-4" /> Bulk Import SOC 2 Statuses</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Upload a CSV with columns: <code className="bg-secondary px-1 rounded">control_id</code>, <code className="bg-secondary px-1 rounded">status</code> (required), and optionally <code className="bg-secondary px-1 rounded">owner_name</code>, <code className="bg-secondary px-1 rounded">notes</code>.
            Valid statuses: <code className="bg-secondary px-1 rounded">compliant</code>, <code className="bg-secondary px-1 rounded">partial</code>, <code className="bg-secondary px-1 rounded">non_compliant</code>, <code className="bg-secondary px-1 rounded">not_applicable</code>.
          </p>
          {!result ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
              <FileUp className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">{importMutation.isPending ? "Processing..." : "Click to select CSV file"}</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={importMutation.isPending} />
            </label>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-500/10 rounded p-2 text-center">
                  <div className="text-lg font-bold text-emerald-400">{result.updated}</div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="bg-amber-500/10 rounded p-2 text-center">
                  <div className="text-lg font-bold text-amber-400">{result.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="bg-secondary rounded p-2 text-center">
                  <div className="text-lg font-bold">{result.total}</div>
                  <div className="text-xs text-muted-foreground">Total Rows</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                  <div className="text-xs font-medium text-red-400 mb-1">Errors ({result.errors.length}):</div>
                  <div className="space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.map((err, i) => <div key={i} className="text-xs text-red-300">{err}</div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>{result ? "Close" : "Cancel"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SOC2Dashboard() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedControl, setExpandedControl] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [ownerDialogControl, setOwnerDialogControl] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const utils = trpc.useUtils();

  const seedMutation = trpc.soc2.seedIfEmpty.useMutation({
    onSuccess: (data) => {
      if (data.seeded) {
        toast.success(`Seeded ${data.count} SOC 2 controls`);
        utils.soc2.getControls.invalidate();
        utils.soc2.getStats.invalidate();
        utils.soc2.getCategories.invalidate();
      }
    },
  });

  const { data: stats } = trpc.soc2.getStats.useQuery();
  const { data: categories } = trpc.soc2.getCategories.useQuery();
  const { data: controls = [], isLoading } = trpc.soc2.getControls.useQuery(undefined, {
    onSuccess: (data) => {
      if (data.length === 0) seedMutation.mutate();
    },
  });

  const updateMutation = trpc.soc2.updateControl.useMutation({
    onSuccess: () => {
      utils.soc2.getControls.invalidate();
      utils.soc2.getStats.invalidate();
      utils.soc2.getCategories.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredControls = filterStatus === "all"
    ? controls
    : controls.filter((c: any) => c.status === filterStatus);

  const groupedByCategory = filteredControls.reduce((acc: Record<string, any[]>, ctrl: any) => {
    if (!acc[ctrl.category]) acc[ctrl.category] = [];
    acc[ctrl.category].push(ctrl);
    return acc;
  }, {});

  const exportMutation = trpc.soc2.exportAuditZip.useMutation({
    onSuccess: (data) => {
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.fileName;
      a.click();
      toast.success(`Audit pack downloaded (${data.controlCount} controls, ${data.evidenceCount} evidence files)`);
    },
    onError: (e) => toast.error(e.message),
  });

  const scoreColor = !stats ? "text-slate-400" : (stats as any).score >= 80 ? "text-emerald-400" : (stats as any).score >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">SOC 2 Compliance</h1>
              <p className="text-sm text-muted-foreground">Trust Services Criteria — Type II Readiness</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkImport(true)}
              className="gap-2"
            >
              <FileUp className="w-3.5 h-3.5" /> Import CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="gap-2"
            >
              {exportMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              Audit Pack
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                utils.soc2.getControls.invalidate();
                utils.soc2.getStats.invalidate();
                utils.soc2.getCategories.invalidate();
              }}
              className="gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Score Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 col-span-2 md:col-span-1 flex flex-col items-center justify-center bg-card border-border">
              <div className={`text-4xl font-bold ${scoreColor}`}>{(stats as any).score}%</div>
              <div className="text-xs text-muted-foreground mt-1">Readiness Score</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-2xl font-bold text-emerald-400">{(stats as any).compliant}</div>
              <div className="text-xs text-muted-foreground">Compliant</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-2xl font-bold text-amber-400">{(stats as any).partial}</div>
              <div className="text-xs text-muted-foreground">Partial</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-2xl font-bold text-red-400">{(stats as any).nonCompliant}</div>
              <div className="text-xs text-muted-foreground">Non-Compliant</div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="text-2xl font-bold text-slate-400">{(stats as any).total}</div>
              <div className="text-xs text-muted-foreground">Total Controls</div>
            </Card>
          </div>
        )}

        {/* Category Progress */}
        {categories && (categories as any[]).length > 0 && (
          <Card className="p-4 bg-card border-border">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Category Breakdown</h2>
            <div className="space-y-2">
              {(categories as any[]).map((cat: any) => {
                const pct = cat.total > 0 ? Math.round(((cat.compliant + cat.partial * 0.5) / cat.total) * 100) : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <div className="w-44 text-xs text-muted-foreground truncate">{cat.category}</div>
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground w-10 text-right">{pct}%</div>
                    <div className="text-xs text-muted-foreground w-16 text-right">{cat.compliant}/{cat.total}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "compliant", "partial", "non_compliant"].map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(s)}
            >
              {s === "all" ? "All" : s === "non_compliant" ? "Non-Compliant" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>

        {/* Controls by Category */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading controls...</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedByCategory).map(([category, catControls]) => {
              const isExpanded = expandedCategory === category;
              return (
                <Card key={category} className="bg-card border-border overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{category}</span>
                      <div className="flex gap-1">
                        {catControls.filter((c) => c.status === "compliant").length > 0 && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                            {catControls.filter((c) => c.status === "compliant").length} ✓
                          </span>
                        )}
                        {catControls.filter((c) => c.status === "partial").length > 0 && (
                          <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                            {catControls.filter((c) => c.status === "partial").length} ~
                          </span>
                        )}
                        {catControls.filter((c) => c.status === "non_compliant").length > 0 && (
                          <span className="text-xs bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">
                            {catControls.filter((c) => c.status === "non_compliant").length} ✗
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border divide-y divide-border">
                      {catControls.map((ctrl: any) => {
                        const cfg = STATUS_CONFIG[ctrl.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.non_compliant;
                        const Icon = cfg.icon;
                        const isCtrlExpanded = expandedControl === ctrl.id;
                        return (
                          <div key={ctrl.id} className="p-4">
                            <div className="flex items-start gap-4">
                              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.iconClass}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono text-muted-foreground">{ctrl.controlId}</span>
                                  <span className="text-sm font-medium">{ctrl.name}</span>
                                </div>
                                {ctrl.description && (
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ctrl.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {ctrl.ownerName && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <User className="w-3 h-3" /> {ctrl.ownerName}
                                    </span>
                                  )}
                                  {ctrl.testingFrequency && (
                                    <span className="text-xs text-muted-foreground">Testing: {ctrl.testingFrequency}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={`text-xs border ${cfg.color}`}>{cfg.label}</Badge>
                                <select
                                  className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground"
                                  value={ctrl.status}
                                  onChange={(e) =>
                                    updateMutation.mutate({
                                      id: ctrl.id,
                                      status: e.target.value as "compliant" | "partial" | "non_compliant" | "not_applicable",
                                    })
                                  }
                                >
                                  <option value="compliant">Compliant</option>
                                  <option value="partial">Partial</option>
                                  <option value="non_compliant">Non-Compliant</option>
                                  <option value="not_applicable">N/A</option>
                                </select>
                                {/* Assign Owner button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 gap-1"
                                  onClick={() => setOwnerDialogControl(ctrl)}
                                >
                                  <User className="w-3 h-3" />
                                  {ctrl.ownerName ? "Reassign" : "Assign Owner"}
                                </Button>
                                {/* Evidence toggle */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2 gap-1"
                                  onClick={() => setExpandedControl(isCtrlExpanded ? null : ctrl.id)}
                                >
                                  <Paperclip className="w-3 h-3" />
                                  Evidence
                                </Button>
                              </div>
                            </div>
                            {/* Evidence panel */}
                            {isCtrlExpanded && <EvidencePanel controlDbId={ctrl.id} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Owner Assignment Dialog */}
      {ownerDialogControl && (
        <OwnerDialog control={ownerDialogControl} onClose={() => setOwnerDialogControl(null)} />
      )}
      {/* Bulk Import Dialog */}
      {showBulkImport && (
        <BulkImportDialog onClose={() => setShowBulkImport(false)} />
      )}
    </div>
  );
}
