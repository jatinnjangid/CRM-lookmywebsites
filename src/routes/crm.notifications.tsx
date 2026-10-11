import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  Filter,
  Users,
  ListChecks,
  CalendarCheck,
  Briefcase,
  Megaphone,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useNotifications,
  type AppNotification,
} from "@/lib/notifications";

export const Route = createFileRoute("/crm/notifications")({
  head: () => ({ meta: [{ title: "Notifications — LookMyHolidays CRM" }] }),
  component: NotificationsPage,
});

function formatTimeAgo(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getVisuals(type: AppNotification["type"]) {
  switch (type) {
    case "lead":
      return {
        label: "Lead",
        icon: Users,
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
        iconBox: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
      };
    case "task":
      return {
        label: "Task",
        icon: ListChecks,
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
        iconBox: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
      };
    case "booking":
      return {
        label: "Booking",
        icon: CalendarCheck,
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
        iconBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
      };
    case "leave":
      return {
        label: "HR / Leave",
        icon: Briefcase,
        badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
        iconBox: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
      };
    case "system":
    default:
      return {
        label: "System",
        icon: Megaphone,
        badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
        iconBox: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25",
      };
  }
}

function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");

  const filtered = notifications.filter((n) => {
    if (search) {
      const q = search.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (statusFilter === "unread" && n.read) return false;
    if (statusFilter === "read" && !n.read) return false;
    return true;
  });

  const leadCount = notifications.filter((n) => n.type === "lead").length;
  const taskCount = notifications.filter((n) => n.type === "task").length;
  const bookingCount = notifications.filter((n) => n.type === "booking").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate({ to: "/crm" });
              }
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Back to Dashboard"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </span>
              Notifications Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stay updated with leads, task deadlines, booking confirmations, and system alerts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsRead()}
              className="rounded-xl shadow-sm h-10"
            >
              <CheckCheck className="h-4 w-4 mr-2 text-emerald-600" />
              Mark All Read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => clearAll()}
              className="rounded-xl h-10 text-muted-foreground hover:text-red-600"
              title="Clear all notifications"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Unread Alerts
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {unreadCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Lead Updates
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {leadCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Task Reminders
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {taskCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Bookings
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {bookingCount}
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts by title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl h-10"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: "all", label: "All" },
            { id: "lead", label: "Leads" },
            { id: "task", label: "Tasks" },
            { id: "booking", label: "Bookings" },
            { id: "leave", label: "Leaves" },
            { id: "system", label: "System" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                typeFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 sm:ml-auto">
          {(["all", "unread", "read"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-secondary text-muted-foreground">
                <Bell className="h-7 w-7 opacity-50" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground">
                No notifications found
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search
                  ? `No alerts matching "${search}". Try clearing your search.`
                  : "All caught up! Check your In-App Notification toggles in Settings to enable more alerts."}
              </p>
              <Link to="/crm/settings" search={{ tab: "notifications" } as any} className="inline-block mt-4">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Configure Alerts in Settings
                </Button>
              </Link>
            </div>
          ) : (
            filtered.map((item) => {
              const visual = getVisuals(item.type);
              const Icon = visual.icon;
              return (
                <div
                  key={item.id}
                  className={`group flex items-start gap-4 p-5 transition-colors ${
                    item.read
                      ? "hover:bg-secondary/30"
                      : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  {/* Left Icon */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${visual.iconBox} shadow-sm`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Main Details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${visual.badge}`}
                      >
                        {visual.label}
                      </span>
                      <h4
                        className={`text-sm font-bold ${
                          item.read ? "text-foreground" : "text-primary"
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                      )}
                      <span className="text-xs text-muted-foreground sm:ml-auto">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.message}
                    </p>

                    {/* Quick navigation link */}
                    {item.link && (
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            markAsRead(item.id);
                            navigate({ to: item.link as any });
                          }}
                          className="h-8 px-3 rounded-xl text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
                        >
                          <span>Open related page</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Actions on right */}
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(item.id)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                      title={item.read ? "Already read" : "Mark as read"}
                      disabled={item.read}
                    >
                      <CheckCheck className={`h-4 w-4 ${item.read ? "opacity-30" : "text-emerald-600"}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(item.id)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
