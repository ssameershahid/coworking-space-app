import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SITES } from "@/lib/constants";

type ViewMode = "day" | "week" | "month";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); const day = x.getDay(); const diff = (day+6)%7; x.setDate(x.getDate()-diff); return x; }
function endOfWeek(d: Date) { return addDays(startOfWeek(d), 6); }
function startOfMonth(d: Date) { const x = new Date(d.getFullYear(), d.getMonth(), 1); return x; }
function endOfMonth(d: Date) { const x = new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999); return x; }

export default function AdminRoomSchedulePage() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>("day");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [siteFilter, setSiteFilter] = useState<'all' | 'blue_area' | 'i_10'>('all');
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const range = useMemo(() => {
    if (view === "day") return { from: startOfDay(cursor), to: endOfDay(cursor) };
    if (view === "week") return { from: startOfWeek(cursor), to: endOfWeek(cursor) };
    return { from: startOfMonth(cursor), to: endOfMonth(cursor) };
  }, [view, cursor]);

  const { data: rooms = [] } = useQuery({ queryKey: ["/api/rooms"], staleTime: 60_000 });
  const { data: bookings = [] } = useQuery({ queryKey: [siteFilter === 'all' ? "/api/admin/bookings" : `/api/admin/bookings?site=${siteFilter}`], staleTime: 30_000 });

  // Extract all lifetime external bookings created by current admin/team user
  const externalBookings = useMemo(() => {
    const tag = "[EXTERNAL BOOKING]";
    return (bookings || [])
      .filter((b: any) => typeof b?.notes === "string" && b.notes.includes(tag))
      .sort((a: any, b: any) => +new Date(b.created_at || b.start_time) - +new Date(a.created_at || a.start_time));
  }, [bookings]);

  const filteredExternalBookings = useMemo(() => {
    if (!dateFrom && !dateTo) return externalBookings;
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    return externalBookings.filter((b: any) => {
      const d = new Date(b.start_time);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [externalBookings, dateFrom, dateTo]);

  const exportCSV = () => {
    const rows = filteredExternalBookings.map((b: any) => {
      const g = parseExternalGuest(b.notes);
      return [
        new Date(b.start_time).toLocaleDateString('en-GB'),
        new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        b.room?.name || '-',
        b.credits_used,
        g.name,
        g.email,
        g.phone,
        (b.notes || '').replace(/\n/g, ' '),
      ];
    });
    const header = ["Date","Start","End","Room","Credits","Guest Name","Guest Email","Guest Phone","Notes"];
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'external-bookings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseExternalGuest = (notes?: string) => {
    if (!notes) return { name: "", email: "", phone: "" };
    const m = notes.match(/\[EXTERNAL BOOKING\]\s*Name:\s*([^|]+)\s*\|\s*Email:\s*([^|]+)\s*\|\s*Phone:\s*([^|\n]+)/);
    return {
      name: m?.[1]?.trim() || "",
      email: m?.[2]?.trim() || "",
      phone: m?.[3]?.trim() || "",
    };
  };

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
            {(user?.role === 'calmkaaj_admin' || user?.role === 'calmkaaj_team') && (
              <Button variant="default" onClick={() => setShowExternalModal(true)}>
                External Client Bookings
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {view === "day" && (
            <div className="space-y-6">
              {/* Room rows with horizontal timelines */}
              {rooms.map((room: any) => (
                <div key={room.id} className="border rounded-lg">
                  <div className="px-3 py-2 font-semibold bg-gray-50">{room.name}</div>
                  <div className="p-3 overflow-x-auto">
                    {/* Hour labels on the row (top) */}
                    <div className="relative bg-transparent min-w-[1440px] h-6">
                      <div className="absolute inset-0 grid grid-cols-24 text-[10px] text-gray-500">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-center">
                            {new Date(startOfDay(cursor).getTime() + i * 3600e3).toLocaleTimeString([], { hour: 'numeric' })}
                          </div>
                        ))}
                        <div className="relative" />
                      </div>
                    </div>
                    <div className="relative bg-white border rounded min-w-[1440px] h-16">
                      {/* hour grid lines */}
                      <div className="absolute inset-0 grid grid-cols-24 pointer-events-none">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div key={i} className="border-l first:border-l-0" />
                        ))}
                        <div className="relative border-l" />
                      </div>

                      {/* bookings as horizontal blocks */}
                      {groupedByRoom[room.id]?.map((b: any, idx: number) => {
                        const s = new Date(b.start_time);
                        const e = new Date(b.end_time);
                        const dayStart = startOfDay(cursor).getTime();
                        const clampedStart = Math.max(s.getTime(), dayStart);
                        const clampedEnd = Math.min(e.getTime(), dayStart + 24 * 3600e3);
                        const leftPct = ((clampedStart - dayStart) / (24 * 3600e3)) * 100;
                        const widthPct = Math.max(1, ((clampedEnd - clampedStart) / (24 * 3600e3)) * 100);
                        return (
                          <div
                            key={idx}
                            className="absolute top-2 bottom-2 bg-green-200 text-green-900 text-xs rounded px-2 flex items-center overflow-hidden"
                            style={{ left: `${leftPct}%`, width: `${Math.max(2.5, widthPct)}%` }}
                            title={`${new Date(b.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} - ${new Date(b.end_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`}
                          >
                            {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {" - "}
                            {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {" • "}
                            {b.user?.first_name} {b.user?.last_name}
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

      {/* External bookings modal */}
      <Dialog open={showExternalModal} onOpenChange={setShowExternalModal}>
        <DialogContent className="max-w-5xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>External Client Bookings (All)</DialogTitle>
          </DialogHeader>
          <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Site</label>
              <select
                className="border rounded px-3 py-2"
                value={siteFilter}
                onChange={(e)=> setSiteFilter(e.target.value as any)}
              >
                <option value="all">All Sites</option>
                <option value={SITES.BLUE_AREA}>Blue Area</option>
                <option value={SITES.I_10}>I-10</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">From</label>
              <input type="date" className="border rounded px-3 py-2" value={dateFrom} onChange={(e)=> setDateFrom(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">To</label>
              <input type="date" className="border rounded px-3 py-2" value={dateTo} onChange={(e)=> setDateTo(e.target.value)} />
            </div>
            <div className="flex-1" />
            <Button onClick={exportCSV}>Export CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Start</TableHead>
                  <TableHead className="whitespace-nowrap">End</TableHead>
                  <TableHead className="whitespace-nowrap">Room</TableHead>
                  <TableHead className="whitespace-nowrap">Credits</TableHead>
                  <TableHead className="whitespace-nowrap">Guest Name</TableHead>
                  <TableHead className="whitespace-nowrap">Guest Email</TableHead>
                  <TableHead className="whitespace-nowrap">Guest Phone</TableHead>
                  <TableHead className="whitespace-nowrap">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExternalBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">No external bookings found.</TableCell>
                  </TableRow>
                ) : (
                  filteredExternalBookings.map((b: any) => {
                    const g = parseExternalGuest(b.notes);
                    return (
                      <TableRow key={b.id}>
                        <TableCell>{new Date(b.start_time).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell>{new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell>{b.room?.name || '-'}</TableCell>
                        <TableCell>{b.credits_used}</TableCell>
                        <TableCell className="max-w-[220px] truncate" title={g.name}>{g.name || '-'}</TableCell>
                        <TableCell className="max-w-[240px] truncate" title={g.email}>{g.email || '-'}</TableCell>
                        <TableCell className="max-w-[160px] truncate" title={g.phone}>{g.phone || '-'}</TableCell>
                        <TableCell className="max-w-[320px] truncate" title={b.notes}>{b.notes?.replace(/\n/g, ' ') || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


