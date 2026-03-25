import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, CalendarDays, List, Clock, Filter, MoreHorizontal, Settings, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekDays(date: Date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const HOURS = Array.from({ length: 24 }).map((_, i) => i);

export default function EventCalendar() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [current, setCurrent] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);

  const queryRange = useMemo(() => {
    if (view === "month") {
      return {
        from: new Date(year, month, 1).toISOString(),
        to: new Date(year, month + 1, 0).toISOString(),
      };
    } else if (view === "week") {
      const weekDays = getWeekDays(current);
      return {
        from: weekDays[0].toISOString(),
        to: weekDays[6].toISOString(),
      };
    } else {
      const d = new Date(current);
      d.setHours(0,0,0,0);
      const e = new Date(current);
      e.setHours(23,59,59,999);
      return { from: d.toISOString(), to: e.toISOString() };
    }
  }, [view, current, year, month]);

  const { data: schedules, refetch } = trpc.scheduling.getCalendar.useQuery(queryRange);

  const cancelEvent = trpc.scheduling.cancelEvent.useMutation({
    onSuccess: () => {
      toast.success("Event cancelled");
      setSelectedEvent(null);
      refetch();
    }
  });

  const confirmEvent = trpc.scheduling.confirmEvent.useMutation({
    onSuccess: () => {
      toast.success("Event confirmed");
      refetch();
    }
  });

  const eventsByDay: Record<number, any[]> = {};
  for (const s of schedules ?? []) {
    const d = new Date(s.scheduledStart).getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(s);
  }

  const statusColor = (status: string) =>
    status === "confirmed" ? "bg-emerald-500" : status === "cancelled" ? "bg-red-500" : "bg-amber-500";

  const renderMonthView = () => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-700">
        {DAYS.map(d => (
          <div key={d} className="px-3 py-2 text-xs font-medium text-slate-400 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-slate-700/50 bg-slate-900/20" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = eventsByDay[day] ?? [];
          const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
          return (
            <div key={day} className={`min-h-[120px] border-b border-r border-slate-700/50 p-1.5 hover:bg-slate-700/30 transition-colors cursor-pointer ${isToday ? "bg-teal-500/5" : ""}`}>
              <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-teal-500 text-white" : "text-slate-400"}`}>{day}</span>
              <div className="space-y-1">
                {dayEvents.map(e => (
                  <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }} className={`text-[10px] px-1.5 py-0.5 rounded text-white truncate shadow-sm hover:brightness-110 transition-all ${statusColor(e.status)}`}>
                    {new Date(e.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {e.eventId}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => {
    const weekDays = getWeekDays(current);
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden flex flex-col h-[600px]">
        <div className="grid grid-cols-8 border-b border-slate-700 bg-slate-900/40">
          <div className="p-2 border-r border-slate-700" />
          {weekDays.map(d => (
            <div key={d.toISOString()} className="px-3 py-2 text-center border-r border-slate-700 last:border-0">
              <div className="text-[10px] uppercase font-bold text-slate-500">{DAYS[d.getDay()]}</div>
              <div className={`text-sm font-bold ${d.toDateString() === new Date().toDateString() ? "text-teal-400" : "text-white"}`}>{d.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 relative">
            <div className="col-span-1 border-r border-slate-700">
              {HOURS.map(h => (
                <div key={h} className="h-16 border-b border-slate-700/50 text-[10px] text-slate-500 p-1 text-right pr-2">
                  {h}:00
                </div>
              ))}
            </div>
            {weekDays.map(d => (
              <div key={d.toISOString()} className="col-span-1 border-r border-slate-700/50 last:border-0 relative">
                {HOURS.map(h => (
                  <div key={h} className="h-16 border-b border-slate-700/30" />
                ))}
                {(schedules ?? []).filter(s => new Date(s.scheduledStart).toDateString() === d.toDateString()).map(s => {
                  const start = new Date(s.scheduledStart);
                  const end = new Date(s.scheduledEnd);
                  const top = (start.getHours() * 64) + (start.getMinutes() * 64 / 60);
                  const height = Math.max(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 64, 20);
                  return (
                    <div 
                      key={s.id}
                      onClick={() => setSelectedEvent(s)}
                      className={`absolute left-1 right-1 rounded p-1 text-[10px] text-white shadow-md border-l-2 border-white/30 cursor-pointer hover:brightness-110 transition-all z-10 ${statusColor(s.status)}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="font-bold truncate">{s.eventId}</div>
                      <div className="opacity-80 truncate">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden h-[600px] overflow-y-auto">
           <div className="relative">
             <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-slate-700 bg-slate-900/40" />
             {HOURS.map(h => (
               <div key={h} className="h-20 border-b border-slate-700/50 relative">
                 <span className="absolute left-2 top-2 text-[10px] text-slate-500">{h}:00</span>
                 <div className="ml-16 h-full border-l border-slate-700/30" />
               </div>
             ))}
             {(schedules ?? []).map(s => {
               const start = new Date(s.scheduledStart);
               const end = new Date(s.scheduledEnd);
               const top = (start.getHours() * 80) + (start.getMinutes() * 80 / 60);
               const height = Math.max(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 80, 40);
               return (
                 <div 
                   key={s.id}
                   onClick={() => setSelectedEvent(s)}
                   className={`absolute left-20 right-4 rounded-lg p-3 text-sm text-white shadow-xl border-l-4 border-white/20 cursor-pointer hover:scale-[1.01] transition-all z-10 ${statusColor(s.status)}`}
                   style={{ top: `${top}px`, height: `${height}px` }}
                 >
                   <div className="flex justify-between items-start">
                     <div>
                       <div className="font-bold">{s.eventId}</div>
                       <div className="text-xs opacity-90 flex items-center gap-1 mt-1">
                         <Clock className="w-3 h-3" />
                         {start.toLocaleTimeString()} - {end.toLocaleTimeString()}
                       </div>
                     </div>
                     <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                       {s.status}
                     </Badge>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
        <div className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <h3 className="text-sm font-bold text-white mb-3">Operator Availability</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 bg-slate-900/50 rounded border border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Available</span>
                </div>
                <span className="text-slate-500">8 Operators</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 bg-slate-900/50 rounded border border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Booked</span>
                </div>
                <span className="text-slate-500">3 Events</span>
              </div>
            </div>
          </Card>
          <Button variant="outline" className="w-full border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700">
            <Filter className="w-4 h-4 mr-2" /> Filter Calendar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0d14]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/events/schedule")} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Event Calendar</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Global Operations Schedule</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
             <button onClick={() => setView("month")} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${view === "month" ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>Month</button>
             <button onClick={() => setView("week")} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${view === "week" ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>Week</button>
             <button onClick={() => setView("day")} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${view === "day" ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>Day</button>
             <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${view === "list" ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>List</button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-4">
            <button onClick={() => setCurrent(new Date())} className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors">Today</button>
            <button 
              onClick={() => {
                const d = new Date(current);
                if (view === "month") d.setMonth(d.getMonth() - 1);
                else if (view === "week") d.setDate(d.getDate() - 7);
                else d.setDate(d.getDate() - 1);
                setCurrent(d);
              }} 
              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-white min-w-[140px] text-center">
              {view === "day" ? current.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 
               view === "week" ? `Week of ${getWeekDays(current)[0].getDate()} ${MONTHS[getWeekDays(current)[0].getMonth()]}` :
               `${MONTHS[month]} ${year}`}
            </span>
            <button 
              onClick={() => {
                const d = new Date(current);
                if (view === "month") d.setMonth(d.getMonth() + 1);
                else if (view === "week") d.setDate(d.getDate() + 7);
                else d.setDate(d.getDate() + 1);
                setCurrent(d);
              }} 
              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 relative">
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}

        {view === "list" && (
          <div className="space-y-3 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Upcoming Events Schedule</h2>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/5">Confirmed: {(schedules ?? []).filter(s => s.status === "confirmed").length}</Badge>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/5">Tentative: {(schedules ?? []).filter(s => s.status === "tentative").length}</Badge>
              </div>
            </div>
            {(schedules ?? []).length === 0 ? (
              <div className="text-center py-20 bg-slate-800/20 border border-dashed border-slate-700 rounded-xl">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-slate-500">No events found for this period</p>
              </div>
            ) : (schedules ?? []).map((s) => (
              <Card key={s.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors group cursor-pointer" onClick={() => setSelectedEvent(s)}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${s.status === 'confirmed' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
                      <span className="text-[10px] font-bold uppercase">{new Date(s.scheduledStart).toLocaleDateString([], { month: 'short' })}</span>
                      <span className="text-lg font-bold leading-none">{new Date(s.scheduledStart).getDate()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{s.eventId}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(s.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(s.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-slate-500 border-l border-slate-700 pl-3">{s.timezone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4 hidden md:block">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Assigned Operator</p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-slate-300">Auto-Allocated</span>
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">SY</div>
                      </div>
                    </div>
                    <Badge className={`${statusColor(s.status)} text-white`}>{s.status}</Badge>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedEvent && (
          <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-[100] p-6 animate-in slide-in-from-right transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Event Details</h2>
              <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <Badge className={`${statusColor(selectedEvent.status)} mb-3`}>{selectedEvent.status}</Badge>
                <h3 className="text-xl font-bold text-white">{selectedEvent.eventId}</h3>
                <p className="text-sm text-slate-400 mt-1">Scheduled for {new Date(selectedEvent.scheduledStart).toLocaleDateString()} at {new Date(selectedEvent.scheduledStart).toLocaleTimeString()}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-teal-500" />
                  <div>
                    <p className="text-white font-medium">Duration</p>
                    <p className="text-xs text-slate-400">{Math.round((new Date(selectedEvent.scheduledEnd).getTime() - new Date(selectedEvent.scheduledStart).getTime()) / 60000)} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Video className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-white font-medium">Platform</p>
                    <p className="text-xs text-slate-400">PSTN / Audio Bridge</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-white font-medium">Operator</p>
                    <p className="text-xs text-slate-400">System Managed</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-3">
                <Button className="w-full bg-teal-600 hover:bg-teal-500" onClick={() => navigate(`/occ?eventId=${selectedEvent.eventId}`)}>Launch OCC</Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300">Edit Event</Button>
                  <Button 
                    variant="outline" 
                    className="border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950/40"
                    onClick={() => cancelEvent.mutate({ scheduleId: selectedEvent.id })}
                    disabled={cancelEvent.isPending}
                  >
                    Cancel Event
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-lg text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-widest mr-2">Legend:</span>
          <span className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Confirmed</span>
          <span className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> Tentative</span>
          <span className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Cancelled</span>
          <span className="flex items-center gap-2 text-slate-300 ml-auto"><Settings className="w-3 h-3 text-slate-500" /> Availability Shading Enabled</span>
        </div>
      </div>
    </div>
  );
}
