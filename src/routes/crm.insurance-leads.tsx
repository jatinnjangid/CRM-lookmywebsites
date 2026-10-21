import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { getAuth } from "@/lib/auth";
import {
  Plus,
  Phone,
  Mail,
  Search,
  X,
  MapPin,
  IndianRupee,
  CalendarDays,
  Globe,
  TrendingUp,
  UserCheck,
  Users,
  ChevronRight,
  Filter,
  LayoutGrid,
  Table2,
  ListChecks,
  CheckCircle2,
  Circle,
  ChevronUp,
  ChevronDown,
  StickyNote,
  Sparkles,
  Upload,
  Briefcase,
  Package,
  AlertCircle,
  Download,
  FileText,
  User,
  Shield,
  Building2,
  Calendar,
  Copy,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImportLeadsModal } from "@/components/ui/import-leads-modal";
import { EmployeeProfileCard } from "@/components/EmployeeProfileCard";
import { formatINR, type Lead } from "@/lib/mock-data";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import type { ExtCustomer } from "./crm.customers";
import { INITIAL_EMPLOYEES } from "./crm.employees";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/crm/insurance-leads")({ component: LeadsPage });

/* ─── Extra fields for extended leads ─── */
export interface ExtLead extends Lead {
  avatar: string;
  notes: string;
  noteDate?: string;
  allNotes?: { text: string; date: string }[];
  insuranceDate?: string;
  policyType?: string;
  queryType?: string;
  clientCompany?: string;
  expiryDate?: string;
  bookingReference?: string;
  vendorName?: string;
  hotelDetails?: string;
  totalAmount?: number;
  amountPaid?: number;
  paymentStatus?: "Pending" | "Partial" | "Paid";
  createdTime?: string;
  leadSection?: string;
}

const AVATARS = [""];

const SOURCES = [
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Walk-in",
  "Website",
  "Referral",
  "Ads",
  "BNI",
  "DD Pharma",
  "Other",
  "Old Ref",
  "BNI INC",
];
const SOURCE_COLORS: Record<string, string> = {
  Instagram: "bg-pink-400",
  Facebook: "bg-blue-600",
  WhatsApp: "bg-emerald-700",
  "Walk-in": "bg-yellow-200",
  Website: "bg-primary/100",
  Referral: "bg-purple-300",
  Ads: "bg-gray-200",
  "DD Pharma": "bg-green-200",
  Other: "bg-pink-200",
  "Old Ref": "bg-blue-300",
  "BNI INC": "bg-green-400",
};
// DESTINATIONS kept for potential future use
const _DESTINATIONS = [
  "Bali",
  "Dubai",
  "Maldives",
  "Europe",
  "Thailand",
  "Singapore",
  "Kerala",
  "Rajasthan",
  "Japan",
  "Sri Lanka",
];
void _DESTINATIONS;

const SERVICES = [
  {
    group: "Insurance Services",
    items: [
      { label: "General Insurance", icon: "🛡️" },
    ],
  },
];

const SERVICE_ICONS: Record<string, string> = SERVICES.reduce(
  (acc, group) => {
    group.items.forEach((item) => (acc[item.label] = item.icon));
    return acc;
  },
  {} as Record<string, string>,
);

const _LEADS_INIT: ExtLead[] = [];

/* ─── Status config ─── */
type LeadStatus = Lead["status"];
const STATUSES: LeadStatus[] = [
  "New Lead",
  "Contacted",
  "Quotation Sent",
  "Negotiation",
  "in process",
  "Confirmed",
  "Payment Pending",
  "Completed",
  "Postponed",
  "Lost",
];

const STATUS_PILL: Record<LeadStatus, string> = {
  "New Lead": "bg-blue-100 text-blue-700",
  Contacted: "bg-amber-100 text-amber-700",
  "Quotation Sent": "bg-cyan-100 text-cyan-700",
  Negotiation: "bg-purple-100 text-purple-700",
  Confirmed: "bg-teal-100 text-teal-700",
  "Payment Pending": "bg-rose-100 text-rose-700",
  "on conform": "bg-indigo-100 text-indigo-700",
  "in process": "bg-emerald-100 text-emerald-700",
  "Postponed": "bg-pink-100 text-pink-700",
  "Completed": "bg-fuchsia-100 text-fuchsia-700",
  Lost: "bg-slate-100 text-slate-700",
};

const PRIORITY_PILL: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

const STATUS_ACCENT: Record<LeadStatus, string> = {
  "New Lead": "border-l-blue-400",
  Contacted: "border-l-amber-400",
  "Quotation Sent": "border-l-cyan-400",
  Negotiation: "border-l-purple-400",
  Confirmed: "border-l-teal-400",
  "Payment Pending": "border-l-rose-400",
  "on conform": "border-l-indigo-400",
  "in process": "border-l-emerald-400",
  "Postponed": "border-l-pink-400",
  "Completed": "border-l-fuchsia-400",
  Lost: "border-l-slate-400",
};

const STATUS_DOT: Record<LeadStatus, string> = {
  "New Lead": "bg-blue-500",
  Contacted: "bg-amber-500",
  "Quotation Sent": "bg-cyan-500",
  Negotiation: "bg-purple-500",
  Confirmed: "bg-teal-500",
  "Payment Pending": "bg-rose-500",
  "on conform": "bg-indigo-500",
  "in process": "bg-emerald-500",
  "Postponed": "bg-pink-500",
  "Completed": "bg-fuchsia-500",
  Lost: "bg-slate-500",
};

const PRIORITY_BADGE: Record<string, string> = {
  High: "🔴 High",
  Medium: "🟡 Medium",
  Low: "🟢 Low",
};

const SOURCE_ICONS: Record<string, string> = {
  Website: "🌐",
  Instagram: "📸",
  Referral: "🤝",
  "Google Ads": "🔍",
  WhatsApp: "💬",
  "Walk-in": "🚶",
};

