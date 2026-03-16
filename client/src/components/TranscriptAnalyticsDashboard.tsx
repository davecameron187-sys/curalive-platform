import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface SentimentData {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  overallScore: number;
}

interface TranscriptAnalyticsDashboardProps {
  sentimentData: SentimentData[];
  conferenceId: number;
}

export function TranscriptAnalyticsDashboard({ sentimentData, conferenceId }: TranscriptAnalyticsDashboardProps) {
  const sentimentSummary = useMemo(() => {
    if (!sentimentData || sentimentData.length === 0) {
      return { positive: 0, neutral: 0, negative: 0, avgScore: 0 };
    }

    const totals = sentimentData.reduce(
      (acc, d) => ({
        positive: acc.positive + d.positive,
        neutral: acc.neutral + d.neutral,
        negative: acc.negative + d.negative,
        scoreSum: acc.scoreSum + d.overallScore,
      }),
      { positive: 0, neutral: 0, negative: 0, scoreSum: 0 }
    );

    return {
      positive: totals.positive,
      neutral: totals.neutral,
      negative: totals.negative,
      avgScore: totals.scoreSum / sentimentData.length,
    };
  }, [sentimentData]);

  const pieData = [
    { name: "Positive", value: sentimentSummary.positive },
    { name: "Neutral", value: sentimentSummary.neutral },
    { name: "Negative", value: sentimentSummary.negative },
  ];

  const COLORS = ["#10b981", "#6b7280", "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Positive Statements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sentimentSummary.positive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Neutral Statements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{sentimentSummary.neutral}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Negative Statements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sentimentSummary.negative}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Sentiment Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${sentimentSummary.avgScore > 0 ? "text-green-600" : sentimentSummary.avgScore < 0 ? "text-red-600" : "text-gray-600"}`}>
              {sentimentSummary.avgScore.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sentiment Trend Over Time</CardTitle>
            <CardDescription>Daily sentiment distribution across recordings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="overallScore" stroke="#8884d8" name="Avg Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Overall breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sentiment by Statement Type</CardTitle>
          <CardDescription>Breakdown of positive, neutral, and negative statements</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="positive" stackId="a" fill="#10b981" name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill="#6b7280" name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill="#ef4444" name="Negative" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
