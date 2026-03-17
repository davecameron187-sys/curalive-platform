import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Filter, Search, TrendingUp, Calendar, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface SessionAnalytics {
  id: number;
  eventName: string;
  clientName: string;
  platform: string;
  eventType: string;
  status: string;
  createdAt: Date;
  duration?: number;
  sentimentAvg?: number;
  transcriptSegments?: number;
  taggedMetricsGenerated?: number;
}

export default function ShadowModeHistory() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'zoom' | 'teams' | 'webex' | 'meet'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('month');

  // Fetch completed sessions
  const { data: sessions = [], isLoading } = trpc.shadowMode.listSessions.useQuery();

  // Filter and process data
  const filteredSessions = useMemo(() => {
    let filtered = (sessions as SessionAnalytics[]).filter(s => s.status === 'completed');

    // Platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(s => s.platform === platformFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.eventName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    const now = new Date();
    const filterDate = new Date();
    switch (dateRange) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    if (dateRange !== 'all') {
      filtered = filtered.filter(s => new Date(s.createdAt) >= filterDate);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sessions, searchTerm, platformFilter, dateRange]);

  // Analytics data
  const analytics = useMemo(() => {
    if (filteredSessions.length === 0) {
      return {
        totalSessions: 0,
        avgSentiment: 0,
        totalSegments: 0,
        avgDuration: 0,
        sentimentTrend: [],
        platformDistribution: [],
      };
    }

    const totalSessions = filteredSessions.length;
    const avgSentiment = Math.round(
      filteredSessions.reduce((sum, s) => sum + (s.sentimentAvg || 0), 0) / totalSessions
    );
    const totalSegments = filteredSessions.reduce((sum, s) => sum + (s.transcriptSegments || 0), 0);
    const avgDuration = Math.round(
      filteredSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions
    );

    // Sentiment trend by date
    const sentimentByDate: Record<string, { sentiment: number; count: number }> = {};
    filteredSessions.forEach(s => {
      const date = new Date(s.createdAt).toLocaleDateString();
      if (!sentimentByDate[date]) {
        sentimentByDate[date] = { sentiment: 0, count: 0 };
      }
      sentimentByDate[date].sentiment += s.sentimentAvg || 0;
      sentimentByDate[date].count += 1;
    });

    const sentimentTrend = Object.entries(sentimentByDate)
      .map(([date, data]) => ({
        date,
        sentiment: Math.round(data.sentiment / data.count),
      }))
      .slice(-30); // Last 30 days

    // Platform distribution
    const platformCounts: Record<string, number> = {};
    filteredSessions.forEach(s => {
      platformCounts[s.platform] = (platformCounts[s.platform] || 0) + 1;
    });

    const platformDistribution = Object.entries(platformCounts).map(([platform, count]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      count,
    }));

    return {
      totalSessions,
      avgSentiment,
      totalSegments,
      avgDuration,
      sentimentTrend,
      platformDistribution,
    };
  }, [filteredSessions]);

  const handleExport = () => {
    const csv = [
      ['Event Name', 'Client', 'Platform', 'Type', 'Date', 'Duration (min)', 'Avg Sentiment', 'Segments', 'Metrics Generated'],
      ...filteredSessions.map(s => [
        s.eventName,
        s.clientName,
        s.platform,
        s.eventType,
        new Date(s.createdAt).toLocaleDateString(),
        s.duration || '—',
        s.sentimentAvg || '—',
        s.transcriptSegments || '—',
        s.taggedMetricsGenerated || '—',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow-mode-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('History exported as CSV');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/shadow-mode')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Session History</h1>
                <p className="text-sm text-muted-foreground">Analyze completed shadow sessions</p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2"
              disabled={filteredSessions.length === 0}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={platformFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setPlatformFilter('all')}
                size="sm"
              >
                All Platforms
              </Button>
              <Button
                variant={platformFilter === 'zoom' ? 'default' : 'outline'}
                onClick={() => setPlatformFilter('zoom')}
                size="sm"
              >
                Zoom
              </Button>
              <Button
                variant={platformFilter === 'teams' ? 'default' : 'outline'}
                onClick={() => setPlatformFilter('teams')}
                size="sm"
              >
                Teams
              </Button>
              <Button
                variant={platformFilter === 'webex' ? 'default' : 'outline'}
                onClick={() => setPlatformFilter('webex')}
                size="sm"
              >
                Webex
              </Button>
            </div>
            <div className="flex gap-2">
              {(['all', 'week', 'month', 'year'] as const).map(range => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'default' : 'outline'}
                  onClick={() => setDateRange(range)}
                  size="sm"
                >
                  {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Total Sessions</p>
            <p className="text-3xl font-bold">{analytics.totalSessions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Avg Sentiment</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{analytics.avgSentiment}%</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Total Segments</p>
            <p className="text-3xl font-bold">{analytics.totalSegments}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Avg Duration</p>
            <p className="text-3xl font-bold">{analytics.avgDuration}m</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sentiment Trend */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Sentiment Trend</h3>
            {analytics.sentimentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.sentimentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sentiment"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </Card>

          {/* Platform Distribution */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Platform Distribution</h3>
            {analytics.platformDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.platformDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="platform" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Completed Sessions ({filteredSessions.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              <p>Loading sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No completed sessions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Event</th>
                    <th className="px-6 py-3 text-left font-medium">Client</th>
                    <th className="px-6 py-3 text-left font-medium">Platform</th>
                    <th className="px-6 py-3 text-left font-medium">Date</th>
                    <th className="px-6 py-3 text-left font-medium">Duration</th>
                    <th className="px-6 py-3 text-left font-medium">Sentiment</th>
                    <th className="px-6 py-3 text-left font-medium">Segments</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/shadow-mode/${session.id}`)}
                    >
                      <td className="px-6 py-4 font-medium">{session.eventName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{session.clientName}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="capitalize">
                          {session.platform}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{session.duration || '—'}m</td>
                      <td className="px-6 py-4">
                        <span className={session.sentimentAvg && session.sentimentAvg >= 70 ? 'text-green-500' : session.sentimentAvg && session.sentimentAvg >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                          {session.sentimentAvg || '—'}%
                        </span>
                      </td>
                      <td className="px-6 py-4">{session.transcriptSegments || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
