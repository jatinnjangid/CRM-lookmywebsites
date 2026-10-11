import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface NotificationPreferences {
  leadAssigned: boolean;
  taskDue: boolean;
  bookingConfirmed: boolean;
  leaveRequested: boolean;
  systemUpdates: boolean;
  emailDigest: boolean;
  whatsapp: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  leadAssigned: true,
  taskDue: true,
  bookingConfirmed: true,
  leaveRequested: true,
  systemUpdates: true,
  emailDigest: true,
  whatsapp: false,
};

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "lead" | "task" | "booking" | "leave" | "system";
  timestamp: string; // ISO date string
  read: boolean;
  link: string;
}

const STORAGE_KEY_NOTIFS = "crm_notifications_list";
const STORAGE_KEY_PREFS = "crm_notification_preferences";
const STORAGE_KEY_READ = "crm_read_notification_ids";
const STORAGE_KEY_DELETED = "crm_deleted_notification_ids";
const EVENT_KEY = "crm-notifications-changed";

export function getStoredPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_PREFERENCES;
}

export function saveStoredPreferences(prefs: NotificationPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent(EVENT_KEY));
  } catch (e) {
    console.error(e);
  }
}

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

function saveReadIds(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY_READ, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

function saveDeletedIds(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

/**
 * Fetch live data from all Supabase tables and convert them into AppNotifications
 */
export async function fetchLiveNotificationsFromSupabase(): Promise<AppNotification[]> {
  const readIds = getReadIds();
  const deletedIds = getDeletedIds();
  const items: AppNotification[] = [];

  try {
    // 1. Fetch live Leads from Supabase
    const { data: leads } = await supabase
      .from("leads")
      .select("id, name, status, created_at, assignedTo, destinationCity, queryType")
      .order("created_at", { ascending: false })
      .limit(10);

    if (leads && leads.length > 0) {
      leads.forEach((l: any) => {
        const notifId = `lead-${l.id}`;
        if (deletedIds.has(notifId)) return;

        const dest = l.destinationCity || l.queryType;
        const assigned = l.assignedTo ? ` • Assigned to ${l.assignedTo}` : "";
        items.push({
          id: notifId,
          title: `New Lead: ${l.name || "Inquiry"}`,
          message: `${dest ? `${dest} • ` : ""}Status: ${l.status || "Active"}${assigned}`,
          type: "lead",
          timestamp: l.created_at || new Date().toISOString(),
          read: readIds.has(notifId),
          link: "/crm/leads",
        });
      });
    }

    // 2. Fetch live Tasks from Supabase
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, status, dueDate, assignee, priority, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (tasks && tasks.length > 0) {
      tasks.forEach((t: any) => {
        const notifId = `task-${t.id}`;
        if (deletedIds.has(notifId)) return;

        const due = t.dueDate ? `Due: ${t.dueDate}` : "Pending deadline";
        const priority = t.priority ? ` • ${t.priority} Priority` : "";
        items.push({
          id: notifId,
          title: `Task: ${t.title || "Untitled Task"}`,
          message: `Status: ${t.status || "Pending"} • ${due}${priority}`,
          type: "task",
          timestamp: t.created_at || new Date().toISOString(),
          read: readIds.has(notifId),
          link: "/crm/tasks",
        });
      });
    }

    // 3. Fetch live Bookings from Supabase
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, status, clientName, destination, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (bookings && bookings.length > 0) {
      bookings.forEach((b: any) => {
        const notifId = `booking-${b.id}`;
        if (deletedIds.has(notifId)) return;

        const client = b.clientName ? `${b.clientName} • ` : "";
        const dest = b.destination ? ` • ${b.destination}` : "";
        items.push({
          id: notifId,
          title: `Booking #${b.id}`,
          message: `${client}Status: ${b.status || "Confirmed"}${dest}`,
          type: "booking",
          timestamp: b.created_at || new Date().toISOString(),
          read: readIds.has(notifId),
          link: "/crm/bookings",
        });
      });
    }

    // 4. Fetch live Leaves from Supabase
    const { data: leaves } = await supabase
      .from("leaves")
      .select("id, employeeName, status, reason, days, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (leaves && leaves.length > 0) {
      leaves.forEach((lv: any) => {
        const notifId = `leave-${lv.id}`;
        if (deletedIds.has(notifId)) return;

        const reason = lv.reason ? ` • ${lv.reason}` : "";
        const days = lv.days ? ` (${lv.days} days)` : "";
        items.push({
          id: notifId,
          title: `Leave: ${lv.employeeName || "Employee Request"}`,
          message: `Status: ${lv.status || "Pending"}${days}${reason}`,
          type: "leave",
          timestamp: lv.created_at || new Date().toISOString(),
          read: readIds.has(notifId),
          link: "/crm/employees",
        });
      });
    }

    // 5. Fetch live Marketing campaigns from Supabase
    const { data: mkt } = await supabase
      .from("marketing_campaigns")
      .select("id, name, status, type, sentDate, created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    if (mkt && mkt.length > 0) {
      mkt.forEach((c: any) => {
        const notifId = `system-${c.id}`;
        if (deletedIds.has(notifId)) return;

        const channel = c.type ? `Channel: ${c.type}` : "Marketing";
        const dateStr = c.sentDate ? ` • ${c.sentDate}` : "";
        items.push({
          id: notifId,
          title: `Template Store: ${c.name || "Campaign"}`,
          message: `${channel} • Status: ${c.status || "Active"}${dateStr}`,
          type: "system",
          timestamp: c.created_at || new Date().toISOString(),
          read: readIds.has(notifId),
          link: "/crm/marketing",
        });
      });
    }

  } catch (err) {
    console.error("Error fetching live notifications from Supabase:", err);
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Cache locally
  if (items.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(items));
    } catch (e) {}
  }

  return items;
}

export function getCachedNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
}

