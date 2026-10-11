import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { IndianRupee, TrendingUp, UserCheck, CalendarCheck, Star, Download, ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/mock-data";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { INITIAL_EMPLOYEES } from "./crm.employees";
import { getAuth } from "@/lib/auth";

export const Route = createFileRoute("/crm/reports")({ component: ReportsPage });

const COLORS = [
  "var(--primary)",
  "color-mix(in oklch, var(--primary) 85%, var(--background))",
  "color-mix(in oklch, var(--primary) 70%, var(--background))",
  "color-mix(in oklch, var(--primary) 55%, var(--background))",
  "color-mix(in oklch, var(--primary) 40%, var(--background))",
  "color-mix(in oklch, var(--primary) 25%, var(--background))"
];

const SOURCE_COLORS = [
  "#3b82f6", // vibrant blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#64748b", // slate
];

function KpiCard({
  label,
  value,
  icon,
  sub,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}>{icon}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

const ReportsRevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rev = payload.find((p: any) => p.dataKey === "revenue")?.value ?? 0;
    const bkg = payload.find((p: any) => p.dataKey === "bookings")?.value ?? 0;
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-4 py-3 shadow-xl min-w-[170px] text-xs pointer-events-none space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border/60">
          {label} Overview
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0 ring-2 ring-primary/20" />
              Revenue:
            </span>
            <span className="font-bold text-foreground font-display">₹{rev} Lakhs</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 ring-2 ring-indigo-500/20" />
              Bookings:
            </span>
            <span className="font-bold text-foreground">{bkg} Total</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ReportsDestinationTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-4 py-2.5 shadow-xl min-w-[140px] text-xs pointer-events-none">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {item.payload?.dest}
        </p>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-border/40"
            style={{ backgroundColor: item.payload?.fill || "var(--primary)" }}
          />
          <span className="text-xs font-medium text-muted-foreground">Revenue:</span>
          <span className="text-sm font-bold text-foreground ml-auto">₹{item.value} Lakhs</span>
        </div>
      </div>
    );
  }
  return null;
};

const ReportsSourceTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-4 py-2.5 shadow-xl min-w-[130px] text-xs pointer-events-none">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {item.name}
        </p>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-border/40"
            style={{ backgroundColor: item.payload?.fill || "var(--primary)" }}
          />
          <span className="text-xs font-medium text-muted-foreground">Share:</span>
          <span className="text-sm font-bold text-foreground ml-auto">{item.value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

function ReportsPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const isAdmin = (auth?.role === "admin" || auth?.role === "manager") && !auth?.name.toLowerCase().includes("suman");
  const [leadsList] = useSupabaseTable<any[]>("leads", []);
  const [bookingsList] = useSupabaseTable<any[]>("bookings", []);
  const [employeesList] = useSupabaseTable<any[]>("employees", INITIAL_EMPLOYEES);

  const [leaderboardPeriod, setLeaderboardPeriod] = useState<string>("all");

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    bookingsList.forEach((b) => {
      const d = b.bookingDate || b.created_at;
      if (d && typeof d === "string" && d.length >= 7) {
        set.add(d.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [bookingsList]);

  const totalRevenue = bookingsList.reduce((s, b) => s + (b.paid || 0), 0);
  const pendingAmount = bookingsList.reduce((s, b) => s + ((b.amount || 0) - (b.paid || 0)), 0);
  const wonLeads = leadsList.filter((l) => l.status === "in process" || l.status === "Confirmed" || l.status === "Payment Pending").length;
  
  const exportCSV = () => {
    const rows = [
      ["Report Type", "Month/Dest/Name", "Metric 1", "Metric 2"],
      ["Revenue & Bookings Trend", "", "", ""],
      ...revenueByMonth.map((r) => ["Trend", r.month, `${r.revenue} Lakhs`, `${r.bookings} Bookings`]),
      [],
      ["Revenue by Destination", "", "", ""],
      ...destData.map((d) => ["Destination", d.dest, `${d.revenue} Lakhs`, ""]),
      [],
      ["Consultant Leaderboard", "", "", ""],
      ...leaderboard.map((l) => ["Consultant", l.name, `₹${l.revenue}`, `${l.deals} Deals`]),
    ];

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reports-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(anchor); // Required for Safari/Firefox
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  // Compute revenueByMonth
  const revenueMap = new Map();
  bookingsList.forEach((b) => {
    if (!b.bookingDate) return;
    const date = new Date(b.bookingDate);
    const month = date.toLocaleString("default", { month: "short" });
    if (!revenueMap.has(month)) revenueMap.set(month, { revenue: 0, bookings: 0 });
    const data = revenueMap.get(month);
    data.revenue += (b.amount || 0) / 100000;
    data.bookings += 1;
  });
  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueByMonth = allMonths
    .map((month) => ({
      month,
      revenue: Number((revenueMap.get(month)?.revenue || 0).toFixed(2)),
      bookings: revenueMap.get(month)?.bookings || 0,
    }))
    .filter((m, i) => m.revenue > 0 || m.bookings > 0 || i <= new Date().getMonth());

  // Compute destData
  const destMap = new Map();
  bookingsList.forEach((b) => {
    const destRaw = b.details?.destination || b.package?.split(" ")[0] || b.destination || b.supplier || "Other";
    const dest = destRaw.trim().toUpperCase();
    destMap.set(dest, (destMap.get(dest) || 0) + (b.amount || 0));
  });
  const destData = Array.from(destMap.entries())
    .map(([dest, amt]) => ({
      dest,
      revenue: Number((amt / 100000).toFixed(2)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Compute sourceData
  const sourceMap = new Map();
  leadsList.forEach((l) => {
    const s = l.source || "Other";
    sourceMap.set(s, (sourceMap.get(s) || 0) + 1);
  });
  const totalSources = leadsList.length || 1;
  const sourceData = Array.from(sourceMap.entries())
    .map(([name, count]) => ({
      name,
      value: Math.round((count / totalSources) * 100),
    }))
    .sort((a, b) => b.value - a.value);

  // Helper to normalize names against actual employee records
  const getNormalizedName = (rawName: string) => {
    if (!rawName) return "Unknown";
    const raw = rawName.trim().toLowerCase();
    if (!raw) return "Unknown";

    // 1. Direct aliases & common typos in bookings/leads
    if (raw === "deeapk" || raw.startsWith("deepak")) {
      const found = employeesList.find((e) => e.name && e.name.toLowerCase().includes("deepak"));
      if (found) return found.name.trim();
    }
    if (raw.startsWith("pushp")) {
      const found = employeesList.find((e) => e.name && e.name.toLowerCase().includes("pushp"));
      if (found) return found.name.trim();
    }
    if (raw.startsWith("manvendr")) {
      const found = employeesList.find((e) => e.name && e.name.toLowerCase().includes("manvendr"));
      if (found) return found.name.trim();
    }
    if (raw.startsWith("nikita")) {
      const found = employeesList.find((e) => e.name && e.name.toLowerCase().includes("nikita"));
      if (found) return found.name.trim();
    }
    if (raw.startsWith("bhavya")) {
      const found = employeesList.find((e) => e.name && e.name.toLowerCase().includes("bhavya"));
      if (found) return found.name.trim();
    }
    if (raw.startsWith("suman")) {
      const found = employeesList.find((e) => e.name && e.name.toLowerCase().includes("suman"));
      if (found) return found.name.trim();
    }
    if (raw.startsWith("aman")) {
      const found = employeesList.find((e) => e.name && e.name.toLowerCase().includes("aman"));
      if (found) return found.name.trim();
    }
    if (raw.startsWith("jatin")) {
      const found = employeesList.find((e) => e.name && e.name.toLowerCase().includes("jatin"));
      if (found) return found.name.trim();
    }
    if (raw.startsWith("kamal")) {
      const found = employeesList.find((e) => e.name && e.name.toLowerCase().includes("kamal"));
      if (found) return found.name.trim();
    }
    if (raw.startsWith("jhone") || raw.startsWith("john")) {
      const found = employeesList.find((e) => e.name && (e.name.toLowerCase().includes("jhone") || e.name.toLowerCase().includes("john")));
      if (found) return found.name.trim();
    }

    // 2. Exact match (case-insensitive, trimmed)
    const exact = employeesList.find(
      (e) => e.name && e.name.toLowerCase().trim() === raw
    );
    if (exact) return exact.name.trim();

    // 3. First-name or substring match
    const firstWord = raw.split(/\s+/)[0];
    const byFirstWord = employeesList.find((e) => {
      if (!e.name) return false;
      const eNorm = e.name.toLowerCase().trim();
      const eFirst = eNorm.split(/\s+/)[0];
      return eFirst === firstWord || eNorm.includes(raw) || raw.includes(eNorm);
    });
    if (byFirstWord) return byFirstWord.name.trim();

    return rawName.trim();
  };

  const isMatchPeriod = (dateStr?: string) => {
    if (!dateStr || typeof dateStr !== "string") return false;
    if (leaderboardPeriod === "all") return true;
    const targetPrefix = leaderboardPeriod === "month"
      ? new Date().toISOString().slice(0, 7) // e.g. "2026-10"
      : leaderboardPeriod;
    return dateStr.startsWith(targetPrefix);
  };

  const currentMonthLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const leaderboardSubtitle =
    leaderboardPeriod === "month"
      ? `Ranked by revenue generated — ${currentMonthLabel}`
      : leaderboardPeriod === "all"
        ? "Ranked by revenue generated — All Time"
        : `Ranked by revenue generated — ${
            leaderboardPeriod.includes("-")
              ? new Date(
                  Number(leaderboardPeriod.split("-")[0]),
                  Number(leaderboardPeriod.split("-")[1]) - 1,
                  1
                ).toLocaleString("default", { month: "long", year: "numeric" })
              : leaderboardPeriod
          }`;

  // Filter bookings and leads according to period
  const filteredBookings = bookingsList.filter((b) => {
    const d = b.bookingDate || b.created_at || b.createdAt;
    return isMatchPeriod(d);
  });

  const filteredLeads = leadsList.filter((l) => {
    const d = l.createdAt || l.created_at;
    return isMatchPeriod(d);
  });

  // Compute leaderboard
  const consultantMap = new Map<string, { deals: number; revenue: number; leads: number }>();

  filteredBookings.forEach((b) => {
    const c = getNormalizedName(b.bookedBy || "Unknown");
    if (c === "Unknown") return;
    if (!consultantMap.has(c)) {
      consultantMap.set(c, { deals: 0, revenue: 0, leads: 0 });
    }
    const item = consultantMap.get(c)!;
    item.deals += 1;
    item.revenue += b.amount || 0;
  });

  filteredLeads.forEach((l) => {
    const c = l.assignedTo ? getNormalizedName(l.assignedTo) : null;
    if (c && c !== "Unknown") {
      if (!consultantMap.has(c)) {
        consultantMap.set(c, { deals: 0, revenue: 0, leads: 0 });
      }
      consultantMap.get(c)!.leads += 1;
    }
  });

  const leaderboard = Array.from(consultantMap.entries())
    // Only include actual employees who have closed deals or revenue
    .filter(([name, data]) => (data.deals > 0 || data.revenue > 0) && employeesList.some((e) => e.name.trim().toLowerCase() === name.trim().toLowerCase()))
    .map(([name, data]) => {
      const conversion = data.leads ? Math.min(100, Math.round((data.deals / data.leads) * 100)) : (data.deals > 0 ? 100 : 0);
      const emp = employeesList.find((e) => e.name.trim().toLowerCase() === name.trim().toLowerCase());
      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || "?";
      return {
        name,
        avatar: emp?.avatar || "",
        initials,
        deals: data.deals,
        revenue: data.revenue,
        conversion,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/crm" })}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revenue, pipeline and consultant performance at a glance.
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" className="gap-2 rounded-xl" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="MTD Revenue"
          value={formatINR(totalRevenue)}
          icon={<IndianRupee className="h-4 w-4" />}
          sub="Collected this month"
          color="bg-primary/15 text-primary border border-primary/25"
        />
        <KpiCard
          label="Pending Amount"
          value={formatINR(pendingAmount)}
          icon={<TrendingUp className="h-4 w-4" />}
          sub="Awaiting collection"
          color="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
        />
        <KpiCard
          label="Won Leads"
          value={`${wonLeads} / ${leadsList.length}`}
          icon={<UserCheck className="h-4 w-4" />}
          sub="Conversion rate"
          color="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
        />
        <KpiCard
          label="Active Bookings"
          value={String(bookingsList.filter((b) => b.status !== "Cancelled").length)}
          icon={<CalendarCheck className="h-4 w-4" />}
          sub="Non-cancelled"
          color="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25"
        />
      </div>

      {/* Revenue + Bookings trend */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0">
        <SectionHeader
          title="Revenue & Bookings Trend"
          sub="Monthly figures (₹ lakhs) and total bookings"
        />
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#888" tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#888" tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#888" tickLine={false} axisLine={false} />
              <Tooltip
                content={<ReportsRevenueTooltip />}
                wrapperStyle={{ outline: "none", zIndex: 50 }}
                cursor={{ stroke: "var(--primary)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
              />
              <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: "12px", fontSize: "11px" }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue (₹L)"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ r: 5, fill: "var(--primary)", strokeWidth: 2 }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bookings"
                name="Bookings"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#6366f1" }}
                strokeDasharray="5 5"
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Destination revenue + Lead source */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0">
          <SectionHeader title="Revenue by Destination" sub="₹ lakhs — current year" />
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={destData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#888" tickLine={false} axisLine={false} />
                <YAxis dataKey="dest" type="category" tick={{ fontSize: 12 }} width={72} stroke="#888" tickLine={false} axisLine={false} />
                <Tooltip
                  content={<ReportsDestinationTooltip />}
                  wrapperStyle={{ outline: "none", zIndex: 50 }}
                  cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                />
                <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                  {destData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card min-w-0">
          <SectionHeader title="Lead Sources" sub="Where inquiries come from" />
          <div className="mt-4 flex items-center gap-6">
            <div className="h-56 w-56 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={88}
                    paddingAngle={3}
                    label={false}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ReportsSourceTooltip />}
                    wrapperStyle={{ outline: "none", zIndex: 50 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {sourceData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                  />
                  <span className="flex-1 text-sm">{s.name}</span>
                  <span className="text-sm font-semibold">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Consultant leaderboard */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Consultant Leaderboard</h2>
            <p className="text-sm text-muted-foreground">
              {leaderboardSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setLeaderboardPeriod("month")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  leaderboardPeriod === "month"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardPeriod("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  leaderboardPeriod === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Time
              </button>
            </div>
            {availableMonths.length > 0 && (
              <select
                value={leaderboardPeriod.startsWith("20") ? leaderboardPeriod : ""}
                onChange={(e) => {
                  if (e.target.value) setLeaderboardPeriod(e.target.value);
                }}
                className="text-xs bg-card border border-border rounded-xl px-2.5 py-1.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                <option value="" disabled>Past Months...</option>
                {availableMonths.map((m) => {
                  const [year, month] = m.split("-");
                  const date = new Date(Number(year), Number(month) - 1, 1);
                  const label = date.toLocaleString("default", { month: "short", year: "numeric" });
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Trophy className="h-6 w-6" />
            </div>
            <p className="font-semibold text-foreground text-sm">
              {leaderboardPeriod === "month"
                ? `No deals closed in ${currentMonthLabel} yet`
                : "No consultant deals recorded for this period"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Inactive employees with 0 deals are filtered out. You can switch to All Time or view previous months to see performance rankings.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setLeaderboardPeriod("all")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                View All Time Leaderboard
              </button>
              {availableMonths.length > 0 && availableMonths[0] !== new Date().toISOString().slice(0, 7) && (
                <button
                  type="button"
                  onClick={() => setLeaderboardPeriod(availableMonths[0])}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                >
                  View {new Date(Number(availableMonths[0].split("-")[0]), Number(availableMonths[0].split("-")[1]) - 1, 1).toLocaleString("default", { month: "short", year: "numeric" })}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leaderboard.map((c, i) => (
              <div
                key={c.name}
                className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors"
              >
                {/* Rank */}
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl font-display text-xs font-bold border ${
                    i === 0
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400"
                      : i === 1
                        ? "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-800 dark:text-slate-300"
                        : i === 2
                          ? "bg-amber-700/10 text-amber-700 border-amber-700/20 dark:bg-amber-950/30 dark:text-amber-500"
                          : "bg-secondary/60 text-muted-foreground border-border/50"
                  }`}
                >
                  {i + 1}
                </span>

                {/* Themed Avatar */}
                {c.avatar ? (
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="h-10 w-10 rounded-full object-cover border border-border shadow-sm"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center font-bold text-primary text-sm shadow-sm">
                    {c.initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.deals} {c.deals === 1 ? "deal" : "deals"} closed</p>
                </div>
                {/* Conversion */}
                <div className="hidden text-center sm:block">
                  <p className="font-semibold">{c.conversion}%</p>
                  <p className="text-xs text-muted-foreground">Conversion</p>
                </div>
                {/* Revenue */}
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-primary">
                    {formatINR(c.revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
                {/* Mini bar */}
                <div className="hidden w-24 sm:block">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: leaderboard.length > 0 && leaderboard[0].revenue > 0 ? `${Math.round((c.revenue / leaderboard[0].revenue) * 100)}%` : '0%',
                        background: "var(--gradient-brand)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead pipeline table */}
      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold">Lead Pipeline Summary</h2>
          <p className="text-sm text-muted-foreground">Stage-wise breakdown of all leads</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Stage</th>
                <th className="px-6 py-3">Count</th>
                <th className="px-6 py-3">% of Total</th>
                <th className="px-6 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  "New Lead",
                  "Contacted",
                  "Quotation Sent",
                  "Negotiation",
                  "in process",
                  "Confirmed",
                  "Payment Pending",
                  "Postponed",
                  "Completed",
                  "Lost",
                ] as const
              ).map((stage) => {
                const count = leadsList.filter((l) => l.status === stage).length;
                const pct = leadsList.length ? Math.round((count / leadsList.length) * 100) : 0;
                return (
                  <tr key={stage} className="border-t border-border hover:bg-secondary/20">
                    <td className="px-6 py-3 font-medium">{stage}</td>
                    <td className="px-6 py-3">{count}</td>
                    <td className="px-6 py-3">{pct}%</td>
                    <td className="px-6 py-3 w-40">
                      <div className="h-1.5 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
