import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Trash2,
  Table2,
  Briefcase,
  Plane,
  Train,
  Building2,
  Map,
  Car,
  ShieldCheck,
  Shield,
  Bus,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Undo2,
  CreditCard,
  ChevronDown,
  Copy,
  MoreVertical,
  Pencil,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Check,
  ChevronsUpDown
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImportModal } from "@/components/ui/import-modal";
import { formatINR, type Booking } from "@/lib/mock-data";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { getAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AddBookingModal } from "@/components/AddBookingModal";
import { BookingType } from "@/lib/mock-data";

interface BookingFile {
  name: string;
  size: number;
  type: string;
  priority: "High" | "Medium" | "Low";
  category?: string;
  uploadedAt: string;
  dataUrl: string;
}

interface ExtBooking extends Booking {
  files?: BookingFile[];
  details?: Record<string, any>;
}

export const Route = createFileRoute("/crm/bookings")({
  component: BookingsPage,
});

const statusColor: Record<Booking["status"], string> = {
  Confirmed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  Pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
  Cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
  Completed: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
  Partial: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
  Paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  Refunded: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25",
};

const SERVICES = [
  {
    group: "Travel Services",
    items: [
      { label: "Air Ticket", icon: "✈️" },
      { label: "Hotel Booking", icon: "🏨" },
      { label: "Visa", icon: "🛂" },
      { label: "Cruise Booking", icon: "🚢" },
      { label: "Passport Assistance", icon: "📘" },
      { label: "Forex Exchange", icon: "💱" },
      { label: "Airport Transfer", icon: "🚕" },
      { label: "Car Rental", icon: "🚗" },
      { label: "Train Ticket", icon: "🚆" },
      { label: "Bus Ticket", icon: "🚌" },
      { label: "Taxi Booking", icon: "🚕" },
      { label: "Travel Insurance", icon: "🛡️" },
    ],
  },
  {
    group: "Holiday Packages",
    items: [
      { label: "International Package", icon: "🌍" },
      { label: "Domestic Package", icon: "🏝" },
      { label: "Honeymoon Package", icon: "💖" },
      { label: "Family Package", icon: "👨‍👩‍👧‍👦" },
      { label: "Group Tour", icon: "🚌" },
      { label: "Corporate Tour", icon: "🏢" },
      { label: "Luxury Tour", icon: "✨" },
      { label: "Adventure Tour", icon: "🧗" },
    ],
  },
  {
    group: "Business",
    items: [
      { label: "Corporate Travel", icon: "💼" },
      { label: "MICE Events", icon: "🎤" },
      { label: "Conference Booking", icon: "🎟" },
    ],
  },
];

