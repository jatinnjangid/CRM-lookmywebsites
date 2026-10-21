import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Trash2, Wallet, Search, Filter, Download, User, MoreVertical, FileText, IndianRupee, MessageSquare, MessageCircle, History, Copy, Phone, Mail, MapPin, CheckSquare, ArrowUp, ArrowDown, ArrowUpDown, Table2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR, Customer as BaseCustomer } from "@/lib/mock-data";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { ImportCustomersModal } from "@/components/ui/import-customers-modal";
import { getAuth } from "@/lib/auth";
import { INITIAL_EMPLOYEES } from "./crm.employees";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { generateWhatsAppLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/crm/customers")({
  component: CustomersPage,
});

export interface ExtCustomer extends BaseCustomer {
  reference?: string;
  company?: string;
  city?: string;
  source?: string;
  status: "Active" | "Inactive" | "VIP";
  createdAt: string;
  lastBookingDate?: string;
  assignedTo?: string;
}

const CUSTOMER_STATUSES = ["Active", "Inactive", "VIP"];
const SOURCES = ["Website", "Referral", "Facebook", "Instagram", "Ads", "Walk-in", "Other"];

function CustomersPage() {
  const [customerList, setCustomerList] = useSupabaseTable<ExtCustomer[]>("customers", []);
  const [leads] = useSupabaseTable<any[]>("leads", []);
  const [bookings] = useSupabaseTable<any[]>("bookings", []);
  const [tasks] = useSupabaseTable<any[]>("tasks", []);
  const [localEmployees] = useSupabaseTable<any[]>("employees", INITIAL_EMPLOYEES);
  const [insurancePolicies] = useSupabaseTable<any[]>("insurance_policies", []);
  
  const employees = localEmployees?.length ? localEmployees : INITIAL_EMPLOYEES;
  const auth = getAuth();
  const isAdmin = auth?.role === "admin" || auth?.role === "manager";
  const assignees = Array.from(new Set([...employees.map((e) => e.name), ...(auth?.name ? [auth.name] : []), "Unassigned"]));

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  
  const [newCustomer, setNewCustomer] = useState<Partial<ExtCustomer>>({ 
    name: "", phone: "", email: "", status: "Active", source: "Website", assignedTo: "Unassigned", company: "", city: "", reference: "", dob: "", dateOfAnniversary: "", gst: ""
  });

  const [selectedCustomer, setSelectedCustomer] = useState<ExtCustomer | null>(null);
  const [dialogType, setDialogType] = useState<"profile" | "delete" | "edit" | null>(null);

  // Filters & Search
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCity, setFilterCity] = useState("All");
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const cities = Array.from(new Set(customerList.map((c) => c.city).filter(Boolean))) as string[];

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;

    if (dialogType === "edit" && selectedCustomer) {
      setCustomerList((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? { ...c, ...newCustomer } as ExtCustomer : c))
      );
      setDialogType(null);
      return;
    }

    const isDuplicate = customerList.some((c) => c.phone === newCustomer.phone);
    if (isDuplicate) {
      alert("A customer with this phone number already exists.");
      return;
    }

    const currentMaxId = (customerList || []).reduce((max, c) => {
      if (!c.id || typeof c.id !== 'string') return max;
      const num = parseInt(c.id.replace("CRN", ""));
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextId = `CRN${String(currentMaxId + 1).padStart(3, "0")}`;

    const customer: ExtCustomer = {
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
      tier: "Silver", // Legacy compat
    };

    setCustomerList([customer, ...customerList]);
    setIsAddOpen(false);
    setNewCustomer({ name: "", phone: "", email: "", status: "Active", source: "Website", assignedTo: "Unassigned" });
    toast.success("Customer saved successfully! 👍");
  };



  const handleImportCustomers = (data: any[]) => {
    let currentMaxId = customerList.reduce((max, c) => {
      const num = parseInt(c.id.replace("CRN", ""));
      return !isNaN(num) && num > max ? num : max;
    }, 0);

    const pad = (num: number, size: number) => {
      let s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    };

    const newCustomers: ExtCustomer[] = [];
    
    data.forEach((row) => {
      const phone = String(row["Mobile Number"] || "").trim();
      // Skip duplicate phones if already in existing list or current import batch
      if (customerList.some(c => c.phone === phone) || newCustomers.some(c => c.phone === phone)) return;
      
      currentMaxId++;
      newCustomers.push({
        id: `CRN${pad(currentMaxId, 3)}`,
        name: String(row["Customer Name"] || ""),
        email: String(row["Email Address"] || ""),
        phone: phone,
        reference: String(row["Reference Name"] || ""),
        company: String(row["Company Name"] || ""),
        city: String(row["City"] || ""),
        source: String(row["Lead Source"] || "Website"),
        status: (String(row["Status"]) || "Active") as "Active" | "Inactive" | "VIP",
        assignedTo: String(row["Assigned Employee"] || "Unassigned"),
        createdAt: new Date().toISOString().slice(0, 10),
        trips: 0,
        totalSpend: 0,
        tier: "Silver",
      });
    });

    setCustomerList([...newCustomers, ...customerList]);
  };

  const exportToExcel = () => {
    const headers = [
      "Customer ID",
      "Customer Name",
      "Email Address",
      "Mobile Number",
      "Reference Name",
      "Company Name",
      "City",
      "Lead Source",
      "Status",
      "Assigned Employee",
      "Total Bookings",
      "Total Revenue",
      "Created Date",
    ].join(",");

    const exportableCustomers = filtered.filter(c => {
      const d = c.createdAt ? String(c.createdAt).split('T')[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const rows = exportableCustomers.map((c) =>
      [
        c.id,
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.reference || ""}"`,
        `"${c.company || ""}"`,
        `"${c.city || ""}"`,
        `"${c.source || ""}"`,
        `"${c.status}"`,
        `"${c.assignedTo || ""}"`,
        c.trips,
        c.totalSpend,
        c.createdAt,
      ].join(",")
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToWord = () => {
    const tableHeader =
      "<tr><th>Customer ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>City</th><th>Company</th><th>Status</th></tr>";

    const exportableCustomers = filtered.filter(c => {
      const d = c.createdAt ? String(c.createdAt).split('T')[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableRows = exportableCustomers
      .map(
        (c) =>
          `<tr><td>${c.id}</td><td>${c.name || ""}</td><td>${c.phone || ""}</td><td>${c.email || ""}</td><td>${c.city || ""}</td><td>${c.company || ""}</td><td>${c.status || ""}</td></tr>`,
      )
      .join("");

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Customers Export</title><style>table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; } th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head>
      <body><h2>Grand Journeys CRM - Customers Export</h2><table>${tableHeader}${tableRows}</table></body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${new Date().toISOString().slice(0, 10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHeader =
      "<tr><th>Customer ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>City</th><th>Company</th><th>Status</th></tr>";

    const exportableCustomers = filtered.filter(c => {
      const d = c.createdAt ? String(c.createdAt).split('T')[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableRows = exportableCustomers
      .map(
        (c) =>
          `<tr><td>${c.id}</td><td>${c.name || ""}</td><td>${c.phone || ""}</td><td>${c.email || ""}</td><td>${c.city || ""}</td><td>${c.company || ""}</td><td>${c.status || ""}</td></tr>`,
      )
      .join("");

    const css = `body{font-family:sans-serif;padding:20px;color:#333}h2{color:#059669;margin-bottom:5px}p{font-size:12px;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f9fafb;font-weight:bold}tr:nth-child(even){background:#f3f4f6}`;
    const styleEl = printWindow.document.createElement("style");
    styleEl.textContent = css;
    printWindow.document.head.appendChild(styleEl);
    const titleEl = printWindow.document.createElement("title");
    titleEl.textContent = "Customers Export PDF";
    printWindow.document.head.appendChild(titleEl);
    const bodyHtml = `<h2>Grand Journeys CRM - Customers Export</h2><p>Generated on ${new Date().toLocaleDateString("en-IN")} | Total Customers: ${exportableCustomers.length}</p><table><thead>${tableHeader}</thead><tbody>${tableRows}</tbody></table>`;
    const wrapper = printWindow.document.createElement("div");
    wrapper.innerHTML = bodyHtml;
    printWindow.document.body.appendChild(wrapper);
    const script = printWindow.document.createElement("script");
    script.textContent =
      "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
    printWindow.document.body.appendChild(script);
  };

  const { travelPhones, insurancePhones } = useMemo(() => {
    const tp = new Set<string>();
    const ip = new Set<string>();

    bookings?.forEach(b => {
      if (b.mobileNumber) tp.add(String(b.mobileNumber).trim());
    });
    leads?.forEach(l => {
      if (l.phone) tp.add(String(l.phone).trim());
    });

    insurancePolicies?.forEach(p => {
      if (p.mobile_number) ip.add(String(p.mobile_number).trim());
      if (p.customer_phone) ip.add(String(p.customer_phone).trim());
    });

    return { travelPhones: tp, insurancePhones: ip };
  }, [bookings, leads, insurancePolicies]);

  const filtered = useMemo(() => {
    return customerList.filter(
      (c) =>
        (filterStatus === "All" || c.status === filterStatus) &&
        (filterCity === "All" || c.city === filterCity) &&
        (filterAssignee === "All" || c.assignedTo === filterAssignee) &&
        (filterCategory === "All Categories" || 
          (filterCategory === "Travel" && c.phone && travelPhones.has(String(c.phone).trim())) ||
          (filterCategory === "Gen. Insurance" && c.phone && insurancePhones.has(String(c.phone).trim()))
        ) &&
        (q === "" ||
          c.name?.toLowerCase().includes(q.toLowerCase()) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q.toLowerCase()) ||
          c.reference?.toLowerCase().includes(q.toLowerCase()) ||
          c.company?.toLowerCase().includes(q.toLowerCase()) ||
          c.city?.toLowerCase().includes(q.toLowerCase()))
    ).sort((a, b) => {
      const valA = a[sortField as keyof ExtCustomer];
      const valB = b[sortField as keyof ExtCustomer];
      
      if (!valA && valB) return sortOrder === "asc" ? -1 : 1;
      if (valA && !valB) return sortOrder === "asc" ? 1 : -1;
      if (!valA && !valB) return 0;

      if (sortField === "id") {
        const numA = parseInt(a.id.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.id.replace(/\D/g, "")) || 0;
        return sortOrder === "asc" ? numA - numB : numB - numA;
      }
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === "asc" ? -1 : 1;
      if (strA > strB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [customerList, filterStatus, filterCity, filterAssignee, filterCategory, q, sortField, sortOrder, travelPhones, insurancePhones]);

  // Pagination removed - showing all data with scroll


  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "VIP": return <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border border-amber-500/25">VIP</span>;
      case "Active": return <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider">Active</span>;
      default: return <span className="bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider">Inactive</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your entire customer database, view history, and track loyalty.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {isAdmin && (
            <Button variant="outline" onClick={() => setIsExportOpen(true)}>
              <Download className="mr-2 h-4 w-4" /> Export Customer
            </Button>
          )}
          <Button onClick={() => setIsAddOpen(true)} style={{ background: "var(--gradient-brand)" }} className="text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }}
            className="pl-9 bg-background h-10 rounded-xl"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px] bg-background h-10 rounded-xl border border-border shadow-sm font-medium">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {CUSTOMER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCity} onValueChange={(v) => { setFilterCity(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px] bg-background h-10 rounded-xl border border-border shadow-sm font-medium">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAssignee} onValueChange={(v) => { setFilterAssignee(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[150px] bg-background h-10 rounded-xl border border-border shadow-sm font-medium">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Assignees</SelectItem>
              {assignees.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[150px] bg-background h-10 rounded-xl border border-border shadow-sm font-medium">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Categories">All Categories</SelectItem>
              <SelectItem value="Travel">Travel</SelectItem>
              <SelectItem value="Gen. Insurance">Gen. Insurance</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground whitespace-nowrap font-medium px-2">
            {filtered.length} customers
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 select-none">
              <TableHead className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "name" && sortOrder === "asc" ? "desc" : "asc"); setSortField("name"); }}>
                <div className="flex items-center gap-1">Customer Info {sortField === "name" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "phone" && sortOrder === "asc" ? "desc" : "asc"); setSortField("phone"); }}>
                <div className="flex items-center gap-1">Contact Details {sortField === "phone" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "city" && sortOrder === "asc" ? "desc" : "asc"); setSortField("city"); }}>
                <div className="flex items-center gap-1">Location {sortField === "city" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "status" && sortOrder === "asc" ? "desc" : "asc"); setSortField("status"); }}>
                <div className="flex items-center gap-1">Status {sortField === "status" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <User className="h-10 w-10 mb-3 opacity-50" />
                    <p>No customers found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.id}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.phone && travelPhones.has(String(c.phone).trim()) && (
                            <span className="text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/25 font-medium">Travel</span>
                          )}
                          {c.phone && insurancePhones.has(String(c.phone).trim()) && (
                            <span className="text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/25 font-medium">Gen. Insurance</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.phone}
                        {c.phone && (
                          <a
                            href={generateWhatsAppLink(c.phone, "Hello!")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                            title="Message on WhatsApp"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[150px] sm:max-w-[200px]">{c.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.city ? (
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.city}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-50 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => { setSelectedCustomer(c); setDialogType("profile"); }}>
                          <User className="mr-2 h-4 w-4" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedCustomer(c); setDialogType("profile"); }}>
                          <History className="mr-2 h-4 w-4" /> View History
                        </DropdownMenuItem>
                        <>{auth?.role === "admin" && (
<DropdownMenuItem onClick={() => { setSelectedCustomer(c); setNewCustomer(c); setDialogType("edit"); }}>
                          <FileText className="mr-2 h-4 w-4" /> Edit Customer
                        </DropdownMenuItem>
)}</>
                        <DropdownMenuSeparator />
                        {isAdmin && (
                          <>{auth?.role === "admin" && (
<DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => { setSelectedCustomer(c); setDialogType("delete"); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
)}</>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Modals ── */}
      <ImportCustomersModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImportCustomers}
        allowedStatuses={CUSTOMER_STATUSES}
        allowedAssignees={assignees}
      />

      <Dialog open={isAddOpen || dialogType === "edit"} onOpenChange={(val) => {
        if (!val) {
          setIsAddOpen(false);
          setDialogType(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{dialogType === "edit" ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>
              {dialogType === "edit" ? "Update customer details." : "Create a new customer profile."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer} className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name <span className="text-red-500">*</span></Label>
              <Input id="name" autoComplete="off" name="customer_name_field" placeholder="e.g. jatin jangid" required value={newCustomer.name || ""} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number <span className="text-red-500">*</span></Label>
              <Input id="phone" placeholder="e.g. 9876543210" required value={newCustomer.phone || ""} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="e.g. jatin@example.com" value={newCustomer.email || ""} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" placeholder="e.g. NxtWave" value={newCustomer.company || ""} onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="e.g. jaipur" value={newCustomer.city || ""} onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Name</Label>
              <Input id="reference" placeholder="e.g. jatin jangid" value={newCustomer.reference || ""} onChange={(e) => setNewCustomer({ ...newCustomer, reference: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Lead Source</Label>
              <Select value={newCustomer.source || "Website"} onValueChange={(v) => setNewCustomer({ ...newCustomer, source: v })}>
                <SelectTrigger id="source"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newCustomer.status || "Active"} onValueChange={(v: any) => setNewCustomer({ ...newCustomer, status: v })}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUSTOMER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned Employee</Label>
              <Select value={newCustomer.assignedTo || "Unassigned"} onValueChange={(v) => setNewCustomer({ ...newCustomer, assignedTo: v })}>
                <SelectTrigger id="assignedTo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {assignees.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">DOB</Label>
              <Input id="dob" type="date" value={newCustomer.dob || ""} onChange={(e) => setNewCustomer({ ...newCustomer, dob: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfAnniversary">Date of Anniversary</Label>
              <Input id="dateOfAnniversary" type="date" value={newCustomer.dateOfAnniversary || ""} onChange={(e) => setNewCustomer({ ...newCustomer, dateOfAnniversary: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst">GST</Label>
              <Input id="gst" placeholder="GST Number" value={newCustomer.gst || ""} onChange={(e) => setNewCustomer({ ...newCustomer, gst: e.target.value })} />
            </div>
            <DialogFooter className="col-span-2 mt-4">
              <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setDialogType(null); }}>
                Cancel
              </Button>
              <Button type="submit">{dialogType === "edit" ? "Update Customer" : "Save Customer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "profile"} onOpenChange={(val) => !val && setDialogType(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden h-[85vh] flex flex-col">
          {selectedCustomer && (
            <>
              <DialogHeader className="px-6 pt-8 pb-6">
                <div>
                  <DialogTitle className="text-4xl font-display font-bold tracking-tight mb-2">{selectedCustomer.name}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedCustomer.city || "Unknown"}</span>
                    <span>•</span>
                    <span>{selectedCustomer.id}</span>
                  </DialogDescription>
                </div>
              </DialogHeader>

              {(() => {
                const custBookings = bookings.filter((b: any) => b.customer === selectedCustomer.name || b.mobileNumber === selectedCustomer.phone);
                const custLeads = leads.filter((l: any) => l.phone === selectedCustomer.phone);
                const custTasks = tasks.filter((t: any) => t.customer_id === selectedCustomer.name || t.customer_id === selectedCustomer.id);
                const totalSpent = custBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

                return (
                  <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 border-t border-border pt-6 pb-2">
                      <TabsList className="h-12 bg-secondary/30 rounded-full w-full justify-between p-1">
                        <TabsTrigger value="overview" className="flex-1 data-[state=active]:border-orange-500 data-[state=active]:border-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-full py-2 text-sm font-medium border-2 border-transparent text-muted-foreground hover:text-foreground">
                          Info
                        </TabsTrigger>
                        <TabsTrigger value="bookings" className="flex-1 data-[state=active]:border-orange-500 data-[state=active]:border-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-full py-2 text-sm font-medium border-2 border-transparent text-muted-foreground hover:text-foreground">
                          Bookings ({custBookings.length})
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="flex-1 data-[state=active]:border-orange-500 data-[state=active]:border-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-full py-2 text-sm font-medium border-2 border-transparent text-muted-foreground hover:text-foreground">
                          Payments
                        </TabsTrigger>
                        <TabsTrigger value="leads" className="flex-1 data-[state=active]:border-orange-500 data-[state=active]:border-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-full py-2 text-sm font-medium border-2 border-transparent text-muted-foreground hover:text-foreground">
                          Leads ({custLeads.length})
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="flex-1 data-[state=active]:border-orange-500 data-[state=active]:border-2 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-full py-2 text-sm font-medium border-2 border-transparent text-muted-foreground hover:text-foreground">
                          Tasks ({custTasks.length})
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                  <TabsContent value="overview" className="m-0 outline-none">
                    <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-8">
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">Phone</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-lg text-foreground">{selectedCustomer.phone}</p>
                            {selectedCustomer.phone && (
                              <a
                                href={generateWhatsAppLink(selectedCustomer.phone, "Hello!")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-500 hover:text-emerald-600 transition-colors bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-full"
                                title="Message on WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">Email</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.email || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">Company</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.company || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">City</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.city || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">Reference</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.reference || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">Source</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.source || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">Assigned To</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.assignedTo || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">DOB</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.dob || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">Anniversary</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.dateOfAnniversary || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">GST</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.gst || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-1 font-medium">Created At</p>
                          <p className="font-medium text-lg text-foreground">{selectedCustomer.createdAt}</p>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-secondary/20 p-4 rounded-xl border text-center">
                          <p className="text-2xl font-bold font-display">{custBookings.length}</p>
                          <p className="text-xs text-muted-foreground uppercase font-medium mt-1">Bookings</p>
                        </div>
                        <div className="bg-secondary/20 p-4 rounded-xl border text-center">
                          <p className="text-2xl font-bold font-display">{custLeads.length}</p>
                          <p className="text-xs text-muted-foreground uppercase font-medium mt-1">Leads</p>
                        </div>
                        <div className="bg-secondary/20 p-4 rounded-xl border text-center">
                          <p className="text-2xl font-bold font-display">{custTasks.length}</p>
                          <p className="text-xs text-muted-foreground uppercase font-medium mt-1">Tasks</p>
                        </div>
                        <div className="bg-secondary/20 p-4 rounded-xl border text-center">
                          <p className="text-2xl font-bold font-display">{formatINR(totalSpent)}</p>
                          <p className="text-xs text-muted-foreground uppercase font-medium mt-1">Total Spent</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bookings" className="m-0 outline-none flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg">Booking History</h3>
                    </div>
                    {(() => {
                      if (custBookings.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">
                            <History className="h-12 w-12 mb-4 opacity-50" />
                            <p>No booking history found.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {custBookings.map((b: any) => (
                            <div key={b.id} className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-sm">
                                  {b.package || b.bookingType}
                                  {(b.details?.sector || b.details?.destination || b.details?.city) ? ` - ${b.details?.sector || b.details?.destination || b.details?.city}` : ""}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {b.id} • {b.bookingDate}
                                  {b.supplier ? ` • ${b.supplier}` : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-display font-bold text-primary">{formatINR(b.amount)}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                  b.status === "Confirmed" || b.status === "Completed" ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25"
                                }`}>{b.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="payments" className="m-0 outline-none flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg">Payment History</h3>
                    </div>
                     {(() => {
                      if (custBookings.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">
                            <IndianRupee className="h-12 w-12 mb-4 opacity-50" />
                            <p>No payment history found.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {custBookings.map((b: any) => (
                            <div key={b.id + 'pay'} className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-sm">Payment for {b.id}</h4>
                                <p className="text-xs text-muted-foreground mt-1">Via {b.paymentMode || "Unknown"} • {b.transactionId || "No TXN ID"}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-display font-bold text-primary">{formatINR(b.paid)}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Out of {formatINR(b.amount)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="leads" className="m-0 outline-none">
                     {(() => {
                      if (custLeads.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">
                            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                            <p>No leads associated with this customer.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {custLeads.map(l => (
                            <div key={l.id} className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-sm">{l.destination || l.service}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{l.id} • Created on {l.createdAt}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-display font-bold">{formatINR(l.budget || l.totalAmount || 0)}</p>
                                <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                                  {l.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="tasks" className="m-0 outline-none">
                     {(() => {
                      if (custTasks.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed">
                            <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
                            <p>No tasks associated with this customer.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {custTasks.map((t: any) => (
                            <div key={t.id} className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-sm">{t.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">Due {t.due_date} • Priority: {t.priority}</p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                  t.status === "Completed" ? "bg-primary/10 text-primary border-primary/20" :
                                  t.status === "In Progress" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25" :
                                  "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25"
                                }`}>
                                  {t.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </TabsContent>
                </div>
              </Tabs>
              );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "delete"} onOpenChange={(val) => !val && setDialogType(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Customer
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>? This
              action will remove them from the database permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancel</Button>
            <Button variant="default" onClick={() => {
              if (selectedCustomer) {
                setCustomerList(customerList.filter((c) => c.id !== selectedCustomer.id));
              }
              setDialogType(null);
            }}>
              Yes, delete customer
            </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Customers</DialogTitle>
            <DialogDescription>
              Filter customers by created date before exporting.
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
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-center group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/25 border border-rose-500/25">
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
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all text-center group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25 border border-emerald-500/25">
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
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-500 transition-all text-center group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/25 border border-blue-500/25">
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
    </div>
  );
}
