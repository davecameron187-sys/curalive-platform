import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Clock, Users, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function OperatorAnalytics() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Please log in to view operator analytics</p>
          <Button onClick={() => navigate("/")}>Return to Home</Button>
        </Card>
      </div>
    );
  }

  // Operator Performance Data
  const operatorMetrics = [
    { name: "David Cameron", callsHandled: 142, avgDuration: "4:32", satisfaction: 4.8, status: "active" },
    { name: "Sarah Nkosi", callsHandled: 128, avgDuration: "4:15", satisfaction: 4.9, status: "active" },
    { name: "James Dlamini", callsHandled: 115, avgDuration: "3:58", satisfaction: 4.7, status: "active" },
    { name: "Priya Naidoo", callsHandled: 98, avgDuration: "4:45", satisfaction: 4.6, status: "break" },
    { name: "Mark van der Berg", callsHandled: 87, avgDuration: "5:12", satisfaction: 4.5, status: "training" },
  ];

  const performanceMetrics = [
    { label: "Total Calls Handled", value: "570", icon: Phone, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Avg Call Duration", value: "4:28", icon: Clock, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Customer Satisfaction", value: "4.7/5.0", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Active Operators", value: "3", icon: Users, color: "text-violet-400", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dev-tools")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dev Tools
            </Button>
            <h1 className="text-3xl font-bold">Operator Performance Analytics</h1>
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            Live Data
          </Badge>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {performanceMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${metric.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </Card>
            );
          })}
        </div>

        {/* Operator Details Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Operator Performance Details</h2>
            <Button variant="outline" size="sm">Export Report</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Operator Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Calls Handled</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Avg Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Satisfaction</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {operatorMetrics.map((operator) => (
                  <tr key={operator.name} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{operator.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        {operator.callsHandled}
                      </div>
                    </td>
                    <td className="py-3 px-4">{operator.avgDuration}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < Math.floor(operator.satisfaction) ? "★" : "☆"}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-muted-foreground">{operator.satisfaction}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant="outline"
                        className={
                          operator.status === "active" 
                            ? "bg-green-500/10 text-green-500 border-green-500/30"
                            : operator.status === "break"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                        }
                      >
                        {operator.status.charAt(0).toUpperCase() + operator.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Performance Trends */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Call Volume Trend</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-green-500"></div>
                </div>
                <span className="text-sm font-medium">142</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Yesterday</span>
                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-3/5 bg-blue-500"></div>
                </div>
                <span className="text-sm font-medium">98</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Week Avg</span>
                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-purple-500"></div>
                </div>
                <span className="text-sm font-medium">114</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Satisfaction Scores</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < 5 ? "text-yellow-400 text-lg" : "text-muted-foreground text-lg"}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm font-medium">4.7/5.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < 5 ? "text-yellow-400 text-lg" : "text-muted-foreground text-lg"}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm font-medium">4.8/5.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Month</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < 4 ? "text-yellow-400 text-lg" : "text-muted-foreground text-lg"}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm font-medium">4.6/5.0</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Import icon for Phone
import { Phone } from "lucide-react";
