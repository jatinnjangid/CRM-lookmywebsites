import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  Users,
  ListChecks,
  CalendarCheck,
  Briefcase,
  Megaphone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  type AppNotification,
} from "@/lib/notifications";

function formatRelativeTime(dateStr: string) {
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
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getNotificationVisuals(type: AppNotification["type"]) {
  switch (type) {
    case "lead":
      return {
        icon: Users,
        bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    case "task":
      return {
        icon: ListChecks,
        bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    case "booking":
      return {
        icon: CalendarCheck,
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    case "leave":
      return {
        icon: Briefcase,
        bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      };
    case "system":
    default:
      return {
        icon: Megaphone,
        bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      };
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const displayList =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-secondary/60 text-foreground transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[360px] sm:w-[400px] rounded-2xl p-0 shadow-2xl border border-border overflow-hidden bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="font-display text-sm font-bold text-foreground">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 rounded-lg"
                title="Mark all as read"
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 border-b border-border px-4 py-2 bg-background/50">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              filter === "unread"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
          {displayList.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bell className="h-5 w-5 opacity-40" />
              </div>
              <p className="text-xs font-medium text-foreground">
                No notifications right now
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {filter === "unread"
                  ? "You have caught up with all alerts!"
                  : "Check notification toggles in Settings."}
              </p>
            </div>
          ) : (
            displayList.map((notif) => {
              const visual = getNotificationVisuals(notif.type);
              const Icon = visual.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.link) navigate({ to: notif.link as any });
                  }}
                  className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                    notif.read
                      ? "hover:bg-secondary/40"
                      : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  {/* Type Icon */}
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${visual.bg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Text Content */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          notif.read ? "text-foreground" : "text-primary"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeTime(notif.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Action buttons & Unread Dot */}
                  <div className="flex flex-col items-center gap-1.5 self-center shrink-0">
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 rounded transition-opacity"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 bg-muted/20">
          <Link
            to="/crm/notifications"
            className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors rounded-xl"
          >
            <span>View All Notifications</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
