import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import TranscriptViewer from "@/components/TranscriptViewer";
import DashboardLayout from "@/components/DashboardLayout";
import { FileText, Download, Share2, Printer, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function TranscriptPage() {
  const { id } = useParams<{ id: string }>();

  const { data: transcriptData } = trpc.transcription.getTranscript.useQuery({ eventId: id || "" });

  const handleExport = async (format: 'txt' | 'srt' | 'vtt' | 'json') => {
    if (!id) return;
    try {
      const response = await fetch(`/api/trpc/transcription.exportTranscript?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { eventId: id, format } }))}`);
      const data = await response.json();
      const content = data[0].result.data.content;
      const contentType = data[0].result.data.contentType;
      
      const blob = new Blob([content], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export transcript. Please try again.");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-4">
            <Link href={`/post-event/${id}`}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-0.5">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Post-Event Assets</span>
              </div>
              <h1 className="text-xl font-bold text-white leading-none">Full Event Transcript</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <div className="h-6 w-px bg-slate-800 mx-1" />
            <select 
              onChange={(e) => handleExport(e.target.value as any)}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium px-3 py-2 rounded-md focus:outline-none cursor-pointer appearance-none"
              defaultValue=""
            >
              <option value="" disabled>Download...</option>
              <option value="txt" className="bg-slate-800">TXT Format</option>
              <option value="srt" className="bg-slate-800">SRT (Subtitles)</option>
              <option value="vtt" className="bg-slate-800">VTT (Web)</option>
              <option value="json" className="bg-slate-800">JSON Data</option>
            </select>
          </div>
        </div>

        {/* Transcript Container */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-950">
          <TranscriptViewer 
            eventId={id || ""} 
            className="h-full border-none shadow-2xl shadow-black/50" 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
