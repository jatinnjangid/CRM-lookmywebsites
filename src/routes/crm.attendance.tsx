import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo, useCallback } from "react";
import { getUpcomingHolidays, MASTER_HOLIDAYS } from "@/lib/holidays";
import { 
  Clock, Play, Building2, Square, Users, TrendingUp, Download, Calendar as CalendarIcon, 
  Activity, PlusCircle, Search, FileText, Smartphone, Trash2,
  UserCheck, UserX, AlertTriangle, Zap, Timer, PieChart, LogIn, LogOut, Briefcase, 
  Coffee, Sparkles, MapPin, ChevronRight, ChevronLeft, CheckCircle2, Award, CalendarDays,
  Check, X, Pencil, MessageSquare, CalendarRange, Plus, ArrowRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { getAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
function formatTime12Hour(timeStr?: string) {
  if (!timeStr) return "";
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function computeDayAttendance(
  records: any[],
  dateStr: string,
  todayStr: string,
  currentTime: Date
) {
  const isToday = dateStr === todayStr;
  const currentNowSec = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

  let hasActive = false;
  const rawIntervals: Array<{ start: number; end: number; isRecActive: boolean; rawCheckin: string; rawCheckout?: string }> = [];

  for (const r of records) {
    if (!r.checkin) continue;
    const [inH, inM] = r.checkin.split(':').map(Number);
    if (isNaN(inH) || isNaN(inM)) continue;
    const startSec = inH * 3600 + inM * 60;

    let endSec = startSec;
    let isRecActive = false;

    if (r.checkout) {
      const [outH, outM] = r.checkout.split(':').map(Number);
      if (!isNaN(outH) && !isNaN(outM)) {
        endSec = Math.max(startSec, outH * 3600 + outM * 60);
      }
    } else if (isToday) {
      isRecActive = true;
      hasActive = true;
      endSec = Math.max(startSec, currentNowSec);
    } else {
      endSec = startSec;
    }

    rawIntervals.push({
      start: startSec,
      end: endSec,
      isRecActive,
      rawCheckin: r.checkin,
      rawCheckout: r.checkout,
    });
  }

  if (rawIntervals.length === 0) {
    return {
      firstIn: "23:59",
      lastOut: "00:00",
      isActive: false,
      workedSecs: 0,
      breakSecs: 0,
      totalSecs: 0,
      workedH: 0,
      workedM: 0,
      workedS: 0,
      breakH: 0,
      breakM: 0,
      totalH: 0,
      totalM: 0,
      isLate: false,
      isHalfDay: false,
      mergedIntervals: [],
    };
  }

  // Sort raw intervals by start ascending, then by duration / end descending
  rawIntervals.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - a.end;
  });

  // Merge overlapping or adjacent intervals
  const merged: Array<{ start: number; end: number; isRecActive: boolean }> = [];
  for (const interval of rawIntervals) {
    if (merged.length === 0) {
      merged.push({ ...interval });
    } else {
      const prev = merged[merged.length - 1];
      if (interval.start <= prev.end) {
        prev.end = Math.max(prev.end, interval.end);
        prev.isRecActive = prev.isRecActive || interval.isRecActive;
      } else {
        merged.push({ ...interval });
      }
    }
  }

  // Calculate worked seconds
  let workedSecs = 0;
  for (const m of merged) {
    workedSecs += Math.max(0, m.end - m.start);
  }

  // Calculate break seconds as sum of gaps between consecutive working periods
  let breakSecs = 0;
  for (let i = 0; i < merged.length - 1; i++) {
    const gap = merged[i + 1].start - merged[i].end;
    if (gap > 0) breakSecs += gap;
  }

  const totalElapsedSecs = workedSecs + breakSecs;

  // Format firstIn & lastOut strings
  const firstInStr = rawIntervals.reduce((minStr, cur) => (cur.rawCheckin < minStr ? cur.rawCheckin : minStr), rawIntervals[0].rawCheckin);

  let lastOutStr = "00:00";
  if (!hasActive) {
    const completedCheckouts = rawIntervals.filter(r => r.rawCheckout).map(r => r.rawCheckout!);
    if (completedCheckouts.length > 0) {
      lastOutStr = [...completedCheckouts].sort().reverse()[0];
    } else {
      lastOutStr = firstInStr;
    }
  }

  const [fH, fM] = firstInStr.split(':').map(Number);
  const isLate = fH > 10 || (fH === 10 && fM > 15);
  const isHalfDay = workedSecs > 0 && workedSecs < 240 * 60 && !hasActive;

  return {
    firstIn: firstInStr,
    lastOut: lastOutStr,
    isActive: hasActive,
    workedSecs,
    breakSecs,
    totalSecs: totalElapsedSecs,
    workedH: Math.floor(workedSecs / 3600),
    workedM: Math.floor((workedSecs % 3600) / 60),
    workedS: workedSecs % 60,
    breakH: Math.floor(breakSecs / 3600),
    breakM: Math.floor((breakSecs % 3600) / 60),
    totalH: Math.floor(totalElapsedSecs / 3600),
    totalM: Math.floor((totalElapsedSecs % 3600) / 60),
    isLate,
    isHalfDay,
    mergedIntervals: merged,
  };
}

export const Route = createFileRoute("/crm/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const auth = getAuth();
  const isAdmin = auth?.role === "admin" || auth?.role === "manager";

  const [time, setTime] = useState(new Date());
  const upcomingHolidays = useMemo(() => getUpcomingHolidays(4, time), [time]);
  const [shiftNote, setShiftNote] = useState("");
  const [selectedHistoryEmpId, setSelectedHistoryEmpId] = useState<string>("");
  const [myViewMode, setMyViewMode] = useState<"table" | "calendar">("table");
  const [calendarMonth, setCalendarMonth] = useState(new Date(time.getFullYear(), time.getMonth(), 1));
  const [selectedDayInfo, setSelectedDayInfo] = useState<any>(null);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);

  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [remarkTarget, setRemarkTarget] = useState<{ empId: string, date: string, currentRemark: string } | null>(null);

  const [rawAttendance, setAttendance] = useSupabaseTable<any[]>("attendance", []);
  const [employeesList] = useSupabaseTable<any[]>("employees", []);

  const user = getAuth();

  const meInDb = employeesList.find((e: any) => e.name?.toLowerCase().trim() === user?.name?.toLowerCase().trim());
  const myEmpId = user?.empId || (meInDb ? meInDb.id : (user?.name ? `EMP-${user.name.replace(/\s+/g, "").toUpperCase()}` : "EMP001"));

  const ceoInDb = employeesList.find((e: any) => e.name === "Manvendra Singhal");
  const ceoId = ceoInDb ? ceoInDb.id : "EMP001";

  // Get date in local timezone YYYY-MM-DD
  const todayStr = new Date(time.getTime() - time.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  // Normalize EMP001 records to the actual CEO ID to merge history cards
  // Normalize EMP001 records to the actual CEO ID to merge history cards
  // Auto-checkout any active shifts from previous days ONLY
  const attendance = rawAttendance.map(a => {
    let rec = (a.employeeid === "EMP001" && myEmpId !== "EMP001") ? { ...a, employeeid: ceoId } : { ...a };

    if (!rec.checkout) {
      const isPastDay = rec.date < todayStr;

      if (isPastDay) {
        if (rec.checkin && rec.checkin >= "19:30") {
          rec.checkout = rec.checkin;
        } else {
          rec.checkout = "19:30";
        }
        rec.status = "Present";
      }
    }
    return rec;
  });

  const [leaves, setLeaves] = useSupabaseTable<any[]>("leaves", []);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("Casual");
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSearch, setLeaveSearch] = useState("");
  const currentMonthStr = todayStr.substring(0, 7);
  const [kpiMonth, setKpiMonth] = useState(currentMonthStr);
  const myTodayRecords = [...attendance.filter(a => a.employeeid === myEmpId && a.date === todayStr)].sort((a, b) => (b.checkin || "").localeCompare(a.checkin || ""));
  const myCurrentSession = myTodayRecords.find(a => !a.checkout);

  const isMatchingEmpLeave = useCallback((l: any, empId: string) => {
    if (!l) return false;
    const lEmpId = l.employeeid || l.employee_id || "";
    const lEmpName = l.employee_name || l.name || "";
    if (lEmpId === empId) return true;
    const empRec = employeesList.find((e: any) => e.id === empId || e.empId === empId);
    if (empRec) {
      if (lEmpId === empRec.id || lEmpId === empRec.empId) return true;
      if (empRec.name && lEmpName && empRec.name.toLowerCase().trim() === lEmpName.toLowerCase().trim()) return true;
      if (empRec.name && lEmpId && empRec.name.toLowerCase().trim() === lEmpId.toLowerCase().trim()) return true;
    }
    if (empId === myEmpId && user?.name) {
      if (lEmpName && user.name.toLowerCase().trim() === lEmpName.toLowerCase().trim()) return true;
      if (lEmpId && user.name.toLowerCase().trim() === lEmpId.toLowerCase().trim()) return true;
    }
    return false;
  }, [employeesList, myEmpId, user]);

  const getLeaveDaysCount = (l: any) => {
    const start = l.start_date || l.startdate;
    const end = l.end_date || l.enddate;
    if (!start) return 1;
    if (!end || start === end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
  };

  const myLeaves = useMemo(() => {
    return (leaves || []).filter(l => isMatchingEmpLeave(l, myEmpId));
  }, [leaves, myEmpId, isMatchingEmpLeave]);

  const myApprovedLeaves = useMemo(() => {
    return myLeaves.filter(l => (l.status || "").toLowerCase() === "approved");
  }, [myLeaves]);

  const myPendingLeaves = useMemo(() => {
    return myLeaves.filter(l => (l.status || "").toLowerCase() === "pending" || !l.status);
  }, [myLeaves]);

  const teamPendingLeaves = useMemo(() => {
    return (leaves || []).filter(l => (l.status || "").toLowerCase() === "pending" || !l.status);
  }, [leaves]);

  const casualUsed = useMemo(() => {
    return myApprovedLeaves
      .filter(l => (l.type || "").toLowerCase().includes("casual"))
      .reduce((acc, l) => acc + getLeaveDaysCount(l), 0);
  }, [myApprovedLeaves]);

  const sickUsed = useMemo(() => {
    return myApprovedLeaves
      .filter(l => (l.type || "").toLowerCase().includes("sick"))
      .reduce((acc, l) => acc + getLeaveDaysCount(l), 0);
  }, [myApprovedLeaves]);

  const earnedUsed = useMemo(() => {
    return myApprovedLeaves
      .filter(l => (l.type || "").toLowerCase().includes("earned"))
      .reduce((acc, l) => acc + getLeaveDaysCount(l), 0);
  }, [myApprovedLeaves]);

  const casualBalance = Math.max(0, 12 - casualUsed);
  const sickBalance = Math.max(0, 10 - sickUsed);
  const earnedBalance = Math.max(0, 15 - earnedUsed);

  // Export State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  const handleExportCSV = () => {
    const exportableRecords = rawAttendance.filter(a => {
      const d = a.date || "";
      const matchStart = exportStartDate && d ? d >= exportStartDate : true;
      const matchEnd = exportEndDate && d ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const csvRows = [
      ["Employee ID", "Date", "Check-in", "Check-out", "Status", "Remark"]
    ];

    exportableRecords.forEach(a => {
      csvRows.push([
        `"${a.employeeid}"`,
        `"${a.date}"`,
        `"${a.checkin}"`,
        `"${a.checkout || ""}"`,
        `"${a.status}"`,
        `"${a.remark || ""}"`
      ]);
    });

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const [teamSelectedDate, setTeamSelectedDate] = useState<Date>(new Date());
  const teamSelectedDateStr = new Date(teamSelectedDate.getTime() - teamSelectedDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const teamTodayRecords = [...attendance.filter(a => a.date === teamSelectedDateStr)].sort((a, b) => (b.checkin || "").localeCompare(a.checkin || ""));
  const getEmpDetails = (empId: string) => {
    const emp = employeesList.find((e: any) => e.id === empId || e.empId === empId);
    if (emp) return { name: emp.name, role: emp.role || "Employee", initials: emp.name?.charAt(0) || "U", id: emp.id };

    if (empId === myEmpId && user) return { name: user.name, role: user.role, initials: user.name?.charAt(0) || "U", id: myEmpId };
    if (empId === "EMP001") return { name: "Manvendra Singhal", role: "CEO & Founder", initials: "MS", id: "EMP001" };
    return { name: "Unknown Employee", role: "Unknown", initials: "U", id: empId };
  };
  const isClockedIn = !!myCurrentSession;

  const filteredTeamLeaves = useMemo(() => {
    return (leaves || []).filter((leave: any) => {
      if (!leaveSearch.trim()) return true;
      const q = leaveSearch.toLowerCase();
      const emp = getEmpDetails(leave.employeeid || leave.employee_id);
      return (
        (emp.name && emp.name.toLowerCase().includes(q)) ||
        (leave.type && leave.type.toLowerCase().includes(q)) ||
        (leave.reason && leave.reason.toLowerCase().includes(q)) ||
        (leave.status && leave.status.toLowerCase().includes(q)) ||
        (leave.startdate && leave.startdate.includes(q)) ||
        (leave.enddate && leave.enddate.includes(q))
      );
    });
  }, [leaves, leaveSearch, employeesList, user, myEmpId]);

  const filteredMyLeaves = useMemo(() => {
    return myLeaves.filter((leave: any) => {
      if (!leaveSearch.trim()) return true;
      const q = leaveSearch.toLowerCase();
      return (
        (leave.type && leave.type.toLowerCase().includes(q)) ||
        (leave.reason && leave.reason.toLowerCase().includes(q)) ||
        (leave.status && leave.status.toLowerCase().includes(q)) ||
        (leave.startdate && leave.startdate.includes(q)) ||
        (leave.enddate && leave.enddate.includes(q))
      );
    });
  }, [myLeaves, leaveSearch]);

  const uniqueEmpIds = Array.from(new Set(attendance.map((a: any) => a.employeeid)));
  const displayEmpIds = Array.from(new Set([...employeesList.map((e: any) => e.id), ...uniqueEmpIds]));

  const canEditRemarks = isAdmin || user?.name?.toLowerCase().includes("suman");

  const handleSaveRemark = () => {
    if (!remarkTarget) return;
    const updated = rawAttendance.map(a => {
      if (a.employeeid === remarkTarget.empId && a.date === remarkTarget.date) {
        return { ...a, remark: remarkDraft };
      }
      return a;
    });
    setAttendance(updated);
    toast.success("Remark saved successfully!");
    setRemarkDialogOpen(false);
  };

  const handleApplyLeave = () => {
    if (!leaveStartDate || !leaveEndDate || !leaveReason) {
      toast.error("Please fill in all fields");
      return;
    }

    const newLeave = {
      id: crypto.randomUUID(),
      employeeid: myEmpId,
      employee_name: user?.name || meInDb?.name || "Employee",
      type: leaveType,
      startdate: leaveStartDate,
      enddate: leaveEndDate,
      reason: leaveReason,
      status: "Pending",
    };

    setLeaves([newLeave, ...leaves]);
    toast.success("Leave applied successfully!");
    setIsApplyLeaveOpen(false);
    setLeaveType("Casual");
    setLeaveStartDate(new Date().toISOString().split("T")[0]);
    setLeaveEndDate(new Date().toISOString().split("T")[0]);
    setLeaveReason("");
  };

  const handleDeleteRecord = (id: string) => {
    setAttendance(rawAttendance.filter(a => a.id !== id));
    toast.success("Attendance record removed!");
  };

  const handleToggleClock = () => {
    const formattedTimeStr = time.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
    if (isClockedIn && myCurrentSession) {
      setAttendance(
        rawAttendance.map(a => (a.id === myCurrentSession.id || (a.employeeid === myEmpId && a.date === todayStr && !a.checkout)) ? { ...a, checkout: formattedTimeStr, status: "Present" } : a)
      );
      toast.success(`Successfully Clocked Out at ${formatTime12Hour(formattedTimeStr)}!`);
    } else {
      const shiftName = time.getHours() < 12 ? "Morning Shift" : time.getHours() < 17 ? "Afternoon Shift" : "Evening Shift";
      const newRecord = {
        id: crypto.randomUUID(),
        employeeid: myEmpId,
        employee_name: user?.name || meInDb?.name || "Employee",
        date: todayStr,
        checkin: formattedTimeStr,
        checkout: "",
        status: "Active",
        shift: shiftName,
        location: "JTM Mall Office",
        note: shiftNote.trim() || undefined,
      };
      setAttendance([...rawAttendance, newRecord]);
      setShiftNote("");
      toast.success(`Successfully Clocked In at ${formatTime12Hour(formattedTimeStr)}!`);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Custom format: Monday, 13 Jul 2026
  const formattedDate = time.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });



  return (
    <main className="flex-1 p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
      <Tabs defaultValue="my-attendance" className="space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Attendance</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Punch clock, real-time check-ins, automated shifts, and balance tracker.</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => setIsExportOpen(true)} 
              className="gap-2 rounded-xl h-10 px-4 font-semibold border-border/80 hover:bg-secondary/70 shadow-sm transition-all"
            >
              <Download className="h-4 w-4 text-primary" /> Export Records
            </Button>
            
            <TabsList className="flex bg-muted/80 backdrop-blur-md p-1 rounded-2xl w-fit border border-border/80 h-auto shadow-inner">
              <TabsTrigger 
                value="my-attendance" 
                className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
              >
                My Attendance
              </TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger 
                    value="team" 
                    className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                  >
                    Team Check-ins
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
                  >
                    Employee History
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger 
                value="leave" 
                className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground"
              >
                Leave Applications
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="my-attendance" className="m-0 border-none p-0 outline-none">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: Shift Punch & Holidays */}
            <div className="space-y-6">
              {/* Shift Punch Card */}
              <div className="relative overflow-hidden bg-card rounded-3xl border border-border/80 p-6 shadow-sm hover:shadow-md transition-all space-y-5">
                {/* Decorative glowing gradient aura */}
                <div className={`absolute -top-14 -right-14 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
                  isClockedIn ? "bg-rose-500/15" : "bg-emerald-500/15"
                }`} />

                {/* Shift Punch Card Header */}
                <div className="text-center relative z-10 space-y-3">
                  {/* Icon Badge */}
                  <div className="flex justify-center">
                    <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                      isClockedIn
                        ? "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10"
                        : "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10"
                    }`}>
                      <Clock className={`h-9 w-9 stroke-[2.2] ${isClockedIn ? "animate-pulse" : ""}`} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">Shift Punch</h3>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {isClockedIn ? "Shift in progress • Record your check-out when done" : "Record your attendance & daily hours"}
                    </p>
                  </div>

                  {/* Status Indicator Chip */}
                  <div className="flex items-center justify-center">
                    <div className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold border transition-all ${
                      isClockedIn 
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 shadow-xs" 
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-xs"
                    }`}>
                      <span>{isClockedIn ? "Shift Active (Checked In)" : "Ready to Clock In"}</span>
                    </div>
                  </div>

                  {/* Illuminated Digital Clock Display */}
                  <div className="pt-1">
                    <div className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-secondary/50 border border-border/80 shadow-inner w-full">
                      <p className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-foreground flex items-center justify-center gap-2">
                        {formattedTime}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {formattedDate}
                    </p>
                  </div>
                </div>

                {/* Punch Form Inputs */}
                <div className="space-y-4 pt-1 relative z-10">
                  {/* Work Location */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5" htmlFor="work-loc">
                      <Building2 className="h-3.5 w-3.5 text-primary" /> Work Location
                    </label>
                    <div className="relative">
                      <select 
                        id="work-loc" 
                        className="flex h-11 w-full rounded-xl border border-border/80 bg-secondary/30 px-3.5 text-sm font-semibold text-foreground cursor-default focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none disabled:opacity-90 shadow-sm" 
                        disabled
                      >
                        <option>JTM Mall Office</option>
                      </select>
                      <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Scheduled Shift */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5" htmlFor="shift">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Scheduled Shift
                    </label>
                    <div className="relative">
                      <select 
                        id="shift" 
                        disabled 
                        className="flex h-11 w-full rounded-xl border border-border/80 bg-secondary/30 px-3.5 text-sm font-semibold text-foreground cursor-default focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none disabled:opacity-90 shadow-sm"
                      >
                        <option value={time.getHours() < 12 ? "Morning Shift" : time.getHours() < 17 ? "Afternoon Shift" : "Evening Shift"}>
                          {time.getHours() < 12 ? "Morning Shift (10:00 AM - 02:00 PM)" : time.getHours() < 17 ? "Afternoon Shift (02:00 PM - 06:00 PM)" : "Evening Shift (06:00 PM - 10:00 PM)"}
                        </option>
                      </select>
                      <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Shift Note / Focus */}
                  <div className="space-y-1.5 animate-in fade-in duration-300">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5" htmlFor="checkin-note">
                      <FileText className="h-3.5 w-3.5 text-primary" /> Shift Note / Focus
                    </label>
                    <input
                      className="flex h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      id="checkin-note"
                      placeholder="What is your main focus for this shift?"
                      value={shiftNote}
                      onChange={(e) => setShiftNote(e.target.value)}
                    />
                  </div>

                  {/* HERO BUTTON */}
                  <div className="pt-2">
                    <button
                      onClick={handleToggleClock}
                      className={`relative group w-full py-4 px-6 rounded-2xl font-bold tracking-wide text-white shadow-lg active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden cursor-pointer ${
                        isClockedIn 
                          ? "bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30 hover:shadow-rose-600/45" 
                          : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 hover:shadow-emerald-600/45"
                      }`}
                    >
                      <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                        {isClockedIn ? (
                          <Square className="h-4 w-4 fill-white" />
                        ) : (
                          <Play className="h-4 w-4 fill-white ml-0.5" />
                        )}
                      </span>
                      <span className="text-base font-extrabold tracking-tight">
                        {isClockedIn ? "Clock Out / End Shift" : "Clock In / Start Shift"}
                      </span>
                    </button>
                  </div>

                  {/* Today's Punches */}
                  <div className="mt-6 space-y-3 pt-4 border-t border-border/80">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-primary" /> Today's Punches
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary text-secondary-foreground border border-border/60">
                        {myTodayRecords.length} {myTodayRecords.length === 1 ? "Record" : "Records"}
                      </span>
                    </div>

                    {myTodayRecords.map((record) => (
                      <div key={record.id} className="rounded-2xl bg-secondary/30 border border-border/60 p-3.5 space-y-2.5 text-xs hover:border-border transition-all shadow-sm">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-primary" />
                            {parseInt(record.checkin.split(':')[0] || "12") < 12 ? "Morning Shift" : parseInt(record.checkin.split(':')[0] || "12") < 17 ? "Afternoon Shift" : "Evening Shift"}
                          </span>
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase border ${
                            record.checkout 
                              ? 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' 
                              : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-500/30'
                          }`}>
                            {record.checkout ? 'Completed' : 'Active'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-background rounded-xl p-2.5 border border-border/40">
                            <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Clocked In</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatTime12Hour(record.checkin)}</span>
                          </div>
                          <div className="bg-background rounded-xl p-2.5 border border-border/40">
                            <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Clocked Out</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                              {record.checkout ? formatTime12Hour(record.checkout) : "In Progress"}
                            </span>
                          </div>
                        </div>
                        {record.note && (
                          <div className="pt-1 text-muted-foreground italic text-[11px] bg-background/50 rounded-lg px-2.5 py-1 border border-border/30">
                            "{record.note}"
                          </div>
                        )}
                      </div>
                    ))}

                    {myTodayRecords.length === 0 && (
                      <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-border/70 bg-secondary/10">
                        <Clock className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-foreground">No punches recorded today</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Click the button above to punch in your shift.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upcoming Holidays Card */}
              <div className="bg-card rounded-3xl border border-border/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                      <CalendarIcon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">Upcoming Holidays</h3>
                      <p className="text-[11px] text-muted-foreground">Official office holidays & festival breaks</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {upcomingHolidays.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {upcomingHolidays.map((holiday) => {
                    const d = new Date(holiday.isoDate + "T00:00:00");
                    const monthShort = d.toLocaleDateString("en-GB", { month: "short" });
                    const dayNum = d.getDate();

                    return (
                      <div
                        key={holiday.name + holiday.isoDate}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 hover:border-indigo-500/30 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] font-extrabold uppercase leading-none">{monthShort}</span>
                            <span className="text-base font-black leading-none mt-0.5">{dayNum}</span>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {holiday.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-medium">{holiday.date} • {holiday.day}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          holiday.type === 'National'
                            ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
                        }`}>
                          {holiday.type}
                        </span>
                      </div>
                    );
                  })}
                  {upcomingHolidays.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground">No upcoming holidays scheduled.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Statistics & Shift History */}
            <div className="lg:col-span-2 space-y-6">
              {(() => {
                const currentHistoryEmpId = (isAdmin && selectedHistoryEmpId) ? selectedHistoryEmpId : myEmpId;
                const currentHistoryEmp = employeesList.find((e: any) => e.id === currentHistoryEmpId) || (currentHistoryEmpId === myEmpId ? (meInDb || { name: auth?.name || "My" }) : null);

                return (
                  <>
                    {/* Top KPI Header with Month Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-lg text-foreground">Attendance Statistics</h3>
                        {currentHistoryEmp && (
                          <span className="text-xs bg-primary/10 text-primary border border-primary/20 font-bold px-2.5 py-0.5 rounded-full">
                            {currentHistoryEmp.name || currentHistoryEmpId}
                          </span>
                        )}
                      </div>

                      {/* Styled Month Filter */}
                      <div className="relative inline-flex items-center">
                        <CalendarDays className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <select
                          value={kpiMonth}
                          onChange={(e) => setKpiMonth(e.target.value)}
                          className="bg-card border border-border/80 text-xs font-bold rounded-xl pl-8 pr-7 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer appearance-none hover:border-primary/40 transition-colors"
                        >
                          <option value={currentMonthStr}>This Month ({time.toLocaleString('default', { month: 'long', year: 'numeric' })})</option>
                          <option value="all">All Time History</option>
                          {Array.from(new Set(attendance.filter((r) => r.employeeid === currentHistoryEmpId).map((r: any) => r.date ? r.date.substring(0, 7) : "")))
                            .filter(m => Boolean(m) && m !== currentMonthStr)
                            .sort()
                            .reverse()
                            .map(m => {
                              const [year, month] = m.split('-');
                              const date = new Date(Number(year), Number(month) - 1, 1);
                              return <option key={m} value={m}>{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
                            })}
                        </select>
                        <ChevronRight className="absolute right-2.5 h-3.5 w-3.5 text-muted-foreground rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    {/* 6 Modern KPI Widgets */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
                      {(() => {
                        const myAllRecords = attendance.filter((record) => record.employeeid === currentHistoryEmpId);
                        const myRecords = kpiMonth === "all" ? myAllRecords : myAllRecords.filter((r: any) => r.date && r.date.startsWith(kpiMonth));

                        // Group by date
                        const dailyGroup = myRecords.reduce((acc: any, record: any) => {
                          if (!record.date) return acc;
                          if (!acc[record.date]) acc[record.date] = [];
                          acc[record.date].push(record);
                          return acc;
                        }, {} as Record<string, any[]>);

                        let present = 0;
                        let late = 0;
                        let overtimeMinutes = 0;
                        let halfDays = 0;
                        let totalWorkedMinutes = 0;

                        Object.entries(dailyGroup).forEach(([dStr, recs]: [string, any]) => {
                          const stats = computeDayAttendance(recs as any[], dStr, todayStr, time);
                          if (stats.isHalfDay) {
                            halfDays++;
                          } else {
                            present++;
                          }
                          if (stats.isLate) late++;
                          const workedMins = Math.floor(stats.workedSecs / 60);
                          if (workedMins > 480) overtimeMinutes += (workedMins - 480);
                          totalWorkedMinutes += workedMins;
                        });

                        // Calculate absent days (past weekdays in range with no attendance, excluding holidays & approved leaves)
                        let absent = 0;
                        const monthsToScan = kpiMonth === "all"
                          ? Array.from(new Set(myAllRecords.map((r: any) => r.date ? r.date.substring(0, 7) : ""))).filter(Boolean)
                          : [kpiMonth];

                        if (monthsToScan.length === 0) monthsToScan.push(currentMonthStr);

                        monthsToScan.forEach((mStrFull) => {
                          const [yStr, mStr] = mStrFull.split("-");
                          const yNum = Number(yStr);
                          const mNum = Number(mStr) - 1;
                          const totalDays = new Date(yNum, mNum + 1, 0).getDate();
                          for (let d = 1; d <= totalDays; d++) {
                            const dDate = new Date(yNum, mNum, d);
                            const dStr = `${yNum}-${String(mNum + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                            if (dStr > todayStr) continue; // skip future
                            const isWk = dDate.getDay() === 0; // Only Sunday is weekend off (Saturday is a working day)
                            if (isWk) continue;
                            const isHol = MASTER_HOLIDAYS.some(h => h.isoDate === dStr);
                            if (isHol) continue;
                            const isLve = (leaves || []).some((l: any) =>
                              isMatchingEmpLeave(l, currentHistoryEmpId) &&
                              (l.status === 'Approved' || l.status === 'approved') &&
                              dStr >= (l.start_date || l.startdate || '') &&
                              dStr <= (l.end_date || l.enddate || '')
                            );
                            if (isLve) continue;
                            if (!dailyGroup[dStr]) absent++;
                          }
                        });

                        const otHours = Math.floor(overtimeMinutes / 60);
                        const totalActiveDays = present + halfDays;
                        const avgMins = totalActiveDays > 0 ? Math.floor(totalWorkedMinutes / totalActiveDays) : 0;
                        const avgHours = Math.floor(avgMins / 60);
                        const avgM = avgMins % 60;

                        return (
                          <>
                            {/* Present Card */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/[0.08] via-card to-card rounded-2xl border border-emerald-500/25 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Present</span>
                                <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                  <UserCheck className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{present}</div>
                              <span className="text-[10px] text-muted-foreground mt-1 font-semibold">Days attended</span>
                            </div>

                            {/* Absent Card */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500/[0.08] via-card to-card rounded-2xl border border-rose-500/25 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Absent</span>
                                <div className="h-7 w-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                  <UserX className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{absent}</div>
                              <span className="text-[10px] text-muted-foreground mt-1 font-semibold">Missed shifts</span>
                            </div>

                            {/* Late Card */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/[0.08] via-card to-card rounded-2xl border border-amber-500/25 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Late</span>
                                <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                  <AlertTriangle className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{late}</div>
                              <span className="text-[10px] text-muted-foreground mt-1 font-semibold">Past 10:15 AM</span>
                            </div>

                            {/* Half Day Card */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/[0.08] via-card to-card rounded-2xl border border-indigo-500/25 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Half Day</span>
                                <div className="h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                  <PieChart className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{halfDays}</div>
                              <span className="text-[10px] text-muted-foreground mt-1 font-semibold">&lt; 4 hours</span>
                            </div>

                            {/* Overtime Card */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/[0.08] via-card to-card rounded-2xl border border-purple-500/25 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Overtime</span>
                                <div className="h-7 w-7 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                  <Zap className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{otHours}h</div>
                              <span className="text-[10px] text-muted-foreground mt-1 font-semibold">&gt; 8 hours</span>
                            </div>

                            {/* Avg Hours Card */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-sky-500/[0.08] via-card to-card rounded-2xl border border-sky-500/25 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">Avg Hours</span>
                                <div className="h-7 w-7 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                                  <Timer className="h-4 w-4" />
                                </div>
                              </div>
                              <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 tracking-tight">{avgHours}h {avgM}m</div>
                              <span className="text-[10px] text-muted-foreground mt-1 font-semibold">Daily active avg</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Section Controls: Employee Switcher, Count & View Mode Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          {currentHistoryEmpId === myEmpId 
                            ? (auth?.name ? `${auth.name}'s Attendance` : "My Attendance") 
                            : `${currentHistoryEmp?.name || currentHistoryEmpId}'s Attendance`}
                        </h3>
                        {isAdmin && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground font-semibold">Viewing:</span>
                            <div className="relative inline-flex items-center">
                              <select
                                value={selectedHistoryEmpId || myEmpId}
                                onChange={(e) => setSelectedHistoryEmpId(e.target.value === myEmpId ? "" : e.target.value)}
                                className="bg-secondary/70 border border-border/80 text-xs font-bold rounded-xl pl-3 pr-7 py-1.5 text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[220px] shadow-sm appearance-none hover:border-primary/40 transition-colors"
                              >
                                <option value={myEmpId}>👤 My Records ({auth?.name || "Me"})</option>
                                {employeesList
                                  .filter((e: any) => e.id !== myEmpId)
                                  .map((e: any) => (
                                    <option key={e.id} value={e.id}>
                                      {e.name} ({e.designation || e.role || e.id})
                                    </option>
                                  ))}
                              </select>
                              <ChevronRight className="absolute right-2.5 h-3.5 w-3.5 text-muted-foreground rotate-90 pointer-events-none" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                        <span className="text-xs text-muted-foreground font-semibold px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/70 whitespace-nowrap shadow-xs">
                          {attendance.filter((record) => record.employeeid === currentHistoryEmpId).length} shifts logged
                        </span>

                        {/* macOS style Segmented Control for Table / Calendar */}
                        <div className="flex items-center bg-muted/80 backdrop-blur-md p-1 rounded-xl border border-border/70 shadow-inner shrink-0">
                          <button
                            onClick={() => setMyViewMode("table")}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                              myViewMode === "table" 
                                ? "bg-background shadow-sm text-foreground" 
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Table View
                          </button>
                          <button
                            onClick={() => setMyViewMode("calendar")}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                              myViewMode === "calendar" 
                                ? "bg-background shadow-sm text-foreground" 
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Calendar View
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Table Mode: Enhanced Attendance History Cards */}
                    {myViewMode === "table" ? (
                      <div className="space-y-4">
                        {(() => {
                          const myRecords = attendance.filter((record) => record.employeeid === currentHistoryEmpId);

                          if (myRecords.length === 0) {
                            return (
                              <div className="bg-card rounded-3xl border border-border p-12 text-center text-muted-foreground shadow-sm">
                                <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="font-semibold text-foreground">No attendance history found</p>
                                <p className="text-xs text-muted-foreground mt-1">There are no shift logs recorded yet for this employee.</p>
                              </div>
                            );
                          }

                          // Group by date
                          const grouped = myRecords.reduce((acc: any, record: any) => {
                            if (!record.date) return acc;
                            if (!acc[record.date]) acc[record.date] = [];
                            acc[record.date].push(record);
                            return acc;
                          }, {});

                          return Object.entries(grouped)
                            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                            .map(([date, records]: [string, any]) => {
                              const parsedDate = new Date(date + "T00:00:00");
                              const displayDate = parsedDate.toLocaleDateString("en-GB", { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

                              let dayRemark = "";
                              records.forEach((r: any) => {
                                if (r.remark) dayRemark = r.remark;
                              });

                              const stats = computeDayAttendance(records, date, todayStr, time);
                              const { firstIn, lastOut, isActive, isLate, isHalfDay, workedH, workedM, workedS, breakH, breakM, totalH, totalM } = stats;

                              // For visual timeline (assume 10 AM to 6 PM standard bounds for the bar width)
                              const getPercent = (timeStr: string | null, isOutActive: boolean = false) => {
                                if (!timeStr) {
                                  if (isOutActive) {
                                    const now = new Date();
                                    const currentMin = (now.getHours() * 60) + now.getMinutes();
                                    return Math.max(0, Math.min(100, ((currentMin - 600) / 480) * 100));
                                  }
                                  return 100;
                                }
                                const [h, m] = timeStr.split(':').map(Number);
                                const tMin = (h * 60) + m;
                                return Math.max(0, Math.min(100, ((tMin - 600) / 480) * 100));
                              };

                              return (
                                <div key={date} className="bg-card rounded-3xl border border-border/80 shadow-sm overflow-hidden hover:shadow-md hover:border-border transition-all">
                                  {/* Card Header */}
                                  <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-secondary/15">
                                    <div className="flex items-center gap-3.5">
                                      {/* Calendar leaf icon */}
                                      <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex flex-col items-center justify-center shadow-sm shrink-0">
                                        <span className="text-[9px] font-extrabold uppercase leading-none">{parsedDate.toLocaleDateString('en-GB', { month: 'short' })}</span>
                                        <span className="text-base font-black leading-none mt-0.5">{parsedDate.getDate()}</span>
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-base text-foreground">{displayDate}</h4>
                                        <p className="text-xs text-muted-foreground font-medium">{records.length} punch{records.length > 1 ? 'es' : ''} logged for this day</p>
                                      </div>
                                    </div>

                                    {/* Status Badges */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {isHalfDay && (
                                        <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                          <PieChart className="h-3 w-3" /> Half Day
                                        </span>
                                      )}
                                      {isLate && (
                                        <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                          <AlertTriangle className="h-3 w-3" /> Late Arrival
                                        </span>
                                      )}
                                      {isActive ? (
                                        <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                          Active Shift
                                        </span>
                                      ) : (
                                        <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                          Present
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Card Body - Metric Tiles */}
                                  <div className="p-6 space-y-5">
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                      {/* First In */}
                                      <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-emerald-500/30 transition-colors">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                          <LogIn className="h-3.5 w-3.5 text-emerald-500" /> First In
                                        </div>
                                        <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                                          {firstIn !== "23:59" ? formatTime12Hour(firstIn) : "--:--"}
                                        </p>
                                      </div>

                                      {/* Last Out */}
                                      <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-rose-500/30 transition-colors">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                          <LogOut className="h-3.5 w-3.5 text-rose-500" /> Last Out
                                        </div>
                                        <p className="font-extrabold text-rose-600 dark:text-rose-400 text-base">
                                          {lastOut !== "00:00" ? formatTime12Hour(lastOut) : (isActive ? "Active Shift" : "--:--")}
                                        </p>
                                      </div>

                                      {/* Hours Worked */}
                                      <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                          <Briefcase className="h-3.5 w-3.5 text-primary" /> Worked
                                        </div>
                                        <p className="font-extrabold text-foreground text-base">
                                          {workedH}h {workedM}m {isActive && <span className="text-muted-foreground/70 text-xs font-semibold ml-0.5">{workedS}s</span>}
                                        </p>
                                      </div>

                                      {/* Break Time */}
                                      <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-amber-500/30 transition-colors">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                          <Coffee className="h-3.5 w-3.5 text-amber-500" /> Break Time
                                        </div>
                                        <p className="font-extrabold text-amber-600 dark:text-amber-400 text-base">
                                          {breakH > 0 ? `${breakH}h ` : ''}{breakM}m
                                        </p>
                                      </div>

                                      {/* Total Time */}
                                      <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-sky-500/30 transition-colors">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                          <Clock className="h-3.5 w-3.5 text-sky-500" /> Total Time
                                        </div>
                                        <p className="font-extrabold text-sky-600 dark:text-sky-400 text-base">
                                          {totalH}h {totalM}m
                                        </p>
                                      </div>
                                    </div>

                                    {/* Check-in Segments */}
                                    {records.length > 1 && (
                                      <div className="pt-2">
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                          <Activity className="h-3 w-3 text-primary" /> Check-in Segments ({records.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {[...records].sort((a: any, b: any) => (a.checkin || "").localeCompare(b.checkin || "")).map((r: any, i: number) => (
                                            <span key={r.id || i} className="text-xs font-semibold bg-secondary/80 border border-border/70 px-3 py-1.5 rounded-xl text-foreground shadow-sm flex items-center gap-1.5">
                                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                              {r.checkin ? formatTime12Hour(r.checkin) : '--'} → {r.checkout ? formatTime12Hour(r.checkout) : 'Active Now'}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Admin Remark Callout */}
                                    {dayRemark && (
                                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                                        <p className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                          <FileText className="h-3.5 w-3.5" /> Admin Remark
                                        </p>
                                        <p className="font-medium text-foreground text-sm">
                                          "{dayRemark}"
                                        </p>
                                      </div>
                                    )}

                                    {/* Visual Shift Timeline Track */}
                                    <div className="pt-2">
                                      <div className="flex justify-between text-[11px] text-muted-foreground font-bold mb-2 px-1">
                                        <span className="flex items-center gap-1">
                                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                          10:00 AM (Standard Start)
                                        </span>
                                        <span className="text-xs text-muted-foreground/80 font-semibold">02:00 PM (Mid)</span>
                                        <span className="flex items-center gap-1">
                                          06:00 PM (Standard Close)
                                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                        </span>
                                      </div>

                                      <div className="h-3.5 w-full bg-secondary/80 rounded-full overflow-hidden relative border border-border/60 shadow-inner">
                                        <TooltipProvider>
                                          {records.map((r: any, idx: number) => {
                                            const sPct = getPercent(r.checkin);
                                            const isRecActive = !r.checkout;
                                            const ePct = getPercent(r.checkout, isRecActive);
                                            const wPct = Math.max(1, ePct - sPct);
                                            const tooltipText = `${r.checkin ? formatTime12Hour(r.checkin) : '--'} - ${r.checkout ? formatTime12Hour(r.checkout) : 'Active Now'}`;
                                            return (
                                              <Tooltip key={idx}>
                                                <TooltipTrigger asChild>
                                                  <div
                                                    className={`absolute top-0 bottom-0 ${
                                                      isRecActive 
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse shadow-sm' 
                                                        : 'bg-gradient-to-r from-primary to-indigo-600 shadow-sm'
                                                    } rounded-full transition-all duration-700 cursor-pointer hover:opacity-90`}
                                                    style={{ left: `${sPct}%`, width: `${wPct}%` }}
                                                  />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-popover text-popover-foreground border border-border shadow-md rounded-xl p-2">
                                                  <p className="font-bold text-xs">{tooltipText}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            );
                                          })}
                                        </TooltipProvider>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {(() => {
                          const year = calendarMonth.getFullYear();
                          const month = calendarMonth.getMonth();
                          const firstDay = new Date(year, month, 1).getDay();
                          const daysInMonth = new Date(year, month + 1, 0).getDate();

                          const viewRecords = attendance.filter((record) => record.employeeid === currentHistoryEmpId);

                          // Group by date
                          const dailyTotals: any = Object.values(
                            viewRecords.reduce((acc: any, record: any) => {
                              if (!record.date) return acc;
                              if (!acc[record.date]) {
                                acc[record.date] = { date: record.date, records: [], remark: record.remark || "" };
                              } else if (!acc[record.date].remark && record.remark) {
                                acc[record.date].remark = record.remark;
                              }
                              acc[record.date].records.push(record);
                              return acc;
                            }, {} as Record<string, any>)
                          ).reduce((acc: any, day: any) => {
                            acc[day.date] = day;
                            return acc;
                          }, {} as any);

                          const days = [];
                          for (let i = 0; i < firstDay; i++) {
                            days.push(<div key={`pad-${i}`} className="h-28 bg-secondary/10 border-r border-b border-border/50"></div>);
                          }
                          for (let d = 1; d <= daysInMonth; d++) {
                            const dateObj = new Date(year, month, d);
                            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                            const dayData = dailyTotals[dateStr];
                            const isWeekend = dateObj.getDay() === 0; // Only Sunday is weekend off (Saturday is a working day)
                            const isFuture = dateStr > todayStr;
                            const holiday = MASTER_HOLIDAYS.find(h => h.isoDate === dateStr);

                            // Check approved leave
                            const employeeLeaves = (leaves || []).filter((l: any) =>
                              isMatchingEmpLeave(l, currentHistoryEmpId) &&
                              (l.status === 'Approved' || l.status === 'approved') &&
                              dateStr >= (l.start_date || l.startdate || '') &&
                              dateStr <= (l.end_date || l.enddate || '')
                            );
                            const hasLeave = employeeLeaves.length > 0;
                            const isToday = dateStr === todayStr;

                            let status = "Absent";
                            let tooltip = "No check-in recorded";
                            let badgeContent: React.ReactNode = null;

                            if (dayData) {
                              const dayStats = computeDayAttendance(dayData.records, dateStr, todayStr, time);
                              const { firstIn, lastOut, isHalfDay: dayHalf, isLate: dayLate, workedH, workedM, breakH, breakM, totalH, totalM, isActive } = dayStats;

                              if (dayHalf) {
                                status = "Half Day";
                                badgeContent = (
                                  <span className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25 px-2 py-0.5 rounded-lg w-full">
                                    Half Day
                                  </span>
                                );
                              } else {
                                status = "Present";
                                badgeContent = (
                                  <span className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 px-2 py-0.5 rounded-lg w-full truncate">
                                    <Clock className="h-3 w-3 shrink-0 text-emerald-600" />
                                    {totalH}h {totalM}m
                                  </span>
                                );
                              }
                              tooltip = `Clock In: ${firstIn !== "23:59" ? formatTime12Hour(firstIn) : '--:--'}\nClock Out: ${lastOut !== "00:00" ? formatTime12Hour(lastOut) : (isActive ? 'Active Shift' : '--:--')}\nHours Worked: ${workedH}h ${workedM}m\nBreak Time: ${breakH > 0 ? `${breakH}h ` : ''}${breakM}m\nTotal Time: ${totalH}h ${totalM}m`;
                            } else if (hasLeave) {
                              status = "Leave";
                              badgeContent = (
                                <span className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/25 px-2 py-0.5 rounded-lg w-full">
                                  Leave
                                </span>
                              );
                              tooltip = `Approved Leave: ${employeeLeaves[0]?.reason || employeeLeaves[0]?.type || 'Leave'}`;
                            } else if (holiday) {
                              status = "Holiday";
                              badgeContent = (
                                <span className="inline-flex items-center justify-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 px-2 py-0.5 rounded-lg w-full truncate" title={holiday.name}>
                                  <Sparkles className="h-3 w-3 shrink-0 text-indigo-500" />
                                  <span className="truncate">{holiday.name}</span>
                                </span>
                              );
                              tooltip = `Official Holiday: ${holiday.name} (${holiday.type})`;
                            } else if (isWeekend) {
                              status = "Weekend";
                              badgeContent = (
                                <span className="inline-flex items-center justify-center text-[10px] font-medium text-muted-foreground/70 bg-secondary/50 border border-border/50 px-2 py-0.5 rounded-lg w-full">
                                  Weekend
                                </span>
                              );
                              tooltip = "Weekend Off";
                            } else if (isFuture) {
                              status = "Upcoming";
                              badgeContent = (
                                <span className="inline-flex items-center justify-center text-[11px] text-muted-foreground/40 font-medium">
                                  —
                                </span>
                              );
                              tooltip = "Upcoming Working Day";
                            } else {
                              badgeContent = (
                                <span className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 rounded-lg w-full">
                                  Absent
                                </span>
                              );
                            }

                            let dayStats: any = null;
                            let isLate = false;
                            if (dayData) {
                              dayStats = computeDayAttendance(dayData.records, dateStr, todayStr, time);
                              isLate = dayStats.isLate;
                            }

                            days.push(
                              <TooltipProvider key={d}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={() => {
                                        setSelectedDayInfo(dayData ? { ...dayData, ...dayStats, employeeid: currentHistoryEmpId } : {
                                          date: dateStr,
                                          isAbsent: !isWeekend && !isFuture && !holiday && !hasLeave,
                                          isWeekend,
                                          isFuture,
                                          holiday: holiday?.name,
                                          hasLeave,
                                          leaveDetails: employeeLeaves[0],
                                          employeeid: currentHistoryEmpId
                                        });
                                        setIsDaySheetOpen(true);
                                      }}
                                      className={`h-[106px] p-2.5 border-r border-b border-border/60 hover:bg-secondary/40 cursor-pointer transition-all relative flex flex-col justify-between group overflow-hidden ${
                                        isWeekend ? 'bg-secondary/15' : isToday ? 'bg-primary/[0.04]' : 'bg-card'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start">
                                        {isToday ? (
                                          <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-extrabold text-xs flex items-center justify-center shadow-xs">
                                            {d}
                                          </span>
                                        ) : (
                                          <span className={`text-xs font-bold ${dayData ? 'text-foreground' : isWeekend ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                                            {d}
                                          </span>
                                        )}
                                        {isLate && dayData && (
                                          <span className="text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                                            LATE
                                          </span>
                                        )}
                                        {holiday && !dayData && (
                                          <span className="text-[9px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 px-1.5 py-0.2 rounded-md uppercase">
                                            HOLIDAY
                                          </span>
                                        )}
                                      </div>
                                      <div className="w-full flex items-center justify-center transition-transform group-hover:scale-[1.02]">
                                        {badgeContent}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="whitespace-pre-line text-xs font-medium">
                                    {tooltip}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }

                          return (
                            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
                              <div className="flex items-center justify-between p-4 border-b border-border/60 bg-secondary/15">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                                  className="rounded-xl gap-1.5 h-9 font-semibold hover:bg-secondary border-border/80"
                                >
                                  <ChevronLeft className="h-4 w-4" /> Prev
                                </Button>
                                <div className="text-center">
                                  <h3 className="font-extrabold text-xl tracking-tight text-foreground flex items-center justify-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-primary" />
                                    {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCalendarMonth(new Date(time.getFullYear(), time.getMonth(), 1))}
                                    className="rounded-xl h-9 font-semibold hover:bg-secondary border-border/80"
                                  >
                                    Today
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                                    className="rounded-xl gap-1.5 h-9 font-semibold hover:bg-secondary border-border/80"
                                  >
                                    Next <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-7 bg-secondary/30 border-b border-border/60">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                  <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">{day}</div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 border-l border-t border-border/50 bg-background">
                                {days}
                              </div>
                              <div className="p-4 border-t border-border/60 bg-secondary/10 flex flex-wrap gap-4 items-center justify-center text-xs font-semibold text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Present</span>
                                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Absent</span>
                                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Half Day</span>
                                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Leave</span>
                                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Holiday</span>
                                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" /> Weekend</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="team" className="m-0 border-none p-0 outline-none space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Present Today */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/[0.08] via-card to-card rounded-3xl border border-emerald-500/25 p-6 shadow-sm hover:shadow-md transition-all space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Present Today</span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      <Users className="h-4.5 w-4.5" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-foreground">{teamTodayRecords.length}<span className="text-muted-foreground text-lg font-medium"> / {employeesList.length}</span></div>
                  <p className="text-xs text-muted-foreground font-medium">Checked-in staff members today</p>
                </div>

                {/* Attendance Rate */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/[0.08] via-card to-card rounded-3xl border border-purple-500/25 p-6 shadow-sm hover:shadow-md transition-all space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Attendance Rate</span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                      <TrendingUp className="h-4.5 w-4.5" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-foreground">{Math.round((teamTodayRecords.length / (employeesList.length || 1)) * 100) || 0}%</div>
                  <p className="text-xs text-muted-foreground font-medium">Overall workforce turnout ratio</p>
                </div>

                {/* Active Shifts */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/[0.08] via-card to-card rounded-3xl border border-amber-500/25 p-6 shadow-sm hover:shadow-md transition-all space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Active Shifts</span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                      <Clock className="h-4.5 w-4.5" />
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-foreground">{teamTodayRecords.filter(r => !r.checkout).length}</div>
                  <p className="text-xs text-muted-foreground font-medium">Employees currently on the clock</p>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input placeholder="Search team member, role, or location..." className="flex h-11 w-full rounded-2xl border border-border/80 bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm" />
                </div>
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center text-sm font-semibold border border-border/80 rounded-2xl h-11 px-4 bg-background hover:bg-secondary/60 transition-colors shadow-sm cursor-pointer">
                        Selected Date: {format(teamSelectedDate, "dd/MM/yyyy")} <CalendarIcon className="h-4 w-4 ml-2.5 text-primary" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={teamSelectedDate}
                        onSelect={(date) => date && setTeamSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-4">
                {teamTodayRecords.length > 0 ? (
                  Object.values(
                    teamTodayRecords.reduce((acc: any, record: any) => {
                      if (!acc[record.employeeid]) {
                        acc[record.employeeid] = {
                          employeeid: record.employeeid,
                          id: record.id,
                          records: [],
                          firstIn: record.checkin || "23:59",
                          lastOut: record.checkout || "00:00",
                          isActive: false,
                          totalSecs: 0,
                          notes: [],
                          locations: [],
                          remark: record.remark || "",
                        };
                      } else {
                        if (!acc[record.employeeid].remark && record.remark) {
                          acc[record.employeeid].remark = record.remark;
                        }
                      }

                      const empGroup = acc[record.employeeid];
                      empGroup.records.push(record);

                      if (record.checkin && record.checkin < empGroup.firstIn) {
                        empGroup.firstIn = record.checkin;
                      }

                      if (record.checkout && record.checkout > empGroup.lastOut) {
                        empGroup.lastOut = record.checkout;
                      }
                      if (record.checkin && record.checkin > empGroup.lastOut) {
                        empGroup.lastOut = record.checkin;
                      }
                      if (!record.checkout) {
                        empGroup.isActive = true;
                      }

                      if (record.checkin && record.checkout) {
                        const [inH, inM] = record.checkin.split(':').map(Number);
                        const [outH, outM] = record.checkout.split(':').map(Number);
                        let diff = (outH * 3600 + outM * 60) - (inH * 3600 + inM * 60);
                        if (diff > 0) empGroup.totalSecs += diff;
                      } else if (!record.checkout && record.checkin && teamSelectedDateStr === todayStr) {
                        const [inH, inM] = record.checkin.split(':').map(Number);
                        let diff = (time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds()) - (inH * 3600 + inM * 60);
                        if (diff > 0) empGroup.totalSecs += diff;
                      }

                      if (record.note && !empGroup.notes.includes(record.note)) empGroup.notes.push(record.note);
                      if (record.location && !empGroup.locations.includes(record.location)) empGroup.locations.push(record.location);

                      return acc;
                    }, {})
                  ).map((empGroup: any) => {
                    const empDetails = getEmpDetails(empGroup.employeeid);
                    const stats = computeDayAttendance(empGroup.records, teamSelectedDateStr, todayStr, time);
                    const { firstIn, lastOut, isActive, isLate, isHalfDay, workedH, workedM, workedS, breakH, breakM, totalH, totalM, workedSecs } = stats;

                    const getPercent = (timeStr: string | null, isOutActive: boolean = false) => {
                      if (!timeStr) {
                        if (isOutActive) {
                          const now = new Date();
                          const currentMin = (now.getHours() * 60) + now.getMinutes();
                          return Math.max(0, Math.min(100, ((currentMin - 600) / 480) * 100));
                        }
                        return 100;
                      }
                      const [h, m] = timeStr.split(':').map(Number);
                      const tMin = (h * 60) + m;
                      return Math.max(0, Math.min(100, ((tMin - 600) / 480) * 100));
                    };

                    return (
                      <div 
                        key={empGroup.id} 
                        onClick={() => { setSelectedDayInfo({ ...empGroup, ...stats, date: teamSelectedDateStr, hasActive: isActive, totalSeconds: workedSecs, isAbsent: false }); setIsDaySheetOpen(true); }} 
                        className="bg-card rounded-3xl border border-border/80 shadow-sm overflow-hidden hover:shadow-md hover:border-border transition-all cursor-pointer"
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-secondary/15">
                          <div className="flex items-center gap-3.5">
                            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                              {empDetails.initials || "U"}
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-foreground">{empDetails.name}</h4>
                              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                <span>{empDetails.role}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground/70" />
                                  {empGroup.locations.join(", ") || "Office"}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isHalfDay && (
                              <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <PieChart className="h-3 w-3" /> Half Day
                              </span>
                            )}
                            {isLate && (
                              <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Late
                              </span>
                            )}
                            {isActive ? (
                              <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>Active Shift
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Present
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Body - Metric Tiles */}
                        <div className="p-6 space-y-5">
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {/* Clock In */}
                            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-emerald-500/30 transition-colors">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                <LogIn className="h-3.5 w-3.5 text-emerald-500" /> Clock In
                              </div>
                              <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                                {firstIn !== "23:59" ? formatTime12Hour(firstIn) : "--:--"}
                              </p>
                            </div>

                            {/* Clock Out */}
                            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-rose-500/30 transition-colors">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                <LogOut className="h-3.5 w-3.5 text-rose-500" /> Clock Out
                              </div>
                              <p className="font-extrabold text-rose-600 dark:text-rose-400 text-base">
                                {lastOut !== "00:00" ? formatTime12Hour(lastOut) : (isActive ? "Active Shift" : "--:--")}
                              </p>
                            </div>

                            {/* Hours Worked */}
                            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                <Briefcase className="h-3.5 w-3.5 text-primary" /> Worked
                              </div>
                              <p className="font-extrabold text-foreground text-base">
                                {workedH}h {workedM}m {isActive && <span className="text-muted-foreground/70 text-xs font-semibold ml-0.5">{workedS}s</span>}
                              </p>
                            </div>

                            {/* Break Time */}
                            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-amber-500/30 transition-colors">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                <Coffee className="h-3.5 w-3.5 text-amber-500" /> Break Time
                              </div>
                              <p className="font-extrabold text-amber-600 dark:text-amber-400 text-base">
                                {breakH > 0 ? `${breakH}h ` : ''}{breakM}m
                              </p>
                            </div>

                            {/* Total Time */}
                            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-sky-500/30 transition-colors">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
                                <Clock className="h-3.5 w-3.5 text-sky-500" /> Total Time
                              </div>
                              <p className="font-extrabold text-sky-600 dark:text-sky-400 text-base">
                                {totalH}h {totalM}m
                              </p>
                            </div>
                          </div>

                          {/* Focus Note & Admin Remark */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-2xl bg-secondary/20 border border-border/50">
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Shift Focus Note
                              </p>
                              <p className="font-medium text-foreground text-sm italic">
                                "{empGroup.notes.join(" | ") || "No note provided for this shift"}"
                              </p>
                            </div>

                            {(empGroup.remark || canEditRemarks) && (
                              <div className="p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" /> Admin Remark
                                  </p>
                                  {canEditRemarks && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-3 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl font-bold transition-all gap-1 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRemarkTarget({ empId: empGroup.employeeid, date: teamSelectedDateStr, currentRemark: empGroup.remark || "" });
                                        setRemarkDraft(empGroup.remark || "");
                                        setRemarkDialogOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                      {empGroup.remark ? "Edit Remark" : "Add Remark"}
                                    </Button>
                                  )}
                                </div>
                                <p className="font-medium text-foreground text-sm">
                                  {empGroup.remark ? `"${empGroup.remark}"` : <span className="text-muted-foreground/60 italic">No remark added yet.</span>}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Check-in Segments */}
                          {empGroup.records.length > 1 && (
                            <div className="pt-2">
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Activity className="h-3 w-3 text-primary" /> Check-in Segments ({empGroup.records.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {([...empGroup.records] as any[]).sort((a: any, b: any) => (a.checkin || "").localeCompare(b.checkin || "")).map((r: any, i: number) => (
                                  <span key={r.id || i} className="text-xs font-semibold bg-secondary/80 border border-border/70 px-3 py-1.5 rounded-xl text-foreground shadow-sm flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    {r.checkin ? formatTime12Hour(r.checkin) : '--'} → {r.checkout ? formatTime12Hour(r.checkout) : 'Active Now'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Visual Shift Timeline Track */}
                          <div className="pt-2">
                            <div className="flex justify-between text-[11px] text-muted-foreground font-bold mb-2 px-1">
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                10:00 AM (Standard Start)
                              </span>
                              <span className="text-xs text-muted-foreground/80 font-semibold">02:00 PM (Mid)</span>
                              <span className="flex items-center gap-1">
                                06:00 PM (Standard Close)
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              </span>
                            </div>

                            <div className="h-3.5 w-full bg-secondary/80 rounded-full overflow-hidden relative border border-border/60 shadow-inner">
                              <TooltipProvider>
                                {empGroup.records.map((r: any, idx: number) => {
                                  const sPct = getPercent(r.checkin);
                                  const isRecActive = !r.checkout;
                                  const ePct = getPercent(r.checkout, isRecActive);
                                  const wPct = Math.max(1, ePct - sPct);
                                  const tooltipText = `${r.checkin ? formatTime12Hour(r.checkin) : '--'} - ${r.checkout ? formatTime12Hour(r.checkout) : 'Active Now'}`;
                                  return (
                                    <Tooltip key={idx}>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={`absolute top-0 bottom-0 ${
                                            isRecActive 
                                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse shadow-sm' 
                                              : 'bg-gradient-to-r from-primary to-indigo-600 shadow-sm'
                                          } rounded-full transition-all duration-700 cursor-pointer hover:opacity-90`}
                                          style={{ left: `${sPct}%`, width: `${wPct}%` }}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-popover text-popover-foreground border border-border shadow-md rounded-xl p-2">
                                        <p className="font-bold text-xs">{tooltipText}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-card rounded-3xl border border-border p-8 text-center text-muted-foreground shadow-sm">
                    No team check-ins today.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="m-0 border-none p-0 outline-none space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayEmpIds.length === 0 ? (
                  <div className="col-span-full rounded-3xl border border-border border-dashed bg-secondary/30 p-20 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/60 mx-auto mb-4">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-base font-semibold text-foreground">No attendance history found</p>
                    <p className="text-xs text-muted-foreground mt-1">No employee shift records have been logged in the system.</p>
                  </div>
                ) : (
                  displayEmpIds.map(empId => {
                    const details = getEmpDetails(empId as string);
                    const empRecords = attendance.filter((a: any) => a.employeeid === empId).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    const dailyTotals = Object.values(
                      empRecords.reduce((acc: any, record: any) => {
                        if (!acc[record.date]) {
                          acc[record.date] = { date: record.date, records: [], remark: record.remark || "" };
                        } else {
                          if (!acc[record.date].remark && record.remark) {
                            acc[record.date].remark = record.remark;
                          }
                        }
                        acc[record.date].records.push(record);
                        return acc;
                      }, {})
                    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    return (
                      <div key={empId as string} className="rounded-3xl border border-border/80 bg-card shadow-xs hover:shadow-md hover:border-primary/20 transition-all duration-200 p-5 flex flex-col justify-between">
                        <div>
                          {/* Card Header */}
                          <div className="flex items-center justify-between gap-3 mb-4 pb-3.5 border-b border-border/60">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-indigo-500/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm uppercase shadow-xs shrink-0">
                                {details.initials || details.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-foreground text-sm tracking-tight truncate">{details.name}</h3>
                                <p className="text-xs text-muted-foreground truncate">{details.role || "Team Member"}</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 border ${
                              dailyTotals.length > 0 
                                ? "bg-primary/10 text-primary border-primary/20" 
                                : "bg-secondary text-muted-foreground border-border/70"
                            }`}>
                              <CalendarDays className="h-3 w-3" />
                              {dailyTotals.length} {dailyTotals.length === 1 ? 'day' : 'days'}
                            </span>
                          </div>

                          {/* Records List or Clean Empty State */}
                          {dailyTotals.length === 0 ? (
                            <div className="py-10 px-4 text-center rounded-2xl bg-secondary/30 border border-dashed border-border/70 flex flex-col items-center justify-center gap-2">
                              <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground/60">
                                <CalendarDays className="h-4 w-4" />
                              </div>
                              <p className="text-xs font-semibold text-muted-foreground">No shifts recorded yet</p>
                              <p className="text-[11px] text-muted-foreground/60">Staff member has no logged shifts.</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1.5 custom-scrollbar">
                              {dailyTotals.map((day: any) => {
                                const stats = computeDayAttendance(day.records, day.date, todayStr, time);
                                const { firstIn, lastOut, isActive, workedH, workedM, workedS, workedSecs } = stats;

                                return (
                                  <div key={day.date} className="group rounded-2xl border border-border/70 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 p-3 transition-all duration-200 space-y-2">
                                    {/* Top Row: Date & Status */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'}`} />
                                        <span className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1.5">
                                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                          {day.date}
                                        </span>
                                      </div>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        isActive
                                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                          : "bg-secondary text-muted-foreground border border-border/70"
                                      }`}>
                                        {isActive ? "Active Now" : "Completed"}
                                      </span>
                                    </div>

                                    {/* Metrics & Remark Button */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                      <span className="inline-flex items-center gap-1 bg-card border border-border/60 px-2 py-1 rounded-lg text-muted-foreground font-medium">
                                        <Clock className="h-3 w-3 text-primary" />
                                        {firstIn !== "23:59" ? formatTime12Hour(firstIn) : "--:--"} {!isActive ? `→ ${lastOut !== "00:00" ? formatTime12Hour(lastOut) : "--:--"}` : ""}
                                      </span>
                                      {workedSecs > 0 && (
                                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-lg font-bold">
                                          <Timer className="h-3 w-3" />
                                          {workedH}h {workedM}m
                                          {isActive && <span className="opacity-70 ml-0.5">{workedS}s</span>}
                                        </span>
                                      )}
                                      <span className="inline-flex items-center gap-1 bg-card border border-border/60 px-2 py-1 rounded-lg text-muted-foreground">
                                        <Building2 className="h-3 w-3 text-muted-foreground" /> Office
                                      </span>
                                      {canEditRemarks && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRemarkTarget({ empId: empId as string, date: day.date, currentRemark: day.remark || "" });
                                            setRemarkDraft(day.remark || "");
                                            setRemarkDialogOpen(true);
                                          }}
                                          className={`ml-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                            day.remark
                                              ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                              : "bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border-border/70"
                                          }`}
                                          title={day.remark ? "Edit Remark" : "Add Remark"}
                                        >
                                          {day.remark ? (
                                            <>
                                              <Pencil className="h-2.5 w-2.5" />
                                              <span>Edit</span>
                                            </>
                                          ) : (
                                            <>
                                              <MessageSquare className="h-2.5 w-2.5" />
                                              <span>Remark</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>

                                    {/* Admin Remark Callout */}
                                    {day.remark && (
                                      <div className="pt-2 border-t border-dashed border-border/60 flex items-start gap-1.5 text-[11px] bg-amber-500/10 dark:bg-amber-950/20 text-foreground p-2 rounded-xl border border-amber-500/20">
                                        <MessageSquare className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-muted-foreground leading-snug">
                                          <strong className="text-foreground not-italic font-semibold mr-1">Admin note:</strong>
                                          {day.remark}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </>
        )}

        <TabsContent value="leave" className="m-0 border-none p-0 outline-none space-y-6">
          {/* Top KPI Balance Widgets */}
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Casual Leave */}
            <div className="group relative overflow-hidden rounded-3xl border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/70 via-card to-card dark:from-blue-950/20 dark:via-card dark:to-card p-5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Casual Leave</span>
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  <CalendarIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground tracking-tight flex items-baseline gap-1">
                {casualBalance}
                <span className="text-muted-foreground text-base font-semibold">/ 12</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {casualUsed > 0 ? `${casualUsed} day${casualUsed > 1 ? 's' : ''} used` : 'Full allowance available'}
              </p>
            </div>

            {/* Sick Leave */}
            <div className="group relative overflow-hidden rounded-3xl border border-rose-200/60 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/70 via-card to-card dark:from-rose-950/20 dark:via-card dark:to-card p-5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sick Leave</span>
                <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                  <PlusCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground tracking-tight flex items-baseline gap-1">
                {sickBalance}
                <span className="text-muted-foreground text-base font-semibold">/ 10</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {sickUsed > 0 ? `${sickUsed} day${sickUsed > 1 ? 's' : ''} used` : 'Full allowance available'}
              </p>
            </div>

            {/* Earned Leave */}
            <div className="group relative overflow-hidden rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/70 via-card to-card dark:from-emerald-950/20 dark:via-card dark:to-card p-5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Earned Leave</span>
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground tracking-tight flex items-baseline gap-1">
                {earnedBalance}
                <span className="text-muted-foreground text-base font-semibold">/ 15</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {earnedUsed > 0 ? `${earnedUsed} day${earnedUsed > 1 ? 's' : ''} used` : 'Full allowance available'}
              </p>
            </div>

            {/* Pending Requests */}
            <div className="group relative overflow-hidden rounded-3xl border border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/70 via-card to-card dark:from-amber-950/20 dark:via-card dark:to-card p-5 shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Requests</span>
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground tracking-tight flex items-baseline gap-1">
                {isAdmin ? teamPendingLeaves.length : myPendingLeaves.length}
                <span className="text-muted-foreground text-base font-semibold">open</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${(isAdmin ? teamPendingLeaves.length : myPendingLeaves.length) > 0 ? 'bg-amber-500 animate-ping' : 'bg-slate-400'}`} />
                {isAdmin ? 'Team awaiting approval' : 'Awaiting admin approval'}
              </p>
            </div>
          </div>

          {/* Search Bar & Apply Leave CTA */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={leaveSearch}
                onChange={(e) => setLeaveSearch(e.target.value)}
                placeholder="Search leaves by employee, reason, or status..."
                className="flex h-11 w-full rounded-2xl border border-border/80 bg-card px-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
            </div>
            <button
              onClick={() => setIsApplyLeaveOpen(true)}
              className="inline-flex items-center justify-center gap-2 text-sm font-bold h-11 px-6 rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary text-primary-foreground shadow-sm hover:shadow-md hover:shadow-primary/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Apply Leave
            </button>
          </div>

          {/* Team Leave Applications (Admin Only) */}
          {auth?.role === "admin" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  Team Leave Applications
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border/70">
                  {filteredTeamLeaves.length} {filteredTeamLeaves.length === 1 ? 'application' : 'applications'}
                </span>
              </div>
              <div className="bg-card rounded-3xl border border-border/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/40 text-muted-foreground text-xs font-bold uppercase tracking-wider border-b border-border">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Leave Type</th>
                        <th className="px-6 py-4">Date Range</th>
                        <th className="px-6 py-4">Reason</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {filteredTeamLeaves.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic text-sm">
                            {leaveSearch.trim() ? "No team leave applications matched your search." : "No team leave applications found."}
                          </td>
                        </tr>
                      ) : filteredTeamLeaves.map((leave: any) => {
                        const emp = getEmpDetails(leave.employeeid || leave.employee_id);
                        const statusLower = (leave.status || "pending").toLowerCase();
                        const leaveTypeLower = (leave.type || "casual").toLowerCase();

                        return (
                          <tr key={leave.id} className="hover:bg-secondary/20 transition-colors">
                            {/* Employee */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-indigo-500/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                  {emp.initials || emp.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-foreground text-sm tracking-tight">{emp.name}</p>
                                  <p className="text-xs text-muted-foreground">{emp.role || "Staff"}</p>
                                </div>
                              </div>
                            </td>

                            {/* Leave Type */}
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                leaveTypeLower === 'casual'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                  : leaveTypeLower === 'sick'
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              }`}>
                                {leave.type || "Casual"}
                              </span>
                            </td>

                            {/* Date Range */}
                            <td className="px-6 py-4">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-secondary/50 border border-border/60 text-xs font-semibold text-foreground">
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{leave.startdate || leave.start_date}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-primary font-bold">{leave.enddate || leave.end_date}</span>
                              </div>
                            </td>

                            {/* Reason */}
                            <td className="px-6 py-4 text-xs text-muted-foreground max-w-[280px]">
                              <p className="truncate font-medium text-foreground/80">{leave.reason || "—"}</p>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                                statusLower === 'approved'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : statusLower === 'declined'
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              }`}>
                                {statusLower === 'approved' ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Approved</span>
                                  </>
                                ) : statusLower === 'declined' ? (
                                  <>
                                    <X className="h-3.5 w-3.5" />
                                    <span>Declined</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Pending</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              {statusLower === 'pending' || !leave.status ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setLeaves(leaves.map((l: any) => l.id === leave.id ? { ...l, status: 'Approved' } : l));
                                      toast.success("Leave approved");
                                    }}
                                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs hover:shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setLeaves(leaves.map((l: any) => l.id === leave.id ? { ...l, status: 'Declined' } : l));
                                      toast.success("Leave declined");
                                    }}
                                    className="inline-flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-xs px-3.5 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer"
                                  >
                                    <X className="h-3.5 w-3.5 stroke-[2.5]" />
                                    <span>Decline</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setLeaves(leaves.filter((l: any) => l.id !== leave.id));
                                    toast.success("Leave request removed");
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-600 font-semibold py-1.5 px-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200/50 transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* My Leave Applications */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                  <CalendarDays className="h-4 w-4" />
                </div>
                My Leave Applications
              </h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border/70">
                {filteredMyLeaves.length} {filteredMyLeaves.length === 1 ? 'application' : 'applications'}
              </span>
            </div>
            <div className="bg-card rounded-3xl border border-border/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/40 text-muted-foreground text-xs font-bold uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Leave Type</th>
                      <th className="px-6 py-4">Date Range</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {filteredMyLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                          {leaveSearch.trim() ? "No leave applications matched your search." : "You haven't submitted any leave applications."}
                        </td>
                      </tr>
                    ) : filteredMyLeaves.map((leave: any) => {
                      const statusLower = (leave.status || "pending").toLowerCase();
                      const leaveTypeLower = (leave.type || "casual").toLowerCase();

                      return (
                        <tr key={leave.id} className="hover:bg-secondary/20 transition-colors">
                          {/* Leave Type */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              leaveTypeLower === 'casual'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                : leaveTypeLower === 'sick'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            }`}>
                              {leave.type || "Casual"}
                            </span>
                          </td>

                          {/* Date Range */}
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-secondary/50 border border-border/60 text-xs font-semibold text-foreground">
                              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span>{leave.startdate || leave.start_date}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-primary font-bold">{leave.enddate || leave.end_date}</span>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="px-6 py-4 text-xs text-muted-foreground max-w-[280px]">
                            <p className="truncate font-medium text-foreground/80">{leave.reason || "—"}</p>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                              statusLower === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : statusLower === 'declined'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}>
                              {statusLower === 'approved' ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Approved</span>
                                </>
                              ) : statusLower === 'declined' ? (
                                <>
                                  <X className="h-3.5 w-3.5" />
                                  <span>Declined</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Pending</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            {statusLower === 'pending' || !leave.status ? (
                              <button
                                onClick={() => {
                                  setLeaves(leaves.filter((l: any) => l.id !== leave.id));
                                  toast.success("Leave request cancelled");
                                }}
                                className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 border border-rose-500/25 font-semibold py-1.5 px-3 rounded-xl transition-all cursor-pointer active:scale-95"
                              >
                                <X className="h-3.5 w-3.5 stroke-[2.5]" />
                                <span>Cancel</span>
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground font-medium">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isApplyLeaveOpen} onOpenChange={setIsApplyLeaveOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Applicant</Label>
              <Input value={user ? user.name : "Current User"} disabled />
            </div>
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual Leave</SelectItem>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Earned">Earned Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="e.g. Medical appointment" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyLeaveOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyLeave}>Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDaySheetOpen} onOpenChange={setIsDaySheetOpen}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh] rounded-3xl p-6">
          {selectedDayInfo && (
            <>
              <DialogHeader className="border-b border-border pb-4 mb-4">
                <DialogTitle className="text-2xl font-bold">
                  {selectedDayInfo?.date ? format(new Date(selectedDayInfo.date), "EEEE, dd MMM yyyy") : "Date Details"}
                </DialogTitle>
                <DialogDescription>
                  Attendance records and shift details for this day.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clock In</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{selectedDayInfo?.firstIn && selectedDayInfo.firstIn !== "23:59" ? formatTime12Hour(selectedDayInfo.firstIn) : "--:--"}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clock Out</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                      <p className="text-base font-bold text-rose-600 dark:text-rose-400">{selectedDayInfo?.lastOut && selectedDayInfo.lastOut !== "00:00" ? formatTime12Hour(selectedDayInfo.lastOut) : (selectedDayInfo?.hasActive ? "Active Shift" : "--:--")}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hours Worked</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedDayInfo?.workedH !== undefined ? `${selectedDayInfo.workedH}h ${selectedDayInfo.workedM}m` : (selectedDayInfo?.totalSeconds ? `${Math.floor(selectedDayInfo.totalSeconds / 3600)}h ${Math.floor((selectedDayInfo.totalSeconds % 3600) / 60)}m` : "0h 0m")}
                        {selectedDayInfo?.hasActive && <span className="text-muted-foreground/70 text-xs ml-1">{selectedDayInfo?.workedS || 0}s</span>}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Break Time</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                        {selectedDayInfo?.breakH !== undefined ? (selectedDayInfo.breakH > 0 ? `${selectedDayInfo.breakH}h ` : "") + `${selectedDayInfo.breakM}m` : "0m"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Time</span>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                        {selectedDayInfo?.totalH !== undefined ? `${selectedDayInfo.totalH}h ${selectedDayInfo.totalM}m` : (selectedDayInfo?.totalSeconds ? `${Math.floor(selectedDayInfo.totalSeconds / 3600)}h ${Math.floor((selectedDayInfo.totalSeconds % 3600) / 60)}m` : "0h 0m")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                    <p className="text-base font-bold">
                      {selectedDayInfo?.holiday ? (
                        <span className="inline-flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md text-xs">
                          🎉 {selectedDayInfo.holiday}
                        </span>
                      ) : selectedDayInfo?.hasLeave ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-xs">
                          🟣 {selectedDayInfo.leaveDetails?.reason || selectedDayInfo.leaveDetails?.type || "Approved Leave"}
                        </span>
                      ) : selectedDayInfo?.isWeekend ? (
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-xs">
                          ⚪ Weekend
                        </span>
                      ) : selectedDayInfo?.isFuture ? (
                        <span className="inline-flex items-center gap-1.5 bg-secondary text-muted-foreground px-2 py-0.5 rounded-md text-xs">
                          📅 Upcoming
                        </span>
                      ) : selectedDayInfo?.isAbsent ? (
                        <span className="inline-flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> Absent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full ${selectedDayInfo?.hasActive ? "bg-emerald-500 animate-pulse" : "bg-emerald-500"}`}></span>
                          {selectedDayInfo?.hasActive ? "Active" : "Present"}
                        </span>
                      )}
                    </p>
                  </div>

                  {(selectedDayInfo?.remark || canEditRemarks) && !selectedDayInfo?.isAbsent && (
                    <div className="col-span-2 space-y-2 mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Admin Remark</span>
                        {canEditRemarks && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRemarkTarget({ empId: selectedDayInfo.employeeid || myEmpId, date: selectedDayInfo.date, currentRemark: selectedDayInfo.remark || "" });
                              setRemarkDraft(selectedDayInfo.remark || "");
                              setRemarkDialogOpen(true);
                            }}
                            className="h-6 px-3 text-xs bg-orange-500/15 hover:bg-orange-500/25 text-orange-600 dark:text-orange-400 border border-orange-500/30 rounded-full font-semibold transition-colors cursor-pointer"
                          >
                            {selectedDayInfo.remark ? "Edit" : "Add"}
                          </button>
                        )}
                      </div>
                      <p className="font-medium text-slate-600 dark:text-slate-400">
                        {selectedDayInfo?.remark || "--"}
                      </p>
                    </div>
                  )}
                </div>

                {selectedDayInfo?.firstIn && selectedDayInfo.firstIn > "10:15" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 mt-6">
                    <div className="bg-amber-100 text-amber-700 p-2 rounded-full shrink-0">⚠️</div>
                    <div>
                      <h4 className="font-semibold text-amber-900">Late Arrival</h4>
                      <p className="text-sm text-amber-700">Check-in was after the expected 10:15 AM threshold.</p>
                    </div>
                  </div>
                )}

                {selectedDayInfo?.records && selectedDayInfo.records.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">
                      All Punches Today ({selectedDayInfo.records.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedDayInfo.records.map((r: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-secondary/20 rounded-xl border border-border/50">
                          <div className="flex items-center gap-4">
                            <div className="w-1 h-10 bg-primary/40 rounded-full"></div>
                            <div>
                              <p className="font-bold text-foreground text-base">{r.checkin ? formatTime12Hour(r.checkin) : "--:--"}</p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Clock In</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-rose-600 dark:text-rose-400 text-base">{r.checkout ? formatTime12Hour(r.checkout) : "Active Shift"}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Clock Out</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Admin Remark</DialogTitle>
            <DialogDescription>
              Add or edit a remark for this attendance record. Only visible to Admins and HR.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="remark">Remark</Label>
              <Input
                id="remark"
                value={remarkDraft}
                onChange={(e) => setRemarkDraft(e.target.value)}
                placeholder="Enter a remark or note..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRemark}>Save Remark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Attendance</DialogTitle>
            <DialogDescription>
              Filter attendance by date before downloading as CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                className="rounded-xl"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                className="rounded-xl"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" className="rounded-xl px-6" onClick={() => setIsExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportCSV} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="h-4 w-4 mr-2" /> Download CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
