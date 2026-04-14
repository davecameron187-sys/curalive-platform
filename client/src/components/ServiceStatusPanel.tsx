import React, { useEffect, useState } from "react";

type ServiceStatus = {
  configured: boolean;
  status: "enabled" | "disabled";
  reason: string;
};

type SystemStatusResponse = {
  ok: boolean;
  environment: string;
  coreReady: boolean;
  services: {
    core: Record<string, ServiceStatus>;
    integrations: Record<string, ServiceStatus>;
  };
};

export function ServiceStatusPanel() {
  const [data, setData] = useState<SystemStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/health")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-slate-400 text-sm p-4">Loading service status...</div>;
  if (error) return <div className="text-red-400 text-sm p-4">Failed to load status: {error}</div>;
  if (!data) return null;

  const renderSection = (title: string, statuses: Record<string, ServiceStatus>) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{title}</h3>
      <div className="space-y-2">
        {Object.entries(statuses).map(([key, svc]) => (
          <div
            key={key}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              svc.configured
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-amber-500/20 bg-amber-500/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  svc.configured ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span className="text-sm font-medium text-slate-200 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </div>
            <span className={`text-xs ${svc.configured ? "text-emerald-400" : "text-amber-400"}`}>
              {svc.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`w-3 h-3 rounded-full ${data.ok ? "bg-emerald-400" : "bg-red-400"}`}
        />
        <h2 className="text-lg font-semibold text-white">
          System Status — {data.ok ? "All Core Services Ready" : "Core Services Missing"}
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        Environment: {data.environment}
      </p>
      {renderSection("Core Services", data.services.core)}
      {renderSection("Integrations", data.services.integrations)}
    </div>
  );
}
