import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  LifeBuoy,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  Phone,
  Send,
  User,
  Layers,
  Sparkles,
  Paperclip,
  Check,
  CheckCheck,
  RefreshCw,
  Trash2,
  CalendarCheck,
  CreditCard,
  Users,
  Plane,
  X,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
  Bot,
  Image as ImageIcon,
  Star,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getAuth } from "@/lib/auth";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { supabase } from "@/lib/supabase";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";

export const Route = createFileRoute("/crm/help")({
  head: () => ({ meta: [{ title: "IT Support Chat & Helpdesk — LookMyHolidays CRM" }] }),
  component: HelpChatPage,
});

export type TicketPriority = "Critical" | "High" | "Medium" | "Low";
export type TicketStatus = "Open" | "In Review" | "In Progress" | "Resolved" | "Closed";

export interface TicketComment {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  module: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  requesterName: string;
  requesterRole: string;
  requesterEmail?: string;
  requesterPhone?: string;
  relatedReference?: string;
  stepsToReproduce?: string;
  screenshotUrl?: string;
  itAssignee?: string;
  itResolutionNotes?: string;
  resolutionDate?: string;
  comments?: TicketComment[];
  feedbackRating?: number;
  feedbackText?: string;
  feedbackSubmittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const CRM_MODULES = [
  { value: "Bookings", label: "Bookings & Vouchers", icon: CalendarCheck },
  { value: "Leads", label: "Leads & Enquiries", icon: Users },
  { value: "Quotations", label: "Quotations & Pricing", icon: BookOpen },
  { value: "Visa", label: "Visa Processing", icon: Plane },
  { value: "Accounts", label: "Accounts & Payments", icon: CreditCard },
  { value: "Attendance", label: "Attendance & Leaves", icon: Clock },
  { value: "Customers", label: "Customers & Vendors", icon: Users },
  { value: "Taxi Booking", label: "Taxi Booking", icon: Layers },
  { value: "Login / Access", label: "Login & Permissions", icon: ShieldCheck },
  { value: "Speed / Bug", label: "Bug / System Error", icon: AlertTriangle },
  { value: "Feature Request", label: "Feature Suggestion", icon: Sparkles },
  { value: "Other", label: "Other Technical Query", icon: HelpCircle },
];

export const RATING_LABELS: Record<number, { label: string; desc: string; emoji: string }> = {
  5: { emoji: "😍", label: "Outstanding!", desc: "Resolved super fast & perfectly" },
  4: { emoji: "😊", label: "Very Good!", desc: "Helpful support, problem solved" },
  3: { emoji: "😐", label: "Average", desc: "Resolved, but took some time" },
  2: { emoji: "🙁", label: "Below Expectations", desc: "Need faster or clearer response" },
  1: { emoji: "😡", label: "Unsatisfied", desc: "Issue still recurring or unaddressed" },
};

export const FEEDBACK_TAGS = [
  "⚡ Super Fast Resolution",
  "👍 Problem Solved 100%",
  "🙌 Helpful & Polite Support",
  "💬 Clear Guidance",
  "🐛 Bug Fixed Smoothly",
  "✨ Great CRM Experience",
];

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "d1b11111-0000-4000-8000-000000000001",
    ticketNumber: "TICK-1001",
    module: "Bookings",
    subject: "Profit margin calculation on multi-city flight booking",
    description: "When updating vendor payable on booking BK-8821, the profit shows the previous value until refreshed. Please check.",
    priority: "High",
    status: "In Progress",
    requesterName: "Deepak Yogi",
    requesterRole: "Employee",
    requesterEmail: "deepak@lookmyholidays.in",
    relatedReference: "BK-8821",
    itAssignee: "IT Administrator",
    comments: [
      {
        id: "c-1",
        authorName: "IT Administrator",
        authorRole: "IT Administrator",
        content: "Hi Deepak! 👋 Thank you for raising this. I am reviewing the calculation state logic on BK-8821 right now. Will patch it within a few minutes.",
        createdAt: "2026-09-29T10:15:00Z",
      },
    ],
    createdAt: "2026-09-29T09:30:00Z",
    updatedAt: "2026-09-29T10:15:00Z",
  },
  {
    id: "d1b11111-0000-4000-8000-000000000002",
    ticketNumber: "TICK-1002",
    module: "Accounts",
    subject: "Supplier invoice attachment preview on PR-3042",
    description: "Uploaded supplier invoice image is visible on the web portal, but not in PDF download.",
    priority: "Medium",
    status: "Resolved",
    requesterName: "Aman",
    requesterRole: "Accountant",
    requesterEmail: "aman@lookmyholidays.in",
    relatedReference: "PR-3042",
    itAssignee: "IT Administrator",
    itResolutionNotes: "Resolved: cross-origin image embed enabled in PDF generator.",
    feedbackRating: 5,
    feedbackText: "⚡ Super Fast Resolution • Verified, working properly now! Thanks IT Support.",
    feedbackSubmittedAt: "2026-09-29T16:25:00Z",
    comments: [
      {
        id: "c-2",
        authorName: "IT Administrator",
        authorRole: "IT Administrator",
        content: "Fixed! Please test with PR-3042 now.",
        createdAt: "2026-09-29T16:05:00Z",
      },
      {
        id: "c-3",
        authorName: "Aman",
        authorRole: "Accountant",
        content: "Verified, working properly now! Thanks IT Support.",
        createdAt: "2026-09-29T16:20:00Z",
      },
      {
        id: "c-4",
        authorName: "IT Administrator",
        authorRole: "IT Administrator",
        content: "🎉 Thank you so much for your 5 ⭐ rating & feedback! We appreciate your review. Glad we could resolve this CRM issue for you! 🙌",
        createdAt: "2026-09-29T16:25:05Z",
      },
    ],
    createdAt: "2026-09-28T14:00:00Z",
    updatedAt: "2026-09-29T16:25:05Z",
  },
];

