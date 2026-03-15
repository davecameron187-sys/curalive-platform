import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Lock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Key,
  UserCheck,
  BarChart3,
  Plus,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  mfaEnabled: boolean;
  lastLogin: number;
  accessLevel: "admin" | "power-user" | "user" | "viewer";
  status: "active" | "inactive" | "suspended";
}

interface PrivilegedAccount {
  id: string;
  accountName: string;
  type: "service" | "admin" | "root";
  lastUsed: number;
  usageCount: number;
  riskScore: number;
  mfaEnabled: boolean;
  status: "active" | "inactive";
}

interface AccessReview {
  id: string;
  userId: string;
  userName: string;
  reviewDate: number;
  status: "pending" | "approved" | "denied" | "revoked";
  justification: string;
  reviewer: string;
}

export default function IdentityAccessManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "user-001",
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      role: "Security Manager",
      department: "Security",
      mfaEnabled: true,
      lastLogin: Date.now() - 3600000,
      accessLevel: "admin",
      status: "active",
    },
    {
      id: "user-002",
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      role: "Developer",
      department: "Engineering",
      mfaEnabled: true,
      lastLogin: Date.now() - 7200000,
      accessLevel: "power-user",
      status: "active",
    },
    {
      id: "user-003",
      name: "Lisa Anderson",
      email: "lisa.anderson@company.com",
      role: "Analyst",
      department: "Operations",
      mfaEnabled: false,
      lastLogin: Date.now() - 604800000,
      accessLevel: "user",
      status: "inactive",
    },
    {
      id: "user-004",
      name: "John Smith",
      email: "john.smith@company.com",
      role: "Contractor",
      department: "External",
      mfaEnabled: false,
      lastLogin: Date.now() - 1209600000,
      accessLevel: "viewer",
      status: "suspended",
    },
  ]);

  const [privilegedAccounts, setPrivilegedAccounts] = useState<PrivilegedAccount[]>([
    {
      id: "priv-001",
      accountName: "admin-prod",
      type: "admin",
      lastUsed: Date.now() - 86400000,
      usageCount: 12,
      riskScore: 45,
      mfaEnabled: true,
      status: "active",
    },
    {
      id: "priv-002",
      accountName: "root-db",
      type: "root",
      lastUsed: Date.now() - 259200000,
      usageCount: 3,
      riskScore: 78,
      mfaEnabled: true,
      status: "active",
    },
    {
      id: "priv-003",
      accountName: "service-api",
      type: "service",
      lastUsed: Date.now() - 1800000,
      usageCount: 245,
      riskScore: 32,
      mfaEnabled: false,
      status: "active",
    },
  ]);

  const [reviews, setReviews] = useState<AccessReview[]>([
    {
      id: "review-001",
      userId: "user-001",
      userName: "Sarah Chen",
      reviewDate: Date.now() - 604800000,
      status: "approved",
      justification: "Admin access required for security role",
      reviewer: "CTO",
    },
    {
      id: "review-002",
      userId: "user-003",
      userName: "Lisa Anderson",
      reviewDate: Date.now() - 1209600000,
      status: "revoked",
      justification: "User inactive for 6 months",
      reviewer: "Manager",
    },
  ]);

  const stats = {
    totalUsers: users.length,
    mfaEnabled: users.filter((u) => u.mfaEnabled).length,
    activeUsers: users.filter((u) => u.status === "active").length,
    privilegedAccounts: privilegedAccounts.length,
  };

  const handleEnableMFA = (userId: string) => {
    toast.success("MFA enabled for user");
  };

  const handleRevokeAccess = (userId: string) => {
    toast.success("Access revoked");
  };

  const handleApproveReview = (reviewId: string) => {
    toast.success("Access review approved");
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "admin":
        return "bg-red-500/20 text-red-600";
      case "power-user":
        return "bg-orange-500/20 text-orange-600";
      case "user":
        return "bg-blue-500/20 text-blue-600";
      case "viewer":
        return "bg-gray-500/20 text-gray-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600";
      case "inactive":
        return "bg-yellow-500/20 text-yellow-600";
      case "suspended":
        return "bg-red-500/20 text-red-600";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Identity & Access Management</h1>
        <p className="text-muted-foreground mt-1">
          RBAC, privileged account monitoring, and MFA enforcement
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Users</p>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">MFA Enabled</p>
          <p className="text-3xl font-bold text-green-600">{stats.mfaEnabled}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Users</p>
          <p className="text-3xl font-bold">{stats.activeUsers}</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Privileged Accounts</p>
          <p className="text-3xl font-bold">{stats.privilegedAccounts}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Directory
          </h2>
          <Button>
            <Plus className="h-3 w-3 mr-1" />
            Add User
          </Button>
        </div>

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{user.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.email} • {user.role}
                  </p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getAccessLevelColor(user.accessLevel)}`}>
                    {user.accessLevel}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-semibold">{user.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MFA</p>
                  <p className="font-semibold">{user.mfaEnabled ? "✓ Enabled" : "Disabled"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Login</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - user.lastLogin) / (1000 * 60))}m ago
                  </p>
                </div>
                <div>
                  <Button size="sm" onClick={() => handleEnableMFA(user.id)} variant="outline">
                    <Key className="h-3 w-3 mr-1" />
                    MFA
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleRevokeAccess(user.id)} variant="outline">
                  <Lock className="h-3 w-3 mr-1" />
                  Revoke
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Privileged Account Monitoring
        </h2>

        <div className="space-y-3">
          {privilegedAccounts.map((account) => (
            <div
              key={account.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{account.accountName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Type: {account.type}</p>
                </div>
                <div className="flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    account.riskScore > 60
                      ? "bg-red-500/20 text-red-600"
                      : account.riskScore > 40
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-green-500/20 text-green-600"
                  }`}>
                    Risk: {account.riskScore}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(account.status)}`}>
                    {account.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Last Used</p>
                  <p className="font-semibold">
                    {Math.floor((Date.now() - account.lastUsed) / (1000 * 60 * 60))}h ago
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Usage Count</p>
                  <p className="font-semibold">{account.usageCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MFA</p>
                  <p className="font-semibold">{account.mfaEnabled ? "✓ Enabled" : "Disabled"}</p>
                </div>
                <div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Monitor
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Access Reviews
        </h2>

        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{review.userName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reviewed: {new Date(review.reviewDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                  review.status === "approved"
                    ? "bg-green-500/20 text-green-600"
                    : review.status === "denied"
                      ? "bg-red-500/20 text-red-600"
                      : review.status === "revoked"
                        ? "bg-orange-500/20 text-orange-600"
                        : "bg-yellow-500/20 text-yellow-600"
                }`}>
                  {review.status}
                </span>
              </div>

              <div className="mb-3 text-xs">
                <p className="text-muted-foreground mb-1">Justification:</p>
                <p className="text-sm">{review.justification}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Reviewed By</p>
                  <p className="font-semibold">{review.reviewer}</p>
                </div>
                <div>
                  <Button
                    size="sm"
                    onClick={() => handleApproveReview(review.id)}
                    disabled={review.status !== "pending"}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {review.status === "pending" ? "Approve" : "Approved"}
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