function ManageAllBookingsComponent({ booking, allBookings, setManagingBooking }: { booking: ExtBooking, allBookings: ExtBooking[], setManagingBooking: (b: ExtBooking) => void }) {
  const customerBookings = allBookings.filter(b => b.customer === booking.customer);

  const groupedBookings = customerBookings.reduce((acc, b) => {
    const type = b.bookingType || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(b);
    return acc;
  }, {} as Record<string, ExtBooking[]>);

  const types = ["All", ...Object.keys(groupedBookings)];
  const [activeTab, setActiveTab] = useState<string>("All");
  const currentTab = types.includes(activeTab) ? activeTab : "All";
  const displayedBookings = currentTab === "All" ? customerBookings : (groupedBookings[currentTab] || []);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold tracking-tight">Booking History for {booking.customer}</h3>
      {customerBookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings found for this customer.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 border-b border-border pb-0">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`relative flex items-center gap-2 pb-2 transition-colors ${currentTab === type ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {currentTab === type && (
                  <div className="absolute left-0 top-1 h-3 w-1 bg-primary rounded-full"></div>
                )}
                <h4 className={`text-sm font-bold uppercase tracking-wider ${currentTab === type ? "pl-2" : ""}`}>{type}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${currentTab === type ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                  {type === "All" ? customerBookings.length : (groupedBookings[type]?.length || 0)}
                </span>
                {currentTab === type && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>
                )}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayedBookings.map(b => (
              <div
                key={b.id}
                className={`border bg-card p-4 rounded-xl hover:shadow-md transition-all cursor-pointer ${b.id === booking.id ? "border-primary shadow-sm" : "border-border hover:border-primary/50"}`}
                onClick={() => setManagingBooking(b)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-sm">{b.id}</p>
                    <p className="text-xs text-muted-foreground">{b.bookingDate}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor[b.status] || "bg-secondary text-foreground"}`}>{b.status}</span>
                </div>
                <p className="text-sm font-semibold truncate" title={b.package}>{b.package}</p>
                <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">₹{(b.sellingPrice || b.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="font-medium text-emerald-600">₹{(b.paid || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pending:</span>
                    <span className="font-medium text-rose-600 dark:text-rose-400">₹{((b.sellingPrice || b.amount || 0) - (b.paid || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingsPage() {
  const auth = getAuth();
  const isAdmin = auth?.role === "admin";

  const [bookingList, setBookingList] = useSupabaseTable<ExtBooking[]>("bookings", []);
  const [leads, setLeads] = useSupabaseTable<any[]>("leads", []);

  const [transactions] = useSupabaseTable<any[]>("transactions", []);

  const allBookings = useMemo(() => {
    const deduplicated = [...new globalThis.Map(bookingList.map(b => [b.id, b])).values()];
    return deduplicated.map(b => ({
      ...b,
      paid: b.paid || 0
    }));
  }, [bookingList, transactions]);

  // --- Dashboard Data Aggregation ---
  const dashboardData = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalPaid = 0;

    let confirmedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let refundedCount = 0;

    const serviceCounts = {
      "Air Ticket": 0,
      "Train Ticket": 0,
      Hotel: 0,
      "Holiday Package": 0,
      Taxi: 0,
      Visa: 0,
      "Travel Insurance": 0,
      "General Insurance": 0,
      "Bus Ticket": 0,
    };

    const monthlyRev: Record<string, number> = {};

    allBookings.forEach((b) => {
      // Service Counts
      const type = b.bookingType as keyof typeof serviceCounts;
      if (serviceCounts[type] !== undefined) {
        serviceCounts[type]++;
      } else {
        serviceCounts["Holiday Package"]++; // Fallback
      }

      // Status
      if (b.status === "Confirmed" || b.status === "Completed" || b.status === "Paid")
        confirmedCount++;
      else if (b.status === "Pending" || b.status === "Partial") pendingCount++;
      else if (b.status === "Cancelled") cancelledCount++;
      else if (b.status === "Refunded") refundedCount++;

      // Revenue & Profit
      if (b.status !== "Cancelled" && b.status !== "Refunded") {
        totalRevenue += b.amount || 0;
        totalProfit += b.profit || 0;
        totalPaid += b.paid || 0;

        // Monthly
        const monthMatch = (b.bookingDate || b.travelDate || "").match(/^\d{4}-(\d{2})-\d{2}$/);
        if (monthMatch) {
          const monthIdx = parseInt(monthMatch[1], 10) - 1;
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const month = monthNames[monthIdx];
          monthlyRev[month] = (monthlyRev[month] || 0) + (b.amount || 0);
        }
      }
    });

    const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";
    const avgValue = confirmedCount > 0 ? totalRevenue / confirmedCount : 0;

    const monthlyData = Object.keys(monthlyRev).map((k) => ({ name: k, revenue: monthlyRev[k] }));

    const serviceData = [
      { name: "Air", value: serviceCounts["Air Ticket"] },
      { name: "Train", value: serviceCounts["Train Ticket"] },
      { name: "Hotel", value: serviceCounts["Hotel"] },
      { name: "Holiday", value: serviceCounts["Holiday Package"] },
      { name: "Taxi", value: serviceCounts["Taxi"] },
      { name: "Visa", value: serviceCounts["Visa"] },
      { name: "Insurance", value: serviceCounts["Travel Insurance"] },
      { name: "Gen Ins", value: serviceCounts["General Insurance"] },
      { name: "Bus", value: serviceCounts["Bus Ticket"] },
    ]
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    const statusData = [
      { name: "Confirmed", value: confirmedCount, color: "#10b981" },
      { name: "Pending", value: pendingCount, color: "#f59e0b" },
      { name: "Cancelled", value: cancelledCount, color: "#f43f5e" },
      { name: "Refunded", value: refundedCount, color: "#a855f7" },
    ].filter((d) => d.value > 0);

    return {
      totalBookings: allBookings.length,
      serviceCounts,
      totalRevenue,
      totalPaid,
      totalProfit,
      margin,
      avgValue,
      statusCounts: { confirmedCount, pendingCount, cancelledCount, refundedCount },
      serviceData,
      monthlyData,
      statusData,
    };
  }, [allBookings]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addBookingCustomer, setAddBookingCustomer] = useState<string | undefined>();
  const [editingAddBooking, setEditingAddBooking] = useState<ExtBooking | undefined>();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [managingBooking, setManagingBooking] = useState<ExtBooking | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageTab, setManageTab] = useState<"Details" | "Payments" | "All Bookings">("Details");
  const [uploadCategory, setUploadCategory] = useState("Invoice");
  const [deleteTarget, setDeleteTarget] = useState<ExtBooking | null>(null);

  // Filter States
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<"date" | "travelDate" | "customer" | "amount" | "paid" | "pending" | "status" | "mobileNumber" | "pnr" | "purchasePrice" | "profit" | "bookedBy" | "bookingType">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "date" | "travelDate" | "customer" | "amount" | "paid" | "pending" | "status" | "mobileNumber" | "pnr" | "purchasePrice" | "profit" | "bookedBy" | "bookingType") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Success popup state
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-close success popup after 4 seconds
  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  // Export state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<string>("All");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Refund state
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundBookingId, setRefundBookingId] = useState("");
  const [refundAmount, setRefundAmount] = useState<number | "">("");
  const [isRefundComboboxOpen, setIsRefundComboboxOpen] = useState(false);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundBookingId || refundAmount === "") return;

    const targetBooking = allBookings.find((b) => b.id === refundBookingId);
    if (!targetBooking) {
      toast.error("Booking not found.");
      return;
    }

    try {
      updateBookingStatus(refundBookingId, "Refunded");

      if (targetBooking.customer) {
        const { data: customerMatch } = await supabase
          .from("customers")
          .select("id")
          .ilike("name", `%${targetBooking.customer}%`)
          .limit(1);

        if (customerMatch && customerMatch.length > 0) {
          await supabase
            .from("customers")
            .update({ status: "Refunded" })
            .eq("id", customerMatch[0].id);
        }
      }

      toast.success(`Refund of ${formatINR(Number(refundAmount))} processed for ${targetBooking.customer}`);
      setIsRefundOpen(false);
      setRefundBookingId("");
      setRefundAmount("");
    } catch (error) {
      console.error(error);
      toast.error("Error processing refund.");
    }
  };

  const getBookingsToExport = () => {
    let toExport = exportScope === "All" ? filteredBookings : filteredBookings.filter(b => b.bookingType === exportScope);
    
    if (exportStartDate || exportEndDate) {
      toExport = toExport.filter(b => {
        const d = b.bookingDate || "";
        const matchStart = exportStartDate && d ? d >= exportStartDate : true;
        const matchEnd = exportEndDate && d ? d <= exportEndDate : true;
        return matchStart && matchEnd;
      });
    }
    return toExport;
  };

  // Shared export mapping
  const exportHeaders = [
    "ID",
    "Type",
    "Customer",
    "Passengers",
    "Mobile",
    "Booking Date",
    "Travel Date",
    "Supplier",
    "PNR/Ref",
    "Package",
    "Sector",
    "Booked By",
    "Payment Mode",
    "Selling Price (₹)",
    "Purchase Price (₹)",
    "Profit (₹)",
    "Paid (₹)",
    "Status"
  ];

  const getExportRow = (b: ExtBooking) => {
    let passengers = b.details?.passengerName || "";
    if (b.details?.additionalNames && Array.isArray(b.details.additionalNames)) {
      const extra = b.details.additionalNames.filter(Boolean).join(", ");
      if (extra) {
        passengers = passengers ? `${passengers}, ${extra}` : extra;
      }
    }
    return [
      b.id || "-",
      b.bookingType || "-",
      b.customer || "-",
      passengers || "-",
      b.mobileNumber || "-",
      b.bookingDate || "-",
      b.details?.travelDate || b.travelDate || "-",
      b.supplier || "-",
      b.details?.pnr || b.reference || "-",
      b.package || "-",
      b.details?.sector || b.details?.destination || b.details?.city || "-",
      b.bookedBy || "-",
      b.paymentMode || "-",
      b.sellingPrice || b.amount || 0,
      b.purchasePrice || 0,
      b.profit || 0,
      b.paid || 0,
      b.status || "-"
    ];
  };

  // Export: Excel / CSV
  const exportToExcel = () => {
    const dataToExport = getBookingsToExport();
    const csvRows = [
      exportHeaders.join(","),
      ...dataToExport.map((b) =>
        getExportRow(b).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export: Word (.doc)
  const exportToWord = () => {
    const dataToExport = getBookingsToExport();
    const tableHeader = `<tr>${exportHeaders.map(h => `<th>${h}</th>`).join("")}</tr>`;
    const tableRows = dataToExport
      .map(b => `<tr>${getExportRow(b).map(val => `<td>${val}</td>`).join("")}</tr>`)
      .join("");
    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Bookings Export</title><style>table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; } th, td { border: 1px solid #dddddd; padding: 6px; text-align: left; } th { background-color: #f2f2f2; font-weight: bold; }</style></head>
      <body><h2>Grand Journeys CRM - Bookings Export</h2><table>${tableHeader}${tableRows}</table></body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().slice(0, 10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export: PDF
  const exportToPDF = () => {
    const dataToExport = getBookingsToExport();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const tableHeader = `<tr>${exportHeaders.map(h => `<th>${h}</th>`).join("")}</tr>`;
    const tableRows = dataToExport
      .map(b => `<tr>${getExportRow(b).map(val => `<td>${val}</td>`).join("")}</tr>`)
      .join("");
    const css = `body{font-family:sans-serif;padding:20px;color:#333}h2{color:#f43f5e;margin-bottom:5px}p{font-size:12px;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;font-size:10px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f9fafb;font-weight:bold}tr:nth-child(even){background:#f3f4f6}`;
    const docHtml = `<!DOCTYPE html><html><head><title>Bookings PDF</title><style>${css}</style></head><body>`;

    const titleEl = printWindow.document.createElement("title");
    titleEl.textContent = "Bookings Export PDF";
    printWindow.document.head.appendChild(titleEl);
    const bodyHtml = `<h2>Grand Journeys CRM - Bookings Export</h2><p>Generated on ${new Date().toLocaleDateString("en-IN")} | Total Bookings: ${dataToExport.length}</p><table><thead>${tableHeader}</thead><tbody>${tableRows}</tbody></table>`;
    const wrapper = printWindow.document.createElement("div");
    wrapper.innerHTML = bodyHtml;
    printWindow.document.body.appendChild(wrapper);
    const script = printWindow.document.createElement("script");
    script.textContent =
      "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
    printWindow.document.body.appendChild(script);
    printWindow.document.close();
  };

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPriority, setUploadPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [uploading, setUploading] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ExtBooking>>({});

  const handleManageBooking = (booking: ExtBooking) => {
    setManagingBooking(booking);
    setEditForm(booking);
    setIsEditing(false);
    setIsManageOpen(true);
    setUploadFile(null);
    setUploadPriority("Medium");
  };

  const updateBookingStatus = (bookingId: string, status: Booking["status"]) => {
    if (bookingId.startsWith("LD-")) {
      setLeads((prev) => prev.map((l) => {
        if ("LD-" + String(l.id || "").replace("L-", "") === bookingId) {
          return { ...l, paymentStatus: status };
        }
        return l;
      }));
    } else {
      setBookingList((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    }

    if (managingBooking?.id === bookingId) {
      setManagingBooking({ ...managingBooking, status } as ExtBooking);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingBooking) return;

    if (managingBooking.id.startsWith("LD-")) {
      setLeads((prev) => prev.map(l => {
        if ("LD-" + String(l.id || "").replace("L-", "") === managingBooking.id) {
          return {
            ...l,
            name: editForm.customer,
            travelDate: editForm.travelDate,
            destination: editForm.package,
            service: editForm.bookingType,
            totalAmount: editForm.amount,
            amountPaid: editForm.paid
          };
        }
        return l;
      }));
    } else {
      setBookingList((prev) => prev.map(b => b.id === managingBooking.id ? { ...b, ...editForm } as ExtBooking : b));
    }

    setManagingBooking({ ...managingBooking, ...editForm } as ExtBooking);
    setIsEditing(false);
  };

  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !managingBooking) return;

    setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(uploadFile);
      const newFile: BookingFile = {
        name: uploadFile.name,
        size: uploadFile.size,
        type: uploadFile.type || "application/octet-stream",
        priority: uploadPriority,
        category: uploadCategory,
        uploadedAt: new Date().toISOString(),
        dataUrl,
      };

      const updatedBooking: ExtBooking = {
        ...managingBooking,
        files: [...(managingBooking.files || []), newFile],
      };

      setBookingList((prev) => prev.map((b) => (b.id === managingBooking.id ? updatedBooking : b)));
      setManagingBooking(updatedBooking);
      setUploadFile(null);
      setUploadPriority("Medium");
      setUploadCategory("Invoice");
      const fileInput = document.getElementById("booking-doc-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("File upload failed", err);
      alert("File upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (fileName: string) => {
    if (!managingBooking) return;
    const updatedBooking = {
      ...managingBooking,
      files: (managingBooking.files || []).filter((f) => f.name !== fileName),
    };
    setBookingList((prev) => prev.map((b) => (b.id === managingBooking.id ? updatedBooking : b)));
    setManagingBooking(updatedBooking);
  };

  const handleDeleteBooking = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    // Optimistic UI update
    setBookingList((prev) => prev.filter((b) => b.id !== targetId));
    setDeleteTarget(null);

    // Delete from Supabase
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", targetId);
      if (error) {
        console.error("Error deleting booking:", error);
        toast.error("Failed to delete booking from database.");
        // We could revert the state here if needed
      } else {
        toast.success("Booking deleted successfully!");
      }
    } catch (err) {
      console.error("Exception deleting booking:", err);
      toast.error("Failed to delete booking.");
    }
  };


  function getFileIcon(type: string, name: string) {
    const lowercaseName = name.toLowerCase();
    if (type === "application/pdf" || lowercaseName.endsWith(".pdf")) {
      return <FileText className="h-4 w-4 text-rose-500" />;
    }
    if (
      type.includes("sheet") ||
      type.includes("excel") ||
      lowercaseName.endsWith(".xlsx") ||
      lowercaseName.endsWith(".xls") ||
      lowercaseName.endsWith(".csv")
    ) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
    }
    if (
      type.includes("word") ||
      type.includes("document") ||
      lowercaseName.endsWith(".docx") ||
      lowercaseName.endsWith(".doc")
    ) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    if (type.startsWith("image/")) {
      return <FileImage className="h-4 w-4 text-purple-500" />;
    }
    return <File className="h-4 w-4 text-gray-400" />;
  }

  function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  const priorityColor = {
    High: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
    Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    Low: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  };

  const handleImportBookings = (data: any[]) => {
    let currentMaxId = bookingList.reduce((max, b) => {
      const numStr = String(b.id || "").replace(/BK-?/i, "");
      const num = parseInt(numStr, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);

    const importedBookings = data.map((row) => {
      currentMaxId++;
      return {
        id: `BK-${String(currentMaxId).padStart(3, "0")}`,
        bookingType: "Legacy" as Booking["bookingType"],
        supplier: row["Supplier"] || "Unknown",
        bookingDate: new Date().toISOString().slice(0, 10),
        customer: row["Customer"] || row["customer"] || row["Name"] || "Unknown",
        mobileNumber: "",
        bookedBy: "",
        company: "",
        reference: "",
        saleInvoiceNo: "",
        purchaseInvoiceNo: "",
        remarks: "",
        sellingPrice: parseInt(row["Amount"] || row["amount"] || row["Total"]) || 0,
        purchasePrice: 0,
        profit: 0,
        margin: 0,
        package: row["Package"] || row["package"] || row["Service"] || "Custom Package",
        travelDate:
          row["Travel Date"] ||
          row["travelDate"] ||
          row["Date"] ||
          new Date().toISOString().slice(0, 10),
        status: (row["Status"] || row["status"] || "Pending") as Booking["status"],
        amount: parseInt(row["Amount"] || row["amount"] || row["Total"]) || 0,
        paid: parseInt(row["Paid"] || row["paid"]) || 0,
        paymentMode: "Cash" as Booking["paymentMode"],
        transactionId: "",
      };
    });
    setBookingList((prev) => [...importedBookings, ...prev]);
  };

  const handleAddBookingSave = async (booking: Booking) => {
    try {
      const isEdit = bookingList.some((b) => b.id === booking.id);

      if (!isEdit) {
        // Allow multiple tickets/bookings for the same user on the same date by removing the strict isDuplicate check.
      }

      let finalBooking = { ...booking };
      if (!isEdit) {
        const currentMaxId = bookingList.reduce((max, b) => {
          const numStr = String(b.id || "").replace(/BK-?/i, "");
          const num = parseInt(numStr, 10);
          return !isNaN(num) && num > max ? num : max;
        }, 0);
        const nextId = `BK-${String(currentMaxId + 1).padStart(3, "0")}`;
        finalBooking.id = nextId;
        finalBooking.status = "Pending";

        // Remove paymentStatus as it does not exist in the database schema
        delete (finalBooking as any).paymentStatus;

        // Update customer status to Payment Pending
        if (finalBooking.customer) {
          try {
            // Find the customer by name matching
            const { data: customerMatch } = await supabase
              .from("customers")
              .select("id")
              .ilike("name", `%${finalBooking.customer}%`)
              .limit(1);

            if (customerMatch && customerMatch.length > 0) {
              await supabase
                .from("customers")
                .update({ status: "Payment Pending" })
                .eq("id", customerMatch[0].id);
            }
          } catch (err) {
            console.error("Failed to update customer status:", err);
          }
        }
      }

      setBookingList(prev => isEdit ? prev.map(b => b.id === finalBooking.id ? finalBooking : b) : [finalBooking, ...prev]);
      setSuccessBooking(finalBooking);
      setShowSuccess(true);
    } catch (err) {
      console.error("Unexpected error saving booking:", err);
      alert("An unexpected error occurred.");
    }
  };

  const filteredBookings = allBookings.filter((b) => {
    let matchesCategory = false;
    if (activeTab === "All") matchesCategory = true;
    else if (b.bookingType === activeTab) matchesCategory = true;
    else if (activeTab === "Hotel Booking" && b.bookingType === "Hotel") matchesCategory = true;
    else {
      const isHolidayPackageTab = [
        "International Package",
        "Domestic Package",
        "Honeymoon Package",
        "Weekend Getaways"
      ].includes(activeTab);

      if (isHolidayPackageTab && (b.bookingType === "Holiday Package" || !b.bookingType)) matchesCategory = true;
    }

    if (!matchesCategory) return false;

    if (statusFilter !== "All" && b.status !== statusFilter) return false;

    if (dateFrom && b.bookingDate && b.bookingDate < dateFrom) return false;
    if (dateTo && b.bookingDate && b.bookingDate > dateTo) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (b.customer?.toLowerCase() || "").includes(query) ||
        (b.id?.toLowerCase() || "").includes(query) ||
        (b.mobileNumber || "").includes(query) ||
        (b.package?.toLowerCase() || "").includes(query) ||
        (b.supplier?.toLowerCase() || "").includes(query) ||
        (b.bookedBy?.toLowerCase() || "").includes(query);
      if (!matchesSearch) return false;
    }

    return true;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortField === "date") cmp = new Date(a.bookingDate || 0).getTime() - new Date(b.bookingDate || 0).getTime();
    else if (sortField === "travelDate") cmp = new Date(a.travelDate || 0).getTime() - new Date(b.travelDate || 0).getTime();
    else if (sortField === "customer") cmp = (a.customer || "").localeCompare(b.customer || "");
    else if (sortField === "amount") cmp = (a.amount || 0) - (b.amount || 0);
    else if (sortField === "paid") cmp = (a.paid || 0) - (b.paid || 0);
    else if (sortField === "pending") cmp = ((a.amount || 0) - (a.paid || 0)) - ((b.amount || 0) - (b.paid || 0));
    else if (sortField === "status") cmp = (a.status || "").localeCompare(b.status || "");
    else if (sortField === "mobileNumber") cmp = (a.mobileNumber || "").localeCompare(b.mobileNumber || "");
    else if (sortField === "pnr") cmp = (a.details?.pnr || "").localeCompare(b.details?.pnr || "");
    else if (sortField === "bookingType") cmp = (a.bookingType || "").localeCompare(b.bookingType || "");
    else if (sortField === "purchasePrice") cmp = (a.purchasePrice || 0) - (b.purchasePrice || 0);
    else if (sortField === "profit") cmp = (a.profit || 0) - (b.profit || 0);
    else if (sortField === "bookedBy") cmp = (a.bookedBy || "").localeCompare(b.bookedBy || "");

    return sortOrder === "asc" ? cmp : -cmp;
  });

  const renderManageDetails = (booking: ExtBooking) => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
            <p className="font-semibold">{booking.customer}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lead Passenger Name</p>
            <p className="font-semibold">{booking.details?.leaderName || booking.details?.passengerName || booking.customer || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Travel Date</p>
            <p className="font-semibold">{booking.travelDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Booking Type</p>
            <p className="font-semibold">{booking.bookingType}</p>
          </div>
          {booking.details?.pnr && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PNR</p>
              <p className="font-semibold">{booking.details.pnr}</p>
            </div>
          )}

          {booking.bookingType === "Taxi" && (
            <>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Pickup Time</p><p className="font-semibold">{booking.details?.pickupTime || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Pickup Location</p><p className="font-semibold">{booking.details?.pickupLocation || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Drop Location</p><p className="font-semibold">{booking.details?.dropLocation || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Trip Type</p><p className="font-semibold">{booking.details?.tripType || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Vehicle Type</p><p className="font-semibold">{booking.details?.vehicleType || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Driver Name</p><p className="font-semibold">{booking.details?.driverName || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Vehicle Number</p><p className="font-semibold">{booking.details?.vehicleNumber || "—"}</p></div>
            </>
          )}
          {booking.bookingType === "Air Ticket" && (
            <>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Airline</p><p className="font-semibold">{booking.details?.airline || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Flight Number</p><p className="font-semibold">{booking.details?.flightNumber || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Departure</p><p className="font-semibold">{booking.details?.departureAirport || booking.details?.sector?.split('-')[0]?.trim() || "—"} at {booking.details?.departureTime || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Arrival</p><p className="font-semibold">{booking.details?.arrivalAirport || booking.details?.sector?.split('-')[1]?.trim() || "—"} at {booking.details?.arrivalTime || "—"}</p></div>
            </>
          )}
          {booking.bookingType === "Hotel" && (
            <>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Hotel Name</p><p className="font-semibold">{booking.package || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">City</p><p className="font-semibold">{booking.details?.city || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Check In</p><p className="font-semibold">{booking.details?.checkIn || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Check Out</p><p className="font-semibold">{booking.details?.checkOut || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Room Type</p><p className="font-semibold">{booking.details?.roomType || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Meal Plan</p><p className="font-semibold">{booking.details?.mealPlan || "—"}</p></div>
            </>
          )}
          {booking.bookingType === "Visa" && (
            <>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Country</p><p className="font-semibold">{booking.details?.country || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Visa Type</p><p className="font-semibold">{booking.details?.visaType || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Passport Number</p><p className="font-semibold">{booking.details?.passportNumber || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Submission Date</p><p className="font-semibold">{booking.details?.submissionDate || "—"}</p></div>
            </>
          )}
          {booking.bookingType === "Travel Insurance" && (
            <>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Policy Type</p><p className="font-semibold">{booking.details?.policyType || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Query Type</p><p className="font-semibold">{booking.details?.queryType || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Insurance Date</p><p className="font-semibold">{booking.details?.insuranceDate || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Expiry Date</p><p className="font-semibold">{booking.details?.expiryDate || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Client / Company</p><p className="font-semibold">{booking.details?.clientCompany || "—"}</p></div>
            </>
          )}
          {booking.bookingType === "Train Ticket" && (
            <>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Train Number/Name</p><p className="font-semibold">{booking.details?.trainNumber || "—"} {booking.details?.trainName || ""}</p></div>
              {(booking.details?.from || booking.details?.to) && (
                <div><p className="text-xs text-muted-foreground uppercase mb-1">From - To</p><p className="font-semibold">{booking.details?.from || booking.details?.to ? `${booking.details?.from || "—"} → ${booking.details?.to || "—"}` : "—"}</p></div>
              )}
            </>
          )}
          {booking.bookingType === "Bus Ticket" && (
            <>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Operator</p><p className="font-semibold">{booking.details?.operator || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Bus Type</p><p className="font-semibold">{booking.details?.busType || "—"}</p></div>
              {(booking.details?.boardingPoint || booking.details?.droppingPoint) && (
                <div><p className="text-xs text-muted-foreground uppercase mb-1">Boarding - Dropping</p><p className="font-semibold">{booking.details?.boardingPoint || booking.details?.droppingPoint ? `${booking.details?.boardingPoint || "—"} → ${booking.details?.droppingPoint || "—"}` : "—"}</p></div>
              )}
            </>
          )}
          {(booking.bookingType === "Holiday Package" || !booking.bookingType) && (
            <>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Destination</p><p className="font-semibold">{booking.package || booking.details?.destination || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Package Type</p><p className="font-semibold">{booking.details?.packageType || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Travel Dates</p><p className="font-semibold">{booking.details?.travelFrom || "—"} to {booking.details?.travelTo || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase mb-1">Pax</p><p className="font-semibold">{booking.details?.noOfPax || "—"} ({booking.details?.leaderName || "—"})</p></div>

              {booking.details?.airline && (
                <div className="col-span-2 mt-4 space-y-3 p-4 rounded-xl border bg-secondary/5">
                  <h4 className="text-sm font-semibold flex items-center gap-2">✈️ Flight Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Airline</p><p className="font-semibold">{booking.details.airline} {booking.details.flightNumber}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Departure</p><p className="font-semibold">{booking.details.departureAirport || "—"} at {booking.details.departureTime ? new Date(booking.details.departureTime).toLocaleString() : "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Arrival</p><p className="font-semibold">{booking.details.arrivalAirport || "—"} at {booking.details.arrivalTime ? new Date(booking.details.arrivalTime).toLocaleString() : "—"}</p></div>
                  </div>
                </div>
              )}

              {booking.details?.hotelName && (
                <div className="col-span-2 mt-4 space-y-3 p-4 rounded-xl border bg-secondary/5">
                  <h4 className="text-sm font-semibold flex items-center gap-2">🏨 Hotel Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Hotel</p><p className="font-semibold">{booking.details.hotelName} ({booking.details.city || "—"})</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Dates</p><p className="font-semibold">{booking.details.checkIn || "—"} to {booking.details.checkOut || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Room Type</p><p className="font-semibold">{booking.details.roomType || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Meal Plan</p><p className="font-semibold">{booking.details.mealPlan || "—"}</p></div>
                  </div>
                </div>
              )}

              {booking.details?.vehicleType && (
                <div className="col-span-2 mt-4 space-y-3 p-4 rounded-xl border bg-secondary/5">
                  <h4 className="text-sm font-semibold flex items-center gap-2">🚕 Taxi Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Vehicle</p><p className="font-semibold">{booking.details.vehicleType} ({booking.details.tripType || "—"})</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Pickup Time</p><p className="font-semibold">{booking.details.pickupTime ? new Date(booking.details.pickupTime).toLocaleString() : "—"}</p></div>
                    {(booking.details.pickupLocation || booking.details.dropLocation) && (
                      <div><p className="text-xs text-muted-foreground uppercase mb-1">Route</p><p className="font-semibold">{booking.details.pickupLocation || booking.details.dropLocation ? `${booking.details.pickupLocation || "—"} → ${booking.details.dropLocation || "—"}` : "—"}</p></div>
                    )}
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Driver</p><p className="font-semibold">{booking.details.driverName || "—"} ({booking.details.vehicleNumber || "—"})</p></div>
                  </div>
                </div>
              )}

              {booking.details?.trainName && (
                <div className="col-span-2 mt-4 space-y-3 p-4 rounded-xl border bg-secondary/5">
                  <h4 className="text-sm font-semibold flex items-center gap-2">🚆 Train Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Train</p><p className="font-semibold">{booking.details.trainName}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Travel Date</p><p className="font-semibold">{booking.details.travelDate || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Sector</p><p className="font-semibold">{booking.details.sector || "—"}</p></div>
                  </div>
                </div>
              )}

              {booking.details?.busOperator && (
                <div className="col-span-2 mt-4 space-y-3 p-4 rounded-xl border bg-secondary/5">
                  <h4 className="text-sm font-semibold flex items-center gap-2">🚌 Bus Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Operator</p><p className="font-semibold">{booking.details.busOperator}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Travel Date</p><p className="font-semibold">{booking.details.travelDate || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Sector</p><p className="font-semibold">{booking.details.sector || "—"}</p></div>
                  </div>
                </div>
              )}

              {booking.details?.visaType && (
                <div className="col-span-2 mt-4 space-y-3 p-4 rounded-xl border bg-secondary/5">
                  <h4 className="text-sm font-semibold flex items-center gap-2">📄 Visa Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Country</p><p className="font-semibold">{booking.details.country || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Visa Type</p><p className="font-semibold">{booking.details.visaType}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Process Date</p><p className="font-semibold">{booking.details.processDate || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Status</p><p className="font-semibold">{booking.details.applicationStatus || "—"}</p></div>
                  </div>
                </div>
              )}

              {booking.details?.policyType && (
                <div className="col-span-2 mt-4 space-y-3 p-4 rounded-xl border bg-secondary/5">
                  <h4 className="text-sm font-semibold flex items-center gap-2">🛡️ Insurance Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Policy Type</p><p className="font-semibold">{booking.details.policyType}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Query Type</p><p className="font-semibold">{booking.details.queryType || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Insurance Date</p><p className="font-semibold">{booking.details.insuranceDate || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground uppercase mb-1">Expiry Date</p><p className="font-semibold">{booking.details.expiryDate || "—"}</p></div>
                    <div className="col-span-2"><p className="text-xs text-muted-foreground uppercase mb-1">Client / Company</p><p className="font-semibold">{booking.details.clientCompany || "—"}</p></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    );
  };

  const renderManagePayments = (booking: ExtBooking) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-secondary/10 p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Selling Price</p>
          <p className="text-xl font-bold">{formatINR(booking.sellingPrice || booking.amount || 0)}</p>
        </div>
        <div className="bg-secondary/10 p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Purchase Price</p>
          <p className="text-xl font-bold">{formatINR(booking.purchasePrice || 0)}</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-500/20">
          <p className="text-xs uppercase tracking-wider mb-1 opacity-80">Amount Received</p>
          <p className="text-xl font-bold">{formatINR(booking.paid || 0)}</p>
        </div>
        <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl border border-rose-500/20">
          <p className="text-xs uppercase tracking-wider mb-1 opacity-80">Pending Amount</p>
          <p className="text-xl font-bold">{formatINR((booking.sellingPrice || booking.amount || 0) - (booking.paid || 0))}</p>
        </div>
        <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-xl border border-blue-500/20">
          <p className="text-xs uppercase tracking-wider mb-1 opacity-80">Profit</p>
          <p className="text-xl font-bold">{formatINR(booking.profit || 0)}</p>
        </div>
        <div className="bg-purple-500/10 text-purple-600 dark:text-purple-400 p-4 rounded-xl border border-purple-500/20">
          <p className="text-xs uppercase tracking-wider mb-1 opacity-80">Margin</p>
          <p className="text-xl font-bold">{booking.margin || 0}%</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">Payment Status</p>
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusColor[booking.status]}`}>
          {booking.status}
        </span>
      </div>
    </div>
  );

  const documentCategories = [
    "Invoice", "Voucher", "Passport", "Visa", "Flight Ticket", "Hotel Voucher", "Insurance Policy", "Driver Details", "Train Ticket", "Bus Ticket", "Customer ID", "Receipt", "Other Files"
  ];

  const renderManageDocuments = (booking: ExtBooking) => (
    <div className="space-y-6">
      <form onSubmit={handleAddFile} className="space-y-4 rounded-xl border border-border bg-secondary/10 p-5">
        <h3 className="text-sm font-bold tracking-tight">Upload Document</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="booking-doc-file" className="text-xs">Document File (.pdf, image, etc.)</Label>
            <Input
              id="booking-doc-file"
              type="file"
              required
              accept=".pdf,.xls,.xlsx,.doc,.docx,image/*"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="h-10 text-xs rounded-lg cursor-pointer bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="booking-doc-category" className="text-xs">Category</Label>
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger id="booking-doc-category" className="h-10 bg-background text-xs">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {documentCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="booking-doc-priority" className="text-xs">Priority</Label>
            <Select value={uploadPriority} onValueChange={(val: any) => setUploadPriority(val)}>
              <SelectTrigger id="booking-doc-priority" className="h-10 bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">🔴 High</SelectItem>
                <SelectItem value="Medium">🟡 Medium</SelectItem>
                <SelectItem value="Low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={uploading || !uploadFile}
            className="h-10 px-8 rounded-lg text-sm font-semibold"
            style={{ background: "var(--gradient-brand)" }}
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-bold tracking-tight">Attached Files</h3>
        {!booking.files || booking.files.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-xl bg-secondary/10">
            No documents attached yet.
          </div>
        ) : (
          <div className="space-y-3">
            {booking.files.map((file) => (
              <div key={file.name} className="flex items-center justify-between rounded-xl border border-border p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    {getFileIcon(file.type, file.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate text-foreground">{file.name}</p>
                      <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {file.category || "Other Files"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fmtSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${priorityColor[file.priority]}`}>
                    {file.priority}
                  </span>
                  <a href={file.dataUrl} download={file.name} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Download file">
                    <Download className="h-4 w-4" />
                  </a>
                  {isAdmin && (
                    <button type="button" onClick={() => handleDeleteFile(file.name)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition-colors" title="Delete file">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderManageTimeline = (booking: ExtBooking) => {
    const events = [
      { id: 1, title: "Booking Created", date: booking.bookingDate, status: "completed" },
      { id: 2, title: "Payment Pending", date: booking.bookingDate, status: booking.paid > 0 ? "completed" : "current" },
      { id: 3, title: "Documents Uploaded", date: "Pending", status: booking.files && booking.files.length > 0 ? "completed" : (booking.paid > 0 ? "current" : "upcoming") },
      { id: 4, title: "Booking Confirmed", date: "Pending", status: booking.status === "Confirmed" ? "completed" : (booking.files && booking.files.length > 0 ? "current" : "upcoming") },
    ];
    return (
      <div className="space-y-6">
        <h3 className="text-sm font-bold tracking-tight">Booking Timeline</h3>
        <div className="relative pl-6 space-y-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border rounded-full" />
          {events.map((event, index) => (
            <div key={event.id} className="relative">
              <div className={`absolute -left-[30px] top-0.5 h-4 w-4 rounded-full border-2 bg-background flex items-center justify-center ${event.status === 'completed' ? 'border-emerald-500 bg-emerald-500 text-white' : event.status === 'current' ? 'border-primary ring-2 ring-primary/20' : 'border-muted-foreground/30'}`}>
                {event.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
              </div>
              <div className="flex flex-col gap-1">
                <p className={`text-sm font-semibold ${event.status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'}`}>{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleExportCSV = () => {
    const exportableBookings = filteredBookings.filter(b => {
      const d = b.bookingDate || "";
      const matchStart = exportStartDate && d ? d >= exportStartDate : true;
      const matchEnd = exportEndDate && d ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const headers = ["Booking ID", "Booking Date", "Travel Date", "Customer", "Mobile No", "PNR", "Type", "Selling Price", "Purchase Price", "Profit", "Booked By", "Status"];
    const csvContent = [
      headers.join(","),
      ...exportableBookings.map(b =>
        [
          b.id,
          b.bookingDate || "",
          b.travelDate || "",
          `"${(b.customer || "").replace(/"/g, '""')}"`,
          b.mobileNumber || "",
          b.details?.pnr || "",
          b.bookingType || "",
          b.sellingPrice || b.amount || 0,
          b.purchasePrice || 0,
          b.profit || 0,
          `"${(b.bookedBy || "").replace(/"/g, '""')}"`,
          b.status || ""
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Packages, flights, hotels, visas and transfers — all in one place.
          </p>
        </div>

        <div className="flex gap-2">

          <Button className="btn-hero" onClick={() => setIsRefundOpen(true)}>
            <Undo2 className="mr-2 h-4 w-4" /> Refund
          </Button>
          <Button className="btn-hero" onClick={() => {
            setAddBookingCustomer(undefined);
            setEditingAddBooking(undefined);
            setIsAddOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> New booking
          </Button>
          <AddBookingModal
            open={isAddOpen}
            onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) {
                setAddBookingCustomer(undefined);
                setEditingAddBooking(undefined);
              }
            }}
            onSave={handleAddBookingSave}
            defaultCustomer={addBookingCustomer}
            editingBooking={editingAddBooking}
          />

          <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Process Refund</DialogTitle>
                <DialogDescription>
                  Select a booking to process a refund.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRefundSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Booking</Label>
                  <Popover open={isRefundComboboxOpen} onOpenChange={setIsRefundComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isRefundComboboxOpen}
                        className="w-full justify-between font-normal"
                      >
                        {refundBookingId
                          ? (() => {
                              const b = allBookings.find((bk) => bk.id === refundBookingId);
                              return b ? `${b.id} ${b.details?.pnr ? `- PNR: ${b.details.pnr}` : ''} - ${b.customer}` : "Select booking...";
                            })()
                          : "Select booking..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search by ID, PNR or Customer..." />
                        <CommandList>
                          <CommandEmpty>No booking found.</CommandEmpty>
                          <CommandGroup>
                            {allBookings.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={`${b.id} ${b.details?.pnr || ''} ${b.customer}`}
                                onSelect={() => {
                                  setRefundBookingId(b.id || "");
                                  setIsRefundComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    refundBookingId === b.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {b.id} {b.details?.pnr ? `- PNR: ${b.details.pnr} ` : ''}- {b.customer} ({formatINR(b.sellingPrice || b.amount || 0)})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {refundBookingId && (() => {
                  const b = allBookings.find((bk) => bk.id === refundBookingId);
                  if (!b) return null;
                  return (
                    <div className="space-y-4">
                      <div className="max-h-[35vh] overflow-y-auto border p-3 rounded-lg bg-secondary/10 mb-4 text-sm">
                        {renderManageDetails(b)}
                        
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3"><div className="w-1 h-3.5 bg-red-500 rounded-full"></div> Financial Details</h4>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Selling Price (₹)</p>
                              <p className="font-semibold">{formatINR(b.sellingPrice || b.amount || 0)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Purchase Price (₹)</p>
                              <p className="font-semibold">{formatINR(b.purchasePrice || 0)}</p>
                            </div>
                          </div>
                          {(() => {
                            const sp = b.sellingPrice || b.amount || 0;
                            const pp = b.purchasePrice || 0;
                            const paid = b.paid || 0;
                            const profit = sp - pp;
                            const margin = sp > 0 ? Number(((profit / sp) * 100).toFixed(2)) : 0;
                            const pendingAmount = sp - paid;

                            return (
                              <div className="flex items-center justify-between w-full h-full rounded-xl bg-background p-3 border border-border shadow-sm">
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Profit</p>
                                  <p className={`font-mono text-sm font-bold ${profit > 0 ? "text-emerald-600" : profit < 0 ? "text-red-500" : "text-gray-700"}`}>
                                    {formatINR(profit)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Margin %</p>
                                  <p className={`font-mono text-sm font-bold ${margin > 0 ? "text-emerald-600" : margin < 0 ? "text-red-500" : "text-gray-700"}`}>
                                    {margin}%
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Pending Amount</p>
                                  <p className="font-mono text-sm font-bold text-orange-600">
                                    {formatINR(pendingAmount)}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Refund Amount (₹)</Label>
                        <Input
                          type="number"
                          required
                          placeholder="Enter refund amount"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : "")}
                          max={b.paid || b.sellingPrice || b.amount || 0}
                        />
                      </div>
                    </div>
                  );
                })()}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsRefundOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!refundBookingId || refundAmount === ""}>
                    Process Refund
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ===== Dashboard Section ===== */}
      <div className="space-y-6 bg-secondary/10 p-6 rounded-2xl border border-border">
        {/* Row 1: KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
          <div className="bg-card border border-border p-3 rounded-xl shadow-xs flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Briefcase className="h-4 w-4 text-blue-500 shrink-0" />{" "}
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">Total</span>
            </div>
            <p className="text-xl xl:text-2xl font-bold truncate">{dashboardData.totalBookings}</p>
          </div>
          <div className="bg-card border border-border p-3 rounded-xl shadow-xs flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Plane className="h-4 w-4 text-sky-500 shrink-0" />{" "}
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">Air</span>
            </div>
            <p className="text-xl xl:text-2xl font-bold truncate">{dashboardData.serviceCounts["Air Ticket"]}</p>
          </div>
          <div className="bg-card border border-border p-3 rounded-xl shadow-xs flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Train className="h-4 w-4 text-purple-500 shrink-0" />{" "}
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">Train</span>
            </div>
            <p className="text-xl xl:text-2xl font-bold truncate">{dashboardData.serviceCounts["Train Ticket"]}</p>
          </div>
          <div className="bg-card border border-border p-3 rounded-xl shadow-xs flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Building2 className="h-4 w-4 text-orange-500 shrink-0" />{" "}
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">Hotels</span>
            </div>
            <p className="text-xl xl:text-2xl font-bold truncate">{dashboardData.serviceCounts["Hotel"]}</p>
          </div>
          <div className="bg-card border border-border p-3 rounded-xl shadow-xs flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Map className="h-4 w-4 text-emerald-500 shrink-0" />{" "}
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">Holiday</span>
            </div>
            <p className="text-xl xl:text-2xl font-bold truncate">{dashboardData.serviceCounts["Holiday Package"]}</p>
          </div>
          <div className="bg-card border border-border p-3 rounded-xl shadow-xs flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Car className="h-4 w-4 text-yellow-500 shrink-0" />{" "}
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">Taxi</span>
            </div>
            <p className="text-xl xl:text-2xl font-bold truncate">{dashboardData.serviceCounts["Taxi"]}</p>
          </div>
          <div className="bg-card border border-border p-3 rounded-xl shadow-xs flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <FileText className="h-4 w-4 text-indigo-500 shrink-0" />{" "}
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">Visa</span>
            </div>
            <p className="text-xl xl:text-2xl font-bold truncate">{dashboardData.serviceCounts["Visa"]}</p>
          </div>
          <div className="bg-card border border-border p-3 rounded-xl shadow-xs flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <ShieldCheck className="h-4 w-4 text-teal-500 shrink-0" />{" "}
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">Insurance</span>
            </div>
            <p className="text-xl xl:text-2xl font-bold truncate">{dashboardData.serviceCounts["Travel Insurance"]}</p>
          </div>

          <div className="bg-card border border-border p-3 rounded-xl shadow-xs flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Bus className="h-4 w-4 text-pink-500 shrink-0" />{" "}
              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">Bus</span>
            </div>
            <p className="text-xl xl:text-2xl font-bold truncate">{dashboardData.serviceCounts["Bus Ticket"]}</p>
          </div>
        </div>

        {/* Row 2: Revenue Analytics */}
        <div className={`grid grid-cols-2 gap-4 ${isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="h-16 w-16 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Selling Amount
            </p>
            <p className="text-3xl font-display font-bold text-foreground">
              {formatINR(dashboardData.totalRevenue)}
            </p>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Paid Amount
            </p>
            <p className="text-3xl font-display font-bold text-emerald-600">
              {formatINR(dashboardData.totalPaid)}
            </p>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock className="h-16 w-16 text-rose-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Pending
            </p>
            <p className="text-3xl font-display font-bold text-rose-600">
              {formatINR(dashboardData.totalRevenue - dashboardData.totalPaid)}
            </p>
          </div>
          {isAdmin && (
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="h-16 w-16 text-blue-600" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Profit
              </p>
              <p className="text-3xl font-display font-bold text-blue-600">
                {formatINR(dashboardData.totalProfit)}
              </p>
            </div>
          )}
        </div>

        {/* Row 3: Status Summary */}
        <div className="grid grid-cols-4 gap-3 bg-card p-2 rounded-xl border border-border">
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Confirmed</span>
            </div>
            <span className="text-2xl font-bold mt-1">
              {dashboardData.statusCounts.confirmedCount}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
            </div>
            <span className="text-2xl font-bold mt-1">
              {dashboardData.statusCounts.pendingCount}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Cancelled</span>
            </div>
            <span className="text-2xl font-bold mt-1">
              {dashboardData.statusCounts.cancelledCount}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <div className="flex items-center gap-1.5">
              <Undo2 className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Refunded</span>
            </div>
            <span className="text-2xl font-bold mt-1">
              {dashboardData.statusCounts.refundedCount}
            </span>
          </div>
        </div>


      </div>

      {/* Filter and Search Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 py-4 text-sm">
        <div className="relative w-full lg:w-64 xl:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bookings by customer, ID, package..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 sm:h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap xl:flex-nowrap justify-start lg:justify-end overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-muted-foreground text-xs sm:text-sm font-medium whitespace-nowrap">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 sm:h-10 rounded-full border border-border bg-card text-foreground px-2.5 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-[125px] sm:w-[135px]"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-muted-foreground text-xs sm:text-sm font-medium whitespace-nowrap">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 sm:h-10 rounded-full border border-border bg-card text-foreground px-2.5 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-[125px] sm:w-[135px]"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-muted-foreground text-xs sm:text-sm font-medium whitespace-nowrap"><Filter className="inline w-3.5 h-3.5 mr-1" />Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 sm:h-10 cursor-pointer appearance-none rounded-full border border-border bg-card text-card-foreground pl-3 pr-7 py-1 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23111827%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:0.85em_0.85em] bg-[right_0.75rem_center] bg-no-repeat"
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-muted-foreground text-xs sm:text-sm font-medium whitespace-nowrap">Category:</span>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="h-9 sm:h-10 cursor-pointer appearance-none rounded-full border border-border bg-card text-card-foreground pl-3 pr-7 py-1 text-xs sm:text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[145px] sm:max-w-[160px] truncate bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23111827%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:0.85em_0.85em] bg-[right_0.75rem_center] bg-no-repeat"
            >
              <option value="All">All Categories</option>
              {SERVICES.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((i) => (
                    <option key={i.label} value={i.label}>
                      {i.icon} {i.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {(isAdmin || auth?.name?.toLowerCase().includes("aman")) && (
            <Button variant="outline" size="sm" className="h-9 sm:h-10 rounded-full shrink-0 px-3.5" onClick={() => setIsExportOpen(true)}>
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("date")}>
                  <div className="flex items-center gap-1">Booking Date {sortField === "date" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("travelDate")}>
                  <div className="flex items-center gap-1">Travel Date {sortField === "travelDate" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("customer")}>
                  <div className="flex items-center gap-1">Customer {sortField === "customer" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap text-left">
                  <div className="flex items-center gap-1">Lead Passenger</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("mobileNumber")}>
                  <div className="flex items-center gap-1">Mobile No {sortField === "mobileNumber" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("pnr")}>
                  <div className="flex items-center gap-1">PNR {sortField === "pnr" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("bookingType")}>
                  <div className="flex items-center gap-1">Type {sortField === "bookingType" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap text-left">
                  <div className="flex items-center gap-1">Sector</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("amount")}>
                  <div className="flex items-center gap-1">Selling Price (₹) {sortField === "amount" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("purchasePrice")}>
                  <div className="flex items-center gap-1">Purchase Price (₹) {sortField === "purchasePrice" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("profit")}>
                  <div className="flex items-center gap-1">Profit (₹) {sortField === "profit" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("bookedBy")}>
                  <div className="flex items-center gap-1">Booked By {sortField === "bookedBy" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1">Status {sortField === "status" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-muted-foreground">
                    No bookings found for {activeTab}.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="border-t border-border hover:bg-secondary/30 cursor-pointer transition-colors" onClick={() => handleManageBooking(b)}>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">{b.bookingDate || "-"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{b.travelDate || "-"}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{b.customer || "-"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{b.details?.leaderName || b.details?.passengerName || b.customer || "-"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{b.mobileNumber || "-"}</td>
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">{b.details?.pnr || "-"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{b.bookingType || "-"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">{b.details?.sector || b.details?.destination || b.details?.city || "-"}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap text-primary">{formatINR(b.sellingPrice || b.amount || 0)}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap text-muted-foreground">{formatINR(b.purchasePrice || 0)}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap text-emerald-600">{formatINR(b.profit || 0)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">{b.bookedBy || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase border-none h-auto w-auto ${statusColor[b.status as keyof typeof statusColor] || statusColor["Pending"]}`}>
                        {b.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-xl hover:bg-secondary"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 rounded-xl">
                              <>{auth?.role === "admin" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAddBooking(b);
                                    setIsAddOpen(true);
                                  }}
                                  className="cursor-pointer gap-2 py-2"
                                >
                                  <Pencil className="h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}</>
                              <>{auth?.role === "admin" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(b);
                                  }}
                                  className="cursor-pointer gap-2 py-2 text-rose-600 focus:text-rose-700"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}</>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImportBookings}
        title="Import Bookings"
        description="Upload a CSV or Excel file containing your bookings."
      />

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-border p-0 shadow-2xl bg-card">
          <div className="flex items-center justify-between border-b border-border p-6 pb-4">
            <div>
              <DialogTitle className="font-display text-lg font-bold">
                Booking Summary
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {managingBooking?.customer} • {managingBooking?.id}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-8 mr-2"
                onClick={() => {
                  setAddBookingCustomer(managingBooking?.customer);
                  setEditingAddBooking(undefined);
                  setIsAddOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Booking
              </Button>
              {managingBooking && (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[managingBooking.status]}`}>
                  {managingBooking.status}
                </span>
              )}
            </div>
          </div>

          {managingBooking && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center gap-6 px-6 border-b border-border bg-secondary/10">
                {["Details", "Payments", "All Bookings"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setManageTab(tab as any)}
                    className={`py-3 text-sm font-semibold transition-colors border-b-2 -mb-[1px] focus:outline-none ${manageTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {manageTab === "Details" && renderManageDetails(managingBooking)}
                {manageTab === "Payments" && renderManagePayments(managingBooking)}
                {manageTab === "All Bookings" && <ManageAllBookingsComponent booking={managingBooking} allBookings={allBookings} setManagingBooking={setManagingBooking} />}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border p-4 bg-secondary/10 mt-auto">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsManageOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ===== EXPORT DIALOG ===== */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Export Bookings</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Export bookings in your preferred file format. You can choose to export all currently filtered bookings or only a specific service type.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 mt-2">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
              Export Type
            </label>
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-border bg-secondary/20 text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="All">Completely Export (All Bookings)</option>
              {SERVICES.flatMap(g => g.items).map((s) => (
                <option key={s.label} value={s.label}>
                  {s.icon} {s.label} Only
                </option>
              ))}
            </select>
          </div>

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

          <div className="grid grid-cols-3 gap-3 py-4">
            <button
              type="button"
              onClick={() => {
                exportToPDF();
                setIsExportOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all text-center group cursor-pointer"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/20">
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
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all text-center group cursor-pointer"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20">
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
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-center group cursor-pointer"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20">
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

      {/* ===== BOOKING SUCCESS POPUP ===== */}
      {showSuccess && successBooking && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSuccess(false)}
        >
          <div
            className="relative mx-4 w-full max-w-sm rounded-3xl bg-card shadow-2xl border border-border overflow-hidden"
            style={{
              animation: "successPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti gradient top bar */}
            <div
              className="h-2 w-full"
              style={{
                background: "linear-gradient(90deg, #f43f5e, #f59e0b, #10b981, #3b82f6, #a855f7)",
              }}
            />

            {/* Close button */}
            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center gap-4 px-8 py-8 text-center">
              {/* Animated thumbs up */}
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg"
                style={{ animation: "thumbBounce 0.6s 0.2s cubic-bezier(0.34,1.56,0.64,1) both" }}
              >
                <span style={{ fontSize: "3rem", lineHeight: 1 }}>👍</span>
              </div>

              <div className="space-y-1">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                  Thank You for Booking!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your booking has been confirmed successfully.
                </p>
              </div>

              {/* Booking details card */}
              <div className="w-full rounded-2xl bg-secondary/40 border border-border p-4 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">
                    {successBooking.id}
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                    {successBooking.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Customer
                    </p>
                    <p className="font-semibold text-foreground">{successBooking.customer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Travel Date
                    </p>
                    <p className="font-semibold text-foreground">
                      {successBooking.travelDate || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Package
                    </p>
                    <p className="font-semibold text-foreground truncate">
                      {successBooking.package}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Total Amount
                    </p>
                    <p className="font-bold text-primary">{formatINR(successBooking.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Paid
                    </p>
                    <p className="font-bold text-emerald-600">{formatINR(successBooking.paid)}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSuccess(false)}
                className="w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                🎉 Awesome, Got it!
              </button>
            </div>
          </div>

          {/* CSS animations */}
          <style>{`
            @keyframes successPop {
              0% { opacity: 0; transform: scale(0.7) translateY(30px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes thumbBounce {
              0% { opacity: 0; transform: scale(0.3) rotate(-20deg); }
              100% { opacity: 1; transform: scale(1) rotate(0deg); }
            }
          `}</style>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Delete Booking</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete the booking for{" "}
              <strong className="text-foreground">{deleteTarget?.customer}</strong> (
              {deleteTarget?.id})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="default" className="rounded-xl" onClick={handleDeleteBooking}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
