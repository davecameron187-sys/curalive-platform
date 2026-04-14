import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useSmartBack } from "@/lib/useSmartBack";
import {
  ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle,
  BarChart2, Shield, Users, Database, ChevronRight, Clock,
  Download, Mic, ChevronDown, RotateCw,
} from "lucide-react";

const EVENT_TYPES = [
  { value: "earnings_call", label: "Earnings Call", group: "Investor Relations" },
  { value: "interim_results", label: "Interim Results Presentation", group: "Investor Relations" },
  { value: "capital_markets_day", label: "Capital Markets Day", group: "Investor Relations" },
  { value: "investor_day", label: "Investor Day", group: "Investor Relations" },
  { value: "roadshow", label: "Roadshow", group: "Investor Relations" },
  { value: "special_call", label: "Special / Ad-hoc Call", group: "Investor Relations" },
  { value: "agm", label: "AGM / Annual General Meeting", group: "Governance" },
  { value: "board_meeting", label: "Board Meeting", group: "Governance" },
  { value: "webcast", label: "Webcast (General)", group: "Webcast" },
  { value: "partner_webcast", label: "Partner Event Webcast", group: "Webcast" },
  { value: "results_webcast", label: "Results Presentation Webcast", group: "Webcast" },
  { value: "product_launch_webcast", label: "Product Launch Webcast", group: "Webcast" },
  { value: "thought_leadership_webcast", label: "Thought Leadership Webcast", group: "Webcast" },
  { value: "hybrid_webcast", label: "Hybrid Event Webcast", group: "Webcast" },
  { value: "ceo_town_hall", label: "CEO Town Hall", group: "Other" },
  { value: "other", label: "Other", group: "Other" },
];

const PLATFORMS = [
  "CuraLive Webcast", "Zoom", "Microsoft Teams", "Google Meet", "Webex",
  "Lumi Global", "BrightTALK", "ON24", "Vimeo", "In-Person", "Hybrid", "Other",
];

type ProcessResult = {
  archiveId: number;
  eventId: string;
  eventTitle: string;
  wordCount: number;
  segmentCount: number;
  sentimentAvg: number;
  complianceFlags: number;
  metricsGenerated: number;
  specialisedAlgorithmsRun?: number;
  specialisedSessionType?: string;
  message: string;
};