function initials(n: string) {
  if (!n) return "";
  return n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ─── Add Lead Modal (Two-Step) ─── */

const EMPTY_FORM = {
  // Common
  name: "",
  phone: "",
  email: "",
  whatsapp: "",
  source: SOURCES[0],
  assignedTo: "",
  assignOpsTo: "",
  assignToOps: false,
  priority: "Medium" as Lead["priority"],
  notes: "",
  status: "New Lead" as LeadStatus,
  reference: "",
  leadSection: "General Insurance",
  // Air Ticket
  sourceCity: "",
  destinationCity: "",
  adults: "1",
  children: "0",
  infants: "0",
  travelDate: "",
  fareType: "Regular",
  directFlight: false,
  flightClass: "Economy",
  preferredAirline: "",
  // Hotel
  destination: "",
  checkIn: "",
  checkOut: "",
  nights: "",
  nationality: "Indian",
  starRating: "1",
  mealPreference: "",
  // Visa
  country: "",
  visaType: "Tourist",
  passportExpiry: "",
  // Package / Holiday
  goingFrom: "",
  noOfDays: "",
  inclusions: "",
  theme: "",
  hotelPreference: "",
  foodPreference: "",
  budget: "",
  // Insurance
  insuranceDate: "",
  policyType: "Four Wheeler",
  queryType: "New",
  clientCompany: "",
  expiryDate: "",
  // Corporate / MICE
  companyName: "",
  eventType: "",
  // misc
  pax: "2",
  packageType: "",
  totalAmount: "",
  amountPaid: "",
  vendorName: "",
  lastFollowUp: "",
  nextFollowUp: "",
};

// ── field class helper ──
const FIELD_CLS =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow";

// ── Service-specific form field blocks ──────────────────────────────────────

function AirTicketFields({ form, set, setForm }: { form: typeof EMPTY_FORM; set: any; setForm: any }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <div className="col-span-2 sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source City *</label>
        <Input placeholder="e.g. Mumbai" value={form.sourceCity} onChange={set("sourceCity")} className="rounded-xl" />
      </div>
      <div className="col-span-2 sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Destination City *</label>
        <Input placeholder="e.g. Dubai" value={form.destinationCity} onChange={set("destinationCity")} className="rounded-xl" />
      </div>
      <div className="col-span-2 sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Departure Date *</label>
        <Input type="date" value={form.travelDate} onChange={set("travelDate")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adults</label>
        <Input type="number" min="1" value={form.adults} onChange={set("adults")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Childrens</label>
        <Input type="number" min="0" value={form.children} onChange={set("children")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Infants</label>
        <Input type="number" min="0" value={form.infants} onChange={set("infants")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fare Type</label>
        <select value={form.fareType} onChange={set("fareType")} className={FIELD_CLS}>
          {["Regular", "Student", "Senior Citizen", "Armed Forces", "Corporate"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class</label>
        <select value={form.flightClass} onChange={set("flightClass")} className={FIELD_CLS}>
          {["Economy", "Premium Economy", "Business", "First Class"].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preferred Airline</label>
        <Input placeholder="e.g. IndiGo, Air India..." value={form.preferredAirline} onChange={set("preferredAirline")} className="rounded-xl" />
      </div>
      <div className="col-span-2 sm:col-span-4 flex items-center gap-3">
        <input
          type="checkbox"
          id="directFlight"
          checked={form.directFlight}
          onChange={(e) => setForm((f: typeof EMPTY_FORM) => ({ ...f, directFlight: e.target.checked }))}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="directFlight" className="text-sm font-medium cursor-pointer">Direct Flight Only</label>
      </div>
    </div>
  );
}

function HotelFields({ form, set, setForm }: { form: typeof EMPTY_FORM; set: any; setForm: any }) {
  const calcNights = () => {
    if (form.checkIn && form.checkOut) {
      const diff = new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime();
      const n = Math.round(diff / (1000 * 60 * 60 * 24));
      if (n > 0) setForm((f: typeof EMPTY_FORM) => ({ ...f, nights: String(n) }));
    }
  };
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <div className="col-span-2 sm:col-span-4">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Destination *</label>
        <Input placeholder="e.g. Bali, Dubai, Goa..." value={form.destination} onChange={set("destination")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check In *</label>
        <Input type="date" value={form.checkIn} onChange={(e) => { set("checkIn")(e); setTimeout(calcNights, 100); }} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Check Out *</label>
        <Input type="date" value={form.checkOut} onChange={(e) => { set("checkOut")(e); setTimeout(calcNights, 100); }} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nights</label>
        <Input placeholder="Auto" value={form.nights} onChange={set("nights")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travellers</label>
        <Input type="number" min="1" value={form.pax} onChange={set("pax")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nationality</label>
        <Input placeholder="e.g. Indian" value={form.nationality} onChange={set("nationality")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Star Rating</label>
        <select value={form.starRating} onChange={set("starRating")} className={FIELD_CLS}>
          {["Any", "1", "2", "3", "4", "5"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="col-span-2 sm:col-span-4">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meal Preference</label>
        <select value={form.mealPreference} onChange={set("mealPreference")} className={FIELD_CLS}>
          {["", "Room Only", "Breakfast Included", "Half Board", "Full Board", "All Inclusive"].map(m => <option key={m} value={m}>{m || "— Select —"}</option>)}
        </select>
      </div>
    </div>
  );
}

function VisaFields({ form, set }: { form: typeof EMPTY_FORM; set: any }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <div className="col-span-2 sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country *</label>
        <Input placeholder="e.g. UAE, UK, USA..." value={form.country} onChange={set("country")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travel Date</label>
        <Input type="date" value={form.travelDate} onChange={set("travelDate")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visa Type</label>
        <select value={form.visaType} onChange={set("visaType")} className={FIELD_CLS}>
          {["Tourist", "Business", "Student", "Work", "Transit", "Medical", "Family"].map(v => <option key={v}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travellers</label>
        <Input type="number" min="1" value={form.pax} onChange={set("pax")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Passport Expiry</label>
        <Input type="date" value={form.passportExpiry} onChange={set("passportExpiry")} className="rounded-xl" />
      </div>
    </div>
  );
}

function PackageFields({ form, set, setForm }: { form: typeof EMPTY_FORM; set: any; setForm: any }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Going To *</label>
        <Input placeholder="e.g. Bali, Paris, Kerala..." value={form.destination} onChange={set("destination")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Going From</label>
        <Input placeholder="e.g. Mumbai, Delhi..." value={form.goingFrom} onChange={set("goingFrom")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travel Date *</label>
        <Input type="date" value={form.travelDate} onChange={set("travelDate")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">No of Days</label>
        <Input placeholder="e.g. 7" value={form.noOfDays} onChange={set("noOfDays")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travellers</label>
        <select value={form.pax} onChange={set("pax")} className={FIELD_CLS}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
          <option value="10+">10+</option>
        </select>
      </div>
      <div className="col-span-2 sm:col-span-4">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hotel Preference</label>
        <div className="flex items-center gap-5 mt-1">
          {[1, 2, 3, 4, 5].map(star => (
            <label key={star} className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.hotelPreference?.includes(String(star))}
                onChange={(e) => {
                  const cur = form.hotelPreference ? form.hotelPreference.split(",").filter(Boolean) : [];
                  const next = e.target.checked ? [...cur, String(star)] : cur.filter(s => s !== String(star));
                  setForm((f: typeof EMPTY_FORM) => ({ ...f, hotelPreference: next.join(",") }));
                }}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {"⭐".repeat(star)}
            </label>
          ))}
        </div>
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price Range (₹)</label>
        <Input placeholder="e.g. 50000 – 80000" value={form.budget} onChange={set("budget")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Food Preference</label>
        <Input placeholder="e.g. Veg, Non-Veg, Jain..." value={form.foodPreference} onChange={set("foodPreference")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Theme</label>
        <Input placeholder="e.g. Beach, Hill, Adventure..." value={form.theme} onChange={set("theme")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inclusions</label>
        <Input placeholder="e.g. Flight, Hotel, Transfers..." value={form.inclusions} onChange={set("inclusions")} className="rounded-xl" />
      </div>
    </div>
  );
}

function InsuranceFields({ form, set, service }: { form: typeof EMPTY_FORM; set: any; service?: string }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Policy Type *</label>
        <select value={form.policyType} onChange={set("policyType")} className={FIELD_CLS}>
          {(service === "Travel Insurance"
            ? ["Single Trip", "Multi Trip", "Student Travel", "Senior Citizen", "Family Travel", "Corporate Travel", "Domestic", "International"]
            : form.leadSection === "General Insurance"
              ? ["Four Wheeler", "Two Wheeler", "School Bus", "Pickup", "Tractor", "Health", "LIC", "Commercial Vehicle", "Fire", "Marine", "Property", "Liability", "Life"]
              : ["Four Wheeler", "Two Wheeler", "School Bus", "Pickup", "Tractor", "Health", "LIC", "Commercial Vehicle"]
          ).map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Query Type</label>
        <select value={form.queryType} onChange={set("queryType")} className={FIELD_CLS}>
          {["New", "Renewal", "Expired", "Endorsement"].map(q => <option key={q}>{q}</option>)}
        </select>
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Insurance Date *</label>
        <Input type="date" value={form.insuranceDate} onChange={set("insuranceDate")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expiry Date</label>
        <Input type="date" value={form.expiryDate} onChange={set("expiryDate")} className="rounded-xl" />
      </div>
      <div className="col-span-2 sm:col-span-4">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client / Company</label>
        <Input placeholder="e.g. Acme Corp or Customer Name" value={form.clientCompany} onChange={set("clientCompany")} className="rounded-xl" />
      </div>
    </div>
  );
}

function GenericTravelFields({ form, set, label }: { form: typeof EMPTY_FORM; set: any; label: string }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <div className="col-span-2 sm:col-span-4">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label} *</label>
        <Input placeholder={`e.g. ${label.includes("From") ? "Mumbai" : "Dubai"}`} value={form.destination} onChange={set("destination")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date *</label>
        <Input type="date" value={form.travelDate} onChange={set("travelDate")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Travellers</label>
        <Input type="number" min="1" value={form.pax} onChange={set("pax")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price (₹)</label>
        <Input placeholder="e.g. 25000" value={form.budget} onChange={set("budget")} className="rounded-xl" />
      </div>
    </div>
  );
}

function CorporateFields({ form, set }: { form: typeof EMPTY_FORM; set: any }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <div className="col-span-2 sm:col-span-4">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company Name *</label>
        <Input placeholder="e.g. TCS, Infosys..." value={form.companyName} onChange={set("companyName")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event / Trip Type</label>
        <Input placeholder="e.g. Annual Meet, Team Outing..." value={form.eventType} onChange={set("eventType")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Destination</label>
        <Input placeholder="e.g. Goa, Singapore..." value={form.destination} onChange={set("destination")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
        <Input type="date" value={form.travelDate} onChange={set("travelDate")} className="rounded-xl" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pax</label>
        <Input type="number" min="1" value={form.pax} onChange={set("pax")} className="rounded-xl" />
      </div>
      <div className="col-span-2">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Budget (₹)</label>
        <Input placeholder="e.g. 5,00,000" value={form.budget} onChange={set("budget")} className="rounded-xl" />
      </div>
    </div>
  );
}

// ── Service category card colours ─────────────────────────────────────────
const SVC_COLOR: Record<string, string> = {
  "Travel Services": "from-blue-500/10 to-sky-500/5 hover:from-blue-500/20 border-blue-200/60",
  "Holiday Packages": "from-teal-500/10 to-emerald-500/5 hover:from-teal-500/20 border-teal-200/60",
  Business: "from-violet-500/10 to-purple-500/5 hover:from-violet-500/20 border-violet-200/60",
};
const SVC_BADGE: Record<string, string> = {
  "Travel Services": "bg-blue-100 text-blue-700",
  "Holiday Packages": "bg-teal-100 text-teal-700",
  Business: "bg-violet-100 text-violet-700",
};

// ── Helper: which sub-form to render ────────────────────────────────────────
function getServiceFormType(service: string): string {
  if (service === "Air Ticket") return "air";
  if (service === "Hotel Booking") return "hotel";
  if (service === "Visa") return "visa";
  if (service === "Travel Insurance" || service === "General Insurance") return "insurance";
  if (["Corporate Travel", "MICE Events", "Conference Booking"].includes(service)) return "corporate";
  const packages = [
    "International Package", "Domestic Package", "Honeymoon Package",
    "Family Package", "Group Tour", "Corporate Tour", "Luxury Tour", "Adventure Tour",
  ];
  if (packages.includes(service)) return "package";
  return "generic";
}

function getGenericDestLabel(service: string): string {
  const labels: Record<string, string> = {
    "Cruise Booking": "Cruise Destination",
    "Passport Assistance": "Applicant Location",
    "Forex Exchange": "Currency / Destination",
    "Airport Transfer": "Airport / Destination",
    "Car Rental": "Pickup Location",
    "Train Ticket": "Destination",
    "Bus Ticket": "Destination",
    "Taxi Booking": "Pickup & Drop",
  };
  return labels[service] || "Destination";
}

// ── Step 1: Service card selector ───────────────────────────────────────────
function ServiceSelectorStep({ onSelect }: { onSelect: (service: string) => void }) {
  return (
    <div className="flex flex-col gap-6 px-6 pt-4 pb-6 overflow-y-auto">
      {SERVICES.map((group) => (
        <div key={group.group}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${SVC_BADGE[group.group] ?? "bg-secondary text-muted-foreground"}`}>
              {group.group}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {group.items.map((item) => (
              <button
                key={item.label}
                onClick={() => onSelect(item.label)}
                className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border bg-gradient-to-br p-6 text-center transition-all duration-200 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] w-48 ${SVC_COLOR[group.group] ?? "hover:bg-secondary border-border"}`}
              >
                <span className="text-4xl leading-none">{item.icon}</span>
                <span className="text-sm font-semibold leading-tight text-foreground line-clamp-2">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Step 2: Dynamic form (service-specific fields + shared common fields) ───
function DynamicFormStep({
  service,
  form,
  set,
  setForm,
  assignees,
  canSubmit,
  onSubmit,
  onBack,
  customers,
  setCustomers,
}: {
  service: string;
  form: typeof EMPTY_FORM;
  set: (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  assignees: string[];
  canSubmit: boolean;
  onSubmit: () => void;
  onBack: () => void;
  customers: ExtCustomer[];
  setCustomers: React.Dispatch<React.SetStateAction<ExtCustomer[]>>;
}) {
  const icon = SERVICE_ICONS[service] ?? "📋";
  const formType = getServiceFormType(service);
  const [fetchStatus, setFetchStatus] = useState<"idle" | "found" | "notfound">("idle");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<ExtCustomer>>({
    name: "", phone: "", email: "", status: "Active" as any, source: "Website", assignedTo: "Unassigned", company: "", city: "", reference: "", dob: "", dateOfAnniversary: "", gst: ""
  });

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;

    const isDuplicate = customers.some((c) => c.phone === newCustomer.phone);
    if (isDuplicate) {
      alert("A customer with this phone number already exists.");
      return;
    }

    const currentMaxId = (customers || []).reduce((max, c) => {
      if (!c.id || typeof c.id !== 'string') return max;
      const num = parseInt(c.id.replace("CRN", ""));
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextId = `CRN${String(currentMaxId + 1).padStart(3, "0")}`;

    const customer = {
      id: nextId,
      name: newCustomer.name || "",
      phone: newCustomer.phone || "",
      email: newCustomer.email || "",
      company: newCustomer.company || "",
      city: newCustomer.city || "",
      source: newCustomer.source || "Website",
      reference: newCustomer.reference || "",
      status: (newCustomer.status as any) || "Active",
      assignedTo: newCustomer.assignedTo || "Unassigned",
      dob: newCustomer.dob || "",
      dateOfAnniversary: newCustomer.dateOfAnniversary || "",
      gst: newCustomer.gst || "",
      createdAt: new Date().toISOString().slice(0, 10),
      trips: 0,
      totalSpend: 0,
      tier: "Silver",
    } as ExtCustomer;

    setCustomers([customer, ...customers]);
    setForm((f) => ({
      ...f,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      whatsapp: customer.phone,
    }));
    setIsAddCustomerOpen(false);
    setNewCustomer({ name: "", phone: "", email: "", status: "Active" as any, source: "Website", assignedTo: "Unassigned", company: "", city: "", reference: "", dob: "", dateOfAnniversary: "", gst: "" });
    toast.success("Customer saved successfully! 👍");
  };

  const handleFetchCustomer = () => {
    const cleanPhone = (form.phone || "").replace(/[^0-9+]/g, "");
    if (!cleanPhone) return;
    const found = customers.find((c) =>
      c.phone && String(c.phone).replace(/[^0-9+]/g, "").includes(cleanPhone)
    );
    if (found) {
      setForm((f) => ({
        ...f,
        name: found.name || f.name,
        email: (found as any).email || f.email,
        whatsapp: (found as any).whatsapp || f.whatsapp || found.phone || f.whatsapp,
      }));
      setFetchStatus("found");
      setTimeout(() => setFetchStatus("idle"), 2500);
    } else {
      setFetchStatus("notfound");
      setTimeout(() => setFetchStatus("idle"), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-0 overflow-y-auto" inert={isAddCustomerOpen || undefined}>
      {/* Sub-header: service badge + back button */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-secondary/30">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-base">←</span>
          <span className="hidden sm:inline">All Services</span>
        </button>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-bold text-foreground">{service}</span>
        </div>
      </div>

      <div className="grid gap-5 px-6 pt-5 pb-6">

        {/* ── Service-specific fields ── */}
        <div className="rounded-2xl border border-border bg-secondary/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Trip Details</p>
          {formType === "air" && <AirTicketFields form={form} set={set} setForm={setForm} />}
          {formType === "hotel" && <HotelFields form={form} set={set} setForm={setForm} />}
          {formType === "visa" && <VisaFields form={form} set={set} />}
          {formType === "package" && <PackageFields form={form} set={set} setForm={setForm} />}
          {formType === "insurance" && <InsuranceFields form={form} set={set} service={service} />}
          {formType === "corporate" && <CorporateFields form={form} set={set} />}
          {formType === "generic" && <GenericTravelFields form={form} set={set} label={getGenericDestLabel(service)} />}
        </div>

        {/* ── Customer / Contact ── */}
        <div className="rounded-2xl border border-border bg-secondary/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer Info</p>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => setIsAddCustomerOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Customer
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name *</label>
              <Input {...(!isAddCustomerOpen ? { list: "lead-customers" } : {})} id="lead-name" placeholder="e.g. Priya Sharma" value={form.name} onChange={set("name")} className="rounded-xl" />
              {!isAddCustomerOpen && (
                <datalist id="lead-customers">
                  {customers?.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Phone *
              </label>
              <div className="flex gap-2">
                <Input
                  id="lead-phone"
                  type="tel"
                  placeholder="+91 9820000000"
                  value={form.phone}
                  onChange={(e) => { const v = e.target.value.replace(/[^0-9+\s-]/g, ""); setForm(f => ({ ...f, phone: v })); }}
                  className="rounded-xl flex-1"
                />
                <button
                  type="button"
                  onClick={handleFetchCustomer}
                  disabled={!(form.phone || "").trim()}
                  className={
                    `shrink-0 rounded-xl px-3 py-2 text-xs font-semibold border transition-all duration-200 ${fetchStatus === "found"
                      ? "bg-green-500 border-green-500 text-white"
                      : fetchStatus === "notfound"
                        ? "bg-red-500 border-red-500 text-white"
                        : "bg-primary border-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
                    }`
                  }
                >
                  {fetchStatus === "found" ? "✓ Found" : fetchStatus === "notfound" ? "✗ None" : "Find"}
                </button>
              </div>
              {fetchStatus === "found" && (
                <p className="mt-1 text-[11px] text-green-600 font-medium">✓ Customer details filled from records</p>
              )}
              {fetchStatus === "notfound" && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">No customer found with this number</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp</label>
              <Input id="lead-whatsapp" placeholder="+91 98200 00000" value={form.whatsapp} onChange={set("whatsapp")} className="rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
              <Input id="lead-email" type="email" placeholder="name@example.com" value={form.email} onChange={set("email")} className="rounded-xl" />
            </div>
          </div>
        </div>

        {/* ── Assignment & Source ── */}
        <div className="rounded-2xl border border-border bg-secondary/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Assignment & Source</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lead Source</label>
              <Select value={form.source} onValueChange={(v) => setForm(f => ({ ...f, source: v }))}>
                <SelectTrigger id="lead-source" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm h-10 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${SOURCE_COLORS[s] ?? "bg-gray-300"}`} />
                        {s}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assign Ops</label>
              <select id="lead-ops" value={form.assignOpsTo} onChange={set("assignOpsTo")} className={FIELD_CLS}>
                <option value="">— None —</option>
                {assignees.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</label>
              <select id="lead-priority" value={form.priority} onChange={set("priority")} className={FIELD_CLS}>
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reference</label>
              <Input id="lead-reference" placeholder="e.g. Jatin Jangid" value={form.reference} onChange={set("reference")} className="rounded-xl" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lead Section</label>
              <select value={form.leadSection} onChange={set("leadSection")} className={FIELD_CLS}>
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
                <option value="Corporate">Corporate</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Remarks ── */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Remarks <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea
            id="lead-notes"
            rows={2}
            placeholder="Any special requests or context..."
            value={form.notes}
            onChange={set("notes")}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>

        <button
          id="submit-lead-btn"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Plus className="h-4 w-4" />
          Save Lead
        </button>
      </div>

      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:max-w-[600px] z-[60]">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Create a new customer profile.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer} className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Customer Name <span className="text-red-500">*</span></label>
              <Input id="name" autoComplete="off" placeholder="e.g. jatin jangid" required value={newCustomer.name || ""} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Mobile Number <span className="text-red-500">*</span></label>
              <Input id="phone" placeholder="e.g. 9876543210" required value={newCustomer.phone || ""} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email Address</label>
              <Input id="email" type="email" placeholder="e.g. jatin@example.com" value={newCustomer.email || ""} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">Company Name</label>
              <Input id="company" placeholder="e.g. NxtWave" value={newCustomer.company || ""} onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">City</label>
              <Input id="city" placeholder="e.g. jaipur" value={newCustomer.city || ""} onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="reference" className="text-sm font-medium">Reference Name</label>
              <Input id="reference" placeholder="e.g. jatin jangid" value={newCustomer.reference || ""} onChange={(e) => setNewCustomer({ ...newCustomer, reference: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="source" className="text-sm font-medium">Lead Source</label>
              <Select value={newCustomer.source || "Website"} onValueChange={(v) => setNewCustomer({ ...newCustomer, source: v })}>
                <SelectTrigger id="source"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <Select value={newCustomer.status || "Active"} onValueChange={(v: any) => setNewCustomer({ ...newCustomer, status: v })}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Active", "Inactive", "VIP"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="assignedTo" className="text-sm font-medium">Assigned Employee</label>
              <Select value={newCustomer.assignedTo || "Unassigned"} onValueChange={(v) => setNewCustomer({ ...newCustomer, assignedTo: v })}>
                <SelectTrigger id="assignedTo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {assignees.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="dob" className="text-sm font-medium">DOB</label>
              <Input id="dob" type="date" value={newCustomer.dob || ""} onChange={(e) => setNewCustomer({ ...newCustomer, dob: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="dateOfAnniversary" className="text-sm font-medium">Date of Anniversary</label>
              <Input id="dateOfAnniversary" type="date" value={newCustomer.dateOfAnniversary || ""} onChange={(e) => setNewCustomer({ ...newCustomer, dateOfAnniversary: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="gst" className="text-sm font-medium">GST</label>
              <Input id="gst" placeholder="GST Number" value={newCustomer.gst || ""} onChange={(e) => setNewCustomer({ ...newCustomer, gst: e.target.value })} />
            </div>
            <DialogFooter className="col-span-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddCustomerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main modal shell ─────────────────────────────────────────────────────────
function AddLeadModal({
  onClose,
  onAdd,
  existingLeads,
  customers,
  setCustomers,
}: {
  onClose: () => void;
  onAdd: (l: ExtLead) => void;
  existingLeads: ExtLead[];
  customers: ExtCustomer[];
  setCustomers: React.Dispatch<React.SetStateAction<ExtCustomer[]>>;
}) {
  const [localEmployees] = useSupabaseTable<unknown[]>("employees", INITIAL_EMPLOYEES);
  const employees = localEmployees?.length ? localEmployees : INITIAL_EMPLOYEES;
  const auth = getAuth();
  const assignees = Array.from(
    new Set([...employees.map((e: any) => e.name), ...(auth?.name ? [auth.name] : []), "Other"]),
  );

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, assignedTo: assignees[0] || "" });

  const set =
    (k: keyof typeof EMPTY_FORM) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSelectService = (service: string) => {
    setForm(f => ({ ...f, service }));
    setSelectedService(service);
  };

  const handleBack = () => {
    setSelectedService(null);
  };

  const formType = selectedService ? getServiceFormType(selectedService) : "";
  const isInsurance = formType === "insurance";
  const isAir = formType === "air";
  const isPackage = formType === "package";
  const isHotel = formType === "hotel";
  const isVisa = formType === "visa";

  const canSubmit = (() => {
    if (!selectedService || !(form.name || "").trim() || !(form.phone || "").trim()) return false;
    if (isInsurance) return !!form.insuranceDate;
    if (isAir) return !!form.sourceCity && !!form.destinationCity && !!form.travelDate;
    if (isHotel) return !!form.destination && !!form.checkIn && !!form.checkOut;
    if (isVisa) return !!form.country;
    return !!form.destination;
  })();

  const submit = () => {
    if (!canSubmit || !selectedService) return;
    const lmhLeads = existingLeads.filter((l) => l.id?.startsWith("T-"));
    let nextNum = 1;
    if (lmhLeads.length > 0) {
      const nums = lmhLeads.map((l) => {
        const parts = l.id.split("-");
        const n = parseInt(parts[1], 10);
        return isNaN(n) ? 0 : n;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const pad = (num: number, size: number) => {
      let s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    };
    const id = crypto.randomUUID();

    let dest = form.destination;
    if (isAir) dest = `${form.sourceCity} → ${form.destinationCity}`;
    if (isInsurance) dest = form.clientCompany || "Insurance";

    onAdd({
      id,
      name: form.name,
      phone: form.phone,
      email: form.email,
      whatsapp: form.whatsapp || form.phone,
      destination: dest,
      budget: Number(form.budget) || 0,
      travelDate: isInsurance ? form.insuranceDate : (isHotel ? form.checkIn : form.travelDate),
      status: form.status,
      source: form.source,
      reference: form.reference,
      createdAt: new Date().toISOString().slice(0, 10),
      createdTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      avatar: "",
      assignedTo: form.assignedTo,
      notes: form.notes,
      pax: Number(form.pax) || 2,
      service: selectedService,
      priority: form.priority,
      packageType: form.packageType,
      // Air ticket
      sourceCity: isAir ? form.sourceCity : undefined,
      destinationCity: isAir ? form.destinationCity : undefined,
      infants: isAir ? Number(form.infants) : undefined,
      fareType: isAir ? form.fareType : undefined,
      directFlight: isAir ? form.directFlight : undefined,
      flightClass: isAir ? form.flightClass : undefined,
      preferredAirline: isAir ? form.preferredAirline : undefined,
      adults: Number(form.adults) || 1,
      children: Number(form.children) || 0,
      // Hotel
      checkIn: isHotel ? form.checkIn : undefined,
      checkOut: isHotel ? form.checkOut : undefined,
      nights: isHotel ? form.nights : undefined,
      nationality: isHotel ? form.nationality : undefined,
      starRating: isHotel ? form.starRating : undefined,
      mealPreference: isHotel ? form.mealPreference : undefined,
      // Visa
      visaType: isVisa ? form.visaType : undefined,
      passportExpiry: isVisa ? form.passportExpiry : undefined,
      country: isVisa ? form.country : undefined,
      // Package
      goingFrom: isPackage ? form.goingFrom : undefined,
      noOfDays: isPackage ? form.noOfDays : undefined,
      inclusions: isPackage ? form.inclusions : undefined,
      theme: isPackage ? form.theme : undefined,
      hotelPreference: isPackage ? form.hotelPreference : undefined,
      foodPreference: isPackage ? form.foodPreference : undefined,
      // Insurance
      insuranceDate: isInsurance ? form.insuranceDate : undefined,
      policyType: isInsurance ? form.policyType : undefined,
      queryType: isInsurance ? form.queryType : undefined,
      clientCompany: isInsurance ? form.clientCompany : undefined,
      expiryDate: isInsurance ? form.expiryDate : undefined,
      // Corporate
      companyName: form.companyName || undefined,
      eventType: form.eventType || undefined,
      // Common
      assignToOps: form.assignToOps,
      assignOpsTo: form.assignOpsTo || undefined,
      leadSection: form.leadSection,
    });
  };
  const [blink, setBlink] = useState(false);
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full flex flex-col overflow-hidden max-h-[92vh] rounded-t-3xl sm:rounded-3xl border border-border bg-background shadow-2xl transition-all duration-300 ${selectedService ? "sm:max-w-2xl" : "sm:max-w-3xl"} ${blink ? "scale-[1.02] ring-4 ring-primary/40 opacity-90" : ""}`}
        style={{ animation: "floatUp 0.25s ease both" }}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border sm:hidden" />

        {/* Modal header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">
                {selectedService ? `New ${selectedService} Lead` : "Create New Lead"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedService ? "Fill in the details below" : "Select a service to continue"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step content */}
        {!selectedService ? (
          <ServiceSelectorStep onSelect={handleSelectService} />
        ) : (
          <DynamicFormStep
            service={selectedService}
            form={form}
            set={set}
            setForm={setForm}
            assignees={assignees}
            canSubmit={canSubmit}
            onSubmit={submit}
            onBack={handleBack}
            customers={customers}
            setCustomers={setCustomers as React.Dispatch<React.SetStateAction<ExtCustomer[]>>}
          />
        )}
      </div>
    </div>
  );
}
/* ─── Lead Detail Slide-over ─── */
function LeadDetail({
  lead,
  allLeads = [],
  onClose,
  onStatusChange,
  onDelete,
  isAdmin,
  assignees,
  onEditNote,
  onUpdateLead,
}: {
  lead: ExtLead;
  allLeads?: ExtLead[];
  onClose: () => void;
  onStatusChange: (id: string, s: LeadStatus) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
  assignees?: string[];
  onEditNote?: (id: string, newNote: string) => void;
  onUpdateLead?: (id: string, updates: Partial<ExtLead>) => void;
}) {
  const sortedLeads = React.useMemo(() => {
    return [...(allLeads || [])].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }, [allLeads]);
  const leadIndex = sortedLeads.findIndex(l => l.id === lead.id);
  const displayId = leadIndex !== -1 ? `LD-${String(leadIndex + 1).padStart(2, '0')}` : `LD-${lead.id.substring(0, 6).toUpperCase()}`;
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNoteText, setEditNoteText] = useState(lead.notes || "");
  const [newNoteText, setNewNoteText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    bookingReference: lead.bookingReference || "",
    vendorName: lead.vendorName || "",
    hotelDetails: lead.hotelDetails || "",
    totalAmount: lead.totalAmount || 0,
    amountPaid: lead.amountPaid || 0,
    paymentStatus: lead.paymentStatus || "Pending",
  });

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactDetails, setContactDetails] = useState({
    phone: lead.phone || "",
    email: lead.email || "",
  });

  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [tripDetails, setTripDetails] = useState({
    destination: lead.destination || "",
    budget: lead.budget || 0,
    travelDate: lead.travelDate || "",
    pax: lead.pax || 2,
    adults: lead.adults || 2,
    children: lead.children || 0,
    whatsapp: lead.whatsapp || lead.phone || "",
    nextFollowUp: lead.nextFollowUp || "",
    source: lead.source || "Direct",
    service: lead.service || "International Package",
    priority: lead.priority || "Medium",
    expiryDate: lead.expiryDate || "",
    policyType: lead.policyType || "",
    queryType: lead.queryType || "",
    clientCompany: lead.clientCompany || "",
    reference: lead.reference || "",
    packageType: lead.packageType || "",
    leadSection: lead.leadSection || "",
  });
  const [blink, setBlink] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else if (isEditingContact || isEditingTrip || isEditingBooking || isEditingNote) {
          // Inner modal or edit mode is active; let it handle Escape.
          return;
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteConfirmId, isEditingContact, isEditingTrip, isEditingBooking, isEditingNote, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`flex w-full max-w-2xl max-h-[90vh] flex-col overflow-y-auto bg-background shadow-2xl rounded-2xl animate-in zoom-in-95 transition-all duration-150 ${blink ? "scale-[1.02] ring-4 ring-primary/40 opacity-90" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-xl font-bold">Lead Detail</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 p-6">
          <div className="flex items-center gap-4">
            {lead.avatar ? (
              <img
                src={lead.avatar}
                alt={lead.name}
                className="h-16 w-16 rounded-2xl object-cover shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {lead.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || "?"}
                </span>
              </div>
            )}
            <div>
              <p className="font-display text-xl font-bold">{lead.name}</p>
              <p className="text-sm text-muted-foreground" title={lead.id}>
                {displayId} · Created {lead.createdAt}
              </p>
              <div className="mt-2">
                <Select
                  value={lead.status}
                  onValueChange={(val: LeadStatus) => onStatusChange(lead.id, val)}
                >
                  <SelectTrigger
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border-none h-auto w-auto focus:ring-0 focus:ring-offset-0 shadow-none [&>svg]:hidden ${STATUS_PILL[lead.status]}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[lead.status]}`} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="grid gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact
              </p>
              {isAdmin && onUpdateLead && !isEditingContact && (
                <button
                  onClick={() => setIsEditingContact(true)}
                  className="text-[10px] text-blue-500 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingContact ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Phone</label>
                    <Input
                      type="tel"
                      value={contactDetails.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+\s-]/g, "");
                        setContactDetails({ ...contactDetails, phone: val });
                      }}
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      value={contactDetails.email}
                      onChange={(e) => setContactDetails({ ...contactDetails, email: e.target.value })}
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs flex-1 rounded-lg"
                    onClick={() => setIsEditingContact(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs flex-1 rounded-lg"
                    onClick={() => {
                      onUpdateLead?.(lead.id, contactDetails);
                      setIsEditingContact(false);
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">
                    {lead.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href={`mailto:${lead.email}`} className="hover:underline">
                    {lead.email || "—"}
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Trip details */}
          <div className="grid gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {lead.service?.toLowerCase().includes("insurance")
                  ? "Insurance Details"
                  : "Trip Details"}
              </p>
              {isAdmin && onUpdateLead && !isEditingTrip && (
                <button
                  onClick={() => setIsEditingTrip(true)}
                  className="text-[10px] text-blue-500 hover:underline"
                >
                  Edit Details
                </button>
              )}
            </div>

            {isEditingTrip ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="space-y-3">
                  {!lead.service?.toLowerCase().includes("insurance") && (
                    <>
                      <div>
                        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Destination</label>
                        <Input
                          value={tripDetails.destination}
                          onChange={(e) => setTripDetails({ ...tripDetails, destination: e.target.value })}
                          className="h-8 mt-1 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Budget</label>
                          <Input
                            type="number"
                            value={tripDetails.budget}
                            onChange={(e) => setTripDetails({ ...tripDetails, budget: Number(e.target.value) })}
                            className="h-8 mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Travel Date</label>
                          <Input
                            type="date"
                            value={tripDetails.travelDate}
                            onChange={(e) => setTripDetails({ ...tripDetails, travelDate: e.target.value })}
                            className="h-8 mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Adults</label>
                          <Input
                            type="number"
                            value={tripDetails.adults}
                            onChange={(e) => setTripDetails({ ...tripDetails, adults: Number(e.target.value), pax: Number(e.target.value) + Number(tripDetails.children) })}
                            className="h-8 mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Children</label>
                          <Input
                            type="number"
                            value={tripDetails.children}
                            onChange={(e) => setTripDetails({ ...tripDetails, children: Number(e.target.value), pax: Number(tripDetails.adults) + Number(e.target.value) })}
                            className="h-8 mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Package Type</label>
                          <Input
                            value={tripDetails.packageType}
                            onChange={(e) => setTripDetails({ ...tripDetails, packageType: e.target.value })}
                            className="h-8 mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Service</label>
                          <select
                            value={tripDetails.service}
                            onChange={(e) => setTripDetails({ ...tripDetails, service: e.target.value })}
                            className="flex h-8 mt-1 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {Object.keys(SERVICE_ICONS).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  {lead.service?.toLowerCase().includes("insurance") && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Expiry Date</label>
                          <Input
                            type="date"
                            value={tripDetails.expiryDate}
                            onChange={(e) => setTripDetails({ ...tripDetails, expiryDate: e.target.value })}
                            className="h-8 mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Policy Type</label>
                          <Input
                            value={tripDetails.policyType}
                            onChange={(e) => setTripDetails({ ...tripDetails, policyType: e.target.value })}
                            className="h-8 mt-1 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Query Type</label>
                          <Input
                            value={tripDetails.queryType}
                            onChange={(e) => setTripDetails({ ...tripDetails, queryType: e.target.value })}
                            className="h-8 mt-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Client/Company</label>
                          <Input
                            value={tripDetails.clientCompany}
                            onChange={(e) => setTripDetails({ ...tripDetails, clientCompany: e.target.value })}
                            className="h-8 mt-1 text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-muted-foreground">Priority</label>
                      <select
                        value={tripDetails.priority}
                        onChange={(e) => setTripDetails({ ...tripDetails, priority: e.target.value as "High" | "Medium" | "Low" })}
                        className="flex h-8 mt-1 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="High"> 🔴 High</option>
                        <option value="Medium"> 🟡 Medium</option>
                        <option value="Low"> 🟢 Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-muted-foreground">Source</label>
                      <select
                        value={tripDetails.source}
                        onChange={(e) => setTripDetails({ ...tripDetails, source: e.target.value })}
                        className="flex h-8 mt-1 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {Object.keys(SOURCE_ICONS).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-muted-foreground">Section</label>
                      <select
                        value={tripDetails.leadSection}
                        onChange={(e) => setTripDetails({ ...tripDetails, leadSection: e.target.value })}
                        className="flex h-8 mt-1 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="B2C">B2C</option>
                        <option value="B2B">B2B</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Next Follow-up</label>
                    <Input
                      type="date"
                      value={tripDetails.nextFollowUp}
                      onChange={(e) => setTripDetails({ ...tripDetails, nextFollowUp: e.target.value })}
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs flex-1 rounded-lg"
                    onClick={() => setIsEditingTrip(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs flex-1 rounded-lg"
                    onClick={() => {
                      onUpdateLead?.(lead.id, tripDetails);
                      setIsEditingTrip(false);
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {lead.service?.toLowerCase().includes("insurance")
                  ? [
                    {
                      icon: <CalendarDays className="h-4 w-4 text-primary" />,
                      label: "Expiry Date",
                      val: lead.expiryDate || "—",
                    },
                    {
                      icon: <Shield className="h-4 w-4 text-primary" />,
                      label: "Policy Type",
                      val: lead.policyType || "—",
                    },
                    {
                      icon: <AlertCircle className="h-4 w-4 text-primary" />,
                      label: "Query Type",
                      val: lead.queryType || "—",
                    },
                    {
                      icon: <Building2 className="h-4 w-4 text-primary" />,
                      label: "Client / Company",
                      val: lead.clientCompany || "—",
                    },
                    {
                      icon: <UserCheck className="h-4 w-4 text-primary" />,
                      label: "Reference",
                      val: lead.reference || "—",
                    },
                    {
                      icon: <Globe className="h-4 w-4 text-primary" />,
                      label: "Source",
                      val: `${SOURCE_ICONS[lead.source] || ""} ${lead.source}`,
                    },
                    {
                      icon: <Globe className="h-4 w-4 text-primary" />,
                      label: "Section",
                      val: lead.leadSection || "—",
                    },
                    {
                      icon: <Briefcase className="h-4 w-4 text-primary" />,
                      label: "Service",
                      val: `${SERVICE_ICONS[lead.service] || ""} ${lead.service}`,
                    },
                  ].map((r) => (
                    <div key={r.label} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0">{r.icon}</span>
                      <div>
                        <p className="text-xs text-muted-foreground">{r.label}</p>
                        <p className="text-sm font-semibold">{r.val}</p>
                      </div>
                    </div>
                  ))
                  : [
                    {
                      icon: <MapPin className="h-4 w-4 text-primary" />,
                      label: "Destination",
                      val: lead.destination,
                    },
                    {
                      icon: <IndianRupee className="h-4 w-4 text-primary" />,
                      label: "Budget",
                      val: formatINR(lead.budget),
                    },
                    {
                      icon: <CalendarDays className="h-4 w-4 text-primary" />,
                      label: "Travel Date",
                      val: lead.travelDate,
                    },
                    {
                      icon: <Users className="h-4 w-4 text-primary" />,
                      label: "Travellers",
                      val: `${lead.pax} pax (Adults: ${lead.adults || 2}, Children: ${lead.children || 0})`,
                    },
                    {
                      icon: <Phone className="h-4 w-4 text-primary" />,
                      label: "WhatsApp",
                      val: lead.whatsapp || lead.phone,
                    },
                    {
                      icon: <CalendarDays className="h-4 w-4 text-primary" />,
                      label: "Next Follow-up",
                      val: lead.nextFollowUp || "Not scheduled",
                    },
                    {
                      icon: <Globe className="h-4 w-4 text-primary" />,
                      label: "Source",
                      val: `${SOURCE_ICONS[lead.source] || ""} ${lead.source}`,
                    },
                    {
                      icon: <Globe className="h-4 w-4 text-primary" />,
                      label: "Section",
                      val: lead.leadSection || "—",
                    },
                    {
                      icon: <Briefcase className="h-4 w-4 text-primary" />,
                      label: "Service",
                      val: `${SERVICE_ICONS[lead.service] || ""} ${lead.service}`,
                    },
                    {
                      icon: <Package className="h-4 w-4 text-primary" />,
                      label: "Package",
                      val: lead.packageType || "—",
                    },
                    {
                      icon: <AlertCircle className="h-4 w-4 text-primary" />,
                      label: "Priority",
                      val: PRIORITY_BADGE[lead.priority] || lead.priority,
                    },
                  ].map((r) => (
                    <div key={r.label} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0">{r.icon}</span>
                      <div>
                        <p className="text-xs text-muted-foreground">{r.label}</p>
                        <p className="text-sm font-semibold">{r.val}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Notes & Updates Feed */}
          <div className="mt-4 pt-3 border-t border-border border-dashed w-full block">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Notes & Updates
              </p>
            </div>

            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
              {Array.isArray(lead.allNotes) && lead.allNotes.length > 0 ? (
                lead.allNotes.map((note, idx) => (
                  <div key={idx} className="bg-secondary/20 rounded-xl p-3 border border-border/50 text-sm">
                    <p className="text-foreground whitespace-pre-wrap">{note.text}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-medium">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(note.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : lead.notes ? (
                <div className="bg-secondary/20 rounded-xl p-3 border border-border/50 text-sm">
                  <p className="text-foreground whitespace-pre-wrap">{lead.notes}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-medium">
                    <Calendar className="h-3 w-3" />
                    <span>{lead.noteDate ? new Date(lead.noteDate).toLocaleDateString() : "Legacy Note"}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border">
                  No notes yet. Add one below.
                </div>
              )}
            </div>

            {onUpdateLead && (
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Type an update..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newNoteText.trim()) {
                      const noteDate = new Date().toISOString();
                      const currentNotes = Array.isArray(lead.allNotes) ? [...lead.allNotes] : [];
                      if (lead.notes && currentNotes.length === 0) {
                        currentNotes.push({ text: lead.notes, date: lead.noteDate || new Date().toISOString() });
                      }
                      currentNotes.push({ text: newNoteText.trim(), date: noteDate });
                      onUpdateLead(lead.id, { notes: newNoteText.trim(), noteDate, allNotes: currentNotes });
                      setNewNoteText("");
                    }
                  }}
                  className="h-9 text-xs flex-1 rounded-xl bg-background shadow-sm"
                />
                <Button
                  size="sm"
                  className="h-9 rounded-xl px-4 shrink-0 text-white shadow-sm"
                  style={{ background: "var(--gradient-brand)" }}
                  onClick={() => {
                    if (newNoteText.trim()) {
                      const noteDate = new Date().toISOString();
                      const currentNotes = Array.isArray(lead.allNotes) ? [...lead.allNotes] : [];
                      if (lead.notes && currentNotes.length === 0) {
                        currentNotes.push({ text: lead.notes, date: lead.noteDate || new Date().toISOString() });
                      }
                      currentNotes.push({ text: newNoteText.trim(), date: noteDate });
                      onUpdateLead(lead.id, { notes: newNoteText.trim(), noteDate, allNotes: currentNotes });
                      setNewNoteText("");
                    }
                  }}
                  disabled={!newNoteText.trim()}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Assignee Card */}
          <div className="mt-4 pt-3 border-t border-border border-dashed w-full block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Assigned To
            </p>
            {isAdmin && assignees && assignees.length > 0 ? (
              <select
                value={lead.assignedTo}
                onChange={(e) => onUpdateLead?.(lead.id, { assignedTo: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            ) : (
              <div className="scale-90 sm:scale-95 origin-top-left -mx-2 -mt-2">
                <EmployeeProfileCard employeeName={lead.assignedTo} compact={true} />
              </div>
            )}
          </div>
          {/* WhatsApp Quick Actions */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              💬 WhatsApp Customer Share
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const url = window.location.origin + `/crm/portal?leadId=${lead.id}`;
                  const msg = `Hello ${lead.name},\n\nWe are excited to share your customized itinerary & quotation details for ${lead.destination}. You can view the details here:\n${url}\n\nWarm regards,\nLook My Holidays`;
                  window.open(
                    `https://wa.me/${lead.whatsapp || lead.phone}?text=${encodeURIComponent(msg)}`,
                    "_blank",
                  );
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 py-2 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200 transition-colors cursor-pointer"
              >
                Send Itinerary
              </button>
              <button
                onClick={() => {
                  const url = window.location.origin + `/crm/portal?leadId=${lead.id}`;
                  const msg = `Dear ${lead.name},\n\nThis is a friendly reminder for the pending payment balance on your booking for ${lead.destination}. Please find booking invoice details at: ${url}`;
                  window.open(
                    `https://wa.me/${lead.whatsapp || lead.phone}?text=${encodeURIComponent(msg)}`,
                    "_blank",
                  );
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 py-2 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200 transition-colors cursor-pointer"
              >
                Remind Payment
              </button>
              <button
                onClick={() => {
                  const url = window.location.origin + `/crm/portal?leadId=${lead.id}`;
                  const msg = `Hello ${lead.name},\n\nYour travel vouchers for ${lead.destination} are ready! Please download vouchers here: ${url}`;
                  window.open(
                    `https://wa.me/${lead.whatsapp || lead.phone}?text=${encodeURIComponent(msg)}`,
                    "_blank",
                  );
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 py-2 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200 transition-colors cursor-pointer"
              >
                Send Vouchers
              </button>
              <button
                onClick={() => {
                  const msg = `Welcome back ${lead.name}! We hope you had a wonderful trip to ${lead.destination}. Please leave us feedback at: https://g.page/lookmyholidays/review`;
                  window.open(
                    `https://wa.me/${lead.whatsapp || lead.phone}?text=${encodeURIComponent(msg)}`,
                    "_blank",
                  );
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 py-2 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200 transition-colors cursor-pointer"
              >
                Request Review
              </button>
            </div>
          </div>


        </div>

        {/* Footer actions */}
        <div className="flex gap-3 border-t border-border p-6">
          {isAdmin && (
            <Button
              variant="default"
              className="flex-none gap-2 rounded-xl"
              onClick={() => setDeleteConfirmId(lead.id)}
            >
              <X className="h-4 w-4" /> Delete
            </Button>
          )}

          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={() => {
              const phone = lead.phone?.replace(/\D/g, '');
              if (phone) window.open(`https://wa.me/${phone}`, '_blank');
            }}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-xl"
            onClick={() => (window.location.href = `tel:${lead.phone}`)}
          >
            <Phone className="h-4 w-4" /> Call
          </Button>
          <Button
            className="flex-1 gap-2 rounded-xl"
            style={{ background: "var(--gradient-brand)" }}
            onClick={() =>
              (window.location.href = `mailto:${lead.email}?subject=Your Quote from Grand Journeys`)
            }
          >
            <Mail className="h-4 w-4" /> Send Quote
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold font-display text-foreground">Delete Lead?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-xl"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Kanban column ─── */
function KanbanCol({
  status,
  leads,
  onSelect,
  onDropLead,
}: {
  status: LeadStatus;
  leads: ExtLead[];
  onSelect: (l: ExtLead) => void;
  onDropLead: (id: string) => void;
}) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      onDropLead(leadId);
    }
  };

  const total = leads.reduce((s, l) => s + (Number(l.budget) || 0), 0);
  return (
    <div
      className="flex-none w-[calc(25%-9px)] min-w-[280px] flex flex-col rounded-2xl border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50 snap-start"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          <span className="text-xs font-bold uppercase tracking-wider">{status}</span>
        </div>
        <span className="rounded-full bg-border px-2 py-0.5 text-xs font-semibold">
          {leads.length}
        </span>
      </div>
      {/* Budget total */}
      {total > 0 && <p className="mb-2 px-1 text-xs text-muted-foreground">{formatINR(total)}</p>}
      {/* Cards */}
      <div className="flex flex-col gap-2 min-h-[100px] max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {leads.map((l) => (
          <button
            key={l.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("leadId", l.id);
            }}
            onClick={() => onSelect(l)}
            className="group rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              {l.avatar ? (
                <img
                  src={l.avatar}
                  alt={l.name}
                  className="h-7 w-7 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">
                    {l.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || "?"}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{l.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {l.service?.toLowerCase().includes("insurance")
                    ? `${l.policyType || "Insurance"} · ${l.clientCompany || "—"}`
                    : l.destination}
                </p>
              </div>
              <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            {l.budget > 0 && (
              <p className="mt-1.5 text-xs font-bold text-primary">{formatINR(l.budget)}</p>
            )}
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {SERVICE_ICONS[l.service]} {l.service}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {PRIORITY_BADGE[l.priority]} ·{" "}
              {l.service?.toLowerCase().includes("insurance")
                ? l.insuranceDate || l.travelDate
                : l.travelDate}
            </p>
          </button>
        ))}
        {leads.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground/50">No leads</div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
function LeadsPage() {
  const [leads, setLeads] = useSupabaseTable<ExtLead[]>("insurance_leads", _LEADS_INIT);
  const [localEmployees] = useSupabaseTable<unknown[]>("employees", INITIAL_EMPLOYEES);
  const employees = localEmployees?.length ? localEmployees : INITIAL_EMPLOYEES;
  const [customers, setCustomers] = useSupabaseTable<ExtCustomer[]>("customers", []);
  const [newNote, setNewNote] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "All">("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>("All");
  const [sortField, setSortField] = useState<"createdAt" | "name" | "budget">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [showModal, setShowModal] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selected, setSelected] = useState<ExtLead | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [editingTableNoteId, setEditingTableNoteId] = useState<string | null>(null);
  const [tableEditNoteText, setTableEditNoteText] = useState("");

  const [allTasks, setAllTasks] = useSupabaseTable<any[]>("tasks", []);
  const [tableEditTaskText, setTableEditTaskText] = useState("");
  const [editingTaskLeadId, setEditingTaskLeadId] = useState<string | null>(null);
  const auth = getAuth();
  const isAdmin = (auth?.role === "admin" || auth?.role === "manager");

  const assignees = Array.from(
    new Set([...employees.map((e: any) => e.name), ...(auth?.name ? [auth.name] : []), "Other"]),
  );

  const exportToExcel = () => {
    const headers = [
      "ID",
      "Name",
      "Phone",
      "Email",
      "Destination",
      "Budget",
      "Travel Date",
      "Pax",
      "Source",
      "Reference",
      "Status",
      "Assigned To",
      "Service",
      "Priority",
      "Section",
      "Created At",
    ];

    const exportableLeads = sortedLeads.filter(l => {
      const d = l.createdAt ? l.createdAt.split("T")[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const csvRows = [
      headers.join(","),
      ...exportableLeads.map((l) =>
        [
          `"${l.id}"`,
          `"${l.name.replace(/"/g, '""')}"`,
          `"${l.phone}"`,
          `"${l.email}"`,
          `"${l.destination.replace(/"/g, '""')}"`,
          l.budget,
          `"${l.travelDate}"`,
          l.pax,
          `"${l.source}"`,
          `"${l.reference || ""}"`,
          `"${l.status}"`,
          `"${l.assignedTo}"`,
          `"${l.service}"`,
          `"${l.priority}"`,
          `"${l.leadSection || ""}"`,
          `"${l.createdAt}"`,
        ].join(","),
      ),
    ];
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToWord = () => {
    const tableHeader =
      "<tr><th>ID</th><th>Name</th><th>Phone</th><th>Destination</th><th>Budget</th><th>Travel Date</th><th>Status</th><th>Priority</th><th>Section</th></tr>";

    const exportableLeads = sortedLeads.filter(l => {
      const d = l.createdAt ? l.createdAt.split("T")[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableRows = exportableLeads
      .map(
        (l) =>
          `<tr><td>${l.id}</td><td>${l.name}</td><td>${l.phone}</td><td>${l.destination}</td><td>₹${l.budget}</td><td>${l.travelDate}</td><td>${l.status}</td><td>${l.priority}</td></tr>`,
      )
      .join("");
    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Leads Export</title><style>table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; } th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head>
      <body><h2>Grand Journeys CRM - Leads Export</h2><table>${tableHeader}${tableRows}</table></body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const exportableLeads = sortedLeads.filter(l => {
      const d = l.createdAt ? l.createdAt.split("T")[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableHeader =
      "<tr><th>ID</th><th>Name</th><th>Phone</th><th>Destination</th><th>Budget</th><th>Travel Date</th><th>Status</th><th>Priority</th><th>Section</th></tr>";
    const tableRows = exportableLeads
      .map(
        (l) =>
          `<tr><td>${l.id}</td><td>${l.name}</td><td>${l.phone}</td><td>${l.destination || ""}</td><td>${l.budget}</td><td>${l.travelDate}</td><td>${l.status}</td><td>${l.priority}</td><td>${l.leadSection || ""}</td></tr>`,
      )
      .join("");
    const css = `body{font-family:sans-serif;padding:20px;color:#333}h2{color:#f43f5e;margin-bottom:5px}p{font-size:12px;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f9fafb;font-weight:bold}tr:nth-child(even){background:#f3f4f6}`;
    const styleEl = printWindow.document.createElement("style");
    styleEl.textContent = css;
    printWindow.document.head.appendChild(styleEl);
    const titleEl = printWindow.document.createElement("title");
    titleEl.textContent = "Leads Export PDF";
    printWindow.document.head.appendChild(titleEl);
    const bodyHtml = `<h2>Grand Journeys CRM - Leads Export</h2><p>Generated on ${new Date().toLocaleDateString("en-IN")} | Total Leads: ${exportableLeads.length}</p><table><thead>${tableHeader}</thead><tbody>${tableRows}</tbody></table>`;
    const wrapper = printWindow.document.createElement("div");
    wrapper.innerHTML = bodyHtml;
    printWindow.document.body.appendChild(wrapper);
    const script = printWindow.document.createElement("script");
    script.textContent =
      "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
    printWindow.document.body.appendChild(script);
    printWindow.document.close();
  };

  const handleImportLeads = (data: any[]) => {
    const lmhLeads = leads.filter((l) => l.id.startsWith("T-"));
    let nextNum = 1;
    if (lmhLeads.length > 0) {
      const nums = lmhLeads.map((l) => {
        const parts = l.id?.split("-");
        const n = parseInt(parts[1], 10);
        return isNaN(n) ? 0 : n;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const pad = (num: number, size: number) => {
      let s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    };

    const importedLeads: ExtLead[] = data.map((row, idx) => ({
      id: `T-${pad(nextNum + idx, 3)}`,
      name: String(row["Client / Company"] || "Unknown"), // Mapping Client/Company to name for the table
      clientCompany: String(row["Client / Company"] || "Unknown"),
      phone: String(row["Phone"] || ""),
      email: "",
      destination: "Unknown",
      budget: 0,
      travelDate: String(row["Travel Date"] || new Date().toISOString().slice(0, 10)),
      source: String(row["Source"] || SOURCES[0]),
      reference: String(row["Reference"] || ""),
      status: (String(row["Status"]) || "New Lead") as LeadStatus,
      assignedTo: String(row["Assigned To"] || assignees[0]),
      pax: parseInt(String(row["Pax"] || "2")) || 2,
      notes: String(row["Description"] || ""),
      avatar: "",
      createdAt: String(row["Date"] || new Date().toISOString().slice(0, 10)),
      createdTime: String(row["Time"] || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })),
      service: "International Package",
      priority: (String(row["Priority"]) || "Medium") as "High" | "Medium" | "Low",
      packageType: "",
      queryType: String(row["Query Type"] || "New"),
      leadSection: "B2C",
    }));
    setLeads((prev) => [...importedLeads, ...prev]);
  };

  const genInsuranceLeads = leads.filter(l => l.leadSection === "General Insurance");
  const visibleLeads = isAdmin
    ? genInsuranceLeads
    : genInsuranceLeads.filter((l) => l.assignedTo?.toLowerCase() === auth?.name?.toLowerCase());

  const filtered = visibleLeads.filter(
    (l) =>
      (filterStatus === "All" || l.status === filterStatus) &&
      (filterPriority === "All" || l.priority === filterPriority) &&
      (filterAssignedTo === "All" || l.assignedTo === filterAssignedTo) &&
      (q === "" ||
        l.name?.toLowerCase().includes(q.toLowerCase()) ||
        l.destination?.toLowerCase().includes(q.toLowerCase()) ||
        l.id?.toLowerCase().includes(q.toLowerCase())),
  );

  const sortedLeads = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "name") {
      return dir * String(a.name || "").localeCompare(String(b.name || ""));
    }
    if (sortField === "budget") {
      return dir * ((Number(a.budget) || 0) - (Number(b.budget) || 0));
    }
    const aDate = new Date(a.createdAt || "");
    const bDate = new Date(b.createdAt || "");
    if (aDate < bDate) return -1 * dir;
    if (aDate > bDate) return 1 * dir;
    return 0;
  });

  const addLead = (l: ExtLead) => {
    setLeads((prev) => [l, ...prev]);

    // Explicitly insert into Supabase to guarantee it's saved
    supabase.from("insurance_leads").insert([{
      id: l.id,
      name: l.name,
      phone: l.phone,
      email: l.email,
      whatsapp: l.whatsapp,
      destination: l.destination,
      budget: l.budget,
      status: l.status,
      source: l.source,
      priority: l.priority,
      service: l.service,
      assignedTo: l.assignedTo,
      notes: l.notes,
      insuranceDate: l.insuranceDate,
      expiryDate: l.expiryDate,
      policyType: l.policyType,
      queryType: l.queryType,
      clientCompany: l.clientCompany,
      reference: l.reference,
      leadSection: l.leadSection
    }]).then(({ error }) => {
      if (error) console.error("Explicit insurance lead insert failed:", error);
    });
  };

  const updateStatus = (id: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    setSelected((sel) => (sel ? { ...sel, status } : sel));

    // Explicitly update Supabase to ensure it is saved
    supabase
      .from("insurance_leads")
      .update({ status })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Explicit insurance lead update failed:", error);
      });


  };

  const deleteLead = async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelected(null);
    try {
      await supabase.from("insurance_leads").delete().eq("id", id);
    } catch (err) {
      console.error("Failed to explicitly delete insurance lead:", err);
    }
  };



  /* Stats */
  const totalBudget = genInsuranceLeads.reduce((s, l) => s + (Number(l.budget) || 0), 0);
  const completedLeads = genInsuranceLeads.filter((l) => l.status === "in process" || l.status === "Confirmed" || l.status === "Payment Pending").length;
  const newToday = genInsuranceLeads.filter(
    (l) => l.createdAt === new Date().toISOString().slice(0, 10),
  ).length;
  const conversion = genInsuranceLeads.length > 0 ? Math.round((completedLeads / genInsuranceLeads.length) * 100) : 0;

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">General Insurance Leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track every inquiry from first contact to booked trip.
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl"
                  onClick={() => setIsExportOpen(true)}
                >
                  <Download className="h-4 w-4" /> Export Leads
                </Button>
              </>
            )}
            <Button
              id="add-lead-btn"
              onClick={() => setShowModal(true)}
              className="gap-2 rounded-xl"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Plus className="h-4 w-4" /> Add Leads
            </Button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {[
            {
              label: "Total Leads",
              value: genInsuranceLeads.length,
              icon: <UserCheck className="h-4 w-4" />,
              color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
              sub: `${newToday} added today`,
            },
            {
              label: "Completed",
              value: completedLeads,
              icon: <Sparkles className="h-4 w-4" />,
              color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
              sub: `${conversion}% conversion`,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${s.color}`}>
                  {s.icon}
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold truncate">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Pipeline funnel strip ── */}
        <div className="flex overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          {STATUSES.map((s, i) => {
            const count = genInsuranceLeads.filter((l) => l.status === s).length;
            const pct = genInsuranceLeads.length ? Math.round((count / genInsuranceLeads.length) * 100) : 0;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? "All" : s)}
                className={`flex flex-1 min-w-[90px] flex-col items-center gap-1 border-r border-border px-4 py-4 text-center transition-colors last:border-r-0 hover:bg-secondary/50 ${filterStatus === s ? "bg-secondary" : ""}`}
              >
                <span
                  className={`text-xl font-display font-bold ${filterStatus === s ? "text-primary" : ""}`}
                >
                  {count}
                </span>
                <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${STATUS_DOT[s]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{s}</span>
              </button>
            );
          })}
        </div>

        {/* ── Filter + view toggle ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, destination or ID..."
              className="pl-9 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2 text-sm ml-auto">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="h-9 cursor-pointer appearance-none rounded-full border border-border bg-card text-card-foreground pl-4 pr-9 py-1.5 font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23111827%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as typeof sortField)}
              className="h-9 cursor-pointer appearance-none rounded-full border border-border bg-card text-card-foreground pl-4 pr-9 py-1.5 font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23111827%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="createdAt">Date</option>
              <option value="name">Name</option>
              <option value="budget">Budget</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="h-9 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              {sortDir === "asc" ? "Asc" : "Desc"}
            </button>
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <Table2 className="h-3.5 w-3.5" /> Table
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-l border-border transition-colors ${view === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} leads</span>
        </div>

        {/* ── TABLE VIEW ── */}
        {view === "table" && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 dark:bg-muted/40 border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground select-none">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold text-muted-foreground">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                            Status {filterStatus !== "All" && <span className="bg-primary/10 text-primary dark:bg-primary/20 px-1.5 py-0.5 rounded text-[10px] font-bold">{filterStatus}</span>}
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setFilterStatus("All")}>All</DropdownMenuItem>
                          {STATUSES.map(s => (
                            <DropdownMenuItem key={s} onClick={() => setFilterStatus(s)}>{s}</DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                    <th className="px-4 py-3.5 font-semibold text-muted-foreground">Name</th>
                    <th className="px-4 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Create Date & Time</th>
                    <th className="px-4 py-3.5 font-semibold text-muted-foreground">Gen. Insurance Type</th>
                    <th className="px-4 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Expiry Date</th>
                    <th className="px-4 py-3.5 font-semibold text-muted-foreground">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                            Priority {filterPriority !== "All" && <span className="bg-primary/10 text-primary dark:bg-primary/20 px-1.5 py-0.5 rounded text-[10px] font-bold">{filterPriority}</span>}
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setFilterPriority("All")}>All</DropdownMenuItem>
                          {["High", "Medium", "Low"].map(p => (
                            <DropdownMenuItem key={p} onClick={() => setFilterPriority(p)}>{p}</DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                    <th className="px-4 py-3.5 font-semibold text-muted-foreground">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                            Assigned To {filterAssignedTo !== "All" && <span className="bg-primary/10 text-primary dark:bg-primary/20 px-1.5 py-0.5 rounded text-[10px] font-bold truncate max-w-[80px]">{filterAssignedTo}</span>}
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setFilterAssignedTo("All")}>All</DropdownMenuItem>
                          {assignees.map(a => (
                            <DropdownMenuItem key={a} onClick={() => setFilterAssignedTo(a)}>{a}</DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeads.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">
                        No leads match your filters.
                      </td>
                    </tr>
                  )}
                  {sortedLeads.map((l) => (
                    <React.Fragment key={l.id}>
                      <tr
                        className="border-t border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => setSelected(l)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={l.status}
                            onValueChange={(val: LeadStatus) => {
                              updateStatus(l.id, val);
                            }}
                          >
                            <SelectTrigger className={`inline-flex items-center rounded-sm px-2 py-1 text-xs font-semibold whitespace-nowrap border-none h-auto w-auto focus:ring-0 focus:ring-offset-0 shadow-none [&>svg]:hidden ${STATUS_PILL[l.status]}`}>
                              <SelectValue />
                              <ChevronDown className="h-4 w-4 opacity-50 ml-1" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s} className="text-sm">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="text-sm font-semibold whitespace-nowrap">{l.name}</div>
                          </div>
                          {l.clientCompany && <div className="text-xs text-muted-foreground truncate max-w-[120px] mt-0.5">{l.clientCompany}</div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium">{l.createdAt}</div>
                          <div className="text-xs text-muted-foreground">{l.createdTime || "-"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm max-w-[150px] truncate" title={l.policyType}>{l.policyType || "-"}</div>
                          <div className="text-xs font-semibold text-muted-foreground">{l.queryType || "-"}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium">{l.expiryDate || "-"}</div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={l.priority || "Medium"}
                            onValueChange={(val: "High" | "Medium" | "Low") => {
                              setLeads((prev) => prev.map((lead) => (lead.id === l.id ? { ...lead, priority: val } : lead)));
                              // Explicitly update Supabase
                              supabase.from("insurance_leads").update({ priority: val }).eq("id", l.id).then(({ error }) => {
                                if (error) console.error("Failed to update priority in Supabase:", error);
                              });
                            }}
                          >
                            <SelectTrigger className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap border-none h-auto w-auto focus:ring-0 focus:ring-offset-0 shadow-none [&>svg]:hidden ${PRIORITY_PILL[l.priority || "Medium"] || "bg-secondary text-foreground"}`}>
                              <SelectValue placeholder="-" />
                              <ChevronDown className="h-4 w-4 opacity-50 ml-1" />
                            </SelectTrigger>
                            <SelectContent>
                              {["High", "Medium", "Low"].map((p) => (
                                <SelectItem key={p} value={p} className="text-sm">
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-sm align-top min-w-[140px]">
                          <div className="mb-2 font-semibold text-foreground">{l.assignedTo || "-"}</div>
                          <div className="pl-2.5 border-l-[3px] border-primary/30 dark:border-primary/40 py-0.5 flex flex-col gap-1.5">
                            <div className="flex flex-col gap-2.5 max-h-[54px] overflow-y-auto pr-1 custom-scrollbar">
                              {Array.isArray(l.allNotes) && l.allNotes.length > 0 ? (
                                [...l.allNotes].reverse().map((n, i) => (
                                  <div key={i} className="text-sm text-muted-foreground italic flex flex-wrap items-baseline gap-x-1.5 leading-tight">
                                    <span className="text-muted-foreground/60">•</span>
                                    <span className="text-muted-foreground">{n.text}</span>
                                    {n.date && (
                                      <span className="text-xs text-muted-foreground/60 not-italic ml-0.5">
                                        ({new Date(n.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '')})
                                      </span>
                                    )}
                                  </div>
                                ))
                              ) : l.notes ? (
                                <div className="text-sm text-muted-foreground italic flex flex-wrap items-baseline gap-x-1.5 leading-tight">
                                  <span className="text-muted-foreground/60">•</span>
                                  <span className="text-muted-foreground">{l.notes}</span>
                                  {l.noteDate && (
                                    <span className="text-xs text-muted-foreground/60 not-italic ml-0.5">
                                      ({new Date(l.noteDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '')})
                                    </span>
                                  )}
                                </div>
                              ) : null}
                            </div>
                            {editingTableNoteId === l.id ? (
                              <div className="mt-1 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                                <textarea
                                  autoFocus
                                  value={tableEditNoteText}
                                  onChange={(e) => setTableEditNoteText(e.target.value)}
                                  placeholder="Type your note here..."
                                  rows={2}
                                  className="w-full min-w-[160px] max-w-[200px] resize-none rounded-xl border border-border bg-background px-2.5 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                />
                                <div className="flex gap-2 mt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs rounded-full px-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTableNoteId(null);
                                      setTableEditNoteText("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs rounded-full px-3 text-white"
                                    style={{ background: "var(--gradient-brand)" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (tableEditNoteText.trim()) {
                                        const noteDate = new Date().toISOString();
                                        const newLeads = leads.map((x) => {
                                          if (x.id === l.id) {
                                            let currentNotes = Array.isArray(x.allNotes) ? [...x.allNotes] : [];
                                            if (x.notes && currentNotes.length === 0) {
                                              currentNotes.push({ text: x.notes, date: x.noteDate || new Date().toISOString() });
                                            }
                                            currentNotes.push({ text: tableEditNoteText.trim(), date: noteDate });
                                            const updates = { notes: tableEditNoteText.trim(), noteDate, allNotes: currentNotes };
                                            // Explicitly update Supabase
                                            supabase.from("insurance_leads").update(updates).eq("id", l.id).then(({ error }) => {
                                              if (error) console.error("Failed to update notes in Supabase:", error);
                                            });
                                            return { ...x, ...updates };
                                          }
                                          return x;
                                        });
                                        setLeads(newLeads);
                                      }
                                      setEditingTableNoteId(null);
                                      setTableEditNoteText("");
                                    }}
                                  >
                                    Add Note
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTableNoteId(l.id);
                                  setTableEditNoteText("");
                                }}
                                className="text-sm text-blue-500 hover:text-blue-600 font-medium text-left whitespace-nowrap mt-1 pl-1"
                              >
                                + Add Note
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Table footer */}
            <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {genInsuranceLeads.length} leads
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                Pipeline:{" "}
                <span className="text-primary">
                  {formatINR(filtered.reduce((s, l) => s + (Number(l.budget) || 0), 0))}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ── KANBAN VIEW ── */}
        {view === "kanban" && (
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x w-full">
            {STATUSES.map((s) => (
              <KanbanCol
                key={s}
                status={s}
                leads={sortedLeads.filter((l) => l.status === s)}
                onSelect={setSelected}
                onDropLead={(id) => updateStatus(id, s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ImportLeadsModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImportLeads}
        allowedStatuses={STATUSES}
        allowedPriorities={[" 🔴 High", " 🟡 Medium", " 🟢 Low"]}
        allowedAssignees={assignees}
      />
      {showModal && (
        <AddLeadModal
          existingLeads={leads}
          customers={customers}
          setCustomers={setCustomers}
          onClose={() => setShowModal(false)}
          onAdd={(l) => {
            addLead(l);
            setShowModal(false);
          }}
        />
      )}
      {selected && (
        <LeadDetail
          lead={selected}
          allLeads={leads}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
          onDelete={deleteLead}

          isAdmin={isAdmin}
          assignees={assignees}
          onEditNote={(id, newNote) => {
            const noteDate = new Date().toISOString();
            const newLeads = leads.map((x) => {
              if (x.id === id) {
                let currentNotes = Array.isArray(x.allNotes) ? [...x.allNotes] : [];
                if (x.notes && currentNotes.length === 0) {
                  currentNotes.push({ text: x.notes, date: x.noteDate || new Date().toISOString() });
                }
                currentNotes.push({ text: newNote, date: noteDate });
                const updates = { notes: newNote, noteDate, allNotes: currentNotes };
                // Explicitly update Supabase
                supabase.from("insurance_leads").update(updates).eq("id", id).then(({ error }) => {
                  if (error) console.error("Failed to update notes in Supabase:", error);
                });
                return { ...x, ...updates };
              }
              return x;
            });
            setLeads(newLeads);
            setSelected(newLeads.find((x) => x.id === id) || null);
          }}
          onUpdateLead={(id, updates) => {
            const newLeads = leads.map((x) => (x.id === id ? { ...x, ...updates } : x));
            setLeads(newLeads);
            setSelected(newLeads.find((x) => x.id === id) || null);
            // Explicitly update Supabase
            supabase.from("insurance_leads").update(updates).eq("id", id).then(({ error }) => {
              if (error) console.error("Failed to apply updates to Supabase:", error);
            });
          }}
        />
      )}

      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Leads</DialogTitle>
            <DialogDescription>
              Filter leads by creation date before exporting.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-2">
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

          <div className="grid grid-cols-3 gap-3 py-6">
            <button
              type="button"
              onClick={() => {
                exportToPDF();
                setIsExportOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-600 transition-all text-center group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">PDF Report</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportToExcel();
                setIsExportOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-600 transition-all text-center group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                <Table2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportToWord();
                setIsExportOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 transition-all text-center group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Word (.doc)</span>
            </button>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsExportOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
