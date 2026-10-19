import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getUpcomingHolidays } from "@/lib/holidays";
import {
  UserCog,
  Phone,
  Mail,
  Plus,
  Search,
  TrendingUp,
  Star,
  CalendarCheck,
  UserCheck,
  Shield,
  X,
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  ClipboardList,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  Play,
  Square,
  FileSignature,
  Download,
  Trash2,
  Heart,
  MessageSquare,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Edit, Send, CheckCircle, Award, Upload, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
        {label}
      </label>
      <Input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs focus-visible:ring-primary"
      />
    </div>
  );
}

function EditSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { EmployeeProfileModal } from "@/components/EmployeeProfileModal";
import { getAuth } from "@/lib/auth";
import {
  INITIAL_EMPLOYEE_DETAILS,
  createDefaultEmployeeDetails,
  type EmployeeDetails,
  type CareerItem,
  type AcademicItem,
  type FamilyItem,
} from "@/lib/employee-profile-defaults";

export const Route = createFileRoute("/crm/employees")({ component: EmployeesPage });

/* ─── Types ─── */
type Role =
  | "Operations Manager"
  | "Travel Consultant"
  | "Visa Executive"
  | "Accounts"
  | "Marketing"
  | "Sales Executive"
  | "Executive"
  | "HR & Admin Manager"
  | "Accounts Manager"
  | "Ceo Founder"
  | "Insurance Sales"
  | "Web Design Internship"
  | "Other";
type Status = "Active" | "On Leave" | "Inactive" | "Terminated";
type AccessRole = "Admin" | "Manager" | "Employee";

const STATUS_COLOR: Record<Status, string> = {
  Active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  "On Leave": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
  Inactive: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25",
  Terminated: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
};

const ROLE_COLOR: Record<string, string> = {
  "Operations Manager": "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
  "Travel Consultant": "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25",
  "Visa Executive": "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25",
  "Accounts": "bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/25",
  "Marketing": "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25",
  "Sales Executive": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
  "Sales": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
  "Executive": "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25",
  "HR & Admin Manager": "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/25",
  "Accounts Manager": "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
  "Ceo Founder": "bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-600/25",
  "Insurance Sales": "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25",
  "Web Design Internship": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  "other": "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25",
};

interface Employee {
  id: string;
  name: string;
  avatar: string;
  role: Role;
  email: string;
  phone: string;
  joinDate: string;
  status: Status;
  leads: number;
  closedDeals: number;
  revenue: number;
  rating: number;
  recentActivity: string;
  description: string;
  department?: string;
  accessRole?: AccessRole;
  profile_details?: EmployeeDetails;
  notes?: { text: string; createdAt: string }[];
}

export const INITIAL_EMPLOYEES: Employee[] = [];

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function StarRating({ rating = 0 }: { rating?: number }) {
  const validRating = Number(rating) || 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= Math.round(validRating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold">{validRating.toFixed(1)}</span>
    </div>
  );
}

function formatNoteDate(isoString: string) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d
      .toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", "");
  } catch {
    return "";
  }
}