const LOCAL_STORAGE_BACKUP_KEY = "crm_it_support_tickets_v1";

function HelpChatPage() {
  const auth = getAuth();
  const [tickets, setTickets, isLoaded] = useSupabaseTable<SupportTicket[]>("it_support_tickets", INITIAL_TICKETS);

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== "undefined" && isLoaded && tickets && tickets.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(tickets));
      } catch (e) {
        // ignore
      }
    }
  }, [tickets, isLoaded]);

  // Load from local storage fallback (only once on initial load if remote is empty)
  const hasCheckedLocalStorageFallback = useRef(false);
  useEffect(() => {
    if (hasCheckedLocalStorageFallback.current) return;
    if (typeof window !== "undefined" && isLoaded) {
      hasCheckedLocalStorageFallback.current = true;
      if (!tickets || tickets.length === 0) {
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTickets(parsed);
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [isLoaded, tickets, setTickets]);

  // Only 2 members can see ALL employee tickets and manage IT helpdesk:
  // 1) Jatin (IT Lead)
  // 2) Manvendra Sir (CEO & Founder)
  // All other staff (HR, Sales, Managers, Employees) can ONLY see their own tickets!
  const isITLead = useMemo(() => {
    if (!auth) return false;
    const name = (auth.name || "").toLowerCase().trim();
    const email = (auth.email || "").toLowerCase().trim();
    return (
      name.includes("jatin") ||
      name.includes("manvender") ||
      name.includes("manvendra") ||
      email.includes("jatin") ||
      email.includes("manvender") ||
      email.includes("manvendra")
    );
  }, [auth]);

  // View Mode: "chat" (viewing an existing query chat) or "create" (form to raise a new ticket)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Search & Filter in Chat list
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Resolved">("All");

  // New Ticket Form State
  const [newModule, setNewModule] = useState("Bookings");
  const [newPriority, setNewPriority] = useState<TicketPriority>("Medium");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRelatedRef, setNewRelatedRef] = useState("");
  const [newScreenshotUrl, setNewScreenshotUrl] = useState("");

  // Chat message input
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Feedback State
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isFeedbackPopupOpen, setIsFeedbackPopupOpen] = useState(false);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [hasJustSubmittedReaction, setHasJustSubmittedReaction] = useState(false);

  // Pop-up Modal States
  const [ticketToDeleteId, setTicketToDeleteId] = useState<string | null>(null);
  const ticketToDeleteRef = useRef<string | null>(null);

  // Filtered queries in the list
  const visibleTickets = useMemo(() => {
    return tickets.filter((t) => {
      // If NOT Jatin or Manvendra Sir, user can strictly ONLY see their own query tickets!
      if (!isITLead) {
        if (!auth) return false;
        const curName = (auth.name || "").toLowerCase().trim();
        const curEmail = (auth.email || "").toLowerCase().trim();
        const reqName = (t.requesterName || "").toLowerCase().trim();
        const reqEmail = (t.requesterEmail || "").toLowerCase().trim();

        const matchEmail = curEmail && reqEmail && curEmail === reqEmail;
        const matchName = curName && reqName && (
          reqName === curName ||
          reqName.includes(curName.split(" ")[0]) ||
          curName.includes(reqName.split(" ")[0])
        );

        if (!matchEmail && !matchName) return false;
      }

      // Status filter
      if (statusFilter === "Open" && (t.status === "Resolved" || t.status === "Closed")) return false;
      if (statusFilter === "Resolved" && t.status !== "Resolved" && t.status !== "Closed") return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = t.ticketNumber.toLowerCase().includes(q);
        const matchSub = t.subject.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchReq = (t.requesterName || "").toLowerCase().includes(q);
        const matchMod = (t.module || "").toLowerCase().includes(q);
        if (!matchNum && !matchSub && !matchDesc && !matchReq && !matchMod) return false;
      }

      return true;
    });
  }, [tickets, isITLead, auth, statusFilter, searchQuery]);

  // Auto-select first ticket on mount if none selected
  useEffect(() => {
    if (visibleTickets.length > 0) {
      if (!selectedTicketId || !visibleTickets.some((t) => t.id === selectedTicketId)) {
        if (!isCreatingNew) {
          setSelectedTicketId(visibleTickets[0].id);
        }
      }
    } else {
      // If user has no query tickets yet, default to creating a new ticket
      if (!isCreatingNew) {
        setSelectedTicketId(null);
        setIsCreatingNew(true);
      }
    }
  }, [visibleTickets, selectedTicketId, isCreatingNew]);

  const activeTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    const ticket = tickets.find((t) => t.id === selectedTicketId);
    if (!ticket) return null;

    // Strict access control: if NOT Jatin and NOT Manvendra Sir, verify ownership
    if (!isITLead) {
      if (!auth) return null;
      const curName = (auth.name || "").toLowerCase().trim();
      const curEmail = (auth.email || "").toLowerCase().trim();
      const reqName = (ticket.requesterName || "").toLowerCase().trim();
      const reqEmail = (ticket.requesterEmail || "").toLowerCase().trim();
      const matchEmail = curEmail && reqEmail && curEmail === reqEmail;
      const matchName = curName && reqName && (
        reqName === curName ||
        reqName.includes(curName.split(" ")[0]) ||
        curName.includes(reqName.split(" ")[0])
      );
      if (!matchEmail && !matchName) return null;
    }

    return ticket;
  }, [tickets, selectedTicketId, isITLead, auth]);

  // Sync feedback fields when activeTicket changes
  useEffect(() => {
    setHasJustSubmittedReaction(false);
    if (activeTicket?.feedbackRating) {
      setSelectedRating(activeTicket.feedbackRating);
      setFeedbackComment(activeTicket.feedbackText || "");
      setIsFeedbackPopupOpen(false);
      setIsEditingFeedback(false);
    } else {
      setSelectedRating(5);
      setSelectedChips([]);
      setFeedbackComment("");
      setIsEditingFeedback(false);
      if (activeTicket && (activeTicket.status === "Resolved" || activeTicket.status === "Closed")) {
        setIsFeedbackPopupOpen(true);
      } else {
        setIsFeedbackPopupOpen(false);
      }
    }
  }, [activeTicket?.id, activeTicket?.status, activeTicket?.feedbackRating, activeTicket?.feedbackText]);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.comments, activeTicket?.id]);

  // Automatic IT greeting/acknowledgment if an employee message is waiting for reply
  useEffect(() => {
    if (!activeTicket || isITLead) return;
    const comments = activeTicket.comments || [];
    if (comments.length === 0) return;
    const last = comments[comments.length - 1];
    const isLastFromIT = last.authorRole.includes("IT") || last.authorName.toLowerCase().includes("jatin");
    if (!isLastFromIT) {
      // Last message is from employee without an IT reply
      const timer = setTimeout(() => {
        setTickets((latest) =>
          latest.map((t) => {
            if (t.id === activeTicket.id) {
              const curComments = t.comments || [];
              const stillLast = curComments[curComments.length - 1];
              if (stillLast && (stillLast.authorRole.includes("IT") || stillLast.authorName.toLowerCase().includes("jatin"))) {
                return t;
              }
              const ackReply: TicketComment = {
                id: `comm-auto-ack-${Date.now()}`,
                authorName: "IT Administrator",
                authorRole: "IT Administrator",
                content: `Hello ${auth?.name?.split(" ")[0] || "there"}! 👋 Thank you for the update. IT Support has been notified and is actively reviewing ticket #${t.ticketNumber}. We'll keep you updated here!`,
                createdAt: new Date().toISOString(),
              };
              return {
                ...t,
                comments: [...curComments, ackReply],
                updatedAt: new Date().toISOString(),
              };
            }
            return t;
          })
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTicket?.id, activeTicket?.comments?.length, isITLead, auth?.name, setTickets]);

  // Create Ticket with instant IT Auto-Reply
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      toast.error("Please enter a subject / title for your issue.");
      return;
    }
    if (!newDescription.trim()) {
      toast.error("Please describe what issue you are facing.");
      return;
    }

    const nextIdNum = 1000 + tickets.length + 1;
    const ticketNumber = `TICK-${nextIdNum}`;

    // Automatic confirmation reply from IT Administrator
    const autoReplyMessage: TicketComment = {
      id: `comm-auto-${Date.now()}`,
      authorName: "IT Administrator",
      authorRole: "IT Administrator",
      content: `Hello ${auth?.name?.split(" ")[0] || "there"}! 👋 Thank you for reporting this. Your query for "${newModule}" has been logged as #${ticketNumber}. IT Support has been notified and will investigate right away. If this is an urgent CRM blocker, feel free to use the WhatsApp button above.`,
      createdAt: new Date(Date.now() + 500).toISOString(),
    };

    const newTicketId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tick-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newTicket: SupportTicket = {
      id: newTicketId,
      ticketNumber,
      module: newModule,
      subject: newSubject.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      status: "Open",
      requesterName: auth?.name || "Employee",
      requesterRole: auth?.role === "admin" ? "Administrator" : "Employee",
      requesterEmail: auth?.email || "",
      requesterPhone: auth?.phone || "",
      relatedReference: newRelatedRef.trim() || undefined,
      screenshotUrl: newScreenshotUrl.trim() || undefined,
      itAssignee: "IT Administrator",
      comments: [autoReplyMessage],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicketId(newTicket.id);
    setIsCreatingNew(false);

    // Reset inputs
    setNewSubject("");
    setNewDescription("");
    setNewRelatedRef("");
    setNewScreenshotUrl("");
    setNewPriority("Medium");

    toast.success(`Query sent to IT! Ticket ${ticketNumber} created.`);
  };

  // Send message in chat thread with smart auto-acknowledgment
  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeTicket) return;

    const userText = chatInput.trim();
    const newComment: TicketComment = {
      id: `comm-${Date.now()}`,
      authorName: auth?.name || "Staff Member",
      authorRole: isITLead ? "IT Administrator" : "Employee",
      content: userText,
      createdAt: new Date().toISOString(),
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === activeTicket.id) {
          const currentComments = Array.isArray(t.comments) ? t.comments : [];
          return {
            ...t,
            comments: [...currentComments, newComment],
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );

    setChatInput("");

    // If an employee sends a message, IT bot provides a friendly reassurance after 600ms
    if (!isITLead) {
      setTimeout(() => {
        const lower = userText.toLowerCase().trim();
        let replyContent = `Thank you for the update! IT Support has received your message and is on it. 👍`;

        if (lower === "no" || lower.startsWith("no ") || lower === "not yet" || lower === "not working") {
          replyContent = `Understood. IT Support is actively investigating why this is occurring on your account and will patch it shortly. Thanks for your patience! 🙏`;
        } else if (lower === "yes" || lower === "ok" || lower === "okay" || lower === "done" || lower.includes("resolved") || lower.includes("working now")) {
          replyContent = `Awesome! Glad to hear that. 👍 If everything looks good on your side, please tap "Rate & Feedback" above to leave your review! ⭐`;
        } else if (lower.includes("thank") || lower.includes("thx") || lower.includes("shukriya")) {
          replyContent = `You're very welcome! Always happy to keep LookMyHolidays CRM fast and smooth. Please share your rating / feedback above whenever you can! 😊`;
        } else if (lower.includes("urgent") || lower.includes("critical") || lower.includes("fast") || lower.includes("jaldi")) {
          replyContent = `Noted as high priority! IT Support has been notified with high urgency. If needed, you can also tap the WhatsApp button above for an immediate ping. ⚡`;
        }

        setTickets((latest) =>
          latest.map((t) => {
            if (t.id === activeTicket.id) {
              const ackReply: TicketComment = {
                id: `comm-ack-${Date.now()}`,
                authorName: "IT Administrator",
                authorRole: "IT Administrator",
                content: replyContent,
                createdAt: new Date().toISOString(),
              };
              return {
                ...t,
                comments: [...(Array.isArray(t.comments) ? t.comments : []), ackReply],
                updatedAt: new Date().toISOString(),
              };
            }
            return t;
          })
        );
      }, 600);
    }
  };

  // Update Status & auto-add resolution notification
  const handleUpdateStatus = (status: TicketStatus) => {
    if (!activeTicket) return;
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === activeTicket.id) {
          const currentComments = Array.isArray(t.comments) ? t.comments : [];
          let updatedComments = currentComments;

          if (status === "Resolved" || status === "Closed") {
            const resComment: TicketComment = {
              id: `comm-res-${Date.now()}`,
              authorName: "Jatin Jangid (IT Administrator)",
              authorRole: "IT Administrator",
              content: `🎉 Great news! This issue has been marked as Resolved. Please verify on your screen and share your feedback below!`,
              createdAt: new Date().toISOString(),
            };
            updatedComments = [...currentComments, resComment];
          }

          return {
            ...t,
            status,
            comments: updatedComments,
            updatedAt: new Date().toISOString(),
            resolutionDate: status === "Resolved" || status === "Closed" ? new Date().toISOString() : t.resolutionDate,
          };
        }
        return t;
      })
    );
    toast.success(`Ticket marked as ${status}`);
  };

  // Submit Feedback Rating
  const handleSaveFeedback = (ticketId: string) => {
    const feedbackNote = [
      selectedChips.length > 0 ? selectedChips.join(" • ") : "",
      feedbackComment.trim(),
    ]
      .filter(Boolean)
      .join(" — ");

    const thankFeedbackComment: TicketComment = {
      id: `comm-fb-${Date.now()}`,
      authorName: "Jatin Jangid (IT Administrator)",
      authorRole: "IT Administrator",
      content: `🎉 Thank you so much for your ${selectedRating} ⭐ rating & feedback${feedbackNote ? `: "${feedbackNote}"` : ""}! We truly appreciate your review and will keep ensuring LookMyHolidays CRM runs flawlessly for you. 🙌`,
      createdAt: new Date().toISOString(),
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const currentComments = Array.isArray(t.comments) ? t.comments : [];
          return {
            ...t,
            status: "Resolved",
            feedbackRating: selectedRating,
            feedbackText: feedbackNote || undefined,
            feedbackSubmittedAt: new Date().toISOString(),
            comments: [...currentComments, thankFeedbackComment],
            updatedAt: new Date().toISOString(),
            resolutionDate: t.resolutionDate || new Date().toISOString(),
          };
        }
        return t;
      })
    );
    setSelectedChips([]);
    setIsEditingFeedback(false);
    setIsFeedbackPopupOpen(true);
    setHasJustSubmittedReaction(true);
    toast.success("Thank you! Your feedback & reaction have been sent to IT Support.");
  };

  // Delete Ticket (Custom Pop-up Dialog) - strictly IT Lead
  const handleDeleteTicket = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!isITLead) {
      toast.error("Only IT Lead can delete support tickets.");
      return;
    }
    ticketToDeleteRef.current = id;
    setTicketToDeleteId(id);
  };

  const confirmDeleteTicket = () => {
    const id = ticketToDeleteRef.current || ticketToDeleteId;
    if (!id) return;

    // 1. Direct Supabase delete
    supabase
      .from("it_support_tickets")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("[it_support_tickets] Supabase delete error:", error.message);
      });

    // 2. React state + LocalStorage sync
    setTickets((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(next));
        } catch (e) {
          // ignore
        }
      }
      return next;
    });

    // 3. Selection change
    const remaining = visibleTickets.filter((t) => t.id !== id);
    if (selectedTicketId === id) {
      if (remaining.length > 0) {
        setSelectedTicketId(remaining[0].id);
        setIsCreatingNew(false);
      } else {
        setSelectedTicketId(null);
        setIsCreatingNew(true);
      }
    }

    ticketToDeleteRef.current = null;
    setTicketToDeleteId(null);
    toast.success("Query ticket deleted.");
  };

  // Format Date Helper
  const formatTime = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "";
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    } catch {
      return "";
    }
  };

  // WhatsApp quick ping link
  const getWhatsAppLink = (ticket: SupportTicket) => {
    const text = encodeURIComponent(
      `Hello IT Support, I have an urgent query on CRM.\n\n*Ticket #:* ${ticket.ticketNumber}\n*Module:* ${ticket.module}\n*Subject:* ${ticket.subject}\n*Requester:* ${ticket.requesterName}\n\nPlease check this at your earliest convenience.`
    );
    return `https://wa.me/917340098982?text=${text}`;
  };

  const directGeneralWhatsApp = `https://wa.me/917340098982?text=${encodeURIComponent(
    `Hello IT Support, I have an urgent issue with LookMyHolidays CRM. Please help!`
  )}`;

  // Determine if a message is sent by "ME" (outgoing -> right) or INCOMING (-> left)
  const isCommentFromMe = (comm: TicketComment): boolean => {
    if (!auth) return false;
    const myName = (auth.name || "").toLowerCase().trim();
    const authorName = (comm.authorName || "").toLowerCase().trim();
    const authorRole = (comm.authorRole || "").toLowerCase().trim();

    // If currently logged in as IT Lead (Jatin or Manvendra Sir):
    if (isITLead) {
      if (
        authorRole.includes("it") ||
        authorName.includes("jatin") ||
        authorName.includes("manvender") ||
        authorName.includes("manvendra")
      ) {
        return true;
      }
      return false;
    }

    // If currently logged in as Employee / Requester:
    if (authorRole.includes("it") || authorName.includes("jatin")) {
      return false;
    }

    if (myName) {
      if (authorName === myName) return true;
      if (authorName.startsWith(myName) || myName.startsWith(authorName)) return true;
      const myFirstName = myName.split(" ")[0];
      if (myFirstName && myFirstName.length > 2 && authorName.includes(myFirstName)) {
        return true;
      }
    }

    return false;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] min-h-[550px] rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm animate-in fade-in duration-200">
      {/* Main 2-Column Split: Query Chat List (Left) + Active Conversation / New Form (Right) */}
      <div className="flex flex-1 min-h-0 divide-x divide-border/60">
        {/* LEFT COLUMN: Query Chats List */}
        <div
          className={`${
            activeTicket && !isCreatingNew ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 lg:w-96 shrink-0 bg-secondary/15`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border/60 bg-card/80 backdrop-blur">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground leading-tight">IT Support Help</h2>
                  <p className="text-[11px] text-muted-foreground">Direct chat with IT Support</p>
                </div>
              </div>

              <a
                href={directGeneralWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                title="Emergency WhatsApp to IT"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Raise Ticket Button */}
            <Button
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedTicketId(null);
              }}
              className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold h-9 gap-1.5 shadow-sm shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              <span>Raise Query / Ticket</span>
            </Button>
          </div>

          {/* Search & Quick Filters */}
          <div className="p-2.5 border-b border-border/40 space-y-2 bg-card/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queries..."
                className="pl-8 h-8 text-xs rounded-xl bg-background border-border/70"
              />
            </div>

            <div className="flex items-center gap-1">
              {(["All", "Open", "Resolved"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 text-[11px] font-semibold py-1 rounded-lg transition-colors ${
                    statusFilter === filter
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Queries List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/30 p-1.5 space-y-1">
            {visibleTickets.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">No queries found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Click "+ Raise Query / Ticket" above to report any issue to IT.
                </p>
              </div>
            ) : (
              visibleTickets.map((ticket) => {
                const isSelected = ticket.id === selectedTicketId && !isCreatingNew;
                const lastComment =
                  ticket.comments && ticket.comments.length > 0
                    ? ticket.comments[ticket.comments.length - 1]
                    : null;

                return (
                  <button
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      setIsCreatingNew(false);
                    }}
                    className={`group relative w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30 shadow-xs"
                        : "hover:bg-card border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {ticket.ticketNumber}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-semibold">
                          {ticket.module}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1">
                        {ticket.feedbackRating ? (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            ⭐ {ticket.feedbackRating}
                          </span>
                        ) : null}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            ticket.status === "Resolved" || ticket.status === "Closed"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : ticket.status === "In Progress"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {ticket.status}
                        </span>

                        {/* Quick Trash on hover - strictly for IT Lead only */}
                        {isITLead && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => handleDeleteTicket(ticket.id, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-0.5 text-muted-foreground/60 transition-opacity rounded hover:bg-rose-500/15 cursor-pointer ml-0.5"
                            title="Delete ticket"
                          >
                            <Trash2 className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-foreground truncate mb-1">
                      {ticket.subject}
                    </p>

                    <p className="text-[11px] text-muted-foreground truncate">
                      {lastComment ? `IT: ${lastComment.content}` : ticket.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 mt-1.5 pt-1 border-t border-border/20">
                      <span className="truncate">
                        {isITLead ? ticket.requesterName : "Logged with IT"}
                      </span>
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Conversation OR New Ticket Form */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          {isCreatingNew ? (
            /* NEW TICKET FORM */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsCreatingNew(false);
                      if (tickets.length > 0) setSelectedTicketId(tickets[0].id);
                    }}
                    className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Raise New Query / Report Issue</h3>
                    <p className="text-xs text-muted-foreground">Send query to IT Support for instant review</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreatingNew(false);
                    if (tickets.length > 0) setSelectedTicketId(tickets[0].id);
                  }}
                  className="text-xs text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                {/* Module selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Which CRM module has the issue? <span className="text-rose-500">*</span>
                  </label>
                  <Select value={newModule} onValueChange={setNewModule}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-card">
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CRM_MODULES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Medium", "High", "Critical"] as TicketPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={`text-xs font-semibold py-2 rounded-xl border transition-all ${
                          newPriority === p
                            ? p === "Critical"
                              ? "bg-rose-500/15 text-rose-600 border-rose-500 font-bold"
                              : p === "High"
                              ? "bg-amber-500/15 text-amber-600 border-amber-500 font-bold"
                              : "bg-primary/10 text-primary border-primary font-bold"
                            : "bg-card text-muted-foreground border-border/80 hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Query Title / Subject <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Booking profit calculation issue on BK-8821"
                    className="h-10 text-xs rounded-xl bg-card"
                  />
                </div>

                {/* Related reference */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Related Reference / ID <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <Input
                    value={newRelatedRef}
                    onChange={(e) => setNewRelatedRef(e.target.value)}
                    placeholder="e.g. Booking ID BK-1029, Lead #450, Invoice PR-201"
                    className="h-10 text-xs rounded-xl bg-card"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    What is the issue? Describe what happened <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    required
                    rows={4}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Explain what is going wrong, steps you took, or error displayed..."
                    className="text-xs rounded-xl bg-card resize-none"
                  />
                </div>

                {/* Screenshot */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Attach Screenshot <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setNewScreenshotUrl(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="h-10 text-xs rounded-xl bg-card cursor-pointer"
                  />
                  {newScreenshotUrl && (
                    <div className="relative mt-2 rounded-xl border border-border p-2 max-w-xs">
                      <img src={newScreenshotUrl} alt="Preview" className="h-24 w-auto object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setNewScreenshotUrl("")}
                        className="absolute top-3 right-3 bg-background/90 rounded-full p-1 text-rose-500 hover:text-rose-600 shadow"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="submit"
                    className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold gap-1.5 h-10 px-5 shadow-sm shadow-primary/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Query to IT</span>
                  </Button>
                </div>
              </form>
            </div>
          ) : activeTicket ? (
            /* ACTIVE CHAT THREAD */
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:px-5 border-b border-border/60 dark:border-[#222e35] bg-card/60 dark:bg-[#111b21] backdrop-blur flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
                        {activeTicket.ticketNumber}
                      </span>
                      <Badge variant="outline" className="text-xs font-medium py-0.5">
                        {activeTicket.module}
                      </Badge>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          activeTicket.status === "Resolved" || activeTicket.status === "Closed"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : activeTicket.status === "In Progress"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {activeTicket.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground truncate mt-0.5">
                      {activeTicket.subject}
                    </h3>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {/* Employee controls: Rate / Feedback or Mark Resolved */}
                  {!isITLead && (
                    <div className="flex items-center gap-1.5">
                      {activeTicket.feedbackRating ? (
                        <Badge
                          onClick={() => {
                            setIsFeedbackPopupOpen(true);
                            setIsEditingFeedback(false);
                            setHasJustSubmittedReaction(true);
                          }}
                          className="cursor-pointer bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs py-1 px-2.5 font-bold gap-1 hover:bg-amber-500/25 transition-colors"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span>{activeTicket.feedbackRating}/5 Rated</span>
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsFeedbackPopupOpen(true);
                            setIsEditingFeedback(true);
                            setHasJustSubmittedReaction(false);
                          }}
                          className="h-8 text-xs rounded-xl font-semibold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span>Rate & Feedback</span>
                        </Button>
                      )}

                      {activeTicket.status !== "Resolved" && activeTicket.status !== "Closed" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            handleUpdateStatus("Resolved");
                            setIsFeedbackPopupOpen(true);
                            setIsEditingFeedback(true);
                            setHasJustSubmittedReaction(false);
                          }}
                          className="h-8 text-xs rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Mark Resolved</span>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* WhatsApp escalation */}
                  <a
                    href={getWhatsAppLink(activeTicket)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Send directly to IT Support on WhatsApp"
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    <Phone className="h-3 w-3" />
                    <span className="hidden sm:inline">WhatsApp IT</span>
                  </a>

                  {/* IT Lead status toggles */}
                  {isITLead && (
                    <Select value={activeTicket.status} onValueChange={(s: any) => handleUpdateStatus(s)}>
                      <SelectTrigger className="h-8 text-xs rounded-xl w-[110px] bg-background dark:bg-[#202c33] dark:border-[#2a3942]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Delete button (Strictly for IT lead only — never employees) */}
                  {isITLead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteTicket(activeTicket.id, e)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Delete ticket"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-1 bg-muted/20 dark:bg-[#0b141a] dark:bg-[radial-gradient(#15202b_1px,transparent_1px)] dark:[background-size:16px_16px]">
                {/* Initial Issue Card (The original query created by the employee) */}
                <div className="rounded-2xl border border-border/80 bg-secondary/20 dark:bg-[#111b21] dark:border-[#222e35] p-4 space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-2">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {activeTicket.requesterName} <span className="text-[11px] font-normal">({activeTicket.requesterRole})</span>
                    </span>
                    <span>{formatDate(activeTicket.createdAt)} {formatTime(activeTicket.createdAt)}</span>
                  </div>

                  {activeTicket.relatedReference && (
                    <div className="text-xs bg-muted/60 dark:bg-white/5 px-2.5 py-1 rounded-lg inline-block font-medium">
                      Related Ref: <strong className="text-foreground">{activeTicket.relatedReference}</strong>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {activeTicket.description}
                  </p>

                  {/* Screenshot thumbnail */}
                  {activeTicket.screenshotUrl && (
                    <div className="pt-2">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> Attached Screenshot:
                      </p>
                      <a href={activeTicket.screenshotUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={activeTicket.screenshotUrl}
                          alt="Screenshot"
                          className="h-36 w-auto rounded-xl border border-border object-contain hover:opacity-95 cursor-pointer shadow-xs"
                        />
                      </a>
                    </div>
                  )}
                </div>

                {/* IT Resolution Note Banner (if ticket resolved) */}
                {activeTicket.itResolutionNotes && (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-3.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5 mb-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <span className="font-bold">IT Resolution Note: </span>
                      <span>{activeTicket.itResolutionNotes}</span>
                    </div>
                  </div>
                )}

                {/* Compact Feedback Banner in Chat (if already submitted) */}
                {activeTicket.feedbackRating && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between gap-2 text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {RATING_LABELS[activeTicket.feedbackRating]?.emoji || "⭐"}
                      </span>
                      <div>
                        <span className="font-bold text-foreground">
                          Feedback Recorded: {activeTicket.feedbackRating}/5 — {RATING_LABELS[activeTicket.feedbackRating]?.label}
                        </span>
                        {activeTicket.feedbackText && (
                          <span className="text-muted-foreground block text-[11px] truncate max-w-md">
                            "{activeTicket.feedbackText}"
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsFeedbackPopupOpen(true);
                        setIsEditingFeedback(false);
                        setHasJustSubmittedReaction(true);
                      }}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                    >
                      View Reaction
                    </button>
                  </div>
                )}

                {/* Chat Message Thread (Modern WhatsApp Dark / Clean CRM Style) */}
                {activeTicket.comments && activeTicket.comments.map((comm, idx, arr) => {
                  const isIT = comm.authorRole.includes("IT") || comm.authorName.toLowerCase().includes("jatin");
                  const isMe = isCommentFromMe(comm);

                  // Group consecutive messages from same author to prevent repeating headers
                  const prevComm = idx > 0 ? arr[idx - 1] : null;
                  const isSameAuthorAsPrev = prevComm && isCommentFromMe(prevComm) === isMe && prevComm.authorName === comm.authorName;

                  // Initials for avatar
                  const initials = (comm.authorName || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const isCelebration = comm.content.includes("🎉") || comm.content.includes("5 ⭐");

                  return (
                    <div
                      key={comm.id}
                      className={`flex flex-col ${isMe ? "items-end ml-auto" : "items-start mr-auto"} max-w-[85%] sm:max-w-[72%] ${
                        isSameAuthorAsPrev ? "mt-1.5" : "mt-3.5"
                      }`}
                    >
                      {/* Sender Name & Avatar above Incoming Message (only for first message in group) */}
                      {!isMe && !isSameAuthorAsPrev && (
                        <div className="flex items-center gap-1.5 mb-1 px-1 select-none">
                          <div className="h-4.5 w-4.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[#53bdeb] text-[9px] font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <span className="text-[11px] font-semibold text-[#53bdeb]">
                            {comm.authorName}
                          </span>
                          {isIT && (
                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-bold text-[#53bdeb] bg-sky-500/10 border border-sky-500/20">
                              IT Support
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-xs sm:text-[13px] leading-relaxed shadow-sm break-words transition-all ${
                          isMe
                            ? "bg-[#005c4b] dark:bg-[#005c4b] text-white border border-emerald-500/25 rounded-tr-xs shadow-emerald-950/20"
                            : "bg-card border border-border/80 dark:bg-[#202c33] dark:border-[#2a3942] text-foreground dark:text-slate-100 rounded-tl-xs shadow-black/20"
                        } ${
                          isCelebration
                            ? "ring-1 ring-emerald-500/40 bg-gradient-to-br from-[#005c4b] to-[#044438]"
                            : ""
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{comm.content}</p>

                        {/* Timestamp & read receipts */}
                        <div
                          className={`flex items-center justify-end gap-1 text-[10px] mt-1 select-none font-medium ${
                            isMe ? "text-emerald-200/70" : "text-muted-foreground dark:text-[#8696a0]"
                          }`}
                        >
                          <span>{formatTime(comm.createdAt)}</span>
                          {isMe && <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 border-t border-border/60 dark:border-[#222e35] bg-card dark:bg-[#111b21] shrink-0">
                <div className="flex items-center gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Reply to ${isITLead ? activeTicket.requesterName : "IT Administrator"}...`}
                    className="h-11 text-xs sm:text-sm rounded-full bg-background dark:bg-[#202c33] border-border dark:border-[#2a3942] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-[#8696a0] px-4 focus-visible:ring-emerald-500/30"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="h-11 w-11 rounded-full p-0 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 shadow-md shadow-emerald-950/40 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                <LifeBuoy className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">LookMyHolidays IT Helpdesk</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Facing an issue with Bookings, Leads, or Accounts? Send your query directly to IT and chat live to get it resolved.
              </p>
              <Button
                onClick={() => setIsCreatingNew(true)}
                className="mt-4 rounded-xl text-xs font-semibold gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Raise New Query</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Pop-up Dialog */}
      <DeleteConfirmModal
        isOpen={!!ticketToDeleteId}
        onClose={() => setTicketToDeleteId(null)}
        onConfirm={confirmDeleteTicket}
        title="Delete Support Ticket?"
        description="Are you sure you want to delete this query ticket? All messages, attachments, and resolution records will be permanently removed."
      />

      {/* Floating Bottom-Right Trigger Launcher Button */}
      {!isFeedbackPopupOpen && activeTicket && !isITLead && (
        <button
          type="button"
          onClick={() => {
            setIsFeedbackPopupOpen(true);
            setHasJustSubmittedReaction(!!activeTicket.feedbackRating);
          }}
          className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-emerald-600 to-emerald-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-xs font-bold border border-white/20 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <span className="text-base">
            {activeTicket.feedbackRating ? RATING_LABELS[activeTicket.feedbackRating]?.emoji || "⭐" : "⭐"}
          </span>
          <span>
            {activeTicket.feedbackRating ? `${activeTicket.feedbackRating}/5 Feedback Given` : "Rate IT Experience"}
          </span>
          <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-mono">
            #{activeTicket.ticketNumber}
          </span>
        </button>
      )}

      {/* Floating Bottom-Right Feedback & Reaction Pop-up Widget */}
      {isFeedbackPopupOpen && activeTicket && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[340px] sm:w-[480px] max-w-[calc(100vw-2rem)] rounded-3xl bg-card/95 border-2 border-amber-500/30 shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border/50 bg-gradient-to-r from-amber-500/10 to-emerald-500/5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  How was your IT Support experience?
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Share feedback for IT Support on ticket #{activeTicket.ticketNumber}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFeedbackPopupOpen(false)}
              className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Close / Minimize"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body: Reaction view OR Emoji & Text form */}
          {hasJustSubmittedReaction || (activeTicket.feedbackRating && !isEditingFeedback) ? (
            /* REACTION / THANK YOU VIEW */
            <div className="p-5 sm:p-6 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-500 p-0.5 animate-pulse shadow-lg">
                  <div className="w-full h-full bg-card rounded-full flex items-center justify-center text-3xl">
                    {RATING_LABELS[activeTicket.feedbackRating || selectedRating]?.emoji || "🙏"}
                  </div>
                </div>
                <span className="absolute -top-1 -right-1 text-lg animate-bounce">🎉</span>
                <span className="absolute -bottom-1 -left-1 text-lg animate-spin">✨</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-foreground tracking-tight flex items-center justify-center gap-1.5">
                  <span>Thank You So Much!</span> <span>🙏</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your reaction & feedback has been sent directly to IT Support.
                </p>
              </div>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          (activeTicket.feedbackRating || selectedRating) >= s
                            ? "fill-amber-400 text-amber-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {RATING_LABELS[activeTicket.feedbackRating || selectedRating]?.emoji}{" "}
                    {RATING_LABELS[activeTicket.feedbackRating || selectedRating]?.label}
                  </span>
                </div>

                {(activeTicket.feedbackText || feedbackComment) && (
                  <p className="text-xs text-muted-foreground italic pt-1 border-t border-border/50">
                    "{activeTicket.feedbackText || feedbackComment}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {!isITLead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingFeedback(true);
                      setHasJustSubmittedReaction(false);
                    }}
                    className="rounded-xl text-xs h-8 px-3"
                  >
                    Change / Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setIsFeedbackPopupOpen(false)}
                  className="rounded-xl bg-primary text-primary-foreground text-xs font-bold h-8 px-4"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* EMOJI & TEXT FORM VIEW */
            <div className="p-4 sm:p-5 space-y-4">
              {/* 1. Emoji Selection & Rating */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Rate IT Resolution & Assistance:
                </label>

                {/* Big Interactive Emojis */}
                <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-muted/40 rounded-2xl border border-border/50">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const item = RATING_LABELS[val];
                    const isSel = (hoverRating || selectedRating) === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedRating(val)}
                        onMouseEnter={() => setHoverRating(val)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                          isSel
                            ? "bg-amber-500/25 scale-110 shadow-sm ring-2 ring-amber-400/60"
                            : "hover:bg-muted hover:scale-105 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl transition-transform">
                          {item.emoji}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground mt-1">
                          {val}★
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Stars and description badge matching user screenshot */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`h-5 w-5 transition-colors ${
                            (hoverRating || selectedRating) >= star
                              ? "fill-amber-400 text-amber-500 drop-shadow-xs"
                              : "text-muted-foreground/30 hover:text-amber-400/60"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-[11px] font-bold text-foreground">
                    {RATING_LABELS[hoverRating || selectedRating]?.emoji}{" "}
                    {RATING_LABELS[hoverRating || selectedRating]?.label}{" "}
                    <span className="font-normal text-muted-foreground">
                      — {RATING_LABELS[hoverRating || selectedRating]?.desc}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Quick Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-foreground">
                  Quick Tags:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_TAGS.map((tag) => {
                    const isSelected = selectedChips.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedChips((prev) => prev.filter((c) => c !== tag));
                          } else {
                            setSelectedChips((prev) => [...prev, tag]);
                          }
                        }}
                        className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/60 font-bold shadow-xs"
                            : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Text note */}
              <div className="space-y-1">
                <Textarea
                  rows={2}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Optional: Any suggestion or thank-you note for IT Support..."
                  className="text-xs rounded-2xl bg-background border-border resize-none p-3 shadow-inner"
                />
              </div>

              {/* 4. Action bar with gradient Submit Feedback button */}
              <div className="flex items-center justify-end pt-2 border-t border-border/40">
                <Button
                  onClick={() => {
                    if (activeTicket) {
                      handleSaveFeedback(activeTicket.id);
                    }
                  }}
                  className="rounded-full bg-gradient-to-r from-amber-500 via-emerald-600 to-emerald-700 text-white hover:opacity-95 text-xs font-bold gap-1.5 h-9 px-6 shadow-md hover:shadow-lg transition-all"
                >
                  <Star className="h-4 w-4 fill-white text-white" />
                  <span>Submit Feedback</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
