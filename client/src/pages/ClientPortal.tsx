import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Globe, Calendar, Play, Lock, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ClientPortal() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const [, navigate] = useLocation();
  const [accessCode, setAccessCode] = useState("");
  const [unlocked, setUnlocked] = useState<Record<number, boolean>>({});

  const { data, isLoading } = trpc.clientPortal.getPortalBySlug.useQuery(
    { slug: clientSlug ?? "" },
    { enabled: !!clientSlug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h1 className="text-lg font-semibold text-slate-600">Portal not found</h1>
          <p className="text-sm text-slate-400 mt-1">This portal does not exist or has been deactivated.</p>
        </div>
      </div>
    );
  }

  const { client, events } = data;
  const primaryColor = client.primaryColor;

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fa" }}>
      <header className="border-b" style={{ borderColor: `${primaryColor}30` }}>
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {client.logoUrl ? (
              <img src={client.logoUrl} alt={client.companyName} className="h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold" style={{ background: primaryColor }}>
                {client.companyName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-slate-800">{client.companyName}</span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Investor Events Portal
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Investor Events</h1>
        <p className="text-slate-500 text-sm mb-8">Live and on-demand investor events from {client.companyName}</p>

        {events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No events published yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {events.map((portal) => {
              const isLocked = portal.passwordProtected && !unlocked[portal.id];
              return (
                <div key={portal.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                  <div className="h-2" style={{ background: primaryColor }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-800">{portal.customTitle ?? portal.eventId}</h3>
                      {isLocked && <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </div>
                    {portal.customDescription && (
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{portal.customDescription}</p>
                    )}
                    {isLocked ? (
                      <div className="space-y-2">
                        <input
                          type="password"
                          placeholder="Enter access code"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
                        />
                        <button
                          onClick={() => { if (accessCode === portal.accessCode) setUnlocked(u => ({ ...u, [portal.id]: true })); }}
                          className="w-full py-1.5 rounded text-sm font-medium text-white transition-colors"
                          style={{ background: primaryColor }}
                        >
                          Unlock
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/event/${portal.eventId}`)}
                        className="flex items-center gap-2 text-sm font-medium transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <Play className="w-4 h-4" /> Join Event
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-slate-400">
        Powered by CuraLive · Investor Events Platform
      </footer>
    </div>
  );
}
