import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package as Pkg,
  CalendarCheck,
  FileText,
  FileEdit,
  ClipboardList,
  FolderOpen,
  Star,
  BarChart3,
  UserCog,
  Settings,
  Plane,
  Bell,
  Search,
  LogOut,
  ListChecks,
  Shield,
  Plus,
  User,
  Clock,
  Calendar,
  CreditCard,
  Briefcase,
  Building2,
  Zap,
  Network,
  ShieldCheck,
  UserSquare,
  Phone,
  GraduationCap,
  Receipt,
  ChevronDown,
  ChevronRight,
  Megaphone,
  Wallet,
  Car,
  LifeBuoy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAuth, clearAuth, type AuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { EmployeeProfileModal } from "@/components/EmployeeProfileModal";
import { CommandPalette } from "@/components/CommandPalette";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logoImg from "../assets/Logo.svg";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: "CRM — LookMyHolidays" }] }),
  component: CrmLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  subItems?: { label: string; to: string; icon?: React.ElementType }[];
};

const FULL_NAV: NavItem[] = [
  { to: "/crm", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/crm/leads", label: "Leads", icon: Users },
  { to: "/crm/quotations", label: "Quotations", icon: FileText },
  { to: "/crm/tasks", label: "Tasks", icon: ListChecks },
  { to: "/crm/visa", label: "Visa", icon: Plane },
  { to: "/crm/customers", label: "Customers", icon: UserCheck },
  { to: "/crm/bookings", label: "Bookings", icon: CalendarCheck },
  {
    to: "/crm/insurance",
    label: "General Insurance",
    icon: ShieldCheck,
    subItems: [
      { label: "Leads", to: "/crm/insurance-leads", icon: ClipboardList },
      { label: "Policies", to: "/crm/insurance?tab=Policies", icon: Shield },
      { label: "Claims", to: "/crm/insurance-claims", icon: FileText },
      { label: "Endorsement", to: "/crm/insurance-endorsement", icon: FileEdit }
    ]
  },
  { to: "/crm/documents", label: "Documents", icon: ClipboardList },
  { to: "/crm/packages", label: "Packages", icon: Pkg },
  { to: "/crm/taxi-booking", label: "Taxi Booking", icon: Car },
  { to: "/crm/employees", label: "Employees", icon: Briefcase },
  { to: "/crm/attendance", label: "Attendance", icon: Clock },
  { to: "/crm/vendors", label: "Vendors", icon: Building2 },

  { to: "/crm/Accounts", label: "Accounts", icon: CreditCard },
  { to: "/crm/personal-expenses", label: "Personal Expenses", icon: Wallet },
  { to: "/crm/marketing", label: "Marketing", icon: Megaphone },
  { to: "/crm/help", label: "Help & Support", icon: LifeBuoy },
  { to: "/crm/settings", label: "Settings", icon: Settings },
];

function getNavForUser(auth: AuthUser): NavItem[] {
  const name = auth.name.toLowerCase();

  let userNav: NavItem[] = [];

  // IMPORTANT: We check specific names FIRST because some users (like Suman/HR) 
  // might have an "admin" role in the database for permissions (like Edit/Delete),
  // but we still want to strictly limit which tabs they can see.

  if (name.includes("pushplata")) {
    userNav = FULL_NAV.filter((n) => [
      "Leads", "Quotations", "Tasks", "Customers", "Documents", "Packages", "Accounts", "Attendance", "Vendors", "Marketing", "Help & Support"
    ].includes(n.label));
  } else if (name.includes("deepak")) {
    userNav = FULL_NAV.filter((n) => [
      "Leads", "Quotations", "Tasks", "Visa", "Customers", "Bookings", "Packages", "Attendance", "Accounts", "Marketing", "Vendors", "Help & Support"
    ].includes(n.label));
  } else if (name.includes("suman")) {
    userNav = FULL_NAV.filter((n) => [
      "Leads", "Tasks", "Customers", "Bookings", "General Insurance", "Attendance", "Accounts", "Vendors", "Documents", "Marketing", "Help & Support"
    ].includes(n.label));
  } else if (name.includes("nikita")) {
    userNav = FULL_NAV.filter((n) => [
      "Tasks", "Customers", "General Insurance", "Attendance", "Marketing", "Help & Support"
    ].includes(n.label));
  } else if (name.includes("aman")) {
    userNav = FULL_NAV.filter((n) => [
      "Employees", "Tasks", "Customers", "Bookings", "General Insurance", "Attendance", "Accounts", "Vendors", "Documents", "Marketing", "Help & Support"
    ].includes(n.label));
  } else if (name.includes("bhumika")) {
    userNav = FULL_NAV.filter((n) => [
      "Leads", "Customers", "Tasks", "Bookings", "Attendance", "Vendors", "Quotations", "Help & Support"
    ].includes(n.label));
  } else if (name.includes("bhavya")) {
    userNav = FULL_NAV.filter((n) => [
      "Leads", "Quotations", "Tasks", "Customers", "Bookings", "Documents", "Packages", "Taxi Booking", "Attendance", "Vendors", "Marketing", "Help & Support"
    ].includes(n.label));
  } else if (name.includes("jatin")) {
    userNav = FULL_NAV;
  } else if (auth.role === "admin") {
    // Pure Admin gives full access
    userNav = FULL_NAV;
  } else if (auth.role === "manager") {
    userNav = FULL_NAV.filter((n) => n.label !== "Settings");
  } else {
    // Default for other employees
    userNav = FULL_NAV.filter((n) => !["Dashboard", "Employees", "Settings", "Payments", "Personal Expenses"].includes(n.label));
  }

  // Guarantee that Help & Support is always available to EVERY team member
  if (!userNav.some((n) => n.to === "/crm/help")) {
    const helpItem = FULL_NAV.find((n) => n.to === "/crm/help");
    if (helpItem) userNav.push(helpItem);
  }

  return userNav;
}

function CrmLayout() {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const pathname = location.pathname;
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [profileSection, setProfileSection] = useState<string | null>(null);
  const [employees, setEmployees] = useSupabaseTable<any[]>("employees", []);

  const [appearance] = useLocalStorage("crm-appearance", {
    theme: "light",
    sidebarCompact: false,
    fontSize: "default",
    accentColor: "#f43f5e",
  });
  const isCompact = appearance.sidebarCompact;

  useEffect(() => {

    const user = getAuth();
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setAuth(user);

    // If employee is found in DB and marked as Terminated, revoke access immediately
    if (employees && employees.length > 0) {
      const currentEmp = employees.find(
        (e: any) =>
          (e.id && user.empId && e.id === user.empId) ||
          (e.name && user.name && e.name.toLowerCase().trim() === user.name.toLowerCase().trim())
      );
      if (currentEmp) {
        const empStatus = (currentEmp.status || "").trim().toLowerCase();
        if (empStatus === "terminated") {
          clearAuth();
          toast.error("Your account has been terminated. Access revoked.");
          navigate({ to: "/login" });
          return;
        }
      }
    }

    const userNav = getNavForUser(user);
    const hasDashboard = userNav.some((n) => n.to === "/crm");

    if (pathname === "/crm" && !hasDashboard && userNav.length > 0) {
      navigate({ to: userNav[0].to, replace: true });
      return;
    }

    // Employee visiting outside /crm/* → dynamic check
    if (user.role === "employee" && !pathname.startsWith("/crm")) {
      navigate({ to: userNav.length > 0 ? userNav[0].to : "/crm", replace: true });
    }
  }, [pathname, navigate, employees]);

  // Seamless client-side navigation without full page reload
  useEffect(() => {
    const handleCrmNav = (e: any) => {
      if (e.detail) {
        navigate({ to: e.detail });
      }
    };
    window.addEventListener("crm-navigate", handleCrmNav);
    return () => {
      window.removeEventListener("crm-navigate", handleCrmNav);
    };
  }, [navigate]);

  function handleLogout() {
    clearAuth();
    navigate({ to: "/login" });
  }

  const openProfile = (section?: string) => {
    if (!auth) return;
    if (section) setProfileSection(section);

    const found = employees.find(
      (e: any) => e.name.toLowerCase() === auth.name.toLowerCase() || e.id === auth.empId,
    );

    if (found) {
      setSelectedEmployee(found);
    } else {
      setSelectedEmployee({
        id: auth.empId || "LMH-01",
        name: auth.name,
        avatar: auth.avatar,
        role: auth.role === "admin" ? "HR & Admin Manager" : "Travel Consultant",
        email:
          auth.role === "admin" ? "insurancesolutions58@gmail.com" : "employee@lookmyholidays.in",
        phone: "+91 73400 98982",
        joinDate: "2022-01-15",
        status: "Active",
        leads: 0,
        closedDeals: 0,
        revenue: 0,
        rating: 5.0,
        recentActivity: "Active on dashboard",
        description: "Active system user.",
      });
    }
  };

  if (!auth) return null;

  const nav = getNavForUser(auth);
  const isAdmin = auth.role === "admin" || auth.role === "manager";
  const currentEmployee = employees.find((e: any) => e.id === auth.empId || e.name.toLowerCase() === auth.name.toLowerCase());
  const displayAvatar = currentEmployee?.avatar || auth.avatar;

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Sidebar */}
      <aside
        className={`print:hidden sticky top-0 hidden h-screen ${isCompact ? "w-20" : "w-64"} shrink-0 flex-col border-r border-border bg-sidebar p-4 lg:flex transition-all duration-300`}
      >
        {isCompact ? (
          <TooltipProvider delayDuration={40}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/crm"
                  className="mb-6 flex items-center justify-center cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3b9f4e] text-white shadow-sm hover:scale-105 transition-transform">
                    <span className="font-display font-bold text-2xl italic pr-1">H</span>
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={14}
                className="z-50 px-3 py-1.5 text-xs font-semibold rounded-xl bg-popover text-popover-foreground border border-border/80 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 pointer-events-none"
              >
                LookMyHolidays Dashboard
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Link
            to="/crm"
            className="mb-6 flex items-center px-2 cursor-pointer"
          >
            <img
              src={logoImg}
              alt="LookMyHolidays"
              className="h-12 w-auto dark:brightness-0 dark:invert transition-all"
            />
          </Link>
        )}

        {/* Role badge */}
        {!isCompact && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${isAdmin ? "bg-primary/10 text-primary" : "bg-violet-100 text-violet-700"}`}
          >
            <Shield className="h-3.5 w-3.5" />
            {auth.name.toLowerCase().includes("manvendra")
              ? "CEO & Founder"
              : auth.name.toLowerCase().includes("jatin")
                ? "IT Portal"
                : auth.name.toLowerCase().includes("suman")
                  ? "HR Portal"
                  : auth.name.toLowerCase().includes("aman")
                    ? "Accountant Portal"
                    : isAdmin
                      ? "Admin Portal"
                      : `Employee — ${auth.name.split(" ")[0]}`
            }
          </div>
        )}

        <TooltipProvider delayDuration={40}>
          <nav className="flex-1 space-y-0.5 overflow-y-auto">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to.split('?')[0]);
              const Icon = n.icon;

              if (n.subItems && n.subItems.length > 0) {
                const isSubActive = n.subItems.some((sub) => pathname.startsWith(sub.to.split('?')[0]));
                return (
                  <HoverCard key={n.to} openDelay={80} closeDelay={150}>
                    <HoverCardTrigger asChild>
                      <button
                        className={`group w-full flex items-center justify-between ${isCompact ? "justify-center p-3" : "gap-3 px-4 py-2.5"} rounded-full text-sm font-medium transition-all duration-300 ease-out hover:translate-x-1.5 cursor-pointer ${active || isSubActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`${isCompact ? "h-6 w-6" : "h-5 w-5"} transition-transform duration-300 group-hover:scale-110`} />
                          {!isCompact && n.label}
                        </div>
                        {!isCompact && <ChevronDown className="h-4 w-4 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:opacity-100" />}
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" align="start" sideOffset={14} className="w-52 p-2 rounded-2xl shadow-2xl border-border bg-popover/98 backdrop-blur-md flex flex-col gap-1 z-50">
                      {isCompact && (
                        <div className="px-3 py-1.5 mb-1 border-b border-border/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {n.label}
                        </div>
                      )}
                      {n.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = sub.to.includes('?')
                          ? location.href.includes(sub.to)
                          : pathname === sub.to;

                        return (
                          <Link
                            key={sub.to}
                            to={sub.to.split('?')[0]}
                            search={sub.to.includes('?') ? Object.fromEntries(new URLSearchParams(sub.to.split('?')[1])) : undefined}
                            className={`group flex items-center w-full gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:translate-x-1 ${subActive
                              ? "bg-primary/10 text-primary shadow-xs"
                              : "bg-transparent text-foreground hover:bg-primary/5 hover:text-primary"
                              }`}
                          >
                            {SubIcon && <SubIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />}
                            {sub.label}
                          </Link>
                        );
                      })}
                    </HoverCardContent>
                  </HoverCard>
                );
              }

              const linkElement = (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`group flex items-center ${isCompact ? "justify-center p-3" : "gap-3 px-4 py-2.5"} rounded-full text-sm font-medium transition-all duration-300 ease-out hover:translate-x-1.5 ${active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                >
                  <Icon className={`${isCompact ? "h-6 w-6" : "h-5 w-5"} transition-transform duration-300 group-hover:scale-110`} />
                  {!isCompact && n.label}
                </Link>
              );

              if (isCompact) {
                return (
                  <Tooltip key={n.to}>
                    <TooltipTrigger asChild>
                      {linkElement}
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={14}
                      className="z-50 px-3 py-1.5 text-xs font-semibold rounded-xl bg-popover text-popover-foreground border border-border/80 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 pointer-events-none"
                    >
                      {n.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkElement;
            })}
          </nav>

          {/* Logout */}
          {isCompact ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="group mt-4 flex items-center justify-center p-3 rounded-full text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 dark:hover:text-red-300 transition-all duration-300 ease-out hover:translate-x-1.5 cursor-pointer"
                >
                  <LogOut className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={14}
                className="z-50 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-500 text-white shadow-2xl border-0 animate-in fade-in-0 zoom-in-95 pointer-events-none"
              >
                Logout
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="group mt-4 flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 dark:hover:text-red-300 transition-all duration-300 ease-out hover:translate-x-1.5 cursor-pointer"
            >
              <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <span>Logout</span>
            </button>
          )}
        </TooltipProvider>

      </aside>

      <div className="flex min-w-0 flex-1 flex-col print:block">
        {/* Topbar */}
        <header className="print:hidden sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-8">
          <div className="flex-1">
            <CommandPalette />
          </div>

          {/* Right side items */}
          <div className="ml-auto flex items-center gap-3">
            {/* Quick IT Support / Help Desk button */}
            <Link
              to="/crm/help"
              className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 hover:scale-[1.02] transition-all shadow-sm"
              title="IT Help Desk — Raise Query / Report Issue"
            >
              <LifeBuoy className="h-3.5 w-3.5 animate-spin-slow" />
              <span className="hidden sm:inline">IT Help Desk</span>
            </Link>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Interactive User profile block */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 border-l border-border pl-4 outline-none hover:opacity-85 transition-opacity text-left cursor-pointer">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={auth.name}
                      className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shrink-0">
                      {auth.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold leading-tight text-foreground">
                      {auth.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {auth.name.toLowerCase().includes("manvendra")
                        ? "CEO Founder • Admin"
                        : auth.name.toLowerCase().includes("jatin")
                          ? "IT Administrator"
                          : auth.name.toLowerCase().includes("suman")
                            ? "HR Manager"
                            : auth.name.toLowerCase().includes("aman")
                              ? "Accountant"
                              : isAdmin ? "Administrator" : "Employee"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[400px] mt-2 rounded-xl p-3 shadow-lg">
                <DropdownMenuLabel className="font-normal border-b border-border pb-3 mb-2">
                  <div className="flex items-center gap-3">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={auth.name}
                        className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shrink-0 text-lg">
                        {auth.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-[15px] font-bold leading-none text-foreground">{auth.name}</p>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {auth.name.toLowerCase().includes("manvendra")
                          ? "CEO Founder • Admin"
                          : auth.name.toLowerCase().includes("jatin")
                            ? "IT Admin"
                            : auth.name.toLowerCase().includes("suman")
                              ? "HR"
                              : auth.name.toLowerCase().includes("aman")
                                ? "Accountant"
                                : auth.role === "admin" ? "Administrator" : "Team Member"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="px-2 py-1.5 col-span-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1">
                    Profile & Info
                  </div>
                  <DropdownMenuItem onClick={() => openProfile("Personal Profile")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <User className="h-4 w-4 text-blue-500" />
                    <span>Personal Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openProfile("Employment Details")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <UserSquare className="h-4 w-4 text-indigo-500" />
                    <span>Employee Details</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openProfile("Academic Background")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <span>Academic Details</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openProfile("Family Information")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <Users className="h-4 w-4 text-pink-500" />
                    <span>Family Info</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openProfile("Contact Information")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    <span>Contact</span>
                  </DropdownMenuItem>

                  <div className="px-2 py-1.5 col-span-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-2">
                    Work & Docs
                  </div>
                  <DropdownMenuItem onClick={() => openProfile("Reporting Structure")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <Network className="h-4 w-4 text-amber-500" />
                    <span>Reporting Structure</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openProfile("Career History")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <Briefcase className="h-4 w-4 text-rose-500" />
                    <span>Career</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openProfile("Documents Center")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <FolderOpen className="h-4 w-4 text-cyan-500" />
                    <span>Documents Center</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openProfile("Verification Details")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <ShieldCheck className="h-4 w-4 text-teal-500" />
                    <span>Verification Details</span>
                  </DropdownMenuItem>

                  <div className="px-2 py-1.5 col-span-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-2">
                    System
                  </div>
                  <DropdownMenuItem onClick={() => openProfile("Quick Actions")} className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Quick Actions</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/crm/settings" })}
                    className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg"
                  >
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/crm/help" })}
                    className="cursor-pointer gap-2.5 py-2.5 text-sm rounded-lg col-span-2 bg-primary/5 text-primary hover:bg-primary/10"
                  >
                    <LifeBuoy className="h-4 w-4 text-primary" />
                    <span className="font-semibold">IT Help Desk & Tickets</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 py-2.5 text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-lg justify-center font-medium"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span>Log out securely</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>

        <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50">
          Designed and deployed by Jatin Jangid
        </footer>
      </div>

      <EmployeeProfileModal
        employee={selectedEmployee}
        open={!!selectedEmployee}
        initialScrollToId={profileSection}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEmployee(null);
            setProfileSection(null);
          }
        }}
        onEmployeeUpdated={async () => {
          const { data } = await supabase.from("employees").select("*");
          if (data && data.length > 0) {
            setEmployees(data);
            if (selectedEmployee) {
              const updated = data.find((e: any) => e.id === selectedEmployee.id);
              if (updated) setSelectedEmployee(updated);
            }
          }
          const currentAuth = getAuth();
          if (currentAuth) {
            setAuth(currentAuth);
          }
        }}
        onAssignTask={() => {
          setSelectedEmployee(null);
          navigate({ to: "/crm/employees" });
        }}
        onApproveLeave={() => {
          setSelectedEmployee(null);
          navigate({ to: "/crm/employees" });
        }}
      />
    </div>
  );
}
