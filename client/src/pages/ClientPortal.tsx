import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Globe, Calendar, Play, Lock, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

export default function ClientPortal() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const [, navigate] = useLocation();
  const [accessCode, setAccessCode] = useState("");
  const [unlocked, setUnlocked] = useState<Record<number, boolean>>({});

  const { data, isLoading } = trpc.clientPortal.getPortal.useQuery(
    { slug: clientSlug ?? "" },
    { enabled: !!clientSlug }
  );

  useEffect(() => {
    if (data?.client) {
      const root = document.documentElement;
      root.style.setProperty("--portal-primary", data.client.primaryColor);
      root.style.setProperty("--portal-secondary", data.client.secondaryColor);
      root.style.setProperty("--portal-accent", data.client.accentColor || data.client.primaryColor);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data || !data.client) {
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
  const primaryColor = "var(--portal-primary)";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8f9fa" }}>
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10" style={{ borderColor: `${client.primaryColor}20` }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {client.logoUrl ? (
              <img src={client.logoUrl} alt={client.clientName} className="h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg" style={{ background: primaryColor }}>
                {client.clientName.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-bold text-slate-900 block leading-none">{client.clientName}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Investor Portal</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <a href="#" className="hover:text-slate-900 transition-colors">Events</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Resources</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Investor Events</h1>
          <p className="text-slate-500 text-lg max-w-2xl">Access live broadcasts, roadshows, and on-demand recordings from {client.clientName}.</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-200" />
            <h3 className="text-lg font-semibold text-slate-900">No events published</h3>
            <p className="text-slate-500 mt-1">Check back later for upcoming investor presentations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((portal: any) => {
              const isLocked = portal.passwordProtected && !unlocked[portal.id];
              return (
                <div key={portal.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col">
                  <div className="h-1.5" style={{ background: primaryColor }} />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">
                            {portal.isPublished ? "Upcoming" : "Draft"}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {portal.customTitle ?? portal.eventId}
                        </h3>
                      </div>
                      {isLocked && (
                        <div className="p-2 bg-slate-50 rounded-full">
                          <Lock className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed">
                      {portal.customDescription ?? "Join us for this investor event to discuss recent performance and future strategy."}
                    </p>

                    <div className="mt-auto">
                      {isLocked ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="password"
                              placeholder="Enter access code"
                              value={accessCode}
                              onChange={(e) => setAccessCode(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                              style={{ "--tw-ring-color": client.primaryColor } as any}
                            />
                          </div>
                          <button
                            onClick={() => { if (accessCode === portal.accessCode) setUnlocked(u => ({ ...u, [portal.id]: true })); }}
                            className="w-full py-2.5 rounded-lg text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all active:scale-[0.98]"
                            style={{ background: primaryColor }}
                          >
                            Unlock Access
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/portal/${clientSlug}/event/${portal.eventId}`)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all active:scale-[0.98]"
                            style={{ background: primaryColor }}
                          >
                            <Play className="w-4 h-4 fill-current" /> Join Now
                          </button>
                          <button className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-[10px] font-bold text-white">C</div>
            <span className="text-sm font-semibold text-slate-900">Powered by CuraLive</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-medium text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Support</a>
          </div>
          <div className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} {client.clientName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
