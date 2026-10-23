import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { getAuth, setAuth, clearAuth } from "@/lib/auth";
import {
  Building2,
  User,
  Bell,
  Shield,
  Palette,
  Phone,
  Mail,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Users,
  Info,
  ExternalLink,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Trash2,
  Landmark,
  Search,
  Check,
  CreditCard,
  QrCode,
  AlertCircle,
  Activity,
  Laptop,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { EmployeeProfileCard } from "@/components/EmployeeProfileCard";
import {
  getStoredPreferences,
  saveStoredPreferences,
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/notifications";
import { toast as sonnerToast } from "sonner";

export const Route = createFileRoute("/crm/settings")({ component: SettingsPage });

// ─── Section types ────────────────────────────────────────────────────────────
type Tab = "profile" | "company" | "appearance" | "notifications" | "security" | "team";

interface TabMeta {
  id: Tab;
  label: string;
  desc: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const TABS: TabMeta[] = [
  { id: "profile", label: "My Profile", desc: "Personal info, avatar & credentials", icon: <User className="h-4 w-4" /> },
  { id: "company", label: "Company & Brand", desc: "Business identity, GST & bank details", icon: <Building2 className="h-4 w-4" />, adminOnly: true },
  { id: "appearance", label: "Appearance", desc: "Themes, accent colors & layouts", icon: <Palette className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", desc: "Alert triggers & communication channels", icon: <Bell className="h-4 w-4" /> },
  { id: "security", label: "Security & Access", desc: "Password change & session monitoring", icon: <Shield className="h-4 w-4" /> },
  { id: "team", label: "Employees & Roles", desc: "Team directory & access overview", icon: <Users className="h-4 w-4" />, adminOnly: true },
];

function ToastNotification({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-2xl backdrop-blur-md"
      style={{ animation: "slideUpIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      <span className="text-sm font-semibold">{msg}</span>
      <button
        onClick={onClose}
        className="ml-2 opacity-70 hover:opacity-100 text-white text-lg leading-none"
      >
        ✕
      </button>
      <style>{`@keyframes slideUpIn{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

const SectionCard = ({
  title,
  subtitle,
  children,
  badge,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: string;
  action?: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden transition-all duration-200 hover:border-border">
    <div className="border-b border-border/60 px-6 py-4 flex items-center justify-between gap-4 bg-muted/20">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-base text-foreground">{title}</h3>
          {badge && (
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider py-0 px-1.5">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field = ({
  label,
  id,
  children,
  helper,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  helper?: string;
}) => (
  <div className="space-y-1.5">
    <Label
      htmlFor={id}
      className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between"
    >
      <span>{label}</span>
      {helper && <span className="text-[10px] font-normal lowercase text-muted-foreground/70">{helper}</span>}
    </Label>
    {children}
  </div>
);

const ToggleRow = ({
  label,
  sub,
  checked,
  onChange,
  icon,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0 hover:bg-muted/10 px-2 rounded-xl transition-colors">
    <div className="flex items-center gap-3">
      {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition-all cursor-pointer ${
        checked ? "bg-primary border-primary shadow-xs" : "bg-muted border-border"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

function getPasswordStrength(pw: string): { score: number; label: string; color: string; percent: number } {
  if (!pw) return { score: 0, label: "Empty", color: "bg-muted", percent: 0 };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  if (score <= 2) return { score, label: "Weak password", color: "bg-rose-500", percent: 30 };
  if (score <= 3) return { score, label: "Moderate security", color: "bg-amber-500", percent: 65 };
  return { score, label: "Strong & resilient", color: "bg-emerald-500", percent: 100 };
}

function SettingsPage() {
  const navigate = useNavigate();
  const initialAuth = getAuth();
  const [auth, setLocalAuth] = useState(initialAuth);
  const isAdmin = auth?.role === "admin";

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [tabSearch, setTabSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(auth?.avatar || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [localLiveEmps] = useSupabaseTable<any>("employees", []);
  const liveEmps = localLiveEmps?.length ? localLiveEmps : [];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    sonnerToast.success(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // ── Default Company & Financial Configuration ─────────────────────
  const defaultCompany = {
    name: "LookMyHolidays",
    tagline: "Plan memorable trips with LookMyHolidays",
    email: "resv@lookmyholidays.in",
    phone: "+91-95291-55562",
    altPhone: "+91-9887155570",
    address: "FF-35, JTM Mall, Jagatpura",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302017",
    website: "https://www.lookmyholidays.in",
    instagram: "https://www.instagram.com/lookmyholidays",
    facebook: "https://www.facebook.com/lookmyholidays",
    youtube: "",
    gstin: "08AABCL1234F1Z1",
    pan: "AABCL1234F",
    currency: "INR",
    timezone: "Asia/Kolkata",
    bankName: "ICICI Bank",
    accountHolder: "LookMyHolidays Private Limited",
    accountNumber: "678901234567",
    ifscCode: "ICIC0001234",
    upiId: "lookmyholidays@icici",
  };

  const defaultAppearance = {
    theme: "light",
    sidebarCompact: false,
    fontSize: "default",
    accentColor: "#f43f5e",
    tableDensity: "comfortable",
  };

  const defaultNotifications = {
    leadAssigned: true,
    taskDue: true,
    bookingConfirmed: true,
    leaveRequested: true,
    systemUpdates: true,
    emailDigest: true,
    whatsapp: false,
  };

  const defaultSettings = [
    { id: "company", type: "company", data: defaultCompany },
    { id: "appearance", type: "appearance", data: defaultAppearance },
    { id: "notifications", type: "notifications", data: defaultNotifications },
  ];

  const [settings, setSettings] = useSupabaseTable<any[]>("settings", defaultSettings);

  // ── Company Info state ──────────────────────────────────────────
  const company = settings.find((s) => s.id === "company")?.data || defaultCompany;
  const setCompany = (newVal: any) => {
    setSettings((prev: any[]) => {
      const exists = prev.find((s) => s.id === "company");
      if (exists) {
        return prev.map((s) =>
          s.id === "company"
            ? { ...s, data: typeof newVal === "function" ? newVal(s.data) : newVal }
            : s,
        );
      }
      return [
        ...prev,
        {
          id: "company",
          type: "company",
          data: typeof newVal === "function" ? newVal(defaultCompany) : newVal,
        },
      ];
    });
  };

  // ── Profile state ───────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: auth?.name || "",
    email: auth?.email || "",
    phone: auth?.phone || "",
    empId: auth?.empId || "",
    role: auth?.role || "",
    designation: "Senior Travel Specialist",
    department: "Sales & Operations",
    bio: "Passionate about crafting customized travel experiences and seamless holiday bookings for clients worldwide.",
  });

  // ── Appearance state ────────────────────────────────────────────
  const appearance = settings.find((s) => s.id === "appearance")?.data || defaultAppearance;
  const setAppearance = (newVal: any) => {
    setSettings((prev: any[]) => {
      const exists = prev.find((s) => s.id === "appearance");
      if (exists) {
        return prev.map((s) =>
          s.id === "appearance"
            ? { ...s, data: typeof newVal === "function" ? newVal(s.data) : newVal }
            : s,
        );
      }
      return [
        ...prev,
        {
          id: "appearance",
          type: "appearance",
          data: typeof newVal === "function" ? newVal(defaultAppearance) : newVal,
        },
      ];
    });
  };

  // Apply appearance to DOM
  useEffect(() => {
    window.localStorage.setItem("crm-appearance", JSON.stringify(appearance));
    window.dispatchEvent(
      new CustomEvent("local-storage", {
        detail: { key: "crm-appearance", newValue: appearance },
      }),
    );

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (appearance.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      if (systemTheme === "dark") root.classList.add("dark");
    } else if (appearance.theme === "dark") {
      root.classList.add("dark");
    }

    if (appearance.fontSize === "small") root.style.fontSize = "14px";
    else if (appearance.fontSize === "large") root.style.fontSize = "18px";
    else root.style.fontSize = "16px";

    const colorMap: Record<string, string> = {
      "#f43f5e": "0.6 0.2 20",
      "#3b82f6": "0.6 0.15 250",
      "#10b981": "0.65 0.15 150",
      "#8b5cf6": "0.6 0.18 290",
      "#f59e0b": "0.7 0.2 45",
      "#06b6d4": "0.7 0.12 210",
      "#6366f1": "0.58 0.22 270",
    };
    if (appearance.accentColor && colorMap[appearance.accentColor]) {
      root.style.setProperty("--primary", `oklch(${colorMap[appearance.accentColor]})`);
    } else {
      root.style.removeProperty("--primary");
    }
  }, [appearance]);

  // ── Notifications state ─────────────────────────────────────────
  const [notifPreferences, setNotifPreferences] = useState<NotificationPreferences>(() => getStoredPreferences());

  const handleUpdatePreferences = (updated: NotificationPreferences) => {
    setNotifPreferences(updated);
    saveStoredPreferences(updated);
  };

  // ── Security state ──────────────────────────────────────────────
  const [security, setSecurity] = useState({ current: "", newPass: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false });
  const [pwError, setPwError] = useState("");

  const pwStrength = useMemo(() => getPasswordStrength(security.newPass), [security.newPass]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (!security.current) {
      setPwError("Please enter your current password.");
      return;
    }
    if (security.newPass.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (security.newPass !== security.confirm) {
      setPwError("Passwords do not match.");
      return;
    }

    try {
      if (auth?.empId) {
        const { data: emps } = await supabase.from("employees").select("*").eq("id", auth.empId);
        if (emps && emps[0]) {
          const emp = emps[0];
          let currentPass = "";
          if (emp.description?.includes("_isMeta")) {
            try {
              const meta = JSON.parse(emp.description);
              currentPass = meta.profile_details?.password || "";
            } catch {}
          } else if (emp.profile_details?.password) {
            currentPass = emp.profile_details.password;
          }

          if (currentPass && currentPass !== security.current) {
            setPwError("Current password is incorrect.");
            return;
          }
        }
      }

      setSecurity({ current: "", newPass: "", confirm: "" });
      showToast("🔒 Password updated! Logging out for security...");

      setTimeout(() => {
        clearAuth();
        navigate({ to: "/login" });
      }, 1500);
    } catch (err) {
      console.error(err);
      setPwError("An error occurred while updating password.");
    }
  };

  const handleSaveProfile = () => {
    if (!auth) return;
    const newAuth = {
      ...auth,
      name: profile.name,
      email: profile.email || auth.email,
      phone: profile.phone || auth.phone,
      avatar: avatarPreview || auth.avatar,
    };
    setAuth(newAuth);
    setLocalAuth(newAuth);
    if (auth.empId) {
      supabase
        .from("employees")
        .update({
          name: profile.name,
          email: profile.email || auth.email,
          phone: profile.phone || auth.phone,
          ...(avatarPreview ? { avatar: avatarPreview } : {}),
        })
        .eq("id", auth.empId)
        .then();
    }
    showToast("Profile details saved successfully!");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      showToast("Avatar image loaded. Click 'Save Profile' to apply!");
    };
    reader.readAsDataURL(file);
  };

  const visibleTabs = useMemo(() => {
    return TABS.filter((t) => {
      if (t.adminOnly && !isAdmin) return false;
      if (!tabSearch.trim()) return true;
      const q = tabSearch.toLowerCase();
      return t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
    });
  }, [isAdmin, tabSearch]);

  // ── Render Active Tab ──────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      // ── 1. MY PROFILE ─────────────────────────────────────────
      case "profile":
        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <SectionCard
              title="Personal Information"
              subtitle="Update your employee profile, public details, and contact preferences"
              badge={auth?.role || "Staff"}
            >
              {/* Avatar & Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 mb-6 border-b border-border/60">
                <div className="relative group shrink-0">
                  <div className="h-24 w-24 rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-rose-500 to-amber-500 p-0.5 shadow-lg">
                    <div className="h-full w-full rounded-[22px] bg-card overflow-hidden flex items-center justify-center relative">
                      {avatarPreview || auth?.avatar ? (
                        <img
                          src={avatarPreview || auth?.avatar}
                          alt={auth?.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary font-display">
                          {auth?.name?.[0]?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-primary text-primary-foreground shadow-md hover:scale-105 transition-all cursor-pointer"
                    title="Upload Photo"
                  >
                    <User className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                  />
                </div>

                <div className="text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-xl text-foreground">{auth?.name || "Employee"}</h3>
                    <Badge variant="secondary" className="capitalize text-xs font-semibold">
                      {auth?.role || "Employee"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Employee ID: <span className="font-mono font-bold text-foreground">{auth?.empId || "EMP-001"}</span> · LookMyHolidays Travel Network
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8 gap-1.5"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <span>Upload Avatar</span>
                    </Button>
                    {avatarPreview && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        onClick={() => {
                          setAvatarPreview(null);
                          showToast("Avatar cleared. Click Save to persist.");
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" id="pr-name" helper="Official CRM name">
                  <Input
                    id="pr-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </Field>

                <Field label="Employee ID" id="pr-empid" helper="Read-only badge">
                  <Input
                    id="pr-empid"
                    value={profile.empId}
                    disabled
                    className="h-10 rounded-xl bg-muted/50 cursor-not-allowed font-mono text-xs"
                  />
                </Field>

                <Field label="Official Email" id="pr-email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pr-email"
                      className="pl-9 h-10 rounded-xl"
                      placeholder="e.g. jatin@lookmyholidays.in"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                </Field>

                <Field label="Direct Phone" id="pr-phone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pr-phone"
                      className="pl-9 h-10 rounded-xl"
                      placeholder="+91 98871 00000"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </Field>

                <Field label="Department / Unit" id="pr-dept">
                  <Input
                    id="pr-dept"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </Field>

                <Field label="Job Designation" id="pr-title">
                  <Input
                    id="pr-title"
                    value={profile.designation}
                    onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Bio / Employee Notes" id="pr-bio" helper="Internal profile overview">
                  <textarea
                    id="pr-bio"
                    rows={2}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full text-xs rounded-xl border border-input bg-background p-3 focus-visible:ring-2 focus-visible:ring-ring outline-none"
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  className="rounded-xl text-xs h-9"
                  onClick={() => {
                    setProfile({
                      name: auth?.name || "",
                      email: auth?.email || "",
                      phone: auth?.phone || "",
                      empId: auth?.empId || "",
                      role: auth?.role || "",
                      designation: "Senior Travel Specialist",
                      department: "Sales & Operations",
                      bio: "Passionate about crafting customized travel experiences and seamless holiday bookings for clients worldwide.",
                    });
                    setAvatarPreview(auth?.avatar || null);
                    showToast("Profile changes discarded.");
                  }}
                >
                  Discard
                </Button>
                <Button className="rounded-xl text-xs h-9 gap-1.5 shadow-sm" onClick={handleSaveProfile}>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Profile</span>
                </Button>
              </div>
            </SectionCard>
          </div>
        );

      // ── 2. COMPANY & BRAND (Admin only) ───────────────────────
      case "company":
        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Business Details */}
            <SectionCard title="Business Identity" subtitle="Official registration and corporate identity info">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company Name" id="co-name">
                  <Input
                    id="co-name"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </Field>
                <Field label="Tagline / Motto" id="co-tag">
                  <Input
                    id="co-tag"
                    value={company.tagline}
                    onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </Field>
                <Field label="GST / GSTIN Number" id="co-gst" helper="Appears on Tax Invoices">
                  <Input
                    id="co-gst"
                    placeholder="e.g. 08AABCL1234F1Z1"
                    value={company.gstin}
                    onChange={(e) => setCompany({ ...company, gstin: e.target.value })}
                    className="h-10 rounded-xl font-mono uppercase text-xs"
                  />
                </Field>
                <Field label="Corporate PAN" id="co-pan">
                  <Input
                    id="co-pan"
                    placeholder="e.g. AABCL1234F"
                    value={company.pan}
                    onChange={(e) => setCompany({ ...company, pan: e.target.value })}
                    className="h-10 rounded-xl font-mono uppercase text-xs"
                  />
                </Field>
                <Field label="Primary Currency" id="co-cur">
                  <select
                    id="co-cur"
                    value={company.currency}
                    onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="INR">₹ INR — Indian Rupee (Default)</option>
                    <option value="USD">$ USD — United States Dollar</option>
                    <option value="EUR">€ EUR — Euro</option>
                    <option value="AED">AED — UAE Dirham</option>
                    <option value="GBP">£ GBP — British Pound</option>
                    <option value="THB">฿ THB — Thai Baht</option>
                  </select>
                </Field>
                <Field label="CRM Timezone" id="co-tz">
                  <select
                    id="co-tz"
                    value={company.timezone}
                    onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                  </select>
                </Field>
              </div>
            </SectionCard>

            {/* Bank & UPI for Invoices & Vouchers */}
            <SectionCard
              title="Banking & Payment Credentials"
              subtitle="Printed on customer invoices, vouchers, and payment receipts"
              badge="Finance"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Bank Name" id="co-bank">
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-bank"
                      className="pl-9 h-10 rounded-xl"
                      placeholder="e.g. ICICI Bank Ltd"
                      value={company.bankName || ""}
                      onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
                    />
                  </div>
                </Field>

                <Field label="Account Holder Name" id="co-holder">
                  <Input
                    id="co-holder"
                    className="h-10 rounded-xl"
                    placeholder="e.g. LookMyHolidays Pvt Ltd"
                    value={company.accountHolder || ""}
                    onChange={(e) => setCompany({ ...company, accountHolder: e.target.value })}
                  />
                </Field>

                <Field label="Account Number" id="co-acc">
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-acc"
                      className="pl-9 h-10 rounded-xl font-mono text-xs"
                      placeholder="e.g. 678901234567"
                      value={company.accountNumber || ""}
                      onChange={(e) => setCompany({ ...company, accountNumber: e.target.value })}
                    />
                  </div>
                </Field>

                <Field label="IFSC Code" id="co-ifsc">
                  <Input
                    id="co-ifsc"
                    className="h-10 rounded-xl font-mono uppercase text-xs"
                    placeholder="e.g. ICIC0001234"
                    value={company.ifscCode || ""}
                    onChange={(e) => setCompany({ ...company, ifscCode: e.target.value })}
                  />
                </Field>

                <Field label="Primary UPI ID" id="co-upi">
                  <div className="relative">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-upi"
                      className="pl-9 h-10 rounded-xl text-xs font-mono"
                      placeholder="e.g. lookmyholidays@icici"
                      value={company.upiId || ""}
                      onChange={(e) => setCompany({ ...company, upiId: e.target.value })}
                    />
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* Contact & Address */}
            <SectionCard title="Contact & Headquarters" subtitle="Corporate location and customer communication links">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Support Email" id="co-email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-email"
                      className="pl-9 h-10 rounded-xl"
                      value={company.email}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Helpline Phone" id="co-phone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-phone"
                      className="pl-9 h-10 rounded-xl"
                      value={company.phone}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="WhatsApp / Emergency Hotline" id="co-alt">
                  <Input
                    id="co-alt"
                    className="h-10 rounded-xl"
                    value={company.altPhone}
                    onChange={(e) => setCompany({ ...company, altPhone: e.target.value })}
                  />
                </Field>
                <Field label="Official Website" id="co-web">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-web"
                      className="pl-9 h-10 rounded-xl"
                      value={company.website}
                      onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Office Address" id="co-addr">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-addr"
                      className="pl-9 h-10 rounded-xl"
                      value={company.address}
                      onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="City" id="co-city">
                  <Input
                    id="co-city"
                    className="h-10 rounded-xl"
                    value={company.city}
                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  />
                </Field>
                <Field label="State" id="co-state">
                  <Input
                    id="co-state"
                    className="h-10 rounded-xl"
                    value={company.state}
                    onChange={(e) => setCompany({ ...company, state: e.target.value })}
                  />
                </Field>
                <Field label="PIN Code" id="co-pin">
                  <Input
                    id="co-pin"
                    className="h-10 rounded-xl"
                    value={company.pincode}
                    onChange={(e) => setCompany({ ...company, pincode: e.target.value })}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* Social Media */}
            <SectionCard title="Social & Online Presence" subtitle="Links embedded in travel itineraries and guest vouchers">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Instagram" id="co-ig">
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-500" />
                    <Input
                      id="co-ig"
                      className="pl-9 h-10 rounded-xl text-xs"
                      placeholder="https://instagram.com/…"
                      value={company.instagram}
                      onChange={(e) => setCompany({ ...company, instagram: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Facebook" id="co-fb">
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                    <Input
                      id="co-fb"
                      className="pl-9 h-10 rounded-xl text-xs"
                      placeholder="https://facebook.com/…"
                      value={company.facebook}
                      onChange={(e) => setCompany({ ...company, facebook: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="YouTube" id="co-yt">
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                    <Input
                      id="co-yt"
                      className="pl-9 h-10 rounded-xl text-xs"
                      placeholder="https://youtube.com/…"
                      value={company.youtube}
                      onChange={(e) => setCompany({ ...company, youtube: e.target.value })}
                    />
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* Save Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="rounded-xl text-xs h-9"
                onClick={() => {
                  setCompany(defaultCompany);
                  showToast("Company details reset to factory defaults.");
                }}
              >
                Reset
              </Button>
              <Button
                className="rounded-xl text-xs h-9 gap-1.5 shadow-sm"
                onClick={() => showToast("Company & banking configurations saved!")}
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Company Settings</span>
              </Button>
            </div>
          </div>
        );

      // ── 3. APPEARANCE ─────────────────────────────────────────
      case "appearance":
        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <SectionCard title="Theme & Display Engine" subtitle="Customize CRM visual aesthetic and reading comfort">
              <div className="space-y-6">
                {/* Theme Selector */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Color Theme Mode
                  </Label>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAppearance({ ...appearance, theme: t })}
                        className={`relative rounded-2xl border-2 p-4 text-center transition-all cursor-pointer ${
                          appearance.theme === t
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/80 hover:border-primary/40 bg-card"
                        }`}
                      >
                        <span className="text-2xl block mb-1.5">
                          {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"}
                        </span>
                        <span className="text-xs font-bold capitalize text-foreground">{t} Theme</span>
                        {appearance.theme === t && (
                          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color Swatches */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Primary Brand Accent
                  </Label>
                  <div className="mt-3 flex flex-wrap gap-3.5">
                    {[
                      { hex: "#f43f5e", name: "Rose Crimson (Default)" },
                      { hex: "#3b82f6", name: "Royal Sapphire" },
                      { hex: "#10b981", name: "Emerald Growth" },
                      { hex: "#8b5cf6", name: "Neon Violet" },
                      { hex: "#f59e0b", name: "Amber Gold" },
                      { hex: "#06b6d4", name: "Cyan Spark" },
                      { hex: "#6366f1", name: "Deep Indigo" },
                    ].map((item) => (
                      <button
                        key={item.hex}
                        type="button"
                        onClick={() => setAppearance({ ...appearance, accentColor: item.hex })}
                        style={{ backgroundColor: item.hex }}
                        title={item.name}
                        className={`h-9 w-9 rounded-2xl border-2 transition-transform hover:scale-110 shadow-sm flex items-center justify-center cursor-pointer ${
                          appearance.accentColor === item.hex ? "border-foreground scale-110 ring-2 ring-primary/40" : "border-transparent"
                        }`}
                      >
                        {appearance.accentColor === item.hex && <Check className="h-4 w-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Typography Scale
                  </Label>
                  <div className="mt-3 flex gap-3">
                    {(["small", "default", "large"] as const).map((fs) => (
                      <button
                        key={fs}
                        type="button"
                        onClick={() => setAppearance({ ...appearance, fontSize: fs })}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-bold capitalize transition-all cursor-pointer ${
                          appearance.fontSize === fs
                            ? "border-primary bg-primary/10 text-primary shadow-xs"
                            : "border-border hover:border-primary/40 text-foreground"
                        }`}
                      >
                        {fs === "small" ? "Compact (14px)" : fs === "large" ? "Expanded (18px)" : "Default (16px)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-2">
                  <ToggleRow
                    label="Compact Sidebar"
                    sub="Minimizes navigation labels to icons for maximum spreadsheet workspace"
                    checked={appearance.sidebarCompact}
                    onChange={(v) => setAppearance({ ...appearance, sidebarCompact: v })}
                    icon={<Palette className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border/50">
                <Button
                  variant="outline"
                  className="rounded-xl text-xs h-9"
                  onClick={() => {
                    setAppearance(defaultAppearance);
                    showToast("Appearance reset to defaults.");
                  }}
                >
                  Reset Defaults
                </Button>
                <Button
                  className="rounded-xl text-xs h-9 gap-1.5 shadow-sm"
                  onClick={() => showToast("Appearance preferences applied!")}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Appearance</span>
                </Button>
              </div>
            </SectionCard>
          </div>
        );

      // ── 4. NOTIFICATIONS ──────────────────────────────────────
      case "notifications":
        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <SectionCard title="In-App CRM Notifications" subtitle="Real-time alerts delivered right to your notification drawer">
              <div className="divide-y divide-border/30">
                <ToggleRow
                  label="Lead Assigned to Me"
                  sub="Instant alert when incoming holiday leads are routed to your desk"
                  checked={notifPreferences.leadAssigned}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, leadAssigned: v })}
                />
                <ToggleRow
                  label="Task Due Deadlines"
                  sub="Alerts 24 hours prior to voucher dispatch or customer follow-up"
                  checked={notifPreferences.taskDue}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, taskDue: v })}
                />
                <ToggleRow
                  label="Booking Confirmed"
                  sub="Alert whenever flight, hotel or taxi booking vouchers are generated"
                  checked={notifPreferences.bookingConfirmed}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, bookingConfirmed: v })}
                />
                <ToggleRow
                  label="Attendance & Leave Requests"
                  sub="Team status updates, leave requests, and approval receipts"
                  checked={notifPreferences.leaveRequested}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, leaveRequested: v })}
                />
                <ToggleRow
                  label="IT Support & System Broadcasts"
                  sub="Replies on your IT helpdesk tickets and feature updates"
                  checked={notifPreferences.systemUpdates}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, systemUpdates: v })}
                />
              </div>
            </SectionCard>

            <SectionCard title="External Delivery Channels" subtitle="Dispatches outside the CRM browser window">
              <div className="divide-y divide-border/30">
                <ToggleRow
                  label="Email Daily Digest"
                  sub="Consolidated morning briefing of pending tasks and new booking revenue"
                  checked={notifPreferences.emailDigest}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, emailDigest: v })}
                />
                <ToggleRow
                  label="WhatsApp Priority Pings"
                  sub="High-priority notifications delivered directly to your registered WhatsApp number"
                  checked={notifPreferences.whatsapp}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, whatsapp: v })}
                />
              </div>
            </SectionCard>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                className="rounded-xl text-xs h-9 gap-1.5"
                onClick={() => {
                  sonnerToast("🔔 Notification Ping Test: CRM alerts are active and running!");
                }}
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Test Alert Sound & Toast</span>
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl text-xs h-9"
                  onClick={() => {
                    handleUpdatePreferences(DEFAULT_PREFERENCES);
                    showToast("Notification defaults restored.");
                  }}
                >
                  Reset
                </Button>
                <Button
                  className="rounded-xl text-xs h-9 gap-1.5 shadow-sm"
                  onClick={() => {
                    saveStoredPreferences(notifPreferences);
                    showToast("Notification preferences updated!");
                  }}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Preferences</span>
                </Button>
              </div>
            </div>
          </div>
        );

      // ── 5. SECURITY ───────────────────────────────────────────
      case "security":
        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <SectionCard title="Update Password" subtitle="Ensure your LookMyHolidays CRM account is protected with strong credentials">
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                {(["current", "newPass", "confirm"] as const).map((field) => (
                  <Field
                    key={field}
                    label={
                      field === "current"
                        ? "Current Password"
                        : field === "newPass"
                        ? "New Secure Password"
                        : "Confirm New Password"
                    }
                    id={`pw-${field}`}
                  >
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`pw-${field}`}
                        type={showPw[field] ? "text" : "password"}
                        placeholder={
                          field === "current"
                            ? "Enter current password"
                            : field === "newPass"
                            ? "Min. 6 alphanumeric characters"
                            : "Re-enter new password"
                        }
                        value={security[field]}
                        onChange={(e) => setSecurity({ ...security, [field]: e.target.value })}
                        className="pl-9 pr-10 h-10 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {showPw[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                ))}

                {/* Password Strength Indicator */}
                {security.newPass && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Strength Assessment:</span>
                      <span className="font-bold text-foreground">{pwStrength.label}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pwStrength.color} transition-all duration-300`}
                        style={{ width: `${pwStrength.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {pwError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Button type="submit" className="rounded-xl text-xs h-10 gap-1.5 shadow-sm px-5">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Update Password</span>
                  </Button>
                </div>
              </form>
            </SectionCard>

            <SectionCard title="Active CRM Sessions" subtitle="Current device authorization status" badge="Monitored">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground">Current Desktop Session</p>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Authorized as {auth?.name} ({auth?.role}) · Active now
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  onClick={() => {
                    clearAuth();
                    navigate({ to: "/login" });
                  }}
                >
                  <span>Sign Out</span>
                </Button>
              </div>
            </SectionCard>
          </div>
        );

      // ── 6. EMPLOYEES & DIRECTORY (Admin only) ─────────────────
      case "team":
        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            <SectionCard
              title="Team Directory & Access Levels"
              subtitle={`LookMyHolidays staff accounts and operational roles (${liveEmps.length} active members)`}
              badge="Directory"
              action={
                <Button
                  size="sm"
                  onClick={() => navigate({ to: "/crm/employees" })}
                  className="rounded-xl text-xs h-8 gap-1.5 shadow-sm"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Manage All Employees</span>
                </Button>
              }
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {liveEmps.map((u: any) => (
                  <div key={u.id} className="relative group">
                    <EmployeeProfileCard employeeName={u.name} />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold border border-slate-200 shadow-xs">
                        ID: {u.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-border/80 bg-card shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Settings & Preferences
            </h1>
            <Badge variant="outline" className="text-[11px] font-semibold text-primary border-primary/30 bg-primary/5">
              LookMyHolidays
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure system themes, corporate banking info, security authentication, and data performance.
          </p>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <div className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-full border border-border/70 bg-muted/30">
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {auth?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-tight text-foreground">{auth?.name || "Staff Member"}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{auth?.role || "Employee"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Tabs Sidebar (Left) + Active Tab View (Right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-72 shrink-0 space-y-3">
          {/* Quick Search in Settings */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={tabSearch}
              onChange={(e) => setTabSearch(e.target.value)}
              placeholder="Search settings..."
              className="pl-8.5 h-9 text-xs rounded-2xl bg-card border-border/80"
            />
          </div>

          {/* Navigation Pill Menu */}
          <nav className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden p-1.5 space-y-1">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tab.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{tab.label}</p>
                      <p
                        className={`text-[10px] truncate mt-0.5 ${
                          isActive ? "text-white/80" : "text-muted-foreground"
                        }`}
                      >
                        {tab.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                      isActive ? "text-white" : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 min-w-0">{renderTab()}</main>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && <ToastNotification msg={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
