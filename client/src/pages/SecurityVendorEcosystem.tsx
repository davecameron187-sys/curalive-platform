import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Star,
  TrendingUp,
  Eye,
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  name: string;
  category: string;
  status: "active" | "inactive" | "trial";
  healthScore: number;
  integrationStatus: "connected" | "disconnected" | "error";
  dataPoints: number;
  lastSync: number;
  contractExpiry: number;
  performanceScore: number;
}

interface VendorIntegration {
  id: string;
  vendor: string;
  apiStatus: "healthy" | "degraded" | "down";
  lastDataSync: number;
  dataPoints: number;
  syncFrequency: string;
  errorRate: number;
}

interface VendorPerformance {
  vendor: string;
  availability: number;
  responseTime: number;
  dataAccuracy: number;
  supportQuality: number;
  overallScore: number;
  trend: "improving" | "stable" | "declining";
}

interface VendorContract {
  id: string;
  vendor: string;
  startDate: number;
  endDate: number;
  cost: number;
  renewalStatus: "auto-renew" | "manual" | "expired";
  sla: string;
  contacts: string[];
}

export default function SecurityVendorEcosystem() {
  const [vendors] = useState<Vendor[]>([
    {
      id: "vnd-001",
      name: "Crowdstrike",
      category: "Endpoint Protection",
      status: "active",
      healthScore: 98,
      integrationStatus: "connected",
      dataPoints: 2450,
      lastSync: Date.now() - 300000,
      contractExpiry: Date.now() + 15552000000,
      performanceScore: 98,
    },
    {
      id: "vnd-002",
      name: "Rapid7 InsightIDR",
      category: "SIEM/Detection",
      status: "active",
      healthScore: 95,
      integrationStatus: "connected",
      dataPoints: 1890,
      lastSync: Date.now() - 600000,
      contractExpiry: Date.now() + 7776000000,
      performanceScore: 96,
    },
    {
      id: "vnd-003",
      name: "Tenable Nessus",
      category: "Vulnerability Management",
      status: "active",
      healthScore: 92,
      integrationStatus: "connected",
      dataPoints: 1240,
      lastSync: Date.now() - 1800000,
      contractExpiry: Date.now() + 10368000000,
      performanceScore: 94,
    },
    {
      id: "vnd-004",
      name: "Okta",
      category: "Identity Management",
      status: "active",
      healthScore: 97,
      integrationStatus: "connected",
      dataPoints: 3120,
      lastSync: Date.now() - 180000,
      contractExpiry: Date.now() + 31536000000,
      performanceScore: 97,
    },
    {
      id: "vnd-005",
      name: "Datadog",
      category: "Monitoring",
      status: "trial",
      healthScore: 88,
      integrationStatus: "disconnected",
      dataPoints: 450,
      lastSync: Date.now() - 86400000,
      contractExpiry: Date.now() + 1209600000,
      performanceScore: 85,
    },
  ]);

  const [integrations] = useState<VendorIntegration[]>([
    {
      id: "int-001",
      vendor: "Crowdstrike",
      apiStatus: "healthy",
      lastDataSync: Date.now() - 300000,
      dataPoints: 2450,
      syncFrequency: "Real-time",
      errorRate: 0.1,
    },
    {
      id: "int-002",
      vendor: "Rapid7 InsightIDR",
      apiStatus: "healthy",
      lastDataSync: Date.now() - 600000,
      dataPoints: 1890,
      syncFrequency: "Every 5 min",
      errorRate: 0.3,
    },
    {
      id: "int-003",
      vendor: "Tenable Nessus",
      apiStatus: "degraded",
      lastDataSync: Date.now() - 1800000,
      dataPoints: 1240,
      syncFrequency: "Hourly",
      errorRate: 2.1,
    },
    {
      id: "int-004",
      vendor: "Okta",
      apiStatus: "healthy",
      lastDataSync: Date.now() - 180000,
      dataPoints: 3120,
      syncFrequency: "Real-time",
      errorRate: 0.05,
    },
  ]);

  const [performance] = useState<VendorPerformance[]>([
    {
      vendor: "Crowdstrike",
      availability: 99.9,
      responseTime: 145,
      dataAccuracy: 99.2,
      supportQuality: 98,
      overallScore: 98,
      trend: "stable",
    },
    {
      vendor: "Rapid7 InsightIDR",
      availability: 99.7,
      responseTime: 234,
      dataAccuracy: 98.5,
      supportQuality: 96,
      overallScore: 96,
      trend: "improving",
    },
    {
      vendor: "Tenable Nessus",
      availability: 99.2,
      responseTime: 456,
      dataAccuracy: 97.8,
      supportQuality: 92,
      overallScore: 94,
      trend: "stable",
    },
    {
      vendor: "Okta",
      availability: 99.95,
      responseTime: 89,
      dataAccuracy: 99.8,
      supportQuality: 97,
      overallScore: 97,
      trend: "stable",
    },
  ]);

  const [contracts] = useState<VendorContract[]>([
    {
      id: "con-001",
      vendor: "Crowdstrike",
      startDate: Date.now() - 31536000000,
      endDate: Date.now() + 15552000000,
      cost: 125000,
      renewalStatus: "auto-renew",
      sla: "99.9% uptime",
      contacts: ["vendor-support@crowdstrike.com"],
    },
    {
      id: "con-002",
      vendor: "Rapid7 InsightIDR",
      startDate: Date.now() - 15552000000,
      endDate: Date.now() + 7776000000,
      cost: 85000,
      renewalStatus: "manual",
      sla: "99.7% uptime",
      contacts: ["support@rapid7.com"],
    },
    {
      id: "con-003",
      vendor: "Tenable Nessus",
      startDate: Date.now() - 10368000000,
      endDate: Date.now() + 10368000000,
      cost: 45000,
      renewalStatus: "auto-renew",
      sla: "99.5% uptime",
      contacts: ["support@tenable.com"],
    },
  ]);

  const handleAddVendor = () => {
    toast.success("New vendor added to ecosystem");
  };

  const handleSyncData = () => {
    toast.success("Data synchronization initiated");
  };

  const handleReviewContract = () => {
    toast.success("Contract details opened");
  };

  const activeVendors = vendors.filter((v) => v.status === "active").length;
  const totalDataPoints = vendors.reduce((sum, v) => sum + v.dataPoints, 0);
  const avgHealthScore = Math.round(
    vendors.reduce((sum, v) => sum + v.healthScore, 0) / vendors.length
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Vendor Ecosystem</h1>
        <p className="text-muted-foreground mt-1">
          Unified marketplace for security tool integration and management
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Vendors</p>
          <p className="text-3xl font-bold">{vendors.length}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Vendors</p>
          <p className="text-3xl font-bold text-green-600">{activeVendors}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Health Score</p>
          <p className="text-3xl font-bold">{avgHealthScore}%</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Data Points</p>
          <p className="text-3xl font-bold">{(totalDataPoints / 1000).toFixed(1)}K</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Vendor Portfolio
          </h2>
          <Button onClick={handleAddVendor}>
            <Plus className="h-3 w-3 mr-1" />
            Add Vendor
          </Button>
        </div>

        <div className="space-y-3">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{vendor.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{vendor.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      vendor.status === "active"
                        ? "bg-green-500/20 text-green-600"
                        : vendor.status === "trial"
                          ? "bg-blue-500/20 text-blue-600"
                          : "bg-gray-500/20 text-gray-600"
                    }`}
                  >
                    {vendor.status}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      vendor.integrationStatus === "connected"
                        ? "bg-green-500/20 text-green-600"
                        : vendor.integrationStatus === "error"
                          ? "bg-red-500/20 text-red-600"
                          : "bg-gray-500/20 text-gray-600"
                    }`}
                  >
                    {vendor.integrationStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Health</p>
                  <p className="font-semibold">{vendor.healthScore}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Performance</p>
                  <p className="font-semibold">{vendor.performanceScore}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Points</p>
                  <p className="font-semibold">{vendor.dataPoints}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - vendor.lastSync) / 60000)}m ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contract</p>
                  <p className="font-semibold">
                    {Math.floor((vendor.contractExpiry - Date.now()) / (1000 * 60 * 60 * 24))}d
                  </p>
                </div>
                <div>
                  <Button size="sm" onClick={handleSyncData} variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Sync
                  </Button>
                </div>
              </div>

              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    vendor.healthScore >= 95
                      ? "bg-green-600"
                      : vendor.healthScore >= 85
                        ? "bg-yellow-600"
                        : "bg-red-600"
                  }`}
                  style={{ width: `${vendor.healthScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Integration Status
        </h2>

        <div className="space-y-3">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{integration.vendor}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sync Frequency: {integration.syncFrequency}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    integration.apiStatus === "healthy"
                      ? "bg-green-500/20 text-green-600"
                      : integration.apiStatus === "degraded"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {integration.apiStatus}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Data Points</p>
                  <p className="font-semibold">{integration.dataPoints}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Error Rate</p>
                  <p className="font-semibold">{integration.errorRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - integration.lastDataSync) / 60000)}m ago
                  </p>
                </div>
                <div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        integration.errorRate < 1
                          ? "bg-green-600"
                          : integration.errorRate < 3
                            ? "bg-yellow-600"
                            : "bg-red-600"
                      }`}
                      style={{ width: `${Math.min(integration.errorRate * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3 mr-1" />
                    Config
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Vendor Performance Scores
        </h2>

        <div className="space-y-3">
          {performance.map((vendor, idx) => (
            <div
              key={idx}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{vendor.vendor}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Overall Score: {vendor.overallScore}/100
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    vendor.trend === "improving"
                      ? "bg-green-500/20 text-green-600"
                      : vendor.trend === "stable"
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {vendor.trend}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-xs mb-3">
                <div>
                  <p className="text-muted-foreground">Availability</p>
                  <p className="font-semibold">{vendor.availability}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Response Time</p>
                  <p className="font-semibold">{vendor.responseTime}ms</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Accuracy</p>
                  <p className="font-semibold">{vendor.dataAccuracy}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Support Quality</p>
                  <p className="font-semibold">{vendor.supportQuality}%</p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              </div>

              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${vendor.overallScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Contract Management
          </h2>
          <Button onClick={handleReviewContract}>
            <Eye className="h-3 w-3 mr-1" />
            Review Contracts
          </Button>
        </div>

        <div className="space-y-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{contract.vendor}</h4>
                  <p className="text-xs text-muted-foreground mt-1">SLA: {contract.sla}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    contract.renewalStatus === "auto-renew"
                      ? "bg-green-500/20 text-green-600"
                      : contract.renewalStatus === "manual"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {contract.renewalStatus}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Annual Cost</p>
                  <p className="font-semibold">${(contract.cost / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-semibold">
                    {new Date(contract.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-semibold">
                    {new Date(contract.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Days Until Renewal</p>
                  <p className="font-semibold">
                    {Math.floor((contract.endDate - Date.now()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
