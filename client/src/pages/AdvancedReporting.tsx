import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  LineChart,
  Download,
  Calendar,
  Filter,
  Settings,
  Share2,
  Clock,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  name: string;
  type: "executive" | "detailed" | "kpi" | "custom";
  format: "pdf" | "csv" | "json" | "tableau";
  createdAt: number;
  metrics: {
    totalEvents: number;
    totalParticipants: number;
    avgEngagement: number;
    avgCompliance: number;
    roi: number;
  };
}

/**
 * AdvancedReporting Page
 * 
 * Enterprise reporting with BI integration, scheduled reports,
 * KPI dashboards, and data warehouse export.
 */
export default function AdvancedReporting() {
  const [reports, setReports] = useState<Report[]>([
    {
      id: "1",
      name: "Q1 2026 Executive Summary",
      type: "executive",
      format: "pdf",
      createdAt: Date.now() - 86400000,
      metrics: {
        totalEvents: 12,
        totalParticipants: 28500,
        avgEngagement: 78,
        avgCompliance: 94,
        roi: 340,
      },
    },
    {
      id: "2",
      name: "February Detailed Analytics",
      type: "detailed",
      format: "csv",
      createdAt: Date.now() - 172800000,
      metrics: {
        totalEvents: 8,
        totalParticipants: 18200,
        avgEngagement: 75,
        avgCompliance: 92,
        roi: 320,
      },
    },
  ]);

  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [selectedType, setSelectedType] = useState<string>("executive");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");

  const handleGenerateReport = () => {
    const newReport: Report = {
      id: String(reports.length + 1),
      name: `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
      type: selectedType as any,
      format: selectedFormat as any,
      createdAt: Date.now(),
      metrics: {
        totalEvents: 15,
        totalParticipants: 35000,
        avgEngagement: 79,
        avgCompliance: 95,
        roi: 350,
      },
    };

    setReports([newReport, ...reports]);
    toast.success(`${selectedType} report generated`);
  };

  const handleScheduleReport = () => {
    setIsScheduled(!isScheduled);
    toast.success(
      `Report scheduled for ${scheduleFrequency} delivery`
    );
  };

  const handleExportReport = (report: Report) => {
    const data = {
      reportName: report.name,
      generatedAt: new Date(report.createdAt).toISOString(),
      metrics: report.metrics,
      biIntegration: {
        tableau: "https://tableau.example.com/dashboard/chorus",
        powerbi: "https://powerbi.example.com/dashboard/chorus",
      },
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${report.name.replace(/\s+/g, "-")}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Report exported");
  };

  const handleConnectTableau = () => {
    toast.success("Connected to Tableau");
  };

  const handleConnectPowerBI = () => {
    toast.success("Connected to Power BI");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Advanced Reporting & BI</h1>
        <p className="text-muted-foreground mt-1">
          Generate executive reports, connect to BI tools, and track KPIs
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Report Generator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Configuration */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Generate New Report
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Report Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-background"
                >
                  <option value="executive">Executive Summary</option>
                  <option value="detailed">Detailed Analytics</option>
                  <option value="kpi">KPI Dashboard</option>
                  <option value="custom">Custom Report</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["pdf", "csv", "json", "tableau"].map((format) => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`px-3 py-2 border rounded text-sm font-medium transition-colors ${
                        selectedFormat === format
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 p-3 border border-border rounded cursor-pointer hover:bg-secondary/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <div>
                    <p className="font-medium text-sm">Schedule Report</p>
                    <p className="text-xs text-muted-foreground">
                      Receive automated reports on a schedule
                    </p>
                  </div>
                </label>

                {isScheduled && (
                  <div className="mt-3">
                    <label className="text-sm font-medium mb-2 block">
                      Frequency
                    </label>
                    <select
                      value={scheduleFrequency}
                      onChange={(e) => setScheduleFrequency(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateReport}
                  className="flex-1 flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Generate Report
                </Button>
                {isScheduled && (
                  <Button
                    onClick={handleScheduleReport}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Schedule
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* KPI Dashboard */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Key Performance Indicators
            </h2>

            <div className="grid grid-cols-5 gap-3">
              <div className="p-3 bg-secondary rounded text-center">
                <p className="text-xs text-muted-foreground mb-1">Events</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <div className="p-3 bg-secondary rounded text-center">
                <p className="text-xs text-muted-foreground mb-1">Participants</p>
                <p className="text-2xl font-bold">12.8K</p>
              </div>
              <div className="p-3 bg-secondary rounded text-center">
                <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                <p className="text-2xl font-bold">78%</p>
              </div>
              <div className="p-3 bg-secondary rounded text-center">
                <p className="text-xs text-muted-foreground mb-1">Compliance</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <div className="p-3 bg-secondary rounded text-center">
                <p className="text-xs text-muted-foreground mb-1">ROI</p>
                <p className="text-2xl font-bold">340%</p>
              </div>
            </div>
          </Card>

          {/* Generated Reports */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Generated Reports
            </h2>

            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{report.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()} at{" "}
                        {new Date(report.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-secondary rounded font-semibold">
                      {report.format.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Events</p>
                      <p className="font-bold">{report.metrics.totalEvents}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Participants</p>
                      <p className="font-bold">
                        {(report.metrics.totalParticipants / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Engagement</p>
                      <p className="font-bold">{report.metrics.avgEngagement}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Compliance</p>
                      <p className="font-bold">{report.metrics.avgCompliance}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ROI</p>
                      <p className="font-bold">{report.metrics.roi}%</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleExportReport(report)}
                      className="flex-1 flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Share2 className="h-3 w-3" />
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* BI Integration */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-4">BI Integrations</h2>

            <div className="space-y-3">
              <button
                onClick={handleConnectTableau}
                className="w-full p-4 border-2 border-orange-500/30 rounded-lg hover:bg-orange-500/5 transition-colors text-left"
              >
                <div className="font-semibold mb-1">Tableau</div>
                <p className="text-xs text-muted-foreground mb-2">
                  Connect to Tableau for interactive dashboards
                </p>
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-600 rounded font-semibold">
                  Connected
                </span>
              </button>

              <button
                onClick={handleConnectPowerBI}
                className="w-full p-4 border-2 border-blue-500/30 rounded-lg hover:bg-blue-500/5 transition-colors text-left"
              >
                <div className="font-semibold mb-1">Power BI</div>
                <p className="text-xs text-muted-foreground mb-2">
                  Connect to Power BI for real-time analytics
                </p>
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-600 rounded font-semibold">
                  Not Connected
                </span>
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold mb-4">Data Warehouse</h2>

            <div className="space-y-2 text-sm">
              <div className="p-3 bg-secondary rounded">
                <p className="text-muted-foreground mb-1">Export Frequency</p>
                <p className="font-semibold">Daily at 2:00 AM UTC</p>
              </div>

              <div className="p-3 bg-secondary rounded">
                <p className="text-muted-foreground mb-1">Last Export</p>
                <p className="font-semibold">2 hours ago</p>
              </div>

              <div className="p-3 bg-secondary rounded">
                <p className="text-muted-foreground mb-1">Records</p>
                <p className="font-semibold">2.4M rows</p>
              </div>
            </div>

            <Button className="w-full mt-4">Configure Warehouse</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
