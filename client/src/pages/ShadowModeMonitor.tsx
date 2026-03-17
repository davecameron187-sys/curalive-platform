import { useEffect, useState, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, X, Play, Square, Copy, AlertCircle, TrendingUp, Zap, Users, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
  sentiment?: number;
}

export default function ShadowModeMonitor() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/shadow-mode/:sessionId');
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : null;

  const [session, setSession] = useState<any>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Fetch session details
  const { data: sessionData, isLoading, refetch } = trpc.shadowMode.getSession.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId, refetchInterval: 2000 }
  );

  // End session mutation
  const endSession = trpc.shadowMode.endSession.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      navigate('/shadow-mode');
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      if (sessionData.transcriptSegments) {
        setTranscript(sessionData.transcriptSegments);
      }
    }
  }, [sessionData]);

  // Auto-scroll to bottom when new transcript segments arrive
  useEffect(() => {
    if (isAutoScroll && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, isAutoScroll]);

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-indigo-500 animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Session Not Found</h2>
          <p className="text-muted-foreground mb-6">The shadow session you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/shadow-mode')}>Back to Shadow Mode</Button>
        </Card>
      </div>
    );
  }

  const isLive = session.status === 'live' || session.status === 'bot_joining';
  const avgSentiment = transcript.length > 0
    ? Math.round(transcript.reduce((sum, s) => sum + (s.sentiment || 0), 0) / transcript.length)
    : 0;

  const getSentimentColor = (sentiment?: number) => {
    if (!sentiment) return 'text-gray-500';
    if (sentiment >= 70) return 'text-green-500';
    if (sentiment >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'bot_joining':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50';
      case 'completed':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
      case 'failed':
        return 'bg-red-500/20 text-red-700 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/shadow-mode')}
            >
              <X className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{session.eventName}</h1>
                <Badge className={`${getStatusColor(session.status)} border`}>
                  {session.status === 'live' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />}
                  {session.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{session.clientName}</p>
            </div>
          </div>

          {isLive && (
            <Button
              onClick={() => endSession.mutate({ sessionId: session.id })}
              variant="destructive"
              className="gap-2"
              disabled={endSession.isPending}
            >
              <Square className="w-4 h-4" />
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcript */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Live Transcript
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoScroll(!isAutoScroll)}
              >
                {isAutoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
              </Button>
            </div>

            {/* Transcript Content */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
              {transcript.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Waiting for transcript segments...</p>
                  </div>
                </div>
              ) : (
                transcript.map((segment, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{segment.speaker}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(segment.timestamp * 1000).toLocaleTimeString()}
                        </span>
                        {segment.sentiment && (
                          <span className={`text-xs font-medium ${getSentimentColor(segment.sentiment)}`}>
                            {segment.sentiment}%
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{segment.text}</p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Copy Button */}
            {transcript.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  const text = transcript.map(s => `${s.speaker}: ${s.text}`).join('\n');
                  navigator.clipboard.writeText(text);
                  toast.success('Transcript copied to clipboard');
                }}
              >
                <Copy className="w-4 h-4" />
                Copy Transcript
              </Button>
            )}
          </Card>
        </div>

        {/* Sidebar Metrics */}
        <div className="space-y-4">
          {/* Session Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Session Info
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Platform</p>
                <p className="font-medium capitalize">{session.platform}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Event Type</p>
                <p className="font-medium capitalize">{session.eventType.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Started</p>
                <p className="font-medium">{new Date(session.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {/* Metrics */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Metrics
            </h3>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Transcript Segments</p>
                <p className="text-2xl font-bold">{transcript.length}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Avg Sentiment</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${getSentimentColor(avgSentiment)}`}>{avgSentiment}%</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="text-2xl font-bold">
                  {session.duration || (isLive ? 'Live' : '—')}
                </p>
              </div>
            </div>
          </Card>

          {/* Bot Status */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Bot Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Connection</span>
                <Badge variant="outline" className={isLive ? 'bg-green-500/20' : 'bg-gray-500/20'}>
                  {isLive ? 'Connected' : 'Idle'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recording</span>
                <Badge variant="outline" className={isLive ? 'bg-red-500/20' : 'bg-gray-500/20'}>
                  {isLive ? 'Recording' : 'Stopped'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-medium">&lt; 500ms</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          {!isLive && (
            <Button
              onClick={() => navigate('/shadow-mode')}
              className="w-full"
              variant="outline"
            >
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