export function markNotificationAsRead(id: string) {
  const readIds = getReadIds();
  readIds.add(id);
  saveReadIds(readIds);

  const cached = getCachedNotifications();
  const updated = cached.map((n) => (n.id === id ? { ...n, read: true } : n));
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
  } catch (e) {}
  window.dispatchEvent(new CustomEvent(EVENT_KEY));
}

export function markAllNotificationsAsRead() {
  const cached = getCachedNotifications();
  const readIds = getReadIds();
  cached.forEach((n) => readIds.add(n.id));
  saveReadIds(readIds);

  const updated = cached.map((n) => ({ ...n, read: true }));
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
  } catch (e) {}
  window.dispatchEvent(new CustomEvent(EVENT_KEY));
}

export function deleteNotification(id: string) {
  const deletedIds = getDeletedIds();
  deletedIds.add(id);
  saveDeletedIds(deletedIds);

  const cached = getCachedNotifications();
  const updated = cached.filter((n) => n.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
  } catch (e) {}
  window.dispatchEvent(new CustomEvent(EVENT_KEY));
}

export function clearAllNotifications() {
  const cached = getCachedNotifications();
  const deletedIds = getDeletedIds();
  cached.forEach((n) => deletedIds.add(n.id));
  saveDeletedIds(deletedIds);

  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify([]));
  } catch (e) {}
  window.dispatchEvent(new CustomEvent(EVENT_KEY));
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.1); // B5
    gain2.gain.setValueAtTime(0.1, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch (e) {
    // Safe ignore audio policy errors
  }
}

/**
 * Handle incoming real-time notifications with an interactive screen bubble toast
 */
function handleIncomingRealtimeNotification(notif: AppNotification) {
  const prefs = getStoredPreferences();
  if (notif.type === "lead" && !prefs.leadAssigned) return;
  if (notif.type === "task" && !prefs.taskDue) return;
  if (notif.type === "booking" && !prefs.bookingConfirmed) return;
  if (notif.type === "leave" && !prefs.leaveRequested) return;
  if (notif.type === "system" && !prefs.systemUpdates) return;

  const deletedIds = getDeletedIds();
  if (deletedIds.has(notif.id)) return;

  const cached = getCachedNotifications();
  if (cached.some((n) => n.id === notif.id)) return;

  const updated = [notif, ...cached];
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
  } catch (e) {}
  window.dispatchEvent(new CustomEvent(EVENT_KEY));

  // Play subtle sound chime
  playNotificationChime();

  // Show a real-time bubble toast notification on the window
  toast(notif.title, {
    description: notif.message,
    duration: 8000,
    action: {
      label: "View",
      onClick: () => {
        window.dispatchEvent(new CustomEvent("crm-navigate", { detail: notif.link }));
      },
    },
  });
}

