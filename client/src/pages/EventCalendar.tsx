import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, CalendarDays, List } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function EventCalendar() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"month" | "list">("month");
  const [current, setCurrent] = useState(new Date());

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);

  const { data: schedules } = trpc.scheduling.listUpcoming.useQuery({
    from: new Date(year, month, 1).toISOString(),
    to: new Date(year, month + 1, 0).toISOString(),
  });

  const eventsByDay: Record<number, typeof schedules> = {};
  for (const s of schedules ?? []) {
    const d = new Date(s.scheduledStart).getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d]!.push(s);
  }

  const statusColor = (status: string) =>
    status === "confirmed" ? "bg-emerald-500" : status === "cancelled" ? "bg-red-500" : "bg-amber-500";

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/events/schedule")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">Event Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("month")} className={`p-1.5 rounded ${view === "month" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}><Calendar className="w-4 h-4" /></button>
          <button onClick={() => setView("list")} className={`p-1.5 rounded ${view === "list" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}><List className="w-4 h-4" /></button>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-white w-36 text-center">{MONTHS[month]} {year}</span>
            <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {view === "month" && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-700">
              {DAYS.map(d => (
                <div key={d} className="px-3 py-2 text-xs font-medium text-slate-400 text-center">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-700/50 bg-slate-900/20" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = eventsByDay[day] ?? [];
                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                return (
                  <div key={day} className={`min-h-[80px] border-b border-r border-slate-700/50 p-1.5 ${isToday ? "bg-teal-500/5" : ""}`}>
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-teal-500 text-white" : "text-slate-400"}`}>{day}</span>
                    {dayEvents.map(e => (
                      <div key={e.id} className={`text-xs px-1.5 py-0.5 rounded mb-0.5 text-white truncate ${statusColor(e.status)}`}>
                        {e.eventId}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "list" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white mb-4">Upcoming Events — {MONTHS[month]} {year}</h2>
            {(schedules ?? []).length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No events this month</p>
              </div>
            ) : (schedules ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{s.eventId}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(s.scheduledStart).toLocaleString()} · {s.timezone}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${statusColor(s.status)}`}>{s.status}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Confirmed</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Tentative</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Cancelled</span>
        </div>
      </div>
    </div>
  );
}