function EmployeeTaskCard({
  task,
  isAdmin,
  onToggle,
  onEditNote,
}: {
  task: any;
  isAdmin: boolean;
  onToggle: (id: string) => void;
  onEditNote: (id: string, note: string) => void;
}) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNoteText, setEditNoteText] = useState("");

  const isOverdue = task.dueDate < new Date().toISOString().slice(0, 10);
  const isDone = task.status === "Done";

  const allNotes = [task.note, ...(task.notes || [])].filter(Boolean);

  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 shadow-sm transition-shadow flex items-start gap-3 ${isDone ? "opacity-75 hover:opacity-100" : "hover:shadow"}`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 cursor-pointer transition-colors ${isDone ? "text-emerald-600" : "text-muted-foreground hover:text-primary"}`}
      >
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 fill-emerald-100" />
        ) : (
          <span className="block h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center hover:border-primary"></span>
        )}
      </button>
      <div className="flex-1 space-y-1 min-w-0">
        <p
          className={`font-medium text-sm text-foreground/90 ${isDone ? "line-through text-muted-foreground" : ""}`}
        >
          {task.title}
        </p>

        {/* Notes list */}
        {allNotes.length > 0 && (
          <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-border/80">
            {allNotes.map((note, idx) => {
              const isString = typeof note === "string";
              const noteText = isString ? note : note.text;
              const noteTime = isString ? "" : formatNoteDate(note.createdAt);
              return (
                <div
                  key={idx}
                  className="text-xs text-muted-foreground/80 italic leading-relaxed flex flex-wrap items-baseline gap-x-1.5"
                >
                  <span className="text-muted-foreground/60">•</span>
                  <span>{noteText}</span>
                  {noteTime && (
                    <span className="text-[10px] text-muted-foreground/50 not-italic font-medium">
                      ({noteTime})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Note Inline Edit */}
        {isEditingNote ? (
          <div className="mt-2 w-full animate-in fade-in slide-in-from-top-2 duration-200">
            <textarea
              autoFocus
              placeholder="Add another detail or follow-up note..."
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs rounded-full px-4"
                onClick={() => {
                  setIsEditingNote(false);
                  setEditNoteText("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs rounded-full px-4 text-primary-foreground bg-primary hover:bg-primary/90 border-0"
                onClick={() => {
                  if (editNoteText.trim()) {
                    onEditNote(task.id, editNoteText.trim());
                  }
                  setIsEditingNote(false);
                  setEditNoteText("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditNoteText("");
              setIsEditingNote(true);
            }}
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-1.5"
          >
            <Plus className="h-3 w-3" /> Add Note
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="bg-secondary px-2 py-0.5 rounded-md">{task.type}</span>
          {!isDone && (
            <span
              className={`px-2 py-0.5 rounded-md ${task.priority === "High"
                ? "bg-red-50 text-red-600"
                : task.priority === "Medium"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
                }`}
            >
              {task.priority}
            </span>
          )}
          {isDone && <span>Completed</span>}
          {isAdmin && !isDone && <span>Assignee: {task.assignee}</span>}
          {!isDone && (
            <span className={isOverdue ? "text-red-600" : ""}>
              Due:{" "}
              {new Date(task.dueDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function safeFormatDate(dateVal: any, locale = "en-IN", options?: Intl.DateTimeFormatOptions) {
  if (!dateVal) return "NA";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "NA";
  return d.toLocaleDateString(locale, options);
}

function EmployeesPage() {
  const [localEmployees, setEmployees] = useSupabaseTable<Employee[]>(
    "employees",
    []
  );

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingEmployeeNoteId, setEditingEmployeeNoteId] = useState<string | null>(null);
  const [employeeEditNoteText, setEmployeeEditNoteText] = useState("");
  
  // Export state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  const employees = localEmployees?.length ? localEmployees : INITIAL_EMPLOYEES;
  const employeesDetails = useMemo(() => {
    const map: Record<string, EmployeeDetails> = {};
    employees.forEach((e: any) => {
      let pd = e.profile_details;
      if (!pd && typeof e.description === "string" && e.description.includes("_isMeta")) {
        try {
          const meta = JSON.parse(e.description);
          if (meta.profile_details) {
            pd = meta.profile_details;
          }
        } catch {}
      }
      const defaults =
        INITIAL_EMPLOYEE_DETAILS[e.id] ||
        createDefaultEmployeeDetails(e.id, e.name, e.role, e.email, e.phone);
      const combined = {
        ...defaults,
        ...(pd || {}),
      };
      map[e.id] = {
        ...combined,
        skills: Array.isArray(combined.skills) ? combined.skills : [],
        certifications: Array.isArray(combined.certifications) ? combined.certifications : [],
        languages: Array.isArray(combined.languages) ? combined.languages : [],
        directReports: Array.isArray(combined.directReports) ? combined.directReports : [combined.directReports].filter(Boolean),
        careerHistory: Array.isArray(combined.careerHistory) ? combined.careerHistory : [],
        academicBackground: Array.isArray(combined.academicBackground) ? combined.academicBackground : [],
        familyInformation: Array.isArray(combined.familyInformation) ? combined.familyInformation : [],
      };
    });
    return map;
  }, [employees]);

  // Profile inline edit states
  const [profileIsEditing, setProfileIsEditing] = useState(false);
  const [profileEditDetails, setProfileEditDetails] = useState<EmployeeDetails | null>(null);
  const [profileEditCore, setProfileEditCore] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    status: "",
    joinDate: "",
  });

  // Helpers to update array list rows inside Profile inline tabs
  const updateProfileCareer = (index: number, field: keyof CareerItem, value: string) => {
    if (!profileEditDetails) return;
    const history = [...profileEditDetails.careerHistory];
    history[index] = { ...history[index], [field]: value };
    setProfileEditDetails({ ...profileEditDetails, careerHistory: history });
  };
  const addProfileCareer = () => {
    if (!profileEditDetails) return;
    setProfileEditDetails({
      ...profileEditDetails,
      careerHistory: [
        ...profileEditDetails.careerHistory,
        {
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          responsibilities: "",
          achievement: "",
        },
      ],
    });
  };
  const deleteProfileCareer = (index: number) => {
    if (!profileEditDetails) return;
    setProfileEditDetails({
      ...profileEditDetails,
      careerHistory: profileEditDetails.careerHistory.filter((_, i) => i !== index),
    });
  };

  const updateProfileAcademic = (index: number, field: keyof AcademicItem, value: string) => {
    if (!profileEditDetails) return;
    const background = [...profileEditDetails.academicBackground];
    background[index] = { ...background[index], [field]: value };
    setProfileEditDetails({ ...profileEditDetails, academicBackground: background });
  };
  const addProfileAcademic = () => {
    if (!profileEditDetails) return;
    setProfileEditDetails({
      ...profileEditDetails,
      academicBackground: [
        ...profileEditDetails.academicBackground,
        { institution: "", qualification: "", specialization: "", year: "", grade: "" },
      ],
    });
  };
  const deleteProfileAcademic = (index: number) => {
    if (!profileEditDetails) return;
    setProfileEditDetails({
      ...profileEditDetails,
      academicBackground: profileEditDetails.academicBackground.filter((_, i) => i !== index),
    });
  };

  const updateProfileFamily = (index: number, field: keyof FamilyItem, value: string) => {
    if (!profileEditDetails) return;
    const info = [...profileEditDetails.familyInformation];
    info[index] = { ...info[index], [field]: value };
    setProfileEditDetails({ ...profileEditDetails, familyInformation: info });
  };
  const addProfileFamily = () => {
    if (!profileEditDetails) return;
    setProfileEditDetails({
      ...profileEditDetails,
      familyInformation: [
        ...profileEditDetails.familyInformation,
        { name: "", relationship: "", dob: "", contactNumber: "" },
      ],
    });
  };
  const deleteProfileFamily = (index: number) => {
    if (!profileEditDetails) return;
    setProfileEditDetails({
      ...profileEditDetails,
      familyInformation: profileEditDetails.familyInformation.filter((_, i) => i !== index),
    });
  };

  const [tasks, setTasks] = useSupabaseTable<any[]>("tasks", []);

  const auth = getAuth();
  const isAdmin = auth?.role === "admin";
  const [leaves, setLeaves] = useSupabaseTable<any[]>("leaves", []);
  const [attendance, setAttendance] = useSupabaseTable<any[]>("attendance", []);
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const teamTodayRecords = attendance ? attendance.filter((a) => a.date === todayStr) : [];
  const [feeds, setFeeds] = useSupabaseTable<any[]>("feeds", []);
  const [timeLogs, setTimeLogs] = useSupabaseTable<any[]>("timelogs", []);
  const [hrFiles, setHrFiles] = useSupabaseTable<any[]>("hr_files", []);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const [reviews, setReviews] = useSupabaseTable<any[]>("reviews", [
    {
      id: "REV-01",
      empId: "LMH-02",
      period: "Q1 2026",
      rating: 4.5,
      feedback: "Excellent sales performance, exceeded targets.",
      reviewer: "Manvendra Singhal",
      date: "2026-04-05",
    },
    {
      id: "REV-02",
      empId: "LMH-03",
      period: "Q1 2026",
      rating: 4.8,
      feedback: "Great coordination and support on tour bookings.",
      reviewer: "Manvendra Singhal",
      date: "2026-04-06",
    },
  ]);
  const [payroll, setPayroll] = useSupabaseTable<any[]>("payroll", [
    {
      id: "PAY-01",
      empId: "LMH-02",
      month: "May 2026",
      salary: 35000,
      status: "Paid",
      txId: "TXN1029384",
      date: "2026-06-01",
    },
    {
      id: "PAY-02",
      empId: "LMH-03",
      month: "May 2026",
      salary: 32000,
      status: "Paid",
      txId: "TXN1029385",
      date: "2026-06-01",
    },
    {
      id: "PAY-03",
      empId: "LMH-04",
      month: "May 2026",
      salary: 45000,
      status: "Paid",
      txId: "TXN1029386",
      date: "2026-06-01",
    },
  ]);
  const [assets, setAssets] = useSupabaseTable<any[]>("assets", [
    {
      id: "AST-01",
      empId: "LMH-02",
      name: "Dell Latitude 5420 Laptop",
      serial: "CN-0V2H3Y-1234",
      type: "Laptop",
      value: 65000,
      date: "2023-03-10",
    },
    {
      id: "AST-02",
      empId: "LMH-03",
      name: "HP ProBook 440 G8 Laptop",
      serial: "CN-0V2H3Y-5678",
      type: "Laptop",
      value: 58000,
      date: "2022-06-25",
    },
    {
      id: "AST-03",
      empId: "LMH-04",
      name: "MacBook Air M1",
      serial: "FVFCX123QY7",
      type: "Laptop",
      value: 85000,
      date: "2021-11-05",
    },
    {
      id: "AST-04",
      empId: "LMH-05",
      name: "Lenovo ThinkPad L14",
      serial: "CN-0V2H3Y-9012",
      type: "Laptop",
      value: 55000,
      date: "2023-08-12",
    },
  ]);
  const [certificates, setCertificates] = useSupabaseTable<any[]>("certificates", [
    {
      id: "CRT-01",
      empId: "LMH-02",
      name: "Destination Expert - Middle East",
      issuer: "Tourism Board",
      date: "2024-05-15",
      url: "#",
    },
    {
      id: "CRT-02",
      empId: "LMH-03",
      name: "IATA Foundation Course",
      issuer: "IATA",
      date: "2023-11-20",
      url: "#",
    },
    {
      id: "CRT-03",
      empId: "LMH-05",
      name: "Visa Regulations & Compliance",
      issuer: "VFS Global Academy",
      date: "2024-02-18",
      url: "#",
    },
  ]);
  const [bookings] = useSupabaseTable<any[]>("bookings", []);

  // Form states for adding new records in the details section
  const [addLeaveType, setAddLeaveType] = useState("Casual Leave");
  const [addLeaveFrom, setAddLeaveFrom] = useState("");
  const [addLeaveTo, setAddLeaveTo] = useState("");
  const [addLeaveReason, setAddLeaveReason] = useState("");

  const [addAttDate, setAddAttDate] = useState("");
  const [addAttIn, setAddAttIn] = useState("09:30");
  const [addAttOut, setAddAttOut] = useState("18:30");
  const [addAttLoc, setAddAttLoc] = useState("JTM Mall Office");

  const [addReviewPeriod, setAddReviewPeriod] = useState("");
  const [addReviewRating, setAddReviewRating] = useState("5.0");
  const [addReviewFeedback, setAddReviewFeedback] = useState("");

  const [addDocName, setAddDocName] = useState("");
  const [addDocType, setAddDocType] = useState("Resume");
  const [addDocSize, setAddDocSize] = useState("1.0 MB");

  const [addPayMonth, setAddPayMonth] = useState("");
  const [addPaySalary, setAddPaySalary] = useState("");
  const [addPayStatus, setAddPayStatus] = useState("Paid");

  const [addAssetName, setAddAssetName] = useState("");
  const [addAssetSerial, setAddAssetSerial] = useState("");
  const [addAssetType, setAddAssetType] = useState("Laptop");

  const [addCertName, setAddCertName] = useState("");
  const [addCertIssuer, setAddCertIssuer] = useState("");

  // States for interactive forms
  // 1. Leave form
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // 2. Attendance punch
  const [punchLocation, setPunchLocation] = useState("JTM Mall Office");
  const [punchNote, setPunchNote] = useState("");

  // 3. Feeds post
  const [feedText, setFeedText] = useState("");

  // 4. File upload
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileSize, setNewFileSize] = useState("");

  // 5. Time log modal
  const [isTimeLogModalOpen, setIsTimeLogModalOpen] = useState(false);
  const [logProject, setLogProject] = useState("");
  const [logTask, setLogTask] = useState("");
  const [logHours, setLogHours] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));

  // 6. Task Modal (for admin to add tasks)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("Call");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "All">("All");
  const allRoles: Role[] = [
    "Operations Manager",
    "Travel Consultant",
    "Visa Executive",
    "Accounts",
    "Marketing",
    "Sales Executive",
    "Executive",
    "HR & Admin Manager",
    "Accounts Manager",
  ];

  const [activeTab, setActiveTab] = useState("Employees");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    role: "Travel Consultant" as Role,
    status: "Active" as Status,
    description: "",
    username: "",
    password: "",
  });

  // Pre-generate credentials and ID when modal is opened
  useEffect(() => {
    if (isAddOpen) {
      // Find a safe next sequential ID
      let maxNum = 5; // Default starts at 5 (LMH-05)
      employees.forEach((emp) => {
        if (emp.id.startsWith("LMH-")) {
          const num = parseInt(emp.id.replace("LMH-", ""), 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
      const nextId = `LMH-${String(maxNum + 1).padStart(2, "0")}`;
      setNewEmployee({
        id: nextId,
        name: "",
        email: "",
        phone: "",
        role: "Travel Consultant" as Role,
        status: "Active" as Status,
        description: "",
        username: "",
        password: "",
      });
    }
  }, [isAddOpen, employees]);

  const handleNameChange = (name: string) => {
    const parts = name.trim().toLowerCase().split(/\s+/);
    const generatedUsername = parts.length ? parts[0] : "";
    setNewEmployee((prev) => ({
      ...prev,
      name,
      username: prev.username ? prev.username : generatedUsername,
    }));
  };

  const filtered = employees.filter(
    (e) =>
      (roleFilter === "All" || e.role === roleFilter) &&
      (q === "" ||
        (e.name || "").toLowerCase().includes(q.toLowerCase()) ||
        (e.email || "").toLowerCase().includes(q.toLowerCase())),
  );

  // Live data: Total Bookings from Supabase bookings table
  const totalBookings = bookings.length;

  // Live data: Team Revenue = total revenue generated by all bookings
  const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (Number(b.paid) || 0), 0);

  const handleDeleteEmployee = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newEmployee.name ||
      !newEmployee.email ||
      !newEmployee.id ||
      !newEmployee.username ||
      !newEmployee.password
    )
      return;

    const isDuplicate = employees.some(
      (emp) =>
        (emp.email && emp.email.toLowerCase() === newEmployee.email.toLowerCase()) ||
        (emp.id && emp.id.toLowerCase() === newEmployee.id.toLowerCase())
    );
    if (isDuplicate) {
      toast.error("An employee with this email, username, or Employee ID already exists.");
      return;
    }

    const employeeDetails = createDefaultEmployeeDetails(
      newEmployee.id,
      newEmployee.name,
      newEmployee.role,
      newEmployee.email,
      newEmployee.phone
    );
    employeeDetails.username = newEmployee.username;
    employeeDetails.password = newEmployee.password;

    const employee: Employee = {
      id: newEmployee.id,
      name: newEmployee.name,
      avatar: "",
      role: newEmployee.role,
      email: newEmployee.email,
      phone: newEmployee.phone,
      joinDate: new Date().toISOString().slice(0, 10),
      status: newEmployee.status,
      leads: 0,
      closedDeals: 0,
      revenue: 0,
      rating: 0,
      recentActivity: "Newly added to the team",
      description: JSON.stringify({
        _isMeta: true,
        text: newEmployee.description || "No description provided.",
        profile_details: employeeDetails,
      }),
      accessRole: (newEmployee as any).accessRole || "employee",
      username: newEmployee.username,
      password: newEmployee.password,
      profile_details: employeeDetails,
    } as Employee;

    setEmployees([employee, ...employees]);
    setIsAddOpen(false);
    toast.success(`Employee ${newEmployee.name} added successfully with username: ${newEmployee.username}`);
  };

  const handleExportCSV = () => {
    const exportableEmployees = employees.filter(e => {
      const d = e.joinDate ? String(e.joinDate).split('T')[0] : "";
      const matchStart = exportStartDate && d ? d >= exportStartDate : true;
      const matchEnd = exportEndDate && d ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const csvRows = [
      ["ID", "Name", "Role", "Email", "Phone", "Join Date", "Status"]
    ];

    exportableEmployees.forEach(e => {
      csvRows.push([
        `"${e.id}"`,
        `"${(e.name || "").replace(/"/g, '""')}"`,
        `"${e.role}"`,
        `"${e.email}"`,
        `"${e.phone}"`,
        `"${e.joinDate || ""}"`,
        `"${e.status}"`
      ]);
    });

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `employees_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Team directory, roles, and performance overview.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsExportOpen(true)} className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl" style={{ background: "var(--gradient-brand)" }}>
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Enter the details of the new team member. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id">Employee ID</Label>
                  <Input
                    id="id"
                    required
                    placeholder="e.g. LMH-01"
                    value={newEmployee.id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    required
                    placeholder="e.g. Jatin Jangid"
                    value={newEmployee.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="e.g. jatin@lmh"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Login Username</Label>
                  <Input
                    id="username"
                    required
                    placeholder="e.g. jatin"
                    value={newEmployee.username}
                    onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Login Password</Label>
                  <Input
                    id="password"
                    required
                    placeholder="e.g. jatin123@lMH"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Job Role</Label>
                  <select
                    id="role"
                    value={newEmployee.role}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, role: e.target.value as Role })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {allRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessRole">Access Level <span className="text-red-500">*</span></Label>
                  <select
                    id="accessRole"
                    value={(newEmployee as any).accessRole || "employee"}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, accessRole: e.target.value } as any)
                    }
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="admin">Admin (Full Access)</option>
                    <option value="manager">Manager (Mid Access)</option>
                    <option value="employee">Employee (Limited Access)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={newEmployee.status}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, status: e.target.value as Status })
                    }
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="Description">Description</Label>
                  <Input
                    id="Description"
                    className="h-10 rounded-lg"
                    placeholder="Brief bio or description..."
                    value={newEmployee.description}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Employee</Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Employees</DialogTitle>
            <DialogDescription>
              Filter employees by join date before downloading as CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
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

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" className="rounded-xl px-6" onClick={() => setIsExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportCSV} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="h-4 w-4 mr-2" /> Download CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>


      {activeTab === "Employees" ? (
        <>
          {/* Top stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              {
                label: "Total Staff",
                value: employees.length,
                icon: <UserCog className="h-4 w-4" />,
                color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
              },
              {
                label: "Present Today",
                value: `${teamTodayRecords.length} / ${employees.length}`,
                icon: <UserCheck className="h-4 w-4" />,
                color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
              },
              {
                label: "Attendance Rate",
                value: `${Math.round((teamTodayRecords.length / (employees.length || 1)) * 100) || 0}%`,
                icon: <TrendingUp className="h-4 w-4" />,
                color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25",
              },
              {
                label: "Active Shifts",
                value: teamTodayRecords.filter((r) => !r.checkout).length,
                icon: <Clock className="h-4 w-4" />,
                color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <span className={`grid h-8 w-8 place-items-center rounded-full ${s.color}`}>
                    {s.icon}
                  </span>
                </div>
                <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
            <div className="relative w-full md:max-w-md flex-1 shrink-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 rounded-xl w-full"
              />
            </div>
            <div className="flex items-center gap-2 text-sm w-full md:w-auto md:ml-auto">
              <span className="text-muted-foreground font-medium shrink-0">Category:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="h-9 w-full md:w-auto cursor-pointer appearance-none rounded-full border border-border bg-card text-card-foreground pl-4 pr-9 py-1.5 font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23111827%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[right_1rem_center] bg-no-repeat"
              >
                <option value="All">All Categories</option>
                {allRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((emp) => (
              <div
                key={emp.id}
                className={`group relative rounded-2xl border bg-card p-5 shadow-card transition-all ${
                  emp.status === "Terminated"
                    ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0 border-border/50"
                    : "border-border hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {/* Top section */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {emp.avatar ? (
                      <img
                        src={emp.avatar}
                        alt={emp.name || "Employee"}
                        className="h-12 w-12 rounded-2xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-primary">
                          {(emp.name || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold leading-tight">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 -mr-1.5 -mt-1.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[emp.status] || "bg-secondary text-secondary-foreground border border-border"}`}
                    >
                      {emp.status}
                    </span>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:bg-secondary">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 rounded-xl" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedEmployee(emp); }} className="cursor-pointer gap-2 py-2">
                            <Eye className="h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDeleteEmployee(e, emp.id)} className="cursor-pointer gap-2 py-2 text-rose-600 focus:text-rose-700">
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLOR[emp.role] || "bg-secondary/60 text-foreground border border-border"}`}
                  >
                    <Shield className="h-3 w-3" /> {emp.role}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{emp.description}</p>

                {/* Contact */}
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {emp.email}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {emp.phone}
                  </p>
                </div>

                {/* Stats (only for consultants) */}
                {emp.revenue > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-secondary/50 p-3">
                    <div className="text-center">
                      <p className="font-display text-lg font-bold text-primary">{emp.leads}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-lg font-bold text-primary">
                        {emp.closedDeals}
                      </p>
                      <p className="text-xs text-muted-foreground">Deals</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-lg font-bold text-primary">
                        {Math.round(emp.revenue / 100000)}L
                      </p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                )}





                {/* Rating & Activity */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <StarRating rating={emp.rating} />
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(emp.joinDate).getFullYear()}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground italic truncate">
                    "{emp.recentActivity}"
                  </p>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                No employees found matching the current filters.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Sub-tab rendering block */}
          {activeTab === "Profile" &&
            (() => {
              const cur =
                employees.find(
                  (e) => (e.name && auth?.name && e.name.toLowerCase() === auth.name.toLowerCase()) || e.id === auth?.empId,
                ) || employees[0];

              if (!cur) {
                return (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-sm text-muted-foreground animate-pulse">Loading employee profile...</p>
                  </div>
                );
              }

              const empDetails =
                employeesDetails[cur.id] ||
                createDefaultEmployeeDetails(cur.id, cur.name, cur.role, cur.email, cur.phone);

              const handleStartEdit = () => {
                setProfileEditCore({
                  name: cur.name,
                  role: cur.role,
                  email: cur.email,
                  phone: cur.phone,
                  status: cur.status,
                  joinDate: cur.joinDate,
                });
                setProfileEditDetails(structuredClone(empDetails)); // deep clone
                setProfileIsEditing(true);
              };

              const handleCancelEdit = () => {
                setProfileIsEditing(false);
                setProfileEditDetails(null);
              };

              const handleSave = async () => {
                if (!profileEditDetails) return;

                const updatedDetails = {
                  ...profileEditDetails,
                  username: cur.profile_details?.username || (cur.name || "").trim().split(" ")[0].toLowerCase(),
                  password: cur.profile_details?.password || (cur.name || "").trim().split(" ")[0].toLowerCase(),
                };

                const supabasePayload: any = {
                  name: profileEditCore.name,
                  role: profileEditCore.role,
                  email: profileEditCore.email,
                  phone: profileEditCore.phone,
                  status: profileEditCore.status,
                  joinDate: profileEditCore.joinDate,
                  profile_details: updatedDetails,
                  description: JSON.stringify({
                    _isMeta: true,
                    text: profileEditDetails.bio || "",
                    profile_details: updatedDetails,
                  }),
                };

                try {
                  const { error } = await supabase
                    .from("employees")
                    .update(supabasePayload)
                    .eq("id", cur.id);

                  if (error) {
                    console.error("Error updating employee profile in Supabase:", error);
                    toast.error("Failed to save profile changes. Please try again.");
                    return;
                  }

                  // Sync core and details to local state
                  const updatedList = employees.map((e) => {
                    if (e.id === cur.id) {
                      return {
                        ...e,
                        ...supabasePayload,
                        profile_details: updatedDetails,
                      };
                    }
                    return e;
                  });
                  setEmployees(updatedList);
                  INITIAL_EMPLOYEE_DETAILS[cur.id] = updatedDetails;

                  // Update auth if modifying current user
                  const authStored = localStorage.getItem("crm_auth");
                  if (authStored) {
                    try {
                      const authObj = JSON.parse(authStored);
                      if (
                        authObj.empId === cur.id ||
                        (authObj.name && profileEditCore.name && authObj.name.toLowerCase().trim() === profileEditCore.name.toLowerCase().trim())
                      ) {
                        authObj.name = profileEditCore.name;
                        authObj.role = profileEditCore.role;
                        authObj.email = profileEditCore.email;
                        localStorage.setItem("crm_auth", JSON.stringify(authObj));
                      }
                    } catch {}
                  }

                  const authStoredV1 = localStorage.getItem("crm_auth_v1");
                  if (authStoredV1) {
                    try {
                      const authObj = JSON.parse(authStoredV1);
                      if (
                        authObj.empId === cur.id ||
                        (authObj.name && profileEditCore.name && authObj.name.toLowerCase().trim() === profileEditCore.name.toLowerCase().trim())
                      ) {
                        authObj.name = profileEditCore.name;
                        authObj.email = profileEditCore.email;
                        authObj.phone = profileEditCore.phone;
                        localStorage.setItem("crm_auth_v1", JSON.stringify(authObj));
                      }
                    } catch {}
                  }

                  toast.success("Profile details saved successfully!");
                  setProfileIsEditing(false);
                } catch (err) {
                  console.error(err);
                  toast.error("Error saving profile details");
                }
              };

              // Calculate dynamic stats
              const empAtt = attendance.filter((a) => a.empId === cur.id);
              const presentDays = empAtt.filter((a) => a.status === "Present").length;
              const attendancePct = empAtt.length > 0 ? Math.round((presentDays / empAtt.length) * 100) : 100;

              const empTasks = tasks.filter((t) => t.assignee === cur.name);
              const completedTasks = empTasks.filter((t) => t.status === "Done").length;

              const empBookings = bookings.filter((b) => b.assignedTo === cur.name);
              const completedBookings = empBookings.filter(
                (b) => b.status === "Completed" || b.status === "Confirmed"
              ).length;

              const projectsCompleted = completedTasks + completedBookings;
              const taskCompletionRate = empTasks.length > 0 ? (completedTasks / empTasks.length) * 100 : 100;
              const kpiScore = Math.round((attendancePct + taskCompletionRate) / 2);

              // Calculated parameters
              const mockPerf = {
                kpiScore: kpiScore,
                attendancePct: attendancePct,
                projectsCompleted: projectsCompleted || cur.closedDeals || 0,
                monthlyRating: cur.rating || 4.5,
                activeProjects: [
                  {
                    name: "Maldives Luxury Group Travel",
                    status: "In Progress",
                    deadline: "2026-06-30",
                    progress: 75,
                  },
                  {
                    name: "Europe Summer Itinerary Prep",
                    status: "Planning",
                    deadline: "2026-07-15",
                    progress: 40,
                  },
                ],
                activityTimeline: [
                  {
                    title: "Logged In",
                    desc: "Clocked in from JTM Mall Office",
                    time: "Today, 09:30 AM",
                  },
                  {
                    title: "Task Completed",
                    desc: "Updated Maldives package prices",
                    time: "Yesterday, 04:15 PM",
                  },
                  {
                    title: "Profile Updated",
                    desc: "Modified emergency contact info",
                    time: "18-Jun-2026",
                  },
                ],
                documents: [
                  { name: "Resume_Updated.pdf", type: "Resume", size: "1.2 MB" },
                  { name: "Offer_Letter_LMH.pdf", type: "Offer Letter", size: "840 KB" },
                  { name: "Aadhaar_Card_Masked.pdf", type: "ID Proof", size: "620 KB" },
                ],
              };

              return (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  {/* Top Info Banner / Profile Overview */}
                  <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-5 w-full md:w-auto">
                      {cur.avatar ? (
                        <img
                          src={cur.avatar}
                          alt={cur.name || "Employee"}
                          className="h-20 w-20 rounded-2xl object-cover border border-border ring-4 ring-primary/10 shrink-0"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 ring-4 ring-primary/10">
                          <span className="text-4xl font-bold text-primary">
                            {(cur.name || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {profileIsEditing && profileEditDetails ? (
                        <div className="space-y-3 w-full md:max-w-md">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Full Name
                              </label>
                              <Input
                                value={profileEditCore.name}
                                onChange={(e) =>
                                  setProfileEditCore({ ...profileEditCore, name: e.target.value })
                                }
                                className="h-8 text-xs focus-visible:ring-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Job Title / Role
                              </label>
                              <Input
                                value={profileEditCore.role}
                                onChange={(e) =>
                                  setProfileEditCore({ ...profileEditCore, role: e.target.value })
                                }
                                className="h-8 text-xs focus-visible:ring-primary"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1 col-span-2">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Work Email
                              </label>
                              <Input
                                value={profileEditCore.email}
                                onChange={(e) =>
                                  setProfileEditCore({ ...profileEditCore, email: e.target.value })
                                }
                                className="h-8 text-xs focus-visible:ring-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                                Status
                              </label>
                              <select
                                value={profileEditCore.status}
                                onChange={(e) =>
                                  setProfileEditCore({ ...profileEditCore, status: e.target.value })
                                }
                                className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                              >
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center md:text-left space-y-1">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                            <h2 className="text-2xl font-bold font-display text-foreground">
                              {cur.name}
                            </h2>
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[cur.status as keyof typeof STATUS_COLOR] || "bg-slate-100"}`}
                            >
                              {cur.status}
                            </span>
                          </div>
                          <p className="text-primary font-semibold text-sm">
                            {cur.role} • {empDetails.department}
                          </p>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" /> {cur.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> {cur.phone}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats inside Banner */}
                    <div className="flex items-center gap-4 bg-secondary/40 border border-border rounded-xl p-3.5 px-5">
                      <div className="text-center pr-4 border-r border-border">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                          Employee ID
                        </p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{cur.id}</p>
                      </div>
                      <div className="text-center pl-1">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                          Joining Date
                        </p>
                        {profileIsEditing && profileEditDetails ? (
                          <input
                            type="date"
                            value={profileEditCore.joinDate}
                            onChange={(e) =>
                              setProfileEditCore({ ...profileEditCore, joinDate: e.target.value })
                            }
                            className="text-xs bg-card text-card-foreground border border-border rounded px-1.5 py-0.5 mt-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <p className="text-sm font-bold text-foreground mt-0.5">
                            {safeFormatDate(cur.joinDate, "en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    {/* LEFT COLUMN */}
                    <div className="space-y-6 md:col-span-1">

                      {/* Quick Actions Card */}
                      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                          {profileIsEditing ? "Actions" : "Quick Actions"}
                        </h3>
                        {profileIsEditing ? (
                          <div className="space-y-2.5 pt-1">
                            <Button
                              onClick={handleSave}
                              className="w-full justify-center gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                            >
                              <Check className="h-4 w-4" /> Save Details
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="w-full justify-center gap-2 text-xs h-9 hover:bg-slate-100 transition-colors"
                            >
                              <X className="h-4 w-4" /> Cancel Edit
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2.5 pt-1">
                            <Button
                              variant="outline"
                              onClick={handleStartEdit}
                              className="w-full justify-start gap-2 text-xs h-9 hover:text-primary hover:bg-primary/5 hover:border-primary/40 transition-colors"
                            >
                              <Edit className="h-4 w-4" /> Edit Profile Details
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => {
                                const printWindow = window.open("", "_blank");
                                if (!printWindow) return;
                                const css = `body{font-family:sans-serif;padding:40px;color:#333}h1{color:var(--primary);margin-bottom:5px}.subtitle{color:#666;margin-bottom:30px;font-weight:bold}.section{margin-bottom:25px;border-bottom:1px solid #eee;padding-bottom:15px}.section-title{font-size:18px;color:var(--primary);margin-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.field{margin-bottom:8px}.label{font-size:11px;text-transform:uppercase;color:#888;font-weight:bold}.value{font-size:14px;font-weight:500;margin-top:2px}`;
                                const styleEl = printWindow.document.createElement("style");
                                styleEl.textContent = css;
                                printWindow.document.head.appendChild(styleEl);
                                const titleEl = printWindow.document.createElement("title");
                                titleEl.textContent = `Employee Profile - ${cur.name}`;
                                printWindow.document.head.appendChild(titleEl);
                                const safeText = (s: string) =>
                                  String(s ?? "")
                                    .replace(/</g, "&lt;")
                                    .replace(/>/g, "&gt;");
                                const bodyHtml = `<h1>${safeText(cur.name)}</h1><div class="subtitle">${safeText(cur.role)} &bull; ${safeText(empDetails.department)} (${safeText(cur.id)})</div><div class="section"><div class="section-title">Employment Details</div><div class="grid"><div class="field"><div class="label">Designation</div><div class="value">${safeText(empDetails.designation)}</div></div><div class="field"><div class="label">Employment Type</div><div class="value">${safeText(empDetails.employmentType)}</div></div><div class="field"><div class="label">Work Location</div><div class="value">${safeText(empDetails.workLocation)}</div></div><div class="field"><div class="label">Reporting Manager</div><div class="value">${safeText(empDetails.manager)}</div></div></div></div><div class="section"><div class="section-title">Contact Information</div><div class="grid"><div class="field"><div class="label">Work Phone</div><div class="value">${safeText(cur.phone)}</div></div><div class="field"><div class="label">Personal Phone</div><div class="value">${safeText(empDetails.personalPhone)}</div></div><div class="field"><div class="label">Work Email</div><div class="value">${safeText(cur.email)}</div></div><div class="field"><div class="label">Personal Email</div><div class="value">${safeText(empDetails.personalEmail)}</div></div></div></div>`;
                                const wrapper = printWindow.document.createElement("div");
                                wrapper.innerHTML = bodyHtml;
                                printWindow.document.body.appendChild(wrapper);
                                const script = printWindow.document.createElement("script");
                                script.textContent =
                                  "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
                                printWindow.document.body.appendChild(script);
                                printWindow.document.close();
                              }}
                              className="w-full justify-start gap-2 text-xs h-9 hover:text-primary hover:bg-primary/5 hover:border-primary/40 transition-colors"
                            >
                              <Download className="h-4 w-4" /> Download Profile
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Reporting Structure */}
                      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                          Reporting Structure
                        </h3>
                        {profileIsEditing && profileEditDetails ? (
                          <div className="space-y-3">
                            <EditField
                              label="Reporting Manager"
                              value={profileEditDetails.reportingManager}
                              onChange={(v) =>
                                setProfileEditDetails({
                                  ...profileEditDetails,
                                  reportingManager: v,
                                })
                              }
                            />
                            <EditField
                              label="Team Lead"
                              value={profileEditDetails.teamLead}
                              onChange={(v) =>
                                setProfileEditDetails({ ...profileEditDetails, teamLead: v })
                              }
                            />
                            <EditField
                              label="Direct Reports (Comma-separated)"
                              value={(profileEditDetails.directReports || []).join(", ")}
                              onChange={(v) =>
                                setProfileEditDetails({
                                  ...profileEditDetails,
                                  directReports: v
                                    .split(",")
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                                })
                              }
                            />
                          </div>
                        ) : (
                          <div className="space-y-3.5 text-sm">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">
                                Reporting Manager
                              </p>
                              <p className="font-semibold text-gray-800">
                                {empDetails.reportingManager}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Team Lead</p>
                              <p className="font-semibold text-gray-800">{empDetails.teamLead}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">
                                Direct Reports
                              </p>
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {(Array.isArray(empDetails.directReports) ? empDetails.directReports : [empDetails.directReports].filter(Boolean)).map((r, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-gray-100 font-semibold px-2 py-0.5 rounded-md text-muted-foreground"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Verification Details */}
                      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                          Verification Details
                        </h3>
                        {profileIsEditing && profileEditDetails ? (
                          <div className="space-y-3">
                            <EditField
                              label="PAN Number"
                              value={profileEditDetails.panNumber}
                              onChange={(v) =>
                                setProfileEditDetails({ ...profileEditDetails, panNumber: v })
                              }
                            />
                            <EditField
                              label="Aadhaar Number"
                              value={profileEditDetails.aadhaarNumber}
                              onChange={(v) =>
                                setProfileEditDetails({ ...profileEditDetails, aadhaarNumber: v })
                              }
                            />
                            <EditField
                              label="Passport Number"
                              value={profileEditDetails.passportNumber}
                              onChange={(v) =>
                                setProfileEditDetails({ ...profileEditDetails, passportNumber: v })
                              }
                            />
                            <EditSelect
                              label="Verification Status"
                              value={profileEditDetails.verificationStatus}
                              options={["Verified", "Pending", "Unverified"]}
                              onChange={(v) =>
                                setProfileEditDetails({
                                  ...profileEditDetails,
                                  verificationStatus: v,
                                })
                              }
                            />
                          </div>
                        ) : (
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                              <span className="text-muted-foreground text-xs font-medium">
                                Employee Code
                              </span>
                              <span className="font-semibold text-gray-800">{cur.id}</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                              <span className="text-muted-foreground text-xs font-medium">
                                PAN Number
                              </span>
                              <span className="font-semibold text-gray-800 tracking-wider">
                                {empDetails.panNumber}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                              <span className="text-muted-foreground text-xs font-medium">
                                Aadhaar Number
                              </span>
                              <span className="font-semibold text-gray-800">
                                {empDetails.aadhaarNumber}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                              <span className="text-muted-foreground text-xs font-medium">
                                Passport Number
                              </span>
                              <span className="font-semibold text-gray-800">
                                {empDetails.passportNumber}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 pt-1.5">
                              <span className="text-muted-foreground text-xs font-medium">
                                Verification Status
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${empDetails.verificationStatus === "Verified"
                                  ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                                  : "text-amber-600 bg-amber-50 border-amber-200"
                                  }`}
                              >
                                <CheckCircle className="h-3 w-3" /> {empDetails.verificationStatus}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Documents Center */}
                      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                          Documents Center
                        </h3>
                        <div className="space-y-2 pt-1">
                          {mockPerf.documents.map((doc, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 border border-gray-100 bg-gray-50/50 hover:bg-primary/10/20 rounded-xl transition-colors text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                                <div className="truncate">
                                  <p
                                    className="font-semibold text-gray-800 truncate"
                                    title={doc.name}
                                  >
                                    {doc.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {doc.type} • {doc.size}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => alert(`Downloading ${doc.name}...`)}
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-card text-card-foreground hover:border-primary/40 transition-colors cursor-pointer"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6 md:col-span-2">
                      {/* Performance Summary */}
                      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                          Performance Summary
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-4 pt-1">
                          {[
                            {
                              label: "KPI Score",
                              value: `${mockPerf.kpiScore}%`,
                              icon: <Award className="h-4 w-4" />,
                              color: "bg-primary/10 text-primary border-primary/20",
                            },
                            {
                              label: "Attendance %",
                              value: `${mockPerf.attendancePct}%`,
                              icon: <Clock className="h-4 w-4" />,
                              color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                            },
                            {
                              label: "Projects Completed",
                              value: mockPerf.projectsCompleted,
                              icon: <CheckCircle className="h-4 w-4" />,
                              color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                            },
                            {
                              label: "Monthly Rating",
                              value: `${mockPerf.monthlyRating} / 5`,
                              icon: <TrendingUp className="h-4 w-4" />,
                              color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                            },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className={`rounded-xl border p-4 text-center ${stat.color} flex flex-col items-center justify-center`}
                            >
                              <span className="p-1.5 bg-card text-card-foreground/80 rounded-lg shadow-sm border border-inherit mb-2 shrink-0">
                                {stat.icon}
                              </span>
                              <p className="text-xl font-bold">{stat.value}</p>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1.5">
                                {stat.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Active Projects */}
                      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                          Active Projects
                        </h3>
                        <div className="space-y-4 pt-1">
                          {mockPerf.activeProjects.map((p, i) => (
                            <div
                              key={i}
                              className="space-y-2 border border-gray-100 rounded-xl p-3.5 bg-gray-50/50"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-sm text-gray-800">{p.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    Deadline:{" "}
                                    {new Date(p.deadline).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.status === "In Progress"
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-blue-50 border-blue-200 text-blue-600"
                                    }`}
                                >
                                  {p.status}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-semibold">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="text-muted-foreground">{p.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${p.progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Employment Details */}
                      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                          Employment Details
                        </h3>
                        {profileIsEditing && profileEditDetails ? (
                          <div className="grid gap-4 sm:grid-cols-2 text-xs">
                            <div className="space-y-2.5">
                              <EditField
                                label="Department"
                                value={profileEditDetails.department}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, department: v })
                                }
                              />
                              <EditField
                                label="Designation"
                                value={profileEditDetails.designation}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, designation: v })
                                }
                              />
                              <EditSelect
                                label="Employment Type"
                                value={profileEditDetails.employmentType}
                                options={["Permanent", "Contract", "Intern", "Part-time"]}
                                onChange={(v) =>
                                  setProfileEditDetails({
                                    ...profileEditDetails,
                                    employmentType: v,
                                  })
                                }
                              />
                              <EditField
                                label="Work Location"
                                value={profileEditDetails.workLocation}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, workLocation: v })
                                }
                              />
                              <EditField
                                label="Reporting Manager"
                                value={profileEditDetails.manager}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, manager: v })
                                }
                              />
                            </div>
                            <div className="space-y-2.5">
                              <EditField
                                label="Assigned Team"
                                value={profileEditDetails.team}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, team: v })
                                }
                              />
                              <EditField
                                label="Total Experience"
                                value={profileEditDetails.experience}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, experience: v })
                                }
                              />
                              <EditField
                                label="Employee Level"
                                value={profileEditDetails.level}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, level: v })
                                }
                              />
                              <EditField
                                label="Skills (Comma-separated)"
                                value={(profileEditDetails.skills || []).join(", ")}
                                onChange={(v) =>
                                  setProfileEditDetails({
                                    ...profileEditDetails,
                                    skills: v
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                              <EditField
                                label="Certifications (Comma-separated)"
                                value={(profileEditDetails.certifications || []).join(", ")}
                                onChange={(v) =>
                                  setProfileEditDetails({
                                    ...profileEditDetails,
                                    certifications: v
                                      .split(",")
                                      .map((c) => c.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Department
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.department}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Designation
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.designation}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Employment Type
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.employmentType}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Work Location
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.workLocation}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Reporting Manager
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.manager}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Assigned Team
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.team}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Total Experience
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.experience}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Employee Level
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.level}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Skills
                                </span>
                                <div className="col-span-2 flex flex-wrap gap-1">
                                  {(empDetails.skills || []).map((s, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 py-1.5">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Certifications
                                </span>
                                <div className="col-span-2 flex flex-wrap gap-1">
                                  {(empDetails.certifications || []).map((c, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Personal Profile */}
                      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                          Personal Profile
                        </h3>
                        {profileIsEditing && profileEditDetails ? (
                          <div className="grid gap-4 sm:grid-cols-2 text-xs">
                            <div className="space-y-2.5">
                              <EditField
                                label="Date of Birth"
                                value={profileEditDetails.dob}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, dob: v })
                                }
                              />
                              <EditSelect
                                label="Gender"
                                value={profileEditDetails.gender}
                                options={["Female", "Male", "Other"]}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, gender: v })
                                }
                              />
                              <EditField
                                label="Nationality"
                                value={profileEditDetails.nationality}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, nationality: v })
                                }
                              />
                            </div>
                            <div className="space-y-2.5">
                              <EditSelect
                                label="Marital Status"
                                value={profileEditDetails.maritalStatus}
                                options={["Single", "Married", "Divorced", "Widowed"]}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, maritalStatus: v })
                                }
                              />
                              <EditField
                                label="Languages (Comma-separated)"
                                value={(profileEditDetails.languages || []).join(", ")}
                                onChange={(v) =>
                                  setProfileEditDetails({
                                    ...profileEditDetails,
                                    languages: v
                                      .split(",")
                                      .map((l) => l.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                  About / Bio
                                </label>
                                <textarea
                                  value={profileEditDetails.bio || ""}
                                  onChange={(e) =>
                                    setProfileEditDetails({
                                      ...profileEditDetails,
                                      bio: e.target.value,
                                    })
                                  }
                                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Date of Birth
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {safeFormatDate(empDetails.dob, "en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Gender
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.gender}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Nationality
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.nationality}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Marital Status
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.maritalStatus}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Languages
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {(empDetails.languages || []).join(", ")}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5">
                                <span className="text-muted-foreground text-xs font-medium">
                                  About / Bio
                                </span>
                                <span className="col-span-2 text-muted-foreground leading-relaxed font-medium">
                                  {cur.description || "Active system user."}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contact Information */}
                      <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                          Contact Information
                        </h3>
                        {profileIsEditing && profileEditDetails ? (
                          <div className="grid gap-4 sm:grid-cols-2 text-xs">
                            <div className="space-y-2.5">
                              <EditField
                                label="Work Phone"
                                value={profileEditCore.phone}
                                onChange={(v) =>
                                  setProfileEditCore({ ...profileEditCore, phone: v })
                                }
                              />
                              <EditField
                                label="Personal Phone"
                                value={profileEditDetails.personalPhone}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, personalPhone: v })
                                }
                              />
                              <EditField
                                label="Work Email"
                                value={profileEditCore.email}
                                onChange={(v) =>
                                  setProfileEditCore({ ...profileEditCore, email: v })
                                }
                              />
                              <EditField
                                label="Personal Email"
                                value={profileEditDetails.personalEmail}
                                onChange={(v) =>
                                  setProfileEditDetails({ ...profileEditDetails, personalEmail: v })
                                }
                              />
                            </div>
                            <div className="space-y-2.5">
                              <EditField
                                label="Current Address"
                                value={profileEditDetails.currentAddress}
                                onChange={(v) =>
                                  setProfileEditDetails({
                                    ...profileEditDetails,
                                    currentAddress: v,
                                  })
                                }
                              />
                              <EditField
                                label="Permanent Address"
                                value={profileEditDetails.permanentAddress}
                                onChange={(v) =>
                                  setProfileEditDetails({
                                    ...profileEditDetails,
                                    permanentAddress: v,
                                  })
                                }
                              />
                              <EditField
                                label="Emergency Contact"
                                value={profileEditDetails.emergencyContact}
                                onChange={(v) =>
                                  setProfileEditDetails({
                                    ...profileEditDetails,
                                    emergencyContact: v,
                                  })
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Work Phone
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {cur.phone}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Personal Phone
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.personalPhone}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Work Email
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {cur.email}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Personal Email
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800">
                                  {empDetails.personalEmail}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Current Address
                                </span>
                                <span className="col-span-2 text-xs font-medium text-gray-800 leading-relaxed">
                                  {empDetails.currentAddress}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-gray-100">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Permanent Address
                                </span>
                                <span className="col-span-2 text-xs font-medium text-gray-800 leading-relaxed">
                                  {empDetails.permanentAddress}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-1.5">
                                <span className="text-muted-foreground text-xs font-medium">
                                  Emergency Contact
                                </span>
                                <span className="col-span-2 font-semibold text-gray-800 text-xs">
                                  {empDetails.emergencyContact}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FULL WIDTH BOTTOM SECTIONS */}
                  <div className="space-y-6">
                    {/* Career History */}
                    <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                        Career History
                      </h3>
                      <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-primary/5 text-primary text-xs font-bold border-b border-border">
                            <tr>
                              <th className="px-4 py-3">Company</th>
                              <th className="px-4 py-3">Position</th>
                              <th className="px-4 py-3">Start Date</th>
                              <th className="px-4 py-3">End Date</th>
                              <th className="px-4 py-3">Responsibilities</th>
                              <th className="px-4 py-3">Achievement</th>
                              {profileIsEditing && (
                                <th className="px-4 py-3 text-right">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-muted-foreground bg-card text-card-foreground">
                            {profileIsEditing && profileEditDetails ? (
                              profileEditDetails.careerHistory.map((h, i) => (
                                <tr key={i} className="hover:bg-primary/10/10 transition-colors">
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={h.company}
                                      onChange={(e) =>
                                        updateProfileCareer(i, "company", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={h.position}
                                      onChange={(e) =>
                                        updateProfileCareer(i, "position", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      type="date"
                                      value={h.startDate}
                                      onChange={(e) =>
                                        updateProfileCareer(i, "startDate", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      type="date"
                                      value={h.endDate}
                                      onChange={(e) =>
                                        updateProfileCareer(i, "endDate", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={h.responsibilities}
                                      onChange={(e) =>
                                        updateProfileCareer(i, "responsibilities", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={h.achievement}
                                      onChange={(e) =>
                                        updateProfileCareer(i, "achievement", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    {isAdmin && (
  <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => deleteProfileCareer(i)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
)}
                                  </td>
                                </tr>
                              ))
                            ) : empDetails.careerHistory.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="px-4 py-8 text-center text-xs text-muted-foreground"
                                >
                                  No career history records logged.
                                </td>
                              </tr>
                            ) : (
                              empDetails.careerHistory.map((h, i) => (
                                <tr key={i} className="hover:bg-primary/10/10 transition-colors">
                                  <td className="px-4 py-3.5 font-semibold text-gray-800">
                                    {h.company}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs">{h.position}</td>
                                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                    {h.startDate
                                      ? safeFormatDate(h.startDate, "en-IN", {
                                        month: "short",
                                        year: "numeric",
                                      })
                                      : "N/A"}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                    {h.endDate
                                      ? safeFormatDate(h.endDate, "en-IN", {
                                        month: "short",
                                        year: "numeric",
                                      })
                                      : "Present"}
                                  </td>
                                  <td
                                    className="px-4 py-3.5 text-xs max-w-xs truncate"
                                    title={h.responsibilities}
                                  >
                                    {h.responsibilities}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs font-medium text-emerald-700">
                                    {h.achievement}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {profileIsEditing && (
                        <div className="pt-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-primary border-primary/30 hover:bg-primary/10 text-xs"
                            onClick={addProfileCareer}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Experience Row
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Academic Background */}
                    <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                        Academic Background
                      </h3>
                      <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-primary/5 text-primary text-xs font-bold border-b border-border">
                            <tr>
                              <th className="px-4 py-3">Institution</th>
                              <th className="px-4 py-3">Qualification</th>
                              <th className="px-4 py-3">Specialization</th>
                              <th className="px-4 py-3">Year</th>
                              <th className="px-4 py-3">Grade</th>
                              {profileIsEditing && (
                                <th className="px-4 py-3 text-right">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-muted-foreground bg-card text-card-foreground">
                            {profileIsEditing && profileEditDetails ? (
                              profileEditDetails.academicBackground.map((a, i) => (
                                <tr key={i} className="hover:bg-primary/10/10 transition-colors">
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={a.institution}
                                      onChange={(e) =>
                                        updateProfileAcademic(i, "institution", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={a.qualification}
                                      onChange={(e) =>
                                        updateProfileAcademic(i, "qualification", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={a.specialization}
                                      onChange={(e) =>
                                        updateProfileAcademic(i, "specialization", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={a.year}
                                      onChange={(e) =>
                                        updateProfileAcademic(i, "year", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={a.grade}
                                      onChange={(e) =>
                                        updateProfileAcademic(i, "grade", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    {isAdmin && (
  <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => deleteProfileAcademic(i)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
)}
                                  </td>
                                </tr>
                              ))
                            ) : empDetails.academicBackground.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-4 py-8 text-center text-xs text-muted-foreground"
                                >
                                  No academic records logged.
                                </td>
                              </tr>
                            ) : (
                              empDetails.academicBackground.map((a, i) => (
                                <tr key={i} className="hover:bg-primary/10/10 transition-colors">
                                  <td className="px-4 py-3.5 font-semibold text-gray-800">
                                    {a.institution}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs">{a.qualification}</td>
                                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                    {a.specialization}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                    {a.year}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs font-semibold text-gray-800">
                                    {a.grade}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {profileIsEditing && (
                        <div className="pt-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-primary border-primary/30 hover:bg-primary/10 text-xs"
                            onClick={addProfileAcademic}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Qualification Row
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Family Information */}
                    <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                        Family Information
                      </h3>
                      <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-primary/5 text-primary text-xs font-bold border-b border-border">
                            <tr>
                              <th className="px-4 py-3">Name</th>
                              <th className="px-4 py-3">Relationship</th>
                              <th className="px-4 py-3">Date of Birth</th>
                              <th className="px-4 py-3">Contact Number</th>
                              {profileIsEditing && (
                                <th className="px-4 py-3 text-right">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-muted-foreground bg-card text-card-foreground">
                            {profileIsEditing && profileEditDetails ? (
                              profileEditDetails.familyInformation.map((f, i) => (
                                <tr key={i} className="hover:bg-primary/10/10 transition-colors">
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={f.name}
                                      onChange={(e) =>
                                        updateProfileFamily(i, "name", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={f.relationship}
                                      onChange={(e) =>
                                        updateProfileFamily(i, "relationship", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      type="date"
                                      value={f.dob}
                                      onChange={(e) =>
                                        updateProfileFamily(i, "dob", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <Input
                                      className="h-7 text-xs"
                                      value={f.contactNumber}
                                      onChange={(e) =>
                                        updateProfileFamily(i, "contactNumber", e.target.value)
                                      }
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 text-right">
                                    {isAdmin && (
  <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => deleteProfileFamily(i)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
)}
                                  </td>
                                </tr>
                              ))
                            ) : empDetails.familyInformation.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-8 text-center text-xs text-muted-foreground"
                                >
                                  No dependent records logged.
                                </td>
                              </tr>
                            ) : (
                              empDetails.familyInformation.map((f, i) => (
                                <tr key={i} className="hover:bg-primary/10/10 transition-colors">
                                  <td className="px-4 py-3.5 font-semibold text-gray-800">
                                    {f.name}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                    {f.relationship}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                    {f.dob
                                      ? safeFormatDate(f.dob, "en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                      : "N/A"}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-gray-800 font-medium">
                                    {f.contactNumber}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {profileIsEditing && (
                        <div className="pt-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-primary border-primary/30 hover:bg-primary/10 text-xs"
                            onClick={addProfileFamily}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Dependent Row
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Employee Records (Accordion-style) */}
                    <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm space-y-4">
                      <h3 className="font-bold text-base text-foreground border-b border-gray-100 pb-2">
                        Employee Records
                      </h3>
                      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card text-card-foreground">
                        {[
                          "Performance Reviews",
                          "Documents",
                          "Payroll Records",
                          "Company Assets",
                          "Training Certificates",
                        ].map((rec) => {
                          const isExpanded = expandedSection === rec;
                          return (
                            <div key={rec} className="border-b last:border-b-0 border-gray-100">
                              <div
                                onClick={() => setExpandedSection(isExpanded ? null : rec)}
                                className="flex items-center justify-between px-4 py-3.5 hover:bg-primary/10/20 cursor-pointer group transition-colors"
                              >
                                <span className="font-semibold text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                  {rec}
                                </span>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-primary" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="bg-gray-50/50 p-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-1 duration-150">


                                  {/* PERFORMANCE REVIEWS */}
                                  {rec === "Performance Reviews" &&
                                    (() => {
                                      const empRev = reviews.filter((r) => r.empId === cur.id);
                                      return (
                                        <div className="space-y-3">
                                          <div className="overflow-x-auto border border-border rounded-lg bg-card text-card-foreground">
                                            <table className="w-full text-left text-xs">
                                              <thead className="bg-gray-50 text-muted-foreground font-bold border-b border-border">
                                                <tr>
                                                  <th className="p-2.5">Period</th>
                                                  <th className="p-2.5">Rating</th>
                                                  <th className="p-2.5">Reviewer</th>
                                                  <th className="p-2.5">Feedback</th>
                                                  <th className="p-2.5">Date</th>
                                                  <th className="p-2.5 text-right">Action</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-border">
                                                {empRev.map((r) => (
                                                  <tr key={r.id} className="hover:bg-gray-50">
                                                    <td className="p-2.5 font-medium">
                                                      {r.period}
                                                    </td>
                                                    <td className="p-2.5 text-orange-500 font-semibold">
                                                      {r.rating} / 5.0
                                                    </td>
                                                    <td className="p-2.5">{r.reviewer}</td>
                                                    <td
                                                      className="p-2.5 text-muted-foreground max-w-[200px] truncate"
                                                      title={r.feedback}
                                                    >
                                                      {r.feedback}
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {r.date}
                                                    </td>
                                                    <td className="p-2.5 text-right">
                                                      {isAdmin && (
  <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                          onClick={() =>
                                                            setReviews(
                                                              reviews.filter(
                                                                (item) => item.id !== r.id,
                                                              ),
                                                            )
                                                          }
                                                        >
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
)}
                                                    </td>
                                                  </tr>
                                                ))}
                                                {empRev.length === 0 && (
                                                  <tr>
                                                    <td
                                                      colSpan={6}
                                                      className="p-4 text-center text-muted-foreground"
                                                    >
                                                      No performance reviews.
                                                    </td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>

                                          <div className="bg-card text-card-foreground p-3.5 rounded-lg border border-border space-y-2.5">
                                            <p className="text-xs font-bold text-gray-800">
                                              Add Performance Review
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                              <input
                                                type="text"
                                                placeholder="Period (e.g. Q2 2026)"
                                                value={addReviewPeriod}
                                                onChange={(e) => setAddReviewPeriod(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              />
                                              <select
                                                value={addReviewRating}
                                                onChange={(e) => setAddReviewRating(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              >
                                                <option>5.0</option>
                                                <option>4.5</option>
                                                <option>4.0</option>
                                                <option>3.5</option>
                                                <option>3.0</option>
                                              </select>
                                              <input
                                                type="text"
                                                placeholder="Feedback Comments"
                                                value={addReviewFeedback}
                                                onChange={(e) =>
                                                  setAddReviewFeedback(e.target.value)
                                                }
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none col-span-2"
                                              />
                                            </div>
                                            <div className="text-right">
                                              <Button
                                                onClick={() => {
                                                  if (!addReviewPeriod || !addReviewFeedback)
                                                    return alert(
                                                      "Please fill review period and feedback",
                                                    );
                                                  const newRev = {
                                                    id: `REV-${Date.now()}`,
                                                    empId: cur.id,
                                                    period: addReviewPeriod,
                                                    rating: parseFloat(addReviewRating),
                                                    feedback: addReviewFeedback,
                                                    reviewer: "Manvendra Singhal",
                                                    date: new Date().toISOString().slice(0, 10),
                                                  };
                                                  setReviews([...reviews, newRev]);
                                                  setAddReviewPeriod("");
                                                  setAddReviewFeedback("");
                                                }}
                                                className="h-7 text-[11px] px-3 bg-primary text-white hover:bg-primary/90"
                                              >
                                                Save Review
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                  {/* DOCUMENTS */}
                                  {rec === "Documents" &&
                                    (() => {
                                      const empDocs = hrFiles.filter(
                                        (d) => d.empId === cur.id || !d.empId,
                                      );
                                      return (
                                        <div className="space-y-3">
                                          <div className="overflow-x-auto border border-border rounded-lg bg-card text-card-foreground">
                                            <table className="w-full text-left text-xs">
                                              <thead className="bg-gray-50 text-muted-foreground font-bold border-b border-border">
                                                <tr>
                                                  <th className="p-2.5">Doc Name</th>
                                                  <th className="p-2.5">Type</th>
                                                  <th className="p-2.5">Size</th>
                                                  <th className="p-2.5">Upload Date</th>
                                                  <th className="p-2.5 text-right">Action</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-border">
                                                {empDocs.map((d) => (
                                                  <tr key={d.id} className="hover:bg-gray-50">
                                                    <td className="p-2.5 font-medium flex items-center gap-1.5">
                                                      <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                                      <span className="truncate max-w-[150px]">
                                                        {d.name}
                                                      </span>
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {d.type || "Document"}
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {d.size}
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {d.date}
                                                    </td>
                                                    <td className="p-2.5 text-right">
                                                      {isAdmin && (
  <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                          onClick={() =>
                                                            setHrFiles(
                                                              hrFiles.filter(
                                                                (item) => item.id !== d.id,
                                                              ),
                                                            )
                                                          }
                                                        >
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
)}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>

                                          <div className="bg-card text-card-foreground p-3.5 rounded-lg border border-border space-y-2.5">
                                            <p className="text-xs font-bold text-gray-800">
                                              Upload / Add Document Record
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                              <input
                                                type="text"
                                                placeholder="File Name (e.g. Passport.pdf)"
                                                value={addDocName}
                                                onChange={(e) => setAddDocName(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              />
                                              <select
                                                value={addDocType}
                                                onChange={(e) => setAddDocType(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              >
                                                <option>Resume</option>
                                                <option>Offer Letter</option>
                                                <option>ID Proof</option>
                                                <option>Other</option>
                                              </select>
                                              <input
                                                type="text"
                                                placeholder="File Size (e.g. 500 KB)"
                                                value={addDocSize}
                                                onChange={(e) => setAddDocSize(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              />
                                            </div>
                                            <div className="text-right">
                                              <Button
                                                onClick={() => {
                                                  if (!addDocName)
                                                    return alert("Please fill file name");
                                                  const newD = {
                                                    id: `DOC-${Date.now()}`,
                                                    empId: cur.id,
                                                    name: addDocName,
                                                    type: addDocType,
                                                    size: addDocSize,
                                                    date: new Date().toISOString().slice(0, 10),
                                                    uploader: "Manvendra Singhal",
                                                  };
                                                  setHrFiles([...hrFiles, newD]);
                                                  setAddDocName("");
                                                }}
                                                className="h-7 text-[11px] px-3 bg-primary text-white hover:bg-primary/90"
                                              >
                                                Log Document
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                  {/* PAYROLL RECORDS */}
                                  {rec === "Payroll Records" &&
                                    (() => {
                                      const empPay = payroll.filter((p) => p.empId === cur.id);
                                      return (
                                        <div className="space-y-3">
                                          <div className="overflow-x-auto border border-border rounded-lg bg-card text-card-foreground">
                                            <table className="w-full text-left text-xs">
                                              <thead className="bg-gray-50 text-muted-foreground font-bold border-b border-border">
                                                <tr>
                                                  <th className="p-2.5">Month</th>
                                                  <th className="p-2.5">Net Salary</th>
                                                  <th className="p-2.5">Tx ID</th>
                                                  <th className="p-2.5">Paid Date</th>
                                                  <th className="p-2.5">Status</th>
                                                  <th className="p-2.5 text-right">Action</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-border">
                                                {empPay.map((p) => (
                                                  <tr key={p.id} className="hover:bg-gray-50">
                                                    <td className="p-2.5 font-medium">{p.month}</td>
                                                    <td className="p-2.5 text-gray-800 font-bold">
                                                      ₹{p.salary.toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {p.txId}
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {p.date}
                                                    </td>
                                                    <td className="p-2.5">
                                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        {p.status}
                                                      </span>
                                                    </td>
                                                    <td className="p-2.5 text-right">
                                                      {isAdmin && (
  <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                          onClick={() =>
                                                            setPayroll(
                                                              payroll.filter(
                                                                (item) => item.id !== p.id,
                                                              ),
                                                            )
                                                          }
                                                        >
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
)}
                                                    </td>
                                                  </tr>
                                                ))}
                                                {empPay.length === 0 && (
                                                  <tr>
                                                    <td
                                                      colSpan={6}
                                                      className="p-4 text-center text-muted-foreground"
                                                    >
                                                      No payroll slips logged.
                                                    </td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>

                                          <div className="bg-card text-card-foreground p-3.5 rounded-lg border border-border space-y-2.5">
                                            <p className="text-xs font-bold text-gray-800">
                                              Record Salary Disbursal
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                              <input
                                                type="text"
                                                placeholder="Month (e.g. June 2026)"
                                                value={addPayMonth}
                                                onChange={(e) => setAddPayMonth(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              />
                                              <input
                                                type="number"
                                                placeholder="Amount (INR)"
                                                value={addPaySalary}
                                                onChange={(e) => setAddPaySalary(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              />
                                              <select
                                                value={addPayStatus}
                                                onChange={(e) => setAddPayStatus(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              >
                                                <option>Paid</option>
                                                <option>Processing</option>
                                              </select>
                                            </div>
                                            <div className="text-right">
                                              <Button
                                                onClick={() => {
                                                  if (!addPayMonth || !addPaySalary)
                                                    return alert("Please fill month and amount");
                                                  const newP = {
                                                    id: `PAY-${Date.now()}`,
                                                    empId: cur.id,
                                                    month: addPayMonth,
                                                    salary: parseInt(addPaySalary),
                                                    status: addPayStatus,
                                                    txId: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
                                                    date: new Date().toISOString().slice(0, 10),
                                                  };
                                                  setPayroll([...payroll, newP]);
                                                  setAddPayMonth("");
                                                  setAddPaySalary("");
                                                }}
                                                className="h-7 text-[11px] px-3 bg-primary text-white hover:bg-primary/90"
                                              >
                                                Disburse Salary
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                  {/* COMPANY ASSETS */}
                                  {rec === "Company Assets" &&
                                    (() => {
                                      const empAssets = assets.filter((a) => a.empId === cur.id);
                                      return (
                                        <div className="space-y-3">
                                          <div className="overflow-x-auto border border-border rounded-lg bg-card text-card-foreground">
                                            <table className="w-full text-left text-xs">
                                              <thead className="bg-gray-50 text-muted-foreground font-bold border-b border-border">
                                                <tr>
                                                  <th className="p-2.5">Asset Name</th>
                                                  <th className="p-2.5">Type</th>
                                                  <th className="p-2.5">Serial No</th>
                                                  <th className="p-2.5">Assigned Date</th>
                                                  <th className="p-2.5 text-right">Action</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-border">
                                                {empAssets.map((a) => (
                                                  <tr key={a.id} className="hover:bg-gray-50">
                                                    <td className="p-2.5 font-medium">{a.name}</td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {a.type}
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground font-mono">
                                                      {a.serial}
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {a.date}
                                                    </td>
                                                    <td className="p-2.5 text-right">
                                                      {isAdmin && (
  <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                          onClick={() =>
                                                            setAssets(
                                                              assets.filter(
                                                                (item) => item.id !== a.id,
                                                              ),
                                                            )
                                                          }
                                                        >
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
)}
                                                    </td>
                                                  </tr>
                                                ))}
                                                {empAssets.length === 0 && (
                                                  <tr>
                                                    <td
                                                      colSpan={5}
                                                      className="p-4 text-center text-muted-foreground"
                                                    >
                                                      No assets assigned.
                                                    </td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>

                                          <div className="bg-card text-card-foreground p-3.5 rounded-lg border border-border space-y-2.5">
                                            <p className="text-xs font-bold text-gray-800">
                                              Assign Company Asset
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                              <input
                                                type="text"
                                                placeholder="Asset Name (e.g. iPhone 13)"
                                                value={addAssetName}
                                                onChange={(e) => setAddAssetName(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              />
                                              <input
                                                type="text"
                                                placeholder="Serial / Tag Number"
                                                value={addAssetSerial}
                                                onChange={(e) => setAddAssetSerial(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              />
                                              <select
                                                value={addAssetType}
                                                onChange={(e) => setAddAssetType(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              >
                                                <option>Laptop</option>
                                                <option>Mobile Phone</option>
                                                <option>Accessories</option>
                                                <option>Other</option>
                                              </select>
                                            </div>
                                            <div className="text-right">
                                              <Button
                                                onClick={() => {
                                                  if (!addAssetName || !addAssetSerial)
                                                    return alert(
                                                      "Please fill asset name and serial number",
                                                    );
                                                  const newAst = {
                                                    id: `AST-${Date.now()}`,
                                                    empId: cur.id,
                                                    name: addAssetName,
                                                    serial: addAssetSerial,
                                                    type: addAssetType,
                                                    value: 30000,
                                                    date: new Date().toISOString().slice(0, 10),
                                                  };
                                                  setAssets([...assets, newAst]);
                                                  setAddAssetName("");
                                                  setAddAssetSerial("");
                                                }}
                                                className="h-7 text-[11px] px-3 bg-primary text-white hover:bg-primary/90"
                                              >
                                                Assign Asset
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                  {/* TRAINING CERTIFICATES */}
                                  {rec === "Training Certificates" &&
                                    (() => {
                                      const empCerts = certificates.filter(
                                        (c) => c.empId === cur.id,
                                      );
                                      return (
                                        <div className="space-y-3">
                                          <div className="overflow-x-auto border border-border rounded-lg bg-card text-card-foreground">
                                            <table className="w-full text-left text-xs">
                                              <thead className="bg-gray-50 text-muted-foreground font-bold border-b border-border">
                                                <tr>
                                                  <th className="p-2.5">Certificate Name</th>
                                                  <th className="p-2.5">Issuer</th>
                                                  <th className="p-2.5">Completion Date</th>
                                                  <th className="p-2.5 text-right">Action</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-border">
                                                {empCerts.map((c) => (
                                                  <tr key={c.id} className="hover:bg-gray-50">
                                                    <td className="p-2.5 font-medium flex items-center gap-1.5">
                                                      <Award className="h-3.5 w-3.5 text-primary" />
                                                      <span>{c.name}</span>
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {c.issuer}
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground">
                                                      {c.date}
                                                    </td>
                                                    <td className="p-2.5 text-right">
                                                      {isAdmin && (
  <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                          onClick={() =>
                                                            setCertificates(
                                                              certificates.filter(
                                                                (item) => item.id !== c.id,
                                                              ),
                                                            )
                                                          }
                                                        >
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
)}
                                                    </td>
                                                  </tr>
                                                ))}
                                                {empCerts.length === 0 && (
                                                  <tr>
                                                    <td
                                                      colSpan={4}
                                                      className="p-4 text-center text-muted-foreground"
                                                    >
                                                      No certificates logged.
                                                    </td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>

                                          <div className="bg-card text-card-foreground p-3.5 rounded-lg border border-border space-y-2.5">
                                            <p className="text-xs font-bold text-gray-800">
                                              Add Training Certificate
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                              <input
                                                type="text"
                                                placeholder="Certificate Name"
                                                value={addCertName}
                                                onChange={(e) => setAddCertName(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              />
                                              <input
                                                type="text"
                                                placeholder="Issuing Authority (e.g. Udemy)"
                                                value={addCertIssuer}
                                                onChange={(e) => setAddCertIssuer(e.target.value)}
                                                className="h-8 rounded border border-border bg-background px-2 text-xs outline-none"
                                              />
                                            </div>
                                            <div className="text-right">
                                              <Button
                                                onClick={() => {
                                                  if (!addCertName || !addCertIssuer)
                                                    return alert(
                                                      "Please fill certificate name and issuer",
                                                    );
                                                  const newCert = {
                                                    id: `CRT-${Date.now()}`,
                                                    empId: cur.id,
                                                    name: addCertName,
                                                    issuer: addCertIssuer,
                                                    date: new Date().toISOString().slice(0, 10),
                                                    url: "#",
                                                  };
                                                  setCertificates([...certificates, newCert]);
                                                  setAddCertName("");
                                                  setAddCertIssuer("");
                                                }}
                                                className="h-7 text-[11px] px-3 bg-primary text-white hover:bg-primary/90"
                                              >
                                                Log Certificate
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>


                  </div>
                </div>
              );
            })()}

          {activeTab === "Leave" &&
            (() => {
              const cur =
                employees.find(
                  (e) => (e.name && auth?.name && e.name.toLowerCase() === auth.name.toLowerCase()) || e.id === auth?.empId,
                ) || employees[0];
              const myLeaves = leaves.filter((l) => l.empId === cur.id || l.empName === cur.name);
              return (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                  {/* Leave Balance Stats */}
                  <div className="grid gap-4 grid-cols-3">
                    {[
                      {
                        label: "Casual Leave",
                        total: 8,
                        booked: myLeaves.filter(
                          (l) => l.type === "Casual Leave" && l.status === "Approved",
                        ).length,
                        color: "border-l-emerald-500 bg-emerald-500/5 text-emerald-700",
                      },
                      {
                        label: "Sick Leave",
                        total: 5,
                        booked: myLeaves.filter(
                          (l) => l.type === "Sick Leave" && l.status === "Approved",
                        ).length,
                        color: "border-l-blue-500 bg-blue-500/5 text-blue-700",
                      },
                      {
                        label: "Earned Leave",
                        total: 10,
                        booked: myLeaves.filter(
                          (l) => l.type === "Earned Leave" && l.status === "Approved",
                        ).length,
                        color: "border-l-amber-500 bg-amber-500/5 text-amber-700",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className={`rounded-xl border border-border border-l-4 p-4 shadow-sm ${s.color}`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                          {s.label}
                        </p>
                        <div className="mt-2 flex items-baseline justify-between">
                          <p className="text-2xl font-bold">
                            {s.total - s.booked}{" "}
                            <span className="text-xs font-normal opacity-70">Avail</span>
                          </p>
                          <p className="text-xs font-medium">
                            Booked: {s.booked} / {s.total}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Left Side: Leaves List */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">My Leave Applications</h3>
                        <Button
                          onClick={() => setIsLeaveModalOpen(true)}
                          className="gap-1.5 rounded-xl text-xs h-9"
                        >
                          <Plus className="h-4 w-4" /> Apply Leave
                        </Button>
                      </div>

                      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-secondary/40 text-muted-foreground text-xs font-medium border-b border-border">
                            <tr>
                              <th className="px-4 py-3">Leave Type</th>
                              <th className="px-4 py-3">Dates</th>
                              <th className="px-4 py-3">Reason</th>
                              <th className="px-4 py-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {myLeaves.map((l) => (
                              <tr key={l.id} className="hover:bg-secondary/20">
                                <td className="px-4 py-3.5 font-medium">{l.type}</td>
                                <td className="px-4 py-3.5 text-muted-foreground">
                                  {new Date(l.fromDate).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                  })}{" "}
                                  -{" "}
                                  {new Date(l.toDate).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "2-digit",
                                  })}
                                </td>
                                <td
                                  className="px-4 py-3.5 text-muted-foreground max-w-xs truncate"
                                  title={l.reason}
                                >
                                  {l.reason}
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <span
                                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${l.status === "Approved"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : l.status === "Rejected"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                      }`}
                                  >
                                    {l.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {myLeaves.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-8 text-center text-muted-foreground"
                                >
                                  No leave requests found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Side: Holidays Calendar */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Upcoming Holidays</h3>
                      <div className="bg-card rounded-xl border border-border shadow-sm p-4 divide-y divide-border">
                        {getUpcomingHolidays(5).map((h) => (
                          <div
                            key={h.name + h.isoDate}
                            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-sm">{h.name}</p>
                              <p className="text-xs text-muted-foreground">{h.day}</p>
                            </div>
                            <span className="text-xs font-semibold bg-secondary px-2.5 py-1 rounded-lg text-muted-foreground">
                              {new Date(h.isoDate + "T00:00:00").toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        ))}
                        {getUpcomingHolidays(5).length === 0 && (
                          <div className="text-center py-4 text-xs text-muted-foreground">No upcoming holidays</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {activeTab === "Attendance" &&
            (() => {
              const cur =
                employees.find(
                  (e) => (e.name && auth?.name && e.name.toLowerCase() === auth.name.toLowerCase()) || e.id === auth?.empId,
                ) || employees[0];
              const myLogs = attendance.filter((r) => r.empId === cur.id);
              const todayStr = new Date().toISOString().slice(0, 10);
              const todayLog = myLogs.find((r) => r.date === todayStr);

              const handlePunch = () => {
                const nowTime = new Date().toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                if (!todayLog) {
                  // Clock In
                  const newRecord = {
                    id: `ATT-${Date.now()}`,
                    empId: cur.id,
                    name: cur.name,
                    role: cur.role,
                    phone: cur.phone,
                    avatar: cur.avatar,
                    date: todayStr,
                    clockIn: nowTime,
                    clockOut: null,
                    clockInLocation: punchLocation,
                    note: punchNote || "Punch in via dashboard",
                    status: "Present",
                  };
                  setAttendance([newRecord, ...attendance]);
                  setPunchNote("");
                } else if (!todayLog.clockOut) {
                  // Clock Out
                  const updated = attendance.map((r) =>
                    r.id === todayLog.id
                      ? { ...r, clockOut: nowTime, clockOutLocation: punchLocation }
                      : r,
                  );
                  setAttendance(updated);
                }
              };

              return (
                <div className="grid gap-6 md:grid-cols-3 animate-in fade-in-50 duration-200">
                  {/* Punch Board */}
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-5">
                    <div className="text-center">
                      <Clock className="h-10 w-10 text-primary mx-auto mb-2 animate-pulse" />
                      <h3 className="font-semibold text-lg">Punch Clock</h3>
                      <p className="text-2xl font-bold tracking-tight mt-1">
                        {new Date().toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date().toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="p-loc">Work Location</Label>
                        <select
                          id="p-loc"
                          disabled={!!todayLog?.clockOut}
                          value={punchLocation}
                          onChange={(e) => setPunchLocation(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                        >
                          <option>JTM Mall Office</option>
                          <option>Work from Home</option>
                          <option>On-site Client Visit</option>
                        </select>
                      </div>

                      {!todayLog && (
                        <div className="space-y-1.5">
                          <Label htmlFor="p-note">Daily Check-in Note</Label>
                          <Input
                            id="p-note"
                            placeholder="What is your plan for today?"
                            value={punchNote}
                            onChange={(e) => setPunchNote(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {todayLog?.clockIn && (
                      <div className="rounded-xl bg-secondary/50 p-3 space-y-1.5 text-xs">
                        <p className="flex justify-between">
                          <span>Clocked In:</span>{" "}
                          <span className="font-semibold text-emerald-600">
                            {todayLog.clockIn} ({todayLog.clockInLocation || "Office"})
                          </span>
                        </p>
                        {todayLog.clockOut && (
                          <p className="flex justify-between">
                            <span>Clocked Out:</span>{" "}
                            <span className="font-semibold text-red-600">{todayLog.clockOut}</span>
                          </p>
                        )}
                        {todayLog.note && (
                          <p className="text-[11px] text-muted-foreground italic mt-1 border-t pt-1">
                            "{todayLog.note}"
                          </p>
                        )}
                      </div>
                    )}

                    {!todayLog?.clockOut ? (
                      <Button
                        onClick={handlePunch}
                        className={`w-full py-5 rounded-xl font-bold gap-2 ${!todayLog ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                      >
                        {!todayLog ? (
                          <>
                            <Play className="h-4 w-4 fill-white" /> Clock In
                          </>
                        ) : (
                          <>
                            <Square className="h-4 w-4 fill-white" /> Clock Out
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-center text-xs font-semibold">
                        🎉 Shift Completed Successfully!
                      </div>
                    )}
                  </div>

                  {/* History Table */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="font-semibold text-lg">My Attendance Logs</h3>
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/40 text-muted-foreground text-xs font-medium border-b border-border">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Clock In</th>
                            <th className="px-4 py-3">Clock Out</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {myLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-secondary/20">
                              <td className="px-4 py-3.5 font-medium">
                                {new Date(log.date).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-emerald-600">
                                {log.clockIn}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-red-600">
                                {log.clockOut || "-"}
                              </td>
                              <td className="px-4 py-3.5 text-muted-foreground text-xs">
                                {log.clockInLocation || "Office"}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <span className="inline-block rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-semibold">
                                  {log.status || "Present"}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {myLogs.length === 0 && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-8 text-center text-muted-foreground"
                              >
                                No attendance records clocked.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}



          {activeTab === "Feeds" &&
            (() => {
              const handlePost = (e: React.FormEvent) => {
                e.preventDefault();
                if (!feedText.trim()) return;
                const newPost = {
                  id: `feed-${Date.now()}`,
                  user: auth?.name || "Manvendra Singhal",
                  avatar: auth?.avatar || "/avatars/manvendra.png",
                  role: isAdmin ? "HR & Admin Manager" : "Team Member",
                  content: feedText,
                  date: new Date().toISOString(),
                  likes: 0,
                  likedBy: [],
                };
                setFeeds([newPost, ...feeds]);
                setFeedText("");
              };

              const handleLike = (id: string) => {
                const updated = feeds.map((post) => {
                  if (post.id === id) {
                    const likedBy = post.likedBy || [];
                    const userKey = auth?.name || "anonymous";
                    const alreadyLiked = likedBy.includes(userKey);
                    return {
                      ...post,
                      likes: alreadyLiked ? post.likes - 1 : post.likes + 1,
                      likedBy: alreadyLiked
                        ? likedBy.filter((u: string) => u !== userKey)
                        : [...likedBy, userKey],
                    };
                  }
                  return post;
                });
                setFeeds(updated);
              };

              return (
                <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-200">
                  {/* Create Post */}
                  <form
                    onSubmit={handlePost}
                    className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <textarea
                      placeholder="Share an announcement, update, or thought..."
                      value={feedText}
                      onChange={(e) => setFeedText(e.target.value)}
                      className="w-full min-h-[80px] text-sm bg-secondary/20 focus:bg-background border border-transparent focus:border-border rounded-xl p-3 resize-none focus:outline-none transition-colors"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!feedText.trim()}
                        className="rounded-xl h-9 text-xs px-4"
                      >
                        Share Post
                      </Button>
                    </div>
                  </form>

                  {/* Posts List */}
                  <div className="space-y-4">
                    {feeds.map((post) => {
                      const userKey = auth?.name || "anonymous";
                      const isLiked = (post.likedBy || []).includes(userKey);
                      return (
                        <div
                          key={post.id}
                          className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3 hover:border-border/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={post.avatar || "https://i.pravatar.cc/80"}
                              alt={post.user}
                              className="h-10 w-10 rounded-full object-cover border"
                            />
                            <div>
                              <p className="font-semibold text-sm leading-tight">{post.user}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {post.role} •{" "}
                                {new Date(post.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                            {post.content}
                          </p>
                          <div className="flex items-center gap-4 pt-2 border-t text-xs">
                            <button
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center gap-1.5 font-semibold py-1 px-3 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer ${isLiked ? "text-rose-600" : "text-muted-foreground"}`}
                            >
                              <Heart
                                className={`h-4 w-4 ${isLiked ? "fill-rose-600 text-rose-600" : ""}`}
                              />
                              <span>{post.likes}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          {activeTab === "Files" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Document Vault</h3>
                  <p className="text-xs text-muted-foreground">
                    Access policies, handbooks, and documents.
                  </p>
                </div>
                {isAdmin && (
                  <Button
                    onClick={() => setIsFileModalOpen(true)}
                    className="gap-1.5 rounded-xl text-xs h-9"
                  >
                    <Upload className="h-4 w-4" /> Upload Document
                  </Button>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/40 text-muted-foreground text-xs font-medium border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Document Name</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Upload Date</th>
                      <th className="px-4 py-3">Uploader</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {hrFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-secondary/20">
                        <td className="px-4 py-3.5 flex items-center gap-2 font-medium">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span>{file.name}</span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">{file.size}</td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">
                          {new Date(file.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">
                          {file.uploader}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() =>
                              alert(`Simulated download for ${file.name} triggered successfully!`)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Time Logs" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Time Tracker</h3>
                  <p className="text-xs text-muted-foreground">
                    Log hours worked on client itineraries and operations.
                  </p>
                </div>
                <Button
                  onClick={() => setIsTimeLogModalOpen(true)}
                  className="gap-1.5 rounded-xl text-xs h-9"
                >
                  <Clock className="h-4 w-4" /> Log Hours
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-card text-center flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Logged This Week
                  </p>
                  <p className="text-3xl font-bold mt-2 text-primary">
                    {timeLogs.reduce((s, l) => s + l.hours, 0)} hrs
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Goal: 40 hrs</p>
                </div>

                <div className="md:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/40 text-muted-foreground text-xs font-medium border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3">Task Description</th>
                        <th className="px-4 py-3">Hours</th>
                        <th className="px-4 py-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {timeLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-secondary/20">
                          <td className="px-4 py-3.5 font-medium">{log.employee}</td>
                          <td className="px-4 py-3.5 text-xs text-primary font-semibold">
                            {log.project}
                          </td>
                          <td
                            className="px-4 py-3.5 text-muted-foreground text-xs max-w-xs truncate"
                            title={log.task}
                          >
                            {log.task}
                          </td>
                          <td className="px-4 py-3.5 font-bold">{log.hours}</td>
                          <td className="px-4 py-3.5 text-right text-muted-foreground text-xs">
                            {new Date(log.date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Activities" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <h3 className="font-semibold text-lg">Activity Logs</h3>
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="relative border-l-2 border-border pl-6 ml-3 space-y-6">
                  {[
                    {
                      title: "Checked in for the day",
                      desc: "Work mode: JTM Mall Office",
                      date: "2026-06-19T09:30:00Z",
                      user: "Suman Yadav",
                    },
                    {
                      title: "Submitted Maldives Package proposal",
                      desc: "Itinerary sent to Mr. Gupta",
                      date: "2026-06-19T11:45:00Z",
                      user: "Nikita Bairwa",
                    },
                    {
                      title: "Leave request approved",
                      desc: "Pushplata Kriplani: Casual Leave approved",
                      date: "2026-06-18T16:00:00Z",
                      user: "Suman Yadav",
                    },
                    {
                      title: "Schengen Visa processed",
                      desc: "Deepak Kumar completed submittals",
                      date: "2026-06-17T12:00:00Z",
                      user: "Deepak Kumar",
                    },
                  ].map((act, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[31px] top-0.5 bg-background border-2 border-primary h-4 w-4 rounded-full flex items-center justify-center"></span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{act.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {act.desc} • By {act.user}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(act.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Career History" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <h3 className="font-semibold text-lg">Career Milestones</h3>
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="relative border-l-2 border-border pl-6 ml-3 space-y-6">
                  {[
                    {
                      role: "Promoted to HR & Admin Manager",
                      dept: "HR & Operations",
                      date: "2025-06-01",
                      desc: "Overseeing all talent and administrative functions at LookMyHolidays.",
                    },
                    {
                      role: "Senior Operations Coordinator",
                      dept: "Operations",
                      date: "2023-03-15",
                      desc: "Managed end-to-end travel reservations and vendors.",
                    },
                    {
                      role: "Joined as Operations Associate",
                      dept: "Operations",
                      date: "2022-01-15",
                      desc: "Coordinated local sightseeing itineraries and bookings.",
                    },
                  ].map((job, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[31px] top-0.5 bg-background border-2 border-emerald-500 h-4 w-4 rounded-full flex items-center justify-center"></span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{job.role}</p>
                        <p className="text-xs text-primary font-medium mt-0.5">{job.dept}</p>
                        <p className="text-xs text-muted-foreground mt-1">{job.desc}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Effective:{" "}
                          {new Date(job.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Related Data" && (
            <div className="grid gap-6 md:grid-cols-2 animate-in fade-in-50 duration-200">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Exit & Transition Forms</h3>
                <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
                  <FileSignature className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p>No active exit processes initiated.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Travel Requests & Expense Forms</h3>
                <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
                  <Plus className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p>No travel requests filed this quarter.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              Submit a leave request. Your manager will review it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leave-type">Leave Type</Label>
              <select
                id="leave-type"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option>Casual Leave</option>
                <option>Sick Leave</option>
                <option>Earned Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leave-from">From Date</Label>
                <Input
                  id="leave-from"
                  type="date"
                  value={leaveFrom}
                  onChange={(e) => setLeaveFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-to">To Date</Label>
                <Input
                  id="leave-to"
                  type="date"
                  value={leaveTo}
                  onChange={(e) => setLeaveTo(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-reason">Reason</Label>
              <Input
                id="leave-reason"
                placeholder="Reason for leave..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!leaveFrom || !leaveTo || !leaveReason) return;
                const newLeave = {
                  id: `LV-${Math.floor(100 + Math.random() * 900)}`,
                  empId: auth?.empId || "LMH-01",
                  empName: auth?.name || "Manvendra Singhal",
                  type: leaveType,
                  fromDate: leaveFrom,
                  toDate: leaveTo,
                  reason: leaveReason,
                  status: "Pending",
                };
                setLeaves([newLeave, ...leaves]);
                setIsLeaveModalOpen(false);
                setLeaveFrom("");
                setLeaveTo("");
                setLeaveReason("");
              }}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Modal */}
      <Dialog open={isFileModalOpen} onOpenChange={setIsFileModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Upload HR Document</DialogTitle>
            <DialogDescription>
              Add a new document to the company files directory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-name">Document Name</Label>
              <Input
                id="file-name"
                placeholder="e.g. Code_of_Conduct_2026.pdf"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-size">File Size</Label>
              <Input
                id="file-size"
                placeholder="e.g. 1.5 MB"
                value={newFileSize}
                onChange={(e) => setNewFileSize(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFileModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newFileName || !newFileSize) return;
                const newFile = {
                  id: `file-${Date.now()}`,
                  name: newFileName,
                  size: newFileSize,
                  date: new Date().toISOString().slice(0, 10),
                  uploader: auth?.name || "Manvendra Singhal",
                };
                setHrFiles([newFile, ...hrFiles]);
                setIsFileModalOpen(false);
                setNewFileName("");
                setNewFileSize("");
              }}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Time Modal */}
      <Dialog open={isTimeLogModalOpen} onOpenChange={setIsTimeLogModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Log Work Hours</DialogTitle>
            <DialogDescription>Submit your timesheet details for today.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="log-proj">Project Name</Label>
              <select
                id="log-proj"
                value={logProject}
                onChange={(e) => setLogProject(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select Project</option>
                <option>Grand Journeys Itinerary</option>
                <option>Visa Processing</option>
                <option>Accounts Reconciliation</option>
                <option>Marketing Campaigns</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-task">Task Description</Label>
              <Input
                id="log-task"
                placeholder="What did you work on?"
                value={logTask}
                onChange={(e) => setLogTask(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="log-hrs">Hours Spent</Label>
                <Input
                  id="log-hrs"
                  type="number"
                  step="0.5"
                  placeholder="e.g. 4.5"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-dt">Date</Label>
                <Input
                  id="log-dt"
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeLogModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!logProject || !logTask || !logHours) return;
                const newLog = {
                  id: `log-${Date.now()}`,
                  project: logProject,
                  task: logTask,
                  hours: parseFloat(logHours),
                  date: logDate,
                  employee: auth?.name || "Manvendra Singhal",
                };
                setTimeLogs([newLog, ...timeLogs]);
                setIsTimeLogModalOpen(false);
                setLogProject("");
                setLogTask("");
                setLogHours("");
              }}
            >
              Log Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Assign a task to an employee.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="t-title">Task Title</Label>
              <Input
                id="t-title"
                placeholder="e.g. Call client about Maldives package"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-type">Type</Label>
                <select
                  id="t-type"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Call</option>
                  <option>Email</option>
                  <option>Payment</option>
                  <option>Document</option>
                  <option>Follow-up</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-pri">Priority</Label>
                <select
                  id="t-pri"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-assignee">Assignee</Label>
                <select
                  id="t-assignee"
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-date">Due Date</Label>
                <Input
                  id="t-date"
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-note">Note / Description</Label>
              <textarea
                id="t-note"
                placeholder="Optional task details..."
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
                rows={3}
                className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!taskTitle || !taskAssignee || !taskDueDate) return;
                const newTask = {
                  id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
                  title: taskTitle,
                  type: taskType,
                  priority: taskPriority,
                  assignee: taskAssignee,
                  dueDate: taskDueDate,
                  status: "Pending",
                  note: taskNote,
                };
                setTasks([newTask, ...tasks]);
                setIsTaskModalOpen(false);
                setTaskTitle("");
                setTaskAssignee("");
                setTaskDueDate("");
                setTaskNote("");
              }}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmployeeProfileModal
        employee={selectedEmployee}
        open={!!selectedEmployee}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
        onEmployeeUpdated={() => {
          // Handled by realtime!
        }}
        onAssignTask={(name) => {
          setTaskAssignee(name);
          setIsTaskModalOpen(true);
          setSelectedEmployee(null);
        }}
        onApproveLeave={() => {
          setActiveTab("Approvals");
          setSelectedEmployee(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold font-display text-foreground">Delete Employee?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete this employee? This action cannot be undone.
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
                  setEmployees(employees.filter((emp) => emp.id !== deleteConfirmId));
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

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Employees</DialogTitle>
            <DialogDescription>
              Filter employees by join date before downloading as CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
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

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" className="rounded-xl px-6" onClick={() => setIsExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportCSV} className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="h-4 w-4 mr-2" /> Download CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
