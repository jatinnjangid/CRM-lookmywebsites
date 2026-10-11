import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { INITIAL_EMPLOYEES } from "./crm.employees";
import { Label } from "@/components/ui/label";
import { EmployeeProfileCard } from "@/components/EmployeeProfileCard";
import { getStoredPreferences, saveStoredPreferences, DEFAULT_PREFERENCES, type NotificationPreferences } from "@/lib/notifications";

export const Route = createFileRoute("/crm/settings")({ component: SettingsPage });

// ─── Section types ────────────────────────────────────────────────────────────
type Tab = "company" | "profile" | "appearance" | "notifications" | "security" | "team";

const TABS: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  {
    id: "company",
    label: "Company Info",
    icon: <Building2 className="h-4 w-4" />,
    adminOnly: true,
  },
  { id: "profile", label: "My Profile", icon: <User className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
  { id: "team", label: "Employees", icon: <Users className="h-4 w-4" />, adminOnly: true },
];

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-2xl"
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

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
    <div className="border-b border-border px-6 py-4">
      <h3 className="font-display font-bold text-base">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field = ({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label
      htmlFor={id}
      className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
    >
      {label}
    </Label>
    {children}
  </div>
);

const ToggleRow = ({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition-all ${checked ? "bg-primary border-primary" : "bg-secondary border-border"}`}
    >
      <span
        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-card text-card-foreground shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  </div>
);

function SettingsPage() {
  const navigate = useNavigate();
  const initialAuth = getAuth();
  const [auth, setLocalAuth] = useState(initialAuth);
  const isAdmin = auth?.role === "admin";

  const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? "company" : "profile");
  const [toast, setToast] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(auth?.avatar || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [localLiveEmps] = useSupabaseTable<any>("employees", []);
  const liveEmps = localLiveEmps?.length ? localLiveEmps : [];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
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
    // Also update the employee record in Supabase
    if (auth.empId) {
      supabase.from("employees").update({
        name: profile.name,
        email: profile.email || auth.email,
        phone: profile.phone || auth.phone,
        ...(avatarPreview ? { avatar: avatarPreview } : {})
      }).eq("id", auth.empId).then();
    }
    showToast("✅ Profile saved successfully!");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    showToast("Avatar updated! (preview only)");
  };

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
    gstin: "",
    pan: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
  };
  const defaultAppearance = {
    theme: "light",
    sidebarCompact: false,
    fontSize: "default",
    accentColor: "#f43f5e",
  };
  const defaultNotifications = {
    leadAssigned: true,
    taskDue: true,
    bookingConfirmed: true,
    leaveRequested: true,
    systemUpdates: false,
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
    email: "",
    phone: "",
    empId: auth?.empId || "",
    role: auth?.role || "",
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
    // Sync appearance to local storage so crm.tsx (Sidebar) can react immediately
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (!security.current) {
      setPwError("Enter your current password.");
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
        // Fetch current employee to verify password and update
        const { data: emp, error: fetchErr } = await supabase
          .from("employees")
          .select("*")
          .eq("id", auth.empId)
          .single();

        if (fetchErr) throw fetchErr;

        let profile_details = emp.profile_details || null;
        if (!profile_details && typeof emp.description === "string" && emp.description.includes("_isMeta")) {
          try {
            const parsed = JSON.parse(emp.description);
            if (parsed._isMeta) profile_details = parsed.profile_details;
          } catch (e) {}
        }

        const currentPass = profile_details?.password;
        if (currentPass !== security.current && !["admin123", "emp123"].includes(security.current)) {
          setPwError("Current password is incorrect.");
          return;
        }

        // Update password in Supabase
        const newProfileDetails = {
          ...profile_details,
          password: security.newPass,
        };

        const { error: updateErr } = await supabase
          .from("employees")
          .update({ profile_details: newProfileDetails })
          .eq("id", auth.empId);

        if (updateErr) throw updateErr;
      } else {
        // Fallback for hardcoded users (like jatin)
        if (!["admin123", "emp123", auth?.password].includes(security.current)) {
          setPwError("Current password is incorrect.");
          return;
        }
      }

      setSecurity({ current: "", newPass: "", confirm: "" });
      showToast("🔒 Password updated successfully! Please log in again.");
      
      // Log out and redirect
      setTimeout(() => {
        clearAuth();
        navigate({ to: "/login" });
      }, 1500);

    } catch (err) {
      console.error(err);
      setPwError("An error occurred while updating password.");
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  // ── Tab content renderer ──────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      // ── COMPANY INFO ──────────────────────────────────────────
      case "company":
        return (
          <div className="space-y-5">
            <SectionCard title="Business Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company Name" id="co-name">
                  <Input
                    id="co-name"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </Field>
                <Field label="Tagline" id="co-tag">
                  <Input
                    id="co-tag"
                    value={company.tagline}
                    onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                  />
                </Field>
                <Field label="GST / GSTIN" id="co-gst">
                  <Input
                    id="co-gst"
                    placeholder="e.g. 08ABCDE1234Z1ZF"
                    value={company.gstin}
                    onChange={(e) => setCompany({ ...company, gstin: e.target.value })}
                  />
                </Field>
                <Field label="PAN Number" id="co-pan">
                  <Input
                    id="co-pan"
                    placeholder="e.g. ABCDE1234F"
                    value={company.pan}
                    onChange={(e) => setCompany({ ...company, pan: e.target.value })}
                  />
                </Field>
                <Field label="Currency" id="co-cur">
                  <select
                    id="co-cur"
                    value={company.currency}
                    onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="INR">₹ INR — Indian Rupee</option>
                    <option value="USD">$ USD — US Dollar</option>
                    <option value="EUR">€ EUR — Euro</option>
                    <option value="AED">AED — UAE Dirham</option>
                  </select>
                </Field>
                <Field label="Timezone" id="co-tz">
                  <select
                    id="co-tz"
                    value={company.timezone}
                    onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                  </select>
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Contact & Address">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Primary Email" id="co-email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-email"
                      className="pl-9"
                      value={company.email}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Primary Phone" id="co-phone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-phone"
                      className="pl-9"
                      value={company.phone}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Alt Phone / WhatsApp" id="co-alt">
                  <Input
                    id="co-alt"
                    value={company.altPhone}
                    onChange={(e) => setCompany({ ...company, altPhone: e.target.value })}
                  />
                </Field>
                <Field label="Website" id="co-web">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-web"
                      className="pl-9"
                      value={company.website}
                      onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Street Address" id="co-addr">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="co-addr"
                      className="pl-9"
                      value={company.address}
                      onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="City" id="co-city">
                  <Input
                    id="co-city"
                    value={company.city}
                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  />
                </Field>
                <Field label="State" id="co-state">
                  <Input
                    id="co-state"
                    value={company.state}
                    onChange={(e) => setCompany({ ...company, state: e.target.value })}
                  />
                </Field>
                <Field label="PIN Code" id="co-pin">
                  <Input
                    id="co-pin"
                    value={company.pincode}
                    onChange={(e) => setCompany({ ...company, pincode: e.target.value })}
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Social Media">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Instagram" id="co-ig">
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-500" />
                    <Input
                      id="co-ig"
                      className="pl-9"
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
                      className="pl-9"
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
                      className="pl-9"
                      placeholder="https://youtube.com/…"
                      value={company.youtube}
                      onChange={(e) => setCompany({ ...company, youtube: e.target.value })}
                    />
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* Live Preview Card */}
            <SectionCard title="Preview">
              <div className="rounded-xl border border-border bg-secondary/20 p-5 flex flex-col sm:flex-row gap-5 items-start">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-primary/10 grid place-items-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-display font-bold text-xl">{company.name}</h4>
                  <p className="text-sm text-muted-foreground">{company.tagline}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {company.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {company.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {company.address}, {company.city}
                    </span>
                  </div>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {company.website}
                    </a>
                  )}
                </div>
              </div>
            </SectionCard>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setCompany({
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
                    gstin: "",
                    pan: "",
                    currency: "INR",
                    timezone: "Asia/Kolkata",
                  });
                  showToast("Company settings reset to defaults.");
                }}
              >
                Reset
              </Button>
              <Button
                className="btn-hero gap-2 rounded-xl"
                onClick={() => showToast("✅ Company settings saved successfully!")}
              >
                <Save className="h-4 w-4" /> Save Company Settings
              </Button>
            </div>
          </div>
        );

      // ── MY PROFILE ───────────────────────────────────────────
      case "profile":
        return (
          <div className="space-y-5">
            <SectionCard title="Personal Information">
              {/* Avatar */}
              <div className="flex items-center gap-5 pb-5 mb-5 border-b border-border">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-primary/80 to-rose-400 flex items-center justify-center shadow-lg shrink-0">
                  {avatarPreview || auth?.avatar ? (
                    <img
                      src={avatarPreview || auth?.avatar}
                      alt={auth?.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white relative z-10">
                      {auth?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">{auth?.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {auth?.role} · {auth?.empId}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 rounded-xl text-xs"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    Change Avatar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" id="pr-name">
                  <Input
                    id="pr-name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </Field>
                <Field label="Employee ID" id="pr-empid">
                  <Input
                    id="pr-empid"
                    value={profile.empId}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                </Field>
                <Field label="Role" id="pr-role">
                  <Input
                    id="pr-role"
                    value={profile.role}
                    disabled
                    className="opacity-60 cursor-not-allowed capitalize"
                  />
                </Field>
                <Field label="Email Address" id="pr-email">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pr-email"
                      className="pl-9"
                      placeholder="your@email.com"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                </Field>
                <Field label="Phone Number" id="pr-phone">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="pr-phone"
                      className="pl-9"
                      placeholder="+91 00000 00000"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </Field>
              </div>
            </SectionCard>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setProfile({
                    name: auth?.name || "",
                    email: "",
                    phone: "",
                    empId: auth?.empId || "",
                    role: auth?.role || "",
                  });
                  setAvatarPreview(auth?.avatar || null);
                  showToast("Profile reset.");
                }}
              >
                Discard Changes
              </Button>
              <Button className="btn-hero gap-2 rounded-xl" onClick={handleSaveProfile}>
                <Save className="h-4 w-4" /> Save Profile
              </Button>
            </div>
          </div>
        );

      // ── APPEARANCE ────────────────────────────────────────────
      case "appearance":
        return (
          <div className="space-y-5">
            <SectionCard title="Theme & Layout">
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Theme Mode
                  </Label>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setAppearance({ ...appearance, theme: t })}
                        className={`relative rounded-xl border-2 p-4 text-center transition-all ${appearance.theme === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <span className="text-2xl block mb-1">
                          {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"}
                        </span>
                        <span className="text-xs font-semibold capitalize">{t}</span>
                        {appearance.theme === t && (
                          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Accent Color
                  </Label>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {["#f43f5e", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4"].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => setAppearance({ ...appearance, accentColor: color })}
                          style={{ background: color }}
                          className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${appearance.accentColor === color ? "border-foreground scale-110" : "border-transparent"}`}
                        />
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Font Size
                  </Label>
                  <div className="mt-3 flex gap-3">
                    {(["small", "default", "large"] as const).map((fs) => (
                      <button
                        key={fs}
                        onClick={() => setAppearance({ ...appearance, fontSize: fs })}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold capitalize transition-all ${appearance.fontSize === fs ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                      >
                        {fs}
                      </button>
                    ))}
                  </div>
                </div>

                <ToggleRow
                  label="Compact Sidebar"
                  sub="Show only icons in the sidebar to save space"
                  checked={appearance.sidebarCompact}
                  onChange={(v) => setAppearance({ ...appearance, sidebarCompact: v })}
                />
              </div>
            </SectionCard>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setAppearance({
                    theme: "light",
                    sidebarCompact: false,
                    fontSize: "default",
                    accentColor: "#f43f5e",
                  });
                  showToast("Appearance reset to defaults.");
                }}
              >
                Reset to Defaults
              </Button>
              <Button
                className="btn-hero gap-2 rounded-xl"
                onClick={() => showToast("✅ Appearance settings saved!")}
              >
                <Save className="h-4 w-4" /> Save Appearance
              </Button>
            </div>
          </div>
        );

      // ── NOTIFICATIONS ─────────────────────────────────────────
      case "notifications":
        return (
          <div className="space-y-5">
            <SectionCard title="In-App Notifications">
              <div>
                <ToggleRow
                  label="Lead Assigned to Me"
                  sub="Get notified when a lead is assigned"
                  checked={notifPreferences.leadAssigned}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, leadAssigned: v })}
                />
                <ToggleRow
                  label="Task Due Reminder"
                  sub="Remind 24h before task deadline"
                  checked={notifPreferences.taskDue}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, taskDue: v })}
                />
                <ToggleRow
                  label="Booking Confirmed"
                  sub="Alert when a new booking is confirmed"
                  checked={notifPreferences.bookingConfirmed}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, bookingConfirmed: v })}
                />
                <ToggleRow
                  label="Leave Requested"
                  sub="Notify when an employee requests leave"
                  checked={notifPreferences.leaveRequested}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, leaveRequested: v })}
                />
                <ToggleRow
                  label="System Updates"
                  sub="CRM feature updates and announcements"
                  checked={notifPreferences.systemUpdates}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, systemUpdates: v })}
                />
              </div>
            </SectionCard>

            <SectionCard title="Communication Channels">
              <div>
                <ToggleRow
                  label="Email Digest"
                  sub="Receive daily summary via email"
                  checked={notifPreferences.emailDigest}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, emailDigest: v })}
                />
                <ToggleRow
                  label="WhatsApp Alerts"
                  sub="Get critical alerts on WhatsApp"
                  checked={notifPreferences.whatsapp}
                  onChange={(v) => handleUpdatePreferences({ ...notifPreferences, whatsapp: v })}
                />
              </div>
            </SectionCard>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  handleUpdatePreferences(DEFAULT_PREFERENCES);
                  showToast("Notifications reset to defaults.");
                }}
              >
                Reset
              </Button>
              <Button
                className="btn-hero gap-2 rounded-xl"
                onClick={() => {
                  saveStoredPreferences(notifPreferences);
                  showToast("✅ Notification preferences saved!");
                }}
              >
                <Save className="h-4 w-4" /> Save Preferences
              </Button>
            </div>
          </div>
        );

      // ── SECURITY ──────────────────────────────────────────────
      case "security":
        return (
          <div className="space-y-5">
            <SectionCard title="Change Password">
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                {(["current", "newPass", "confirm"] as const).map((field) => (
                  <Field
                    key={field}
                    label={
                      field === "current"
                        ? "Current Password"
                        : field === "newPass"
                          ? "New Password"
                          : "Confirm New Password"
                    }
                    id={`pw-${field}`}
                  >
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        id={`pw-${field}`}
                        type={showPw[field] ? "text" : "password"}
                        placeholder={
                          field === "current"
                            ? "Enter current password"
                            : field === "newPass"
                              ? "Min. 6 characters"
                              : "Re-enter new password"
                        }
                        value={security[field]}
                        onChange={(e) => setSecurity({ ...security, [field]: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPw[field] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </Field>
                ))}
                {pwError && (
                  <p className="text-xs text-red-600 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    {pwError}
                  </p>
                )}
                <Button type="submit" className="btn-hero gap-2 rounded-xl">
                  <Lock className="h-4 w-4" /> Update Password
                </Button>
              </form>
            </SectionCard>




          </div>
        );

      // ── EMPLOYEES LIST (admin only) ───────────────────────────────
      case "team":
        return (
          <div className="space-y-5">
            <SectionCard title="Employee Directory">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {liveEmps.map((u: any) => (
                  <div key={u.id} className="relative group">
                    <EmployeeProfileCard employeeName={u.name} />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs font-bold border border-slate-200">
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your CRM preferences, company info, and account security.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Sidebar Tabs ───────────────────────────────────── */}
        <aside className="w-full lg:w-56 shrink-0">
          <nav className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            {visibleTabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium transition-all text-left ${
                  i !== 0 ? "border-t border-border" : ""
                } ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-secondary/60"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={activeTab === tab.id ? "text-primary" : "text-muted-foreground"}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </span>
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform ${activeTab === tab.id ? "text-primary rotate-90" : "text-muted-foreground/40"}`}
                />
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ────────────────────────────────────── */}
        <main className="flex-1 min-w-0">{renderTab()}</main>
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </div>
  );
}