export default function ArchiveUpload() {
  const goBack = useSmartBack("/operator-links");

  const [clientName, setClientName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<string>("");
  const [eventDate, setEventDate] = useState("");
  const [platform, setPlatform] = useState("");
  const [notes, setNotes] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [inputMode, setInputMode] = useState<"paste" | "file">("paste");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [expandedArchiveId, setExpandedArchiveId] = useState<number | null>(null);

  const processTranscript = trpc.archiveUpload.processTranscript.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success(data.message);
    },
    onError: (err) => {
      toast.error(err.message ?? "Processing failed. Please try again.");
    },
  });

  const { data: archives, refetch } = trpc.archiveUpload.listArchives.useQuery();

  const retryTranscription = trpc.archiveUpload.retryTranscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message ?? "Retry failed. Please try again later.");
    },
  });

  const archiveDetail = trpc.archiveUpload.getArchiveDetail.useQuery(
    { archiveId: expandedArchiveId ?? 0 },
    { enabled: expandedArchiveId != null }
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTranscriptText((ev.target?.result as string) ?? "");
    };
    reader.readAsText(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !eventName.trim() || !eventType || !transcriptText.trim()) {
      toast.error("Please fill in Client Name, Event Name, Event Type, and the transcript.");
      return;
    }
    processTranscript.mutate({
      clientName: clientName.trim(),
      eventName: eventName.trim(),
      eventType: eventType as any,
      eventDate: eventDate || undefined,
      platform: platform || undefined,
      transcriptText: transcriptText.trim(),
      notes: notes || undefined,
    });
  }

  function handleReset() {
    setResult(null);
    setClientName("");
    setEventName("");
    setEventType("");
    setEventDate("");
    setPlatform("");
    setNotes("");
    setTranscriptText("");
    setFileName(null);
    refetch();
  }

  const wordCount = transcriptText.trim().split(/\s+/).filter(Boolean).length;
  const isWebcastType = ["webcast", "partner_webcast", "product_launch_webcast", "thought_leadership_webcast", "results_webcast", "hybrid_webcast"].includes(eventType);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Operator Links
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Archive Upload</h1>
              <p className="text-muted-foreground text-sm">
                Process historical event transcripts to retroactively build your intelligence database
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground bg-muted/30 border border-border rounded-lg px-4 py-3">
            Upload any past event transcript — webcasts, partner events, earnings calls, AGMs, town halls. CuraLive
            runs full AI intelligence including sentiment scoring, compliance scanning, and specialized algorithms
            based on event type. Webcast uploads get 6 additional algorithms: presentation effectiveness, key message
            extraction, speaker performance, content pack generation, audience engagement, and executive reporting.
          </p>
        </div>

        {result ? (
          /* ── Results Panel ── */
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div>
                  <h2 className="font-semibold text-lg">Archive Processed Successfully</h2>
                  <p className="text-sm text-muted-foreground">{result.eventTitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/30 rounded-lg p-4 text-center border border-border">
                  <div className="text-2xl font-bold text-primary mb-1">{result.wordCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Words Processed</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center border border-border">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{result.segmentCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Segments</div>
                </div>
                <div className={`rounded-lg p-4 text-center border ${
                  result.sentimentAvg >= 70 ? "bg-green-500/10 border-green-500/20" :
                  result.sentimentAvg >= 50 ? "bg-yellow-500/10 border-yellow-500/20" :
                  "bg-red-500/10 border-red-500/20"
                }`}>
                  <div className={`text-2xl font-bold mb-1 ${
                    result.sentimentAvg >= 70 ? "text-green-400" :
                    result.sentimentAvg >= 50 ? "text-yellow-400" : "text-red-400"
                  }`}>{result.sentimentAvg}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Sentiment Score</div>
                </div>
                <div className={`rounded-lg p-4 text-center border ${
                  result.complianceFlags > 3 ? "bg-red-500/10 border-red-500/20" :
                  result.complianceFlags > 1 ? "bg-yellow-500/10 border-yellow-500/20" :
                  "bg-green-500/10 border-green-500/20"
                }`}>
                  <div className={`text-2xl font-bold mb-1 ${
                    result.complianceFlags > 3 ? "text-red-400" :
                    result.complianceFlags > 1 ? "text-yellow-400" : "text-green-400"
                  }`}>{result.complianceFlags}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Compliance Flags</div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">
                    {result.metricsGenerated} Intelligence Records Added
                    {result.specialisedAlgorithmsRun && result.specialisedAlgorithmsRun > 0
                      ? ` + ${result.specialisedAlgorithmsRun} ${result.specialisedSessionType === "webcast" ? "Webcast Intelligence" : result.specialisedSessionType === "bastion" ? "Investor" : "Governance"} Algorithms`
                      : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {[
                    { icon: BarChart2, label: "Sentiment score tagged" },
                    { icon: Users, label: "Engagement score tagged" },
                    { icon: Shield, label: "Compliance risk tagged" },
                    { icon: CheckCircle, label: "Archive session confirmed" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="h-3 w-3 text-primary" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                {result.specialisedSessionType === "webcast" && result.specialisedAlgorithmsRun && result.specialisedAlgorithmsRun > 0 && (
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <p className="text-xs font-medium text-primary mb-2">Webcast Intelligence Generated:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                      {[
                        "Presentation Effectiveness Score",
                        "Key Messages & Guidance Extracted",
                        "Speaker Performance Analysis",
                        "Content Pack (Social, Press, Newsletter)",
                        "Audience Engagement Assessment",
                        "Executive Webcast Report",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/tagged-metrics"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <Database className="h-4 w-4" />
                  View Tagged Metrics Dashboard
                  <ChevronRight className="h-4 w-4" />
                </a>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Another Archive
                </button>
              </div>
            </div>

            {/* Previous archives list */}
            {archives && archives.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  All Uploaded Archives ({archives.length})
                </h3>
                <div className="space-y-3">
                  {archives.map((a) => {
                    const isExpanded = expandedArchiveId === a.id;
                    const detail = isExpanded ? archiveDetail.data : null;
                    return (
                      <div key={a.id} className="border-b border-border last:border-0">
                        <button
                          type="button"
                          onClick={() => setExpandedArchiveId(isExpanded ? null : a.id)}
                          className="flex items-center justify-between py-3 w-full text-left hover:bg-muted/30 transition-colors rounded-lg px-2 -mx-2"
                        >
                          <div>
                            <div className="font-medium text-sm">{a.client_name} — {a.event_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {a.event_date ?? "Date not specified"} &nbsp;·&nbsp;
                              {a.word_count.toLocaleString()} words &nbsp;·&nbsp;
                              {a.tagged_metrics_generated} records
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              a.status === "completed"
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}>
                              {a.status}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="pb-3 px-2 -mx-2">
                            {archiveDetail.isLoading ? (
                              <div className="text-xs text-muted-foreground py-2">Loading details...</div>
                            ) : detail ? (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {detail.has_transcript && (
                                  <a
                                    href={`/api/archives/${a.id}/transcript`}
                                    download
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                                  >
                                    <FileText className="h-4 w-4" />
                                    Download Transcript
                                  </a>
                                )}
                                {detail.has_recording && (
                                  <a
                                    href={`/api/archives/${a.id}/recording`}
                                    download
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                  >
                                    <Mic className="h-4 w-4" />
                                    Download Recording
                                  </a>
                                )}
                                {!detail.has_transcript && !detail.has_recording && (
                                  <div className="text-xs text-muted-foreground py-1">No transcript or recording available for this archive.</div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Upload Form ── */
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Event Details */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Event Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Client Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Anglo American Platinum"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Event Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Q4 2024 Earnings Call"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Event Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">Select type...</option>
                    {["Webcast", "Investor Relations", "Governance", "Other"].map((group) => (
                      <optgroup key={group} label={group}>
                        {EVENT_TYPES.filter((t) => t.group === group).map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select platform...</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any context about this archive..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Transcript Input */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-4">
                Transcript <span className="text-destructive">*</span>
              </h2>

              {/* Input mode toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMode === "paste"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMode === "file"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Upload .txt File
                </button>
              </div>

              {inputMode === "paste" ? (
                <div>
                  <textarea
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    placeholder="Paste the full event transcript here. Can include speaker labels, timestamps, Q&A sections — paste it as-is."
                    rows={16}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                    required
                  />
                  {transcriptText && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {wordCount.toLocaleString()} words detected
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    {fileName ? (
                      <div>
                        <p className="font-medium text-sm">{fileName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {wordCount.toLocaleString()} words loaded
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-sm mb-1">Click to upload a .txt file</p>
                        <p className="text-xs text-muted-foreground">
                          Plain text transcripts only. Maximum 500,000 characters.
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {transcriptText && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground font-mono line-clamp-3">
                        {transcriptText.slice(0, 300)}...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* What happens next */}
            <div className="bg-muted/20 border border-border rounded-xl p-5">
              <p className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide text-xs">
                What CuraLive will do with this transcript
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: BarChart2, label: "Score sentiment", desc: "AI scores 0–100" },
                  { icon: Users, label: "Measure engagement", desc: "Segment & word count" },
                  { icon: Shield, label: "Scan compliance", desc: "10 keyword checks" },
                  { icon: Database, label: "Tag 4 records", desc: "Added to database" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="text-center">
                    <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              {isWebcastType && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide mb-3">
                    + Webcast Intelligence Algorithms
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      "Presentation Effectiveness",
                      "Key Message Extraction",
                      "Speaker Performance",
                      "Content Pack Generation",
                      "Audience Engagement",
                      "Executive Report",
                    ].map((algo) => (
                      <div key={algo} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                        <span>{algo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={processTranscript.isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processTranscript.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing archive...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Process Archive &amp; Generate Intelligence
                </>
              )}
            </button>

            {/* Previous archives */}
            {archives && archives.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Previously Uploaded Archives ({archives.length})
                </h3>
                <div className="space-y-3">
                  {archives.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <div>
                        <div className="font-medium text-sm">{a.client_name} — {a.event_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.event_date ?? "No date"} &nbsp;·&nbsp;
                          {a.word_count.toLocaleString()} words &nbsp;·&nbsp;
                          {a.tagged_metrics_generated} intelligence records
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.status === "recording_saved" && (
                          <button
                            type="button"
                            onClick={() => retryTranscription.mutate({ archiveId: a.id })}
                            disabled={retryTranscription.isPending}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                          >
                            <RotateCw className={`h-3 w-3 ${retryTranscription.isPending ? "animate-spin" : ""}`} />
                            Retry
                          </button>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          a.status === "completed"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : a.status === "recording_saved"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}>
                          {a.status === "recording_saved" ? "awaiting transcription" : a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