/**
 * React hook to access live Supabase notifications and real-time subscription
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getCachedNotifications()
  );
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    getStoredPreferences()
  );
  const [isLoading, setIsLoading] = useState(false);

  const syncFromSupabase = useCallback(async () => {
    try {
      setIsLoading(true);
      const live = await fetchLiveNotificationsFromSupabase();
      if (live && live.length > 0) {
        setNotifications(live);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial background fetch
    syncFromSupabase();

    // 2. Automated background poll every 30s so user never needs a manual sync button
    const pollInterval = setInterval(() => {
      syncFromSupabase();
    }, 30000);

    // 3. Setup Realtime Supabase Subscription across all tables
    const channelId = `crm_realtime_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      // Leads (INSERT & UPDATE)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const l = payload.new;
          handleIncomingRealtimeNotification({
            id: `lead-${l.id}`,
            title: `New Lead: ${l.name || "Inquiry"}`,
            message: `${l.destinationCity || l.queryType ? `${l.destinationCity || l.queryType} • ` : ""}Status: ${l.status || "Active"}${l.assignedTo ? ` • Assigned to ${l.assignedTo}` : ""}`,
            type: "lead",
            timestamp: l.created_at || new Date().toISOString(),
            read: false,
            link: "/crm/leads",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          const l = payload.new;
          handleIncomingRealtimeNotification({
            id: `lead-${l.id}-${Date.now()}`,
            title: `Lead Updated: ${l.name || "Inquiry"}`,
            message: `Status: ${l.status || "Updated"}${l.assignedTo ? ` • Assigned to ${l.assignedTo}` : ""}`,
            type: "lead",
            timestamp: new Date().toISOString(),
            read: false,
            link: "/crm/leads",
          });
        }
      )
      // Tasks (INSERT & UPDATE)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => {
          const t = payload.new;
          handleIncomingRealtimeNotification({
            id: `task-${t.id}`,
            title: `New Task: ${t.title || "Untitled Task"}`,
            message: `Status: ${t.status || "Pending"} • Due: ${t.dueDate || "Soon"}`,
            type: "task",
            timestamp: t.created_at || new Date().toISOString(),
            read: false,
            link: "/crm/tasks",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks" },
        (payload) => {
          const t = payload.new;
          handleIncomingRealtimeNotification({
            id: `task-${t.id}-${Date.now()}`,
            title: `Task Updated: ${t.title || "Task"}`,
            message: `Status changed to ${t.status || "Updated"}`,
            type: "task",
            timestamp: new Date().toISOString(),
            read: false,
            link: "/crm/tasks",
          });
        }
      )
      // Bookings (INSERT & UPDATE)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          const b = payload.new;
          handleIncomingRealtimeNotification({
            id: `booking-${b.id}`,
            title: `New Booking #${b.id}`,
            message: `${b.clientName ? `${b.clientName} • ` : ""}Status: ${b.status || "Confirmed"}`,
            type: "booking",
            timestamp: b.created_at || new Date().toISOString(),
            read: false,
            link: "/crm/bookings",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          const b = payload.new;
          handleIncomingRealtimeNotification({
            id: `booking-${b.id}-${Date.now()}`,
            title: `Booking #${b.id} Updated`,
            message: `${b.clientName ? `${b.clientName} • ` : ""}Status: ${b.status || "Updated"}`,
            type: "booking",
            timestamp: new Date().toISOString(),
            read: false,
            link: "/crm/bookings",
          });
        }
      )
      // Leaves (INSERT)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leaves" },
        (payload) => {
          const lv = payload.new;
          handleIncomingRealtimeNotification({
            id: `leave-${lv.id}`,
            title: `Leave Request: ${lv.employeeName || "Employee"}`,
            message: `Status: ${lv.status || "Pending"}${lv.days ? ` (${lv.days} days)` : ""}`,
            type: "leave",
            timestamp: lv.created_at || new Date().toISOString(),
            read: false,
            link: "/crm/employees",
          });
        }
      )
      // Marketing Campaigns (INSERT & UPDATE)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "marketing_campaigns" },
        (payload) => {
          const m = payload.new;
          handleIncomingRealtimeNotification({
            id: `system-${m.id}`,
            title: `New Campaign: ${m.name || "Campaign"}`,
            message: `Channel: ${m.type || "Marketing"} • Status: ${m.status || "Active"}`,
            type: "system",
            timestamp: m.created_at || new Date().toISOString(),
            read: false,
            link: "/crm/marketing",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "marketing_campaigns" },
        (payload) => {
          const m = payload.new;
          handleIncomingRealtimeNotification({
            id: `system-${m.id}-${Date.now()}`,
            title: `Campaign Updated: ${m.name || "Campaign"}`,
            message: `Status: ${m.status || "Updated"}`,
            type: "system",
            timestamp: new Date().toISOString(),
            read: false,
            link: "/crm/marketing",
          });
        }
      )
      .subscribe();

    const handleEvent = () => {
      setNotifications(getCachedNotifications());
      setPreferences(getStoredPreferences());
    };

    window.addEventListener(EVENT_KEY, handleEvent);
    window.addEventListener("storage", handleEvent);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
      window.removeEventListener(EVENT_KEY, handleEvent);
      window.removeEventListener("storage", handleEvent);
    };
  }, [syncFromSupabase]);

  // Filter notifications according to the active toggles in Settings
  const visibleNotifications = notifications.filter((n) => {
    if (n.type === "lead" && !preferences.leadAssigned) return false;
    if (n.type === "task" && !preferences.taskDue) return false;
    if (n.type === "booking" && !preferences.bookingConfirmed) return false;
    if (n.type === "leave" && !preferences.leaveRequested) return false;
    if (n.type === "system" && !preferences.systemUpdates) return false;
    return true;
  });

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  return {
    notifications: visibleNotifications,
    rawNotifications: notifications,
    preferences,
    unreadCount,
    isLoading,
    refresh: syncFromSupabase,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification,
    clearAll: clearAllNotifications,
    updatePreferences: saveStoredPreferences,
  };
}
