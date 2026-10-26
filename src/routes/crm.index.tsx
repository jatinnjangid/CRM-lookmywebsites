import React, { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Users,
  UserCheck,
  IndianRupee,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Award,
  ChevronRight,
  Sparkles,
  User,
  Plane,
  Star,
  ListChecks,
  CheckCircle2,
  Circle,
  Phone,
  Gift,
  MessageCircle,
  Info,
  Car,
  MapPin,
  Globe,
  ArrowRight,
  Clock,
  Timer,
} from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  revenueByMonth,
  destinationPerformance,
  customers as seedCustomers,
  SEED_TASKS,
  formatINR,
} from "@/lib/mock-data";
import { getAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { INITIAL_EMPLOYEES } from "./crm.employees";
import { SEED_PACKAGES } from "./crm.packages";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/")({
  component: Dashboard,
});

const COLORS = [
  "var(--primary)",
  "color-mix(in oklch, var(--primary) 85%, var(--background))",
  "color-mix(in oklch, var(--primary) 70%, var(--background))",
  "color-mix(in oklch, var(--primary) 55%, var(--background))",
  "color-mix(in oklch, var(--primary) 40%, var(--background))",
  "color-mix(in oklch, var(--primary) 25%, var(--background))"
];

const SOURCE_HEX_COLORS: Record<string, string> = {
  Instagram: "#ec4899", // pink-500
  Facebook: "#2563eb", // blue-600
  WhatsApp: "#047857", // emerald-700
  "Walk-in": "#fde047", // yellow-300
  Website: "var(--primary)",
  Referral: "#d8b4fe", // purple-300
  Ads: "#e5e7eb", // gray-200
  "DD Pharma": "#bbf7d0", // green-200
  Other: "#fbcfe8", // pink-200
  "Old Ref": "#93c5fd", // blue-300
  "BNI INC": "#4ade80", // green-400
  BNI: "#22c55e", // green-500
};

const FUNNEL_COLORS = [
  "color-mix(in oklch, var(--primary) 20%, var(--background))",
  "color-mix(in oklch, var(--primary) 40%, var(--background))",
  "color-mix(in oklch, var(--primary) 60%, var(--background))",
  "color-mix(in oklch, var(--primary) 80%, var(--background))",
  "var(--primary)",
];

const AVATARS = ["", "", "", "", "", "", ""];

const LEADS_INIT: any[] = [];

// Custom Recharts tooltip components with crisp, modern shape & shadow
const RevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-4 py-2.5 shadow-xl min-w-[130px] text-xs pointer-events-none">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary shrink-0 ring-2 ring-primary/20" />
          <p className="font-display text-sm font-bold text-foreground">
            ₹{payload[0].value} <span className="text-xs font-semibold text-muted-foreground">Lakhs</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const SourceTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-4 py-2.5 shadow-xl min-w-[130px] text-xs pointer-events-none">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Lead Channel
        </p>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0 ring-2 ring-border/40"
            style={{ backgroundColor: item.payload?.fill || "var(--primary)" }}
          />
          <span className="text-xs font-medium text-foreground">{item.name}:</span>
          <span className="text-xs font-bold text-primary ml-auto">{item.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const renderLeadSourceLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
  // Hide slice labels for slices under 5% to eliminate collisions and overlapping
  if (!percent || percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 14;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor={Math.abs(x - cx) < 8 ? "middle" : x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-[11px] font-bold fill-primary select-none pointer-events-none"
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

const DestinationTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const valInLakhs = (item.value / 100000).toFixed(2);
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-4 py-2.5 shadow-xl min-w-[140px] text-xs pointer-events-none">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {item.payload?.name}
        </p>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0 ring-2 ring-border/40"
            style={{ backgroundColor: item.payload?.fill || "var(--primary)" }}
          />
          <span className="text-xs font-medium text-muted-foreground">Sales:</span>
          <span className="text-sm font-bold text-foreground ml-auto">₹{valInLakhs} L</span>
        </div>
      </div>
    );
  }
  return null;
};

const BookingsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-4 py-2.5 shadow-xl min-w-[130px] text-xs pointer-events-none">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary shrink-0 ring-2 ring-primary/20" />
          <span className="text-xs font-medium text-muted-foreground">Bookings:</span>
          <span className="text-sm font-bold text-foreground ml-auto">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const FunnelTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-4 py-2.5 shadow-xl min-w-[130px] text-xs pointer-events-none">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Pipeline Stage
        </p>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0 ring-2 ring-border/40"
            style={{ backgroundColor: item.payload?.fill || "var(--primary)" }}
          />
          <span className="text-xs font-medium text-foreground">{item.payload?.stage}:</span>
          <span className="text-xs font-bold text-primary ml-auto">{item.value} Leads</span>
        </div>
      </div>
    );
  }
  return null;
};

function getLocalStorageItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function formatLakhs(amount: number) {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakhs`;
  }
  return formatINR(amount);
}

function Dashboard() {
  const user = getAuth();
  const navigate = useNavigate();

  // Read dynamic lists from Supabase
  const [leadsList] = useSupabaseTable<any[]>("leads", LEADS_INIT);
  const [bookingsList] = useSupabaseTable<any[]>("bookings", []);
  const [customersList] = useSupabaseTable<any[]>("customers", seedCustomers);
  const [employeesList] = useSupabaseTable<any[]>("employees", INITIAL_EMPLOYEES);
  const [packagesList] = useSupabaseTable<any[]>("packages", SEED_PACKAGES);
  const [tasksList, setTasksList] = useSupabaseTable<any[]>("tasks", SEED_TASKS);
  const [attendanceList] = useSupabaseTable<any[]>("attendance", []);
  
  // Accounts tables for KPIs
  const [transactions] = useSupabaseTable<any[]>("transactions", []);
  const [followUpsList] = useSupabaseTable<any[]>("payment_followups", []);
  const [insuranceList] = useSupabaseTable<any[]>("insurance_policies", []);
  const [taxiBookingsList] = useSupabaseTable<any[]>("crm_taxi_bookings", []);
  const [visaBookingsList] = useSupabaseTable<any[]>("crm_visa_bookings", []);

  const [topClientType, setTopClientType] = useState<"Travel" | "Insurance">("Travel");

  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Calculate KPI Metrics
  const todayLeadsCount = leadsList.filter(
    (l) => l.createdAt && l.createdAt.slice(0, 10) === todayStr,
  ).length;
  const todaySalesAmount = bookingsList
    .filter((b) => b.bookingDate && b.bookingDate.slice(0, 10) === todayStr)
    .reduce((sum, b) => sum + (b.amount || 0), 0);
  const activeBookingsCount = bookingsList.filter(
    (b) => b.status === "Confirmed" || b.status === "Pending",
  ).length;
  
  // Pending Payments from Bookings
  const pendingPaymentsAmount = bookingsList.reduce((sum, b) => sum + ((b.amount || 0) - (b.paid || 0)), 0);
    
  const followupsTodayCount = leadsList.filter(
    (l) => l.nextFollowUp && l.nextFollowUp.slice(0, 10) === todayStr,
  ).length;

  const upcomingDeparturesCount = bookingsList.filter((b) => {
    if (!b.travelDate) return false;
    const diff = (new Date(b.travelDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  const convertedLeadsList = leadsList.filter(
    (l) => l.status === "Booked" || l.status === "Travel Completed" || l.status === "Completed"
  );
  const conversionRate = leadsList.length > 0 ? ((convertedLeadsList.length / leadsList.length) * 100).toFixed(1) : "0.0";
  const convertedNames = convertedLeadsList.length > 0 ? convertedLeadsList.map((l) => l.name).join(", ") : "No conversions yet";
  
  // Monthly Revenue from Bookings
  const monthlyRevenueTotal = bookingsList.reduce((sum, b) => sum + (b.paid || 0), 0);

  // 2. Chart data aggregations
  // Lead Source Distribution
  const sourceCounts: Record<string, number> = {};
  leadsList.forEach((l) => {
    const src = l.source || "Other";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sourceData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const totalLeadsForSource = sourceData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  // Destination-wise Sales
  const destSalesMap: Record<string, number> = {};
  bookingsList.forEach((b) => {
    const destRaw = b.details?.destination || b.package?.split(" ")[0] || "Other";
    const dest = destRaw.trim().toUpperCase();
    destSalesMap[dest] = (destSalesMap[dest] || 0) + b.amount;
  });
  const destinationSalesData = Object.entries(destSalesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Staff/Agent Performance Aggregation
  const staffStatsMap: Record<
    string,
    {
      name: string;
      role: string;
      totalLeads: number;
      convertedLeads: number;
      revenue: number;
      avatar: string;
    }
  > = {};

  if (employeesList && employeesList.length > 0) {
    employeesList.forEach((emp) => {
      staffStatsMap[emp.name] = {
        name: emp.name,
        role: emp.role,
        totalLeads: 0,
        convertedLeads: 0,
        revenue: 0,
        avatar: emp.avatar,
      };
    });
  }

  leadsList.forEach((lead) => {
    const name = lead.assignedTo || "Unassigned";
    if (!staffStatsMap[name]) {
      staffStatsMap[name] = {
        name,
        role: "Travel Consultant",
        totalLeads: 0,
        convertedLeads: 0,
        revenue: 0,
        avatar: lead.avatar || `https://i.pravatar.cc/80?img=${Math.floor(Math.random() * 70)}`,
      };
    }
    staffStatsMap[name].totalLeads += 1;
    if (
      lead.status === "Booked" ||
      lead.status === "Travel Completed" ||
      lead.status === "Completed"
    ) {
      staffStatsMap[name].convertedLeads += 1;
      staffStatsMap[name].revenue += lead.budget || 0;
    }
  });

  const staffStats = Object.values(staffStatsMap)
    .filter(
      (staff) =>
        staff.totalLeads > 0 || (employeesList && employeesList.some((e) => e.name === staff.name)),
    )
    .sort((a, b) => b.revenue - a.revenue || b.totalLeads - a.totalLeads);

  // Employee Task & CRM Time Performance Aggregation
  const employeeTaskStats = (employeesList || INITIAL_EMPLOYEES)
    .map((emp) => {
      // 1. Task Matching (match assignee or assigned_to by name, ID, or empId)
      const empTasks = (tasksList || []).filter((t) => {
        const aTo = (t.assigned_to || t.assignee || "").toLowerCase().trim();
        const eName = (emp.name || "").toLowerCase().trim();
        const eId = (emp.id || "").toLowerCase().trim();
        const eEmpId = (emp.empId || "").toLowerCase().trim();
        return (
          aTo === eName ||
          (eId && aTo === eId) ||
          (eEmpId && aTo === eEmpId)
        );
      });

      const completedTasks = empTasks.filter(
        (t) => t.status === "Done" || t.status === "Completed" || t.progress === 100,
      ).length;
      const totalTasks = empTasks.length;
      const pendingTasks = Math.max(0, totalTasks - completedTasks);

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // 2. Attendance & CRM Time Spent Today
      const empAttendance = (attendanceList || []).filter((a) => {
        const aEmpId = (a.employeeid || a.employee_id || "").trim();
        const aEmpName = (a.employee_name || a.name || "").toLowerCase().trim();
        const eName = (emp.name || "").toLowerCase().trim();
        const eId = (emp.id || "").trim();
        const eEmpId = (emp.empId || "").trim();
        
        return (
          (eId && aEmpId === eId) ||
          (eEmpId && aEmpId === eEmpId) ||
          (eName && aEmpName === eName) ||
          (emp.name === "Manvendra Singhal" && (aEmpId === "EMP001" || aEmpId === eId))
        );
      });

      const todayRecords = empAttendance.filter((a) => a.date === todayStr);
      let workedMinutes = 0;
      let isCurrentlyActive = false;

      todayRecords.forEach((r) => {
        if (!r.checkin) return;
        const [inH, inM] = r.checkin.split(":").map(Number);
        if (isNaN(inH) || isNaN(inM)) return;
        const inMinutes = inH * 60 + inM;

        let outMinutes = inMinutes;
        if (r.checkout) {
          const [outH, outM] = r.checkout.split(":").map(Number);
          if (!isNaN(outH) && !isNaN(outM)) {
            outMinutes = Math.max(inMinutes, outH * 60 + outM);
          }
        } else {
          // currently active shift
          isCurrentlyActive = true;
          const now = new Date();
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          outMinutes = Math.max(inMinutes, nowMinutes);
        }
        workedMinutes += Math.max(0, outMinutes - inMinutes);
      });

      const workedHours = Math.floor(workedMinutes / 60);
      const workedM = workedMinutes % 60;
      const timeSpentStr = workedMinutes > 0 ? `${workedHours}h ${workedM}m` : "0h 0m";

      return {
        ...emp,
        completedTasks,
        pendingTasks,
        totalTasks,
        completionRate,
        workedMinutes,
        timeSpentStr,
        isCurrentlyActive,
        hasAttendanceToday: todayRecords.length > 0,
      };
    })
    .sort((a, b) => b.workedMinutes - a.workedMinutes || b.completionRate - a.completionRate || b.totalTasks - a.totalTasks);

  // Top Clients Aggregation - Travel
  const travelClientStatsMap: Record<
    string,
    {
      name: string;
      totalBookings: number;
      totalRevenue: number;
    }
  > = {};

  bookingsList.forEach((b) => {
    const name = b.customer;
    if (!name) return;
    if (!travelClientStatsMap[name]) {
      travelClientStatsMap[name] = {
        name,
        totalBookings: 0,
        totalRevenue: 0,
      };
    }
    travelClientStatsMap[name].totalBookings += 1;
    travelClientStatsMap[name].totalRevenue += b.amount || 0;
  });

  const topClientsTravel = Object.values(travelClientStatsMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalBookings - a.totalBookings)
    .slice(0, 5); // top 5
    
  // Top Clients Aggregation - General Insurance
  const insClientStatsMap: Record<
    string,
    {
      name: string;
      totalBookings: number;
      totalRevenue: number;
    }
  > = {};

  insuranceList.forEach((p) => {
    const name = p.customer_name || p.customer;
    if (!name) return;
    if (!insClientStatsMap[name]) {
      insClientStatsMap[name] = {
        name,
        totalBookings: 0,
        totalRevenue: 0,
      };
    }
    insClientStatsMap[name].totalBookings += 1;
    const paid = Number(p.customer_paid) || Number(p.amount_paid) || 0;
    insClientStatsMap[name].totalRevenue += paid;
  });

  const topClientsInsurance = Object.values(insClientStatsMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalBookings - a.totalBookings)
    .slice(0, 5); // top 5
    
  const topClients = topClientType === "Travel" ? topClientsTravel : topClientsInsurance;

  // Booking Trend
  const bookingTrendData = useMemo(() => {
    const monthlyRev: Record<string, { bookings: number; revenue: number }> = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Initialize with all months in order or just empty?
    // Let's just track months that exist or last 6 months. For simplicity, we just aggregate what exists and sort by month index, or keep it simple.
    const monthOrder: string[] = [];

    (bookingsList || []).forEach((b: any) => {
      if (b.status === "Cancelled" || b.status === "Refunded") return;

      const dateStr = b.bookingDate || b.travelDate || "";
      const monthMatch = dateStr.match(/^\d{4}-(\d{2})-\d{2}$/);

      if (monthMatch) {
        const monthIdx = parseInt(monthMatch[1], 10) - 1;
        const month = monthNames[monthIdx];

        if (!monthlyRev[month]) {
          monthlyRev[month] = { bookings: 0, revenue: 0 };
        }
        monthlyRev[month].bookings += 1;
        monthlyRev[month].revenue += b.amount || 0;
      }
    });

    // Extract existing months and sort them by standard calendar order
    const sortedMonths = Object.keys(monthlyRev).sort(
      (a, b) => monthNames.indexOf(a) - monthNames.indexOf(b),
    );

    // If no data, return a default empty chart or 0 for current month
    if (sortedMonths.length === 0) {
      return [{ month: monthNames[new Date().getMonth()], bookings: 0, revenue: 0 }];
    }

    return sortedMonths.map((month) => ({
      month,
      bookings: monthlyRev[month].bookings,
      revenue: parseFloat((monthlyRev[month].revenue / 100000).toFixed(2)), // in Lakhs
    }));
  }, [bookingsList]);

  // User Action Items (Row 4) - Pending Tasks with Today / Overdue filtering
  const [taskFilterTab, setTaskFilterTab] = useState<"all" | "today" | "overdue">("all");

  const allPendingTasks = useMemo(() => {
    return (tasksList || []).filter(
      (t) => t.status !== "Done" && t.status !== "Completed" && t.progress !== 100
    );
  }, [tasksList]);

  const todayPendingTasks = useMemo(() => {
    return allPendingTasks.filter((t) => {
      const d = (t.dueDate || t.due_date || "").slice(0, 10);
      return d === todayStr;
    });
  }, [allPendingTasks, todayStr]);

  const overduePendingTasks = useMemo(() => {
    return allPendingTasks.filter((t) => {
      const d = (t.dueDate || t.due_date || "").slice(0, 10);
      return d && d < todayStr;
    });
  }, [allPendingTasks, todayStr]);

  const displayedPendingTasks = useMemo(() => {
    let list = allPendingTasks;
    if (taskFilterTab === "today") {
      list = todayPendingTasks;
    } else if (taskFilterTab === "overdue") {
      list = overduePendingTasks;
    }
    return [...list]
      .sort((a, b) => {
        const dateA = a.dueDate || a.due_date || "9999-99-99";
        const dateB = b.dueDate || b.due_date || "9999-99-99";
        return dateA.localeCompare(dateB);
      })
      .slice(0, 6);
  }, [allPendingTasks, taskFilterTab, todayPendingTasks, overduePendingTasks]);

  const getDueInfo = (dueDateStr?: string) => {
    if (!dueDateStr) {
      return { label: "No date", badgeColor: "text-muted-foreground bg-secondary/50", isOverdue: false, isToday: false };
    }
    const dStr = dueDateStr.slice(0, 10);
    if (dStr === todayStr) {
      return { label: "Due Today", badgeColor: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300 font-bold", isOverdue: false, isToday: true };
    }
    if (dStr < todayStr) {
      return { label: `Overdue (${dStr})`, badgeColor: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 font-bold", isOverdue: true, isToday: false };
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    if (dStr === tomorrowStr) {
      return { label: "Due Tomorrow", badgeColor: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300", isOverdue: false, isToday: false };
    }
    return { label: `Due: ${dStr}`, badgeColor: "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400", isOverdue: false, isToday: false };
  };

  const handleToggleTask = (id: string) => {
    setTasksList((prev: any[]) =>
      prev.map((t) => {
        if (t.id === id) {
          const isDone = t.status === "Done" || t.status === "Completed";
          const newStatus = isDone ? "Pending" : "Done";
          if (!isDone) {
            toast.success(`Task completed: "${t.title}"`);
          }
          return { ...t, status: newStatus, progress: isDone ? 0 : 100 };
        }
        return t;
      })
    );
  };

  const upcomingFollowups = leadsList
    .filter((l) => l.nextFollowUp && l.nextFollowUp >= todayStr)
    .sort((a, b) => new Date(a.nextFollowUp).getTime() - new Date(b.nextFollowUp).getTime())
    .slice(0, 5);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events: { id: string, name: string, type: "Birthday" | "Anniversary", date: Date, originalDate: string, daysUntil: number, phone: string }[] = [];

    (customersList || []).forEach(c => {
      if (c.dob) {
        const dobDate = new Date(c.dob);
        if (!isNaN(dobDate.getTime())) {
          const nextBday = new Date(today.getFullYear(), dobDate.getMonth(), dobDate.getDate());
          if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
          const diff = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diff <= 30) {
            events.push({ id: c.id, name: c.name, type: "Birthday", date: nextBday, originalDate: c.dob, daysUntil: diff, phone: c.phone || "" });
          }
        }
      }
      if (c.dateOfAnniversary) {
        const annivDate = new Date(c.dateOfAnniversary);
        if (!isNaN(annivDate.getTime())) {
          const nextAnniv = new Date(today.getFullYear(), annivDate.getMonth(), annivDate.getDate());
          if (nextAnniv < today) nextAnniv.setFullYear(today.getFullYear() + 1);
          const diff = Math.ceil((nextAnniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diff <= 30) {
            events.push({ id: c.id, name: c.name, type: "Anniversary", date: nextAnniv, originalDate: c.dateOfAnniversary, daysUntil: diff, phone: c.phone || "" });
          }
        }
      }
    });

    return events.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [customersList]);

  // Details calculations for KPI HoverCards
  const todayLeadsList = leadsList.filter((l) => l.createdAt && l.createdAt.slice(0, 10) === todayStr);
  const recentLeadsList = leadsList.slice(0, 4);

  const todaySalesList = bookingsList.filter((b) => b.bookingDate && b.bookingDate.slice(0, 10) === todayStr);
  const recentSalesList = bookingsList.filter((b) => (b.amount || 0) > 0).slice(0, 4);

  const activeBookingsList = bookingsList.filter(
    (b) => b.status === "Confirmed" || b.status === "Pending" || b.status === "In Progress"
  ).slice(0, 4);

  const pendingPaymentsList = bookingsList.filter((b) => (b.amount || 0) > (b.paid || 0)).slice(0, 4);

  const followupsTodayList = leadsList.filter(
    (l) => l.nextFollowUp && l.nextFollowUp.slice(0, 10) === todayStr
  );
  const upcomingFollowupsList = leadsList.filter((l) => l.nextFollowUp).slice(0, 4);
  const followupsForCard = followupsTodayList.length > 0 ? followupsTodayList : upcomingFollowupsList;

  const upcomingDeparturesList = bookingsList.filter((b) => {
    if (!b.travelDate) return false;
    const diff = (new Date(b.travelDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).slice(0, 4);

  const recentConvertedLeads = convertedLeadsList.slice(0, 4);
  const recentPaidBookings = bookingsList.filter((b) => (b.paid || 0) > 0).slice(0, 4);

  const kpis = [
    {
      label: "Today's Leads",
      value: todayLeadsCount,
      icon: Users,
      trend: "+5 today",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      color: "text-blue-600",
      link: "/crm/leads",
      renderHover: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">Today's Leads Details</span>
            <span className="text-[10px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full">
              {todayLeadsCount} Today
            </span>
          </div>
          {todayLeadsList.length > 0 ? (
            <div className="space-y-2">
              {todayLeadsList.slice(0, 4).map((l: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{l.name}</p>
                    <p className="text-[10px] text-muted-foreground">{l.destination || l.service || "General Inquiry"}</p>
                  </div>
                  <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-medium">{l.status || "New"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground italic">No leads created today yet. Recent leads:</p>
              {recentLeadsList.slice(0, 3).map((l: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{l.name}</p>
                    <p className="text-[10px] text-muted-foreground">{l.destination || l.service || "Inquiry"}</p>
                  </div>
                  <span className="text-[10px] bg-secondary px-2 py-0.5 rounded font-medium">{l.status || "New"}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/crm/leads" className="text-[10px] text-blue-600 font-medium pt-1 text-right block hover:underline">Click to view all leads →</Link>
        </div>
      ),
    },
    {
      label: "Today's Sales",
      value: formatINR(todaySalesAmount),
      icon: IndianRupee,
      trend: "confirmed",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      color: "text-emerald-600",
      link: "/crm/bookings",
      renderHover: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">Today's Sales Breakdown</span>
            <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
              {formatINR(todaySalesAmount)}
            </span>
          </div>
          {todaySalesList.length > 0 ? (
            <div className="space-y-2">
              {todaySalesList.slice(0, 4).map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{b.customer || b.name}</p>
                    <p className="text-[10px] text-muted-foreground">{b.details?.destination || b.package || "Package"}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{formatINR(b.amount || 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground italic">No sales confirmed today yet. Recent sales:</p>
              {recentSalesList.slice(0, 3).map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{b.customer || b.name}</p>
                    <p className="text-[10px] text-muted-foreground">{b.details?.destination || b.package || "Package"}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{formatINR(b.amount || 0)}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/crm/bookings" className="text-[10px] text-emerald-600 font-medium pt-1 text-right block hover:underline">Click to view all bookings →</Link>
        </div>
      ),
    },
    {
      label: "Active Bookings",
      value: activeBookingsCount,
      icon: CalendarCheck,
      trend: "in progress",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      color: "text-violet-600",
      link: "/crm/bookings",
      renderHover: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">Active Bookings Details</span>
            <span className="text-[10px] font-semibold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25 px-2 py-0.5 rounded-full">
              {activeBookingsCount} Total
            </span>
          </div>
          {activeBookingsList.length > 0 ? (
            <div className="space-y-2">
              {activeBookingsList.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{b.customer || b.name}</p>
                    <p className="text-[10px] text-muted-foreground">{b.details?.destination || b.package || "Tour"} • {b.travelDate || "Upcoming"}</p>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{formatINR(b.amount || 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No active bookings found.</p>
          )}
          <Link to="/crm/bookings" className="text-[10px] text-violet-600 font-medium pt-1 text-right block hover:underline">Click to manage bookings →</Link>
        </div>
      ),
    },
    {
      label: "Pending Payments",
      value: formatINR(pendingPaymentsAmount),
      icon: AlertCircle,
      trend: "requires follow-up",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      color: "text-rose-600",
      link: "/crm/accounts",
      renderHover: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">Pending Payments List</span>
            <span className="text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full">
              {formatINR(pendingPaymentsAmount)}
            </span>
          </div>
          {pendingPaymentsList.length > 0 ? (
            <div className="space-y-2">
              {pendingPaymentsList.map((b: any, i: number) => {
                const pending = (b.amount || 0) - (b.paid || 0);
                return (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-semibold text-foreground">{b.customer || b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.details?.destination || b.package || "Trip"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-rose-600">{formatINR(pending)}</p>
                      <p className="text-[9px] text-muted-foreground">Paid: {formatINR(b.paid || 0)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-emerald-600 font-medium">All payments are fully cleared! 🎉</p>
          )}
          <Link to="/crm/accounts" className="text-[10px] text-rose-600 font-medium pt-1 text-right block hover:underline">Click to view accounts →</Link>
        </div>
      ),
    },
    {
      label: "Follow-ups Today",
      value: followupsTodayCount,
      icon: UserCheck,
      trend: "scheduled calls",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      color: "text-amber-600",
      link: "/crm/leads",
      renderHover: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">Scheduled Follow-Ups</span>
            <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full">
              {followupsTodayCount} Today
            </span>
          </div>
          {followupsForCard.length > 0 ? (
            <div className="space-y-2">
              {followupsForCard.map((l: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{l.name}</p>
                    <p className="text-[10px] text-muted-foreground">{l.phone || l.assignedTo || "Lead"}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/25">
                    {l.nextFollowUp || "Today"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No follow-ups scheduled for today.</p>
          )}
          <Link to="/crm/leads" className="text-[10px] text-amber-600 font-medium pt-1 text-right block hover:underline">Click to view lead calls →</Link>
        </div>
      ),
    },
    {
      label: "Upcoming Departures",
      value: upcomingDeparturesCount,
      icon: Plane,
      trend: "next 7 days",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      color: "text-cyan-600",
      link: "/crm/bookings",
      renderHover: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">Upcoming Departures</span>
            <span className="text-[10px] font-semibold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full">
              Next 7 Days ({upcomingDeparturesCount})
            </span>
          </div>
          {upcomingDeparturesList.length > 0 ? (
            <div className="space-y-2">
              {upcomingDeparturesList.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{b.customer || b.name}</p>
                    <p className="text-[10px] text-muted-foreground">{b.details?.destination || b.package || "Destination"}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/25">
                    {b.travelDate}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No departures scheduled in the next 7 days.</p>
          )}
          <Link to="/crm/bookings" className="text-[10px] text-cyan-600 font-medium pt-1 text-right block hover:underline">Click to view all departures →</Link>
        </div>
      ),
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      trend: "overall",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
      color: "text-pink-600",
      link: "/crm/reports",
      renderHover: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">Lead Conversion Info</span>
            <span className="text-[10px] font-semibold bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/25 px-2 py-0.5 rounded-full">
              {conversionRate}% Rate
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs py-1 bg-secondary/50 rounded-xl p-2">
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">TOTAL LEADS</p>
              <p className="font-bold text-foreground text-sm">{leadsList.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">CONVERTED</p>
              <p className="font-bold text-emerald-600 text-sm">{convertedLeadsList.length}</p>
            </div>
          </div>
          {recentConvertedLeads.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-semibold text-muted-foreground">Recent Converted Clients:</p>
              {recentConvertedLeads.map((l: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{l.name}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">{formatINR(l.budget || 0)}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/crm/reports" className="text-[10px] text-pink-600 font-medium pt-1 text-right block hover:underline">Click to view conversion reports →</Link>
        </div>
      ),
    },
    {
      label: "Monthly Revenue",
      value: formatINR(monthlyRevenueTotal),
      icon: TrendingUp,
      trend: "MTD ledger",
      bg: "bg-primary/100/10",
      border: "border-orange-500/20",
      color: "text-orange-600",
      link: "/crm/reports",
      renderHover: () => (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">Monthly Revenue Details</span>
            <span className="text-[10px] font-semibold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded-full">
              {formatINR(monthlyRevenueTotal)}
            </span>
          </div>
          {recentPaidBookings.length > 0 ? (
            <div className="space-y-2">
              {recentPaidBookings.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{b.customer || b.name}</p>
                    <p className="text-[10px] text-muted-foreground">{b.details?.destination || b.package || "Trip"}</p>
                  </div>
                  <span className="text-xs font-bold text-orange-600">{formatINR(b.paid || 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No revenue recorded yet this month.</p>
          )}
          <Link to="/crm/reports" className="text-[10px] text-orange-600 font-medium pt-1 text-right block hover:underline">Click to view revenue reports →</Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 8 KPI Cards Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((s) => (
          <HoverCard key={s.label} openDelay={100} closeDelay={150}>
            <HoverCardTrigger asChild>
              <div
                onClick={() => s.link && navigate({ to: s.link as any })}
                className={`group relative overflow-hidden rounded-2xl border ${s.border} bg-card p-5 shadow-card hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 ${s.link ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${s.bg} ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground capitalize bg-secondary/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                    {s.trend}
                    <Info className="h-3 w-3 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                  </span>
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-1 font-display text-2xl font-black tracking-tight truncate">
                  {s.value}
                </p>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </HoverCardTrigger>
            <HoverCardContent align="start" side="bottom" sideOffset={8} className="w-80 rounded-2xl p-4 shadow-2xl border border-border bg-card z-50">
              {s.renderHover()}
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>

      {/* Row 1: Revenue Graph (Line) & Lead Source (Pie) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold">Monthly Revenue Trend</h3>
              <p className="text-xs text-muted-foreground">
                Cumulative monthly revenue from completed booking invoices
              </p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={bookingTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                <XAxis
                  dataKey="month"
                  stroke="#888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<RevenueTooltip />}
                  wrapperStyle={{ outline: "none", zIndex: 50 }}
                  cursor={{ stroke: "var(--primary)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "var(--primary)", strokeWidth: 2 }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Pie Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Lead Source Share</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Distribution of channels acquiring current leads
            </p>
            <div className="h-72 relative flex items-center justify-center">
              {sourceData.length > 0 ? (
                <>
                  {/* Center donut metric */}
                  <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none z-10">
                    <span className="block text-2xl font-black text-foreground tracking-tight font-display leading-none">
                      {totalLeadsForSource}
                    </span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75 mt-1">
                      Total Leads
                    </span>
                  </div>

                  <ResponsiveContainer>
                    <PieChart margin={{ top: 22, right: 30, bottom: 10, left: 30 }}>
                      <Pie
                        data={sourceData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="44%"
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={3}
                        labelLine={false}
                        label={renderLeadSourceLabel}
                      >
                        {sourceData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<SourceTooltip />} wrapperStyle={{ outline: "none", zIndex: 50 }} />
                      <Legend
                        verticalAlign="bottom"
                        height={44}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 11, paddingTop: "14px" }}
                        formatter={(value, entry: any) => {
                          const count = entry?.payload?.value ?? 0;
                          const pct =
                            totalLeadsForSource > 0
                              ? Math.round((count / totalLeadsForSource) * 100)
                              : 0;
                          return (
                            <span className="text-[11px] font-medium text-foreground/80 hover:text-foreground">
                              {value} <span className="font-bold text-primary font-mono text-[10px]">({pct}%)</span>
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No leads source details logged</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Destination-wise Sales (Bar) & Employee Task Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Destination performance */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0">
          <div>
            <h3 className="font-display text-lg font-bold">Destination Sales Ledger</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Total booking billing values segmented by destinations
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={destinationSalesData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                <XAxis
                  dataKey="name"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={<DestinationTooltip />}
                  wrapperStyle={{ outline: "none", zIndex: 50 }}
                  cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]}>
                  {destinationSalesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee Task Performance */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" /> Employee Task Performance
                </h3>
                <p className="text-xs text-muted-foreground">
                  Task completion rates and metrics by consultant
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {employeeTaskStats.slice(0, 4).map((staff) => {
                const rate = staff.completionRate;
                let badgeColor = "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400";
                let badgeText = "Needs Focus";
                let progressColor = "bg-rose-500";

                if (staff.totalTasks === 0) {
                  badgeColor = "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400";
                  badgeText = "No Tasks";
                  progressColor = "bg-slate-300 dark:bg-slate-700";
                } else if (rate >= 80) {
                  badgeColor = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400";
                  badgeText = "Outstanding";
                  progressColor = "bg-emerald-500";
                } else if (rate >= 70) {
                  badgeColor = "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-400";
                  badgeText = "Good";
                  progressColor = "bg-blue-500";
                } else if (rate >= 50) {
                  badgeColor = "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400";
                  badgeText = "Average";
                  progressColor = "bg-amber-500";
                }

                return (
                  <div
                    key={staff.name}
                    className="flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-secondary/40 transition-colors border border-border/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        {staff.avatar ? (
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="h-10 w-10 rounded-xl object-cover border border-border shadow-sm"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-primary">
                              {staff.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || "?"}
                            </span>
                          </div>
                        )}
                        {staff.isCurrentlyActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {staff.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-muted-foreground truncate">{staff.role}</p>
                          <span className="text-muted-foreground/40 text-[10px]">•</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${staff.isCurrentlyActive ? "text-emerald-600 dark:text-emerald-400 font-bold" : staff.hasAttendanceToday ? "text-slate-600 dark:text-slate-300" : "text-muted-foreground"}`}>
                            {staff.isCurrentlyActive ? (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span>Active ({staff.timeSpentStr})</span>
                              </>
                            ) : staff.hasAttendanceToday ? (
                              <>
                                <Clock className="h-3 w-3 text-slate-500" />
                                <span>{staff.timeSpentStr} today</span>
                              </>
                            ) : (
                              <span>0h (Not in)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 text-right min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {staff.totalTasks > 0 ? `${staff.completedTasks}/${staff.totalTasks} Done` : "0 Tasks"}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}
                        >
                          {badgeText}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 w-28">
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${staff.totalTasks > 0 ? rate : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground w-7 text-right">
                          {staff.totalTasks > 0 ? `${rate}%` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 h-9 text-xs font-semibold rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-2xs group"
            asChild
          >
            <Link to="/crm/tasks" className="flex items-center justify-center gap-1.5 w-full">
              <span>Manage Tasks</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Row 3: Booking Volume Trend (Bar) & Lead Funnel (Bar) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking Volume Trend */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0">
          <h3 className="font-display text-lg font-bold">Monthly Booking Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Total booking reservations confirmed per month
          </p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={bookingTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                <XAxis
                  dataKey="month"
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<BookingsTooltip />}
                  wrapperStyle={{ outline: "none", zIndex: 50 }}
                  cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                />
                <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
                  {bookingTrendData.map((_, index) => (
                    <Cell
                      key={`booking-bar-cell-${index}`}
                      fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Funnel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-lg font-bold">Active Lead Funnel</h3>
              <Link
                to="/crm/leads"
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Lead counts segmented by current pipeline status
            </p>
            <div className="h-60">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    {
                      stage: "New Lead",
                      count: leadsList.filter((l) => l.status === "New Lead").length,
                    },
                    {
                      stage: "Contacted",
                      count: leadsList.filter((l) => l.status === "Contacted").length,
                    },
                    {
                      stage: "Quotation",
                      count: leadsList.filter((l) => l.status === "Quotation Sent").length,
                    },
                    {
                      stage: "Negotiate",
                      count: leadsList.filter((l) => l.status === "Negotiation").length,
                    },
                    {
                      stage: "Confirmed",
                      count: leadsList.filter(
                        (l) => l.status === "Confirmed" || l.status === "Booked",
                      ).length,
                    },
                  ]}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate({ to: "/crm/leads" })}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                  <XAxis
                    dataKey="stage"
                    stroke="#888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<FunnelTooltip />}
                    wrapperStyle={{ outline: "none", zIndex: 50 }}
                    cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Tasks, Follow-ups, Celebrations, Top Clients */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Tasks */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Pending Tasks
                </h3>
                <p className="text-xs text-muted-foreground">Action items for employees</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center bg-secondary/60 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setTaskFilterTab("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    taskFilterTab === "all"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({allPendingTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilterTab("today")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    taskFilterTab === "today"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Today ({todayPendingTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilterTab("overdue")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    taskFilterTab === "overdue"
                      ? "bg-background text-rose-600 dark:text-rose-400 shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-rose-600"
                  }`}
                >
                  Overdue ({overduePendingTasks.length})
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {displayedPendingTasks.length > 0 ? (
                displayedPendingTasks.map((task) => {
                  const dueInfo = getDueInfo(task.dueDate || task.due_date);
                  return (
                    <div
                      key={task.id}
                      className="group flex items-start gap-3 p-3 rounded-2xl border border-border hover:bg-secondary/40 transition-all hover:shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 shrink-0 transition-transform hover:scale-125 active:scale-90 text-muted-foreground hover:text-emerald-600"
                        title="Click to mark as done"
                        aria-label="Mark as done"
                      >
                        <Circle className="h-5 w-5" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {task.title}
                        </p>
                        <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-md border text-[10px] ${
                              task.priority === "High"
                                ? "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300"
                                : task.priority === "Medium"
                                ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300"
                                : "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300"
                            }`}
                          >
                            {task.priority || "Medium"}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${dueInfo.badgeColor}`}
                          >
                            {dueInfo.isToday && <Clock className="h-3 w-3 text-amber-600" />}
                            {dueInfo.isOverdue && <AlertCircle className="h-3 w-3 text-rose-600" />}
                            {dueInfo.label}
                          </span>

                          {(task.assignee || task.assigned_to) && (
                            <span className="text-muted-foreground font-medium text-[11px] bg-secondary/50 px-2 py-0.5 rounded-md">
                              For: <strong className="text-foreground">{task.assignee || task.assigned_to}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center bg-secondary/20 rounded-2xl border border-dashed border-border">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-semibold text-foreground">
                    {taskFilterTab === "today" ? "No tasks due today!" : taskFilterTab === "overdue" ? "No overdue tasks!" : "All caught up!"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {taskFilterTab === "today" ? "All tasks for today are completed." : "No pending action items found."}
                  </p>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 h-9 text-xs font-semibold rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-2xs group"
            asChild
          >
            <Link to="/crm/tasks" className="flex items-center justify-center gap-1.5 w-full">
              <span>View all tasks</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </Button>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" /> Upcoming Follow-ups
                </h3>
                <p className="text-xs text-muted-foreground">
                  Scheduled client calls and follow-ups
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingFollowups.length > 0 ? (
                upcomingFollowups.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-foreground">{lead.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {lead.destination || "General"}
                        </span>
                        <span>{lead.phone}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-semibold text-foreground bg-secondary px-2 py-1 rounded-md">
                        {new Date(lead.nextFollowUp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-secondary/20 rounded-xl border border-dashed border-border">
                  <Phone className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">No upcoming follow-ups</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your schedule is clear for now.
                  </p>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 h-9 text-xs font-semibold rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-2xs group"
            asChild
          >
            <Link to="/crm/leads" className="flex items-center justify-center gap-1.5 w-full">
              <span>View all leads</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </Button>
        </div>
        {/* Upcoming Birthdays & Anniversaries */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" /> Upcoming Celebrations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Customer birthdays & anniversaries in the next 30 days
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 5).map((event, idx) => (
                  <div
                    key={`${event.id}-${idx}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-foreground">{event.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span className={`font-medium px-1.5 py-0.5 rounded border ${event.type === 'Birthday' ? 'text-pink-600 bg-pink-50 border-pink-100' : 'text-purple-600 bg-purple-50 border-purple-100'}`}>
                          {event.type}
                        </span>
                        <span>Turns {new Date().getFullYear() - new Date(event.originalDate).getFullYear()}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {event.phone && (
                          <a
                            href={`https://wa.me/${event.phone.replace(/\\D/g, '')}?text=Happy%20${event.type}%20${event.name}!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors p-1.5 rounded-full"
                            title={`Send WhatsApp message to ${event.name}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <p className="text-[10px] font-semibold text-foreground bg-secondary px-2 py-1 rounded-md">
                          {event.date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {event.daysUntil === 0 ? "Today!" : `In ${event.daysUntil} days`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-secondary/20 rounded-xl border border-dashed border-border">
                  <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">No upcoming celebrations</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No birthdays or anniversaries in the next 30 days.
                  </p>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 h-9 text-xs font-semibold rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-2xs group"
            asChild
          >
            <Link to="/crm/customers" className="flex items-center justify-center gap-1.5 w-full">
              <span>View all customers</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </Button>
        </div>

        {/* Top Clients */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" /> Top Clients
                </h3>
                <p className="text-xs text-muted-foreground">
                  Highest contributing customers by revenue
                </p>
              </div>
              <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg">
                <button
                  onClick={() => setTopClientType("Travel")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    topClientType === "Travel"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:bg-background/50"
                  }`}
                >
                  Travel
                </button>
                <button
                  onClick={() => setTopClientType("Insurance")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    topClientType === "Insurance"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:bg-background/50"
                  }`}
                >
                  Gen Insurance
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {topClients.length > 0 ? (
                topClients.map((client, idx) => (
                  <div
                    key={`${client.name}-${idx}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary">
                          {client.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">{client.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                          <span>{client.totalBookings} {topClientType === "Travel" ? (client.totalBookings === 1 ? "Booking" : "Bookings") : (client.totalBookings === 1 ? "Policy" : "Policies")}</span>
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-foreground">
                        {formatLakhs(client.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-secondary/20 rounded-xl border border-dashed border-border">
                  <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">No top clients yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {topClientType === "Travel" ? "Complete some bookings to see your top clients here." : "Add some insurance policies to see your top clients here."}
                  </p>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 h-9 text-xs font-semibold rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-2xs group"
            asChild
          >
            <Link to="/crm/customers" className="flex items-center justify-center gap-1.5 w-full">
              <span>View all customers</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </Button>
        </div>

        {/* Recent Taxi Bookings */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" /> Recent Taxi Bookings
                </h3>
                <p className="text-xs text-muted-foreground">Latest taxi reservations</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {taxiBookingsList.slice(0, 5).map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-border bg-secondary/20 hover:bg-secondary/35 transition-colors p-3.5 shadow-sm relative">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">{booking.customer_name}</span>
                    {booking.vehicle_type && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {booking.vehicle_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                    {booking.from_location && booking.to_location ? (
                      <>
                        <span className="truncate">{booking.from_location}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        <span className="truncate">{booking.to_location}</span>
                      </>
                    ) : (
                      <span className="truncate">{booking.route || booking.from_location || "No route specified"}</span>
                    )}
                  </div>
                </div>
              ))}
              
              {taxiBookingsList.length === 0 && (
                <div className="py-8 text-center bg-secondary/20 rounded-xl border border-dashed border-border">
                  <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">No taxi bookings yet</p>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 h-9 text-xs font-semibold rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-2xs group"
            asChild
          >
            <Link to="/crm/taxi-booking" className="flex items-center justify-center gap-1.5 w-full">
              <span>View all taxi bookings</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </Button>
        </div>

        {/* Recent Visa Bookings */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" /> Recent Visa Bookings
                </h3>
                <p className="text-xs text-muted-foreground">Latest visa applications</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {visaBookingsList.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-start justify-between p-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{booking.customer_name}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        booking.application_status === "Approved" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" :
                        booking.application_status === "Rejected" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25" :
                        booking.application_status === "Submitted" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25" :
                        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25"
                      }`}>
                        {booking.application_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{booking.country} - {booking.visa_type}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {visaBookingsList.length === 0 && (
                <div className="py-8 text-center bg-secondary/20 rounded-xl border border-dashed border-border">
                  <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">No visa bookings yet</p>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 h-9 text-xs font-semibold rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-2xs group"
            asChild
          >
            <Link to="/crm/visa" className="flex items-center justify-center gap-1.5 w-full">
              <span>View all visa bookings</span>
              <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
