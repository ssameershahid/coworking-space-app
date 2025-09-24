import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "day" | "week" | "month";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); const day = x.getDay(); const diff = (day+6)%7; x.setDate(x.getDate()-diff); return x; }
function endOfWeek(d: Date) { return addDays(startOfWeek(d), 6); }
function startOfMonth(d: Date) { const x = new Date(d.getFullYear(), d.getMonth(), 1); return x; }
function endOfMonth(d: Date) { const x = new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999); return x; }

export default function AdminRoomSchedulePage() {
  const [view, setView] = useState<ViewMode>("day");
  const [cursor, setCursor] = useState<Date>(new Date());
  const range = useMemo(() => {
    if (view === "day") return { from: startOfDay(cursor), to: endOfDay(cursor) };
    if (view === "week") return { from: startOfWeek(cursor), to: endOfWeek(cursor) };
    return { from: startOfMonth(cursor), to: endOfMonth(cursor) };
  }, [view, cursor]);

  const { data: rooms = [] } = useQuery({ queryKey: ["/api/rooms"], staleTime: 60_000 });
  const { data: bookings = [] } = useQuery({ queryKey: ["/api/admin/bookings"], staleTime: 30_000 });

  const filtered = useMemo(() => {
    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    return (bookings || []).filter((b: any) => {
      const s = new Date(b.start_time).getTime();
      const e = new Date(b.end_time).getTime();
      return e >= fromMs && s <= toMs; // overlap test
    });
  }, [bookings, range]);

  const groupedByRoom = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const r of rooms) map[r.id] = [];
    for (const b of filtered) {
      const key = b.room?.id ?? "unknown";
      (map[key] ||= []).push(b);
    }
    for (const k of Object.keys(map)) map[k].sort((a,b) => +new Date(a.start_time) - +new Date(b.start_time));
    return map;
  }, [filtered, rooms]);

  const title = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "2-digit" };
    if (view === "day") return cursor.toLocaleDateString("en-GB", opts);
    if (view === "week") return `${startOfWeek(cursor).toLocaleDateString("en-GB", opts)} – ${endOfWeek(cursor).toLocaleDateString("en-GB", opts)}`;
    return cursor.toLocaleDateString("en-GB", { year: "numeric", month: "long" });
  }, [view, cursor]);

  const goPrev = () => {
    setCursor(c => view === "day" ? addDays(c,-1) : view === "week" ? addDays(c,-7) : new Date(c.getFullYear(), c.getMonth()-1, Math.min(c.getDate(), 28)));
  };
  const goNext = () => {
    setCursor(c => view === "day" ? addDays(c,1) : view === "week" ? addDays(c,7) : new Date(c.getFullYear(), c.getMonth()+1, Math.min(c.getDate(), 28)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" /> Admin Room Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="min-w-[180px] text-center font-medium">{title}</div>
            <Button variant="outline" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
            <Select value={view} onValueChange={(v: ViewMode) => setView(v)}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="View" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {view === "day" && (
            <div className="space-y-6">
              {rooms.map((room: any) => (
                <div key={room.id} className="border rounded-lg">
                  <div className="px-3 py-2 font-semibold bg-gray-50">{room.name}</div>
                  <div className="p-3">
                    <div className="relative h-20 sm:h-24 bg-white border rounded">
                      {/* 24h grid */}
                      <div className="absolute inset-0 grid grid-cols-24">
                        {Array.from({length:24}).map((_,i) => (
                          <div key={i} className="border-r last:border-r-0" />
                        ))}
                      </div>
                      {/* bookings */}
                      {groupedByRoom[room.id]?.map((b:any, idx:number) => {
                        const s = new Date(b.start_time); const e = new Date(b.end_time);
                        const dayStart = startOfDay(cursor).getTime();
                        const leftPct = ((s.getTime()-dayStart)/(24*3600e3))*100;
                        const widthPct = ((e.getTime()-s.getTime())/(24*3600e3))*100;
                        return (
                          <div key={idx} className="absolute top-2 bottom-2 bg-green-200 text-green-900 text-xs rounded px-2 overflow-hidden" style={{left: `${leftPct}%`, width: `${Math.max(3,widthPct)}%`}}>
                            {new Date(b.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} - {new Date(b.end_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} • {b.user?.first_name} {b.user?.last_name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "week" && (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Room</th>
                    {Array.from({length:7}).map((_,i)=>{
                      const d = addDays(startOfWeek(cursor), i);
                      return <th key={i} className="p-2 text-left">{d.toLocaleDateString('en-GB',{weekday:'short', day:'2-digit', month:'short'})}</th>
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room:any)=> (
                    <tr key={room.id} className="align-top">
                      <td className="p-2 font-medium border-r w-44">{room.name}</td>
                      {Array.from({length:7}).map((_,i)=>{
                        const day = addDays(startOfWeek(cursor), i);
                        const dayBookings = (groupedByRoom[room.id]||[]).filter((b:any)=>{
                          const s = startOfDay(new Date(b.start_time));
                          return s.getTime() === startOfDay(day).getTime();
                        });
                        return (
                          <td key={i} className="p-2 border-r">
                            <div className="space-y-1">
                              {dayBookings.length === 0 && <div className="text-xs text-gray-400">—</div>}
                              {dayBookings.map((b:any,idx:number)=> (
                                <div key={idx} className="text-xs bg-green-100 rounded px-2 py-1">
                                  {new Date(b.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} • {b.user?.first_name} {b.user?.last_name}
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "month" && (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({length: 42}).map((_,i)=>{
                const start = startOfWeek(startOfMonth(cursor));
                const day = addDays(start, i);
                const isCurrentMonth = day.getMonth() === cursor.getMonth();
                const count = filtered.filter((b:any)=> {
                  const s = startOfDay(new Date(b.start_time));
                  return s.getTime() === startOfDay(day).getTime();
                }).length;
                return (
                  <div key={i} className={`border rounded p-2 h-28 ${isCurrentMonth? 'bg-white':'bg-gray-50'}`}>
                    <div className="text-xs text-gray-500">{day.getDate()}</div>
                    <div className="mt-2 text-sm font-medium">{count} bookings</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


