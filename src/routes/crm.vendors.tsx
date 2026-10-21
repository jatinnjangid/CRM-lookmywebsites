import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { getAuth } from "@/lib/auth";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Download,
  MoreVertical,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building2,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  Copy,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  FileText,
  Table2,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/lib/mock-data";
import { ImportVendorsModal } from "@/components/ui/import-vendors-modal";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/crm/vendors")({ component: VendorsPage });

// ── Types ────────────────────────────────────────────────────────────────────

export type VendorType =
  | "Hotel"
  | "Flight"
  | "Visa"
  | "Holiday Package"
  | "Transport"
  | "Bus"
  | "Train"
  | "Cruise"
  | "Forex"
  | "Travel Insurance"
  | "Activity"
  | "Tour Guide"
  | "DMC"
  | "Car Rental"
  | "Other";

export type VendorStatus = "Active" | "Inactive";

export interface VendorContact {
  name: string;
  mobile: string;
  email: string;
}

export interface Vendor {
  id: string;
  place: string;
  name: string;
  contactPerson: string;  // legacy — mirrors contacts[0].name
  mobile: string;         // legacy — mirrors contacts[0].mobile
  email: string;          // legacy — mirrors contacts[0].email
  website: string;
  officeCity: string;
  vendorType: VendorType;
  status: VendorStatus;
  createdAt: string;
  notes?: string;
  contacts?: VendorContact[];
}

const VENDOR_TYPES: VendorType[] = [
  "Hotel", "Flight", "Visa", "Holiday Package", "Transport",
  "Bus", "Train", "Cruise", "Forex", "Travel Insurance",
  "Activity", "Tour Guide", "DMC", "Car Rental", "Other",
];

const EMPTY_FORM: Partial<Vendor> = {
  place: "", name: "", contactPerson: "", mobile: "", email: "",
  website: "", officeCity: "", vendorType: "Hotel", status: "Active", notes: "",
  contacts: [{ name: "", mobile: "", email: "" }],
};

const EMPTY_CONTACT: VendorContact = { name: "", mobile: "", email: "" };

const vendorTypeColor: Record<string, string> = {
  Hotel: "bg-sky-100 text-sky-700 border-sky-200",
  Flight: "bg-blue-100 text-blue-700 border-blue-200",
  Visa: "bg-purple-100 text-purple-700 border-purple-200",
  "Holiday Package": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Transport: "bg-orange-100 text-orange-700 border-orange-200",
  Bus: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Train: "bg-teal-100 text-teal-700 border-teal-200",
  Cruise: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Forex: "bg-green-100 text-green-700 border-green-200",
  "Travel Insurance": "bg-rose-100 text-rose-700 border-rose-200",
  Activity: "bg-amber-100 text-amber-700 border-amber-200",
  "Tour Guide": "bg-lime-100 text-lime-700 border-lime-200",
  DMC: "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Car Rental": "bg-slate-100 text-slate-700 border-slate-200",
  Other: "bg-gray-100 text-gray-700 border-gray-200",
};

type SortField = keyof Vendor | null;
type SortDir = "asc" | "desc";

// ── Component ─────────────────────────────────────────────────────────────────

function VendorsPage() {
  const [vendors, setVendors] = useSupabaseTable<Vendor[]>("vendors", []);

  const formatCityName = (city: string) => {
    if (!city) return "";
    return city.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const normalizeVendor = (vendor: any) => {
    let extra: any = {};
    if (typeof vendor.notes === 'string' && vendor.notes.startsWith('{')) {
      try {
        extra = JSON.parse(vendor.notes);
      } catch (e) {
        // ignore
      }
    }
    return {
      ...vendor,
      ...extra,
      place: formatCityName(vendor.place || vendor.location || ""),
      officeCity: formatCityName(vendor.officeCity || extra.officeCity || vendor.city || ""),
      mobile: vendor.mobile || vendor.phone || "",
      vendorType: vendor.vendorType || vendor.category || "",
      contactPerson: vendor.contactPerson || vendor.contactperson || vendor.contact_person || "",
      createdAt: vendor.createdAt || (vendor.created_at ? new Date(vendor.created_at).toISOString().slice(0, 10) : ""),
      contacts: vendor.contacts || extra.contacts || [{
        name: vendor.contactPerson || vendor.contactperson || vendor.contact_person || "",
        mobile: vendor.mobile || vendor.phone || "",
        email: vendor.email || ""
      }],
      notes: extra.notes || (typeof vendor.notes === 'string' && !vendor.notes.startsWith('{') ? vendor.notes : "")
    };
  };

  const normalizedVendors = useMemo(() => vendors.map(normalizeVendor), [vendors]);
  const auth = getAuth();
  const isAdmin = (auth?.role === "admin" || auth?.role === "manager") && !auth?.name.toLowerCase().includes("suman");

  // Search & Filters
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterPlace, setFilterPlace] = useState("All");
  const [filterCity, setFilterCity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Sorting
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Modals
  const [dialogType, setDialogType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<Partial<Vendor>>(EMPTY_FORM);
  const [formContacts, setFormContacts] = useState<VendorContact[]>([{ ...EMPTY_CONTACT }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Contact helpers
  const addContact = () => setFormContacts((prev) => [...prev, { ...EMPTY_CONTACT }]);
  const removeContact = (i: number) => setFormContacts((prev) => prev.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: keyof VendorContact, value: string) =>
    setFormContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  // ── Derived lists ──
  const uniquePlaces = useMemo(() => Array.from(new Set(normalizedVendors.map((v) => v.place).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [normalizedVendors]);
  const uniqueCities = useMemo(() => Array.from(new Set(normalizedVendors.map((v) => v.officeCity).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [normalizedVendors]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: normalizedVendors.length,
    active: normalizedVendors.filter((v) => v.status === "Active").length,
    types: new Set(normalizedVendors.map((v) => v.vendorType)).size,
    cities: new Set(normalizedVendors.map((v) => v.officeCity).filter(Boolean)).size,
    countries: new Set(normalizedVendors.map((v) => (v.place || "").split(",").pop()?.trim()).filter(Boolean)).size,
  }), [normalizedVendors]);

  // ── Filter & Sort ──
  const filtered = useMemo(() => {
    let list = normalizedVendors.filter((v) => {
      const sq = q.toLowerCase();
      return (
        (filterType === "All" || v.vendorType === filterType) &&
        (filterPlace === "All" || v.place === filterPlace) &&
        (filterCity === "All" || v.officeCity === filterCity) &&
        (filterStatus === "All" || v.status === filterStatus) &&
        (!sq ||
          v.name?.toLowerCase().includes(sq) ||
          v.contactPerson?.toLowerCase().includes(sq) ||
          v.mobile?.includes(sq) ||
          v.email?.toLowerCase().includes(sq) ||
          v.place?.toLowerCase().includes(sq) ||
          v.officeCity?.toLowerCase().includes(sq))
      );
    });

    if (sortField) {
      list = [...list].sort((a, b) => {
        const av = String(a[sortField] ?? "").toLowerCase();
        const bv = String(b[sortField] ?? "").toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [normalizedVendors, q, filterType, filterPlace, filterCity, filterStatus, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ── Handlers ──
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />;
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormContacts([{ ...EMPTY_CONTACT }]);
    setFormError(null);
    setDialogType("add");
  };

  const openEdit = (v: Vendor) => {
    setSelectedVendor(v);
    setForm({ ...v });
    // Initialise contacts from stored array, or fall back to legacy single fields
    const existing = v.contacts && v.contacts.length > 0
      ? v.contacts
      : [{ name: v.contactPerson || "", mobile: v.mobile || "", email: v.email || "" }];
    setFormContacts(existing.map((c) => ({ ...c })));
    setFormError(null);
    setDialogType("edit");
  };

  const openView = (v: Vendor) => {
    setSelectedVendor(v);
    setDialogType("view");
  };

  const validateForm = (): string | null => {
    if (!form.name?.trim()) return "Vendor Name is required.";
    if (!form.place?.trim()) return "Place is required.";
    if (!form.officeCity?.trim()) return "Office City is required.";
    if (!form.vendorType) return "Vendor Type is required.";
    if (form.website && !/^https?:\/\/.+/.test(form.website)) return "Website must start with http:// or https://";
    // Validate contacts
    if (!formContacts.length || !formContacts[0].name?.trim()) return "At least one Contact Person name is required.";
    if (!formContacts[0].mobile?.trim()) return "Primary contact Mobile Number is required.";
    for (const c of formContacts) {
      if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return `Email '${c.email}' is not valid.`;
    }
    return null;
  };

  const handleSave = () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }

    // Build primary fields from contacts[0] for backward compat
    const primaryContact = formContacts[0];
    const primaryMobile = primaryContact.mobile.trim();

    if (dialogType === "add") {
      const isDup = vendors.some((v) =>
        v.mobile === primaryMobile ||
        (v.contacts || []).some((c) => c.mobile === primaryMobile)
      );
      if (isDup) { setFormError("A vendor with this mobile number already exists."); return; }

      const id = `VND-${String(Date.now()).slice(-5)}`;

      const newVendorData = {
        id,
        name: form.name,
        category: form.vendorType,
        contactperson: primaryContact.name,
        email: primaryContact.email,
        phone: primaryMobile,
        location: form.place,
        status: form.status,
        created_at: new Date().toISOString(),
        notes: JSON.stringify({
          contacts: formContacts,
          officeCity: form.officeCity,
          website: form.website,
          notes: form.notes
        })
      };

      supabase.from("vendors").insert([newVendorData]).select().then(({ data, error }) => {
        if (error) {
          toast.error("Failed to add vendor: " + error.message);
        } else if (data) {
          const inserted = data[0];
          setVendors([{
            ...form as Vendor,
            id: inserted.id,
            createdAt: inserted.created_at.slice(0, 10),
            contacts: formContacts,
            contactPerson: primaryContact.name,
            mobile: primaryMobile,
            email: primaryContact.email,
          }, ...vendors]);
          toast.success("Vendor added successfully");
        }
      });

    } else if (dialogType === "edit" && selectedVendor) {
      const isDup = vendors.some((v) => {
        if (v.id === selectedVendor.id) return false;
        return v.mobile === primaryMobile || (v.contacts || []).some((c) => c.mobile === primaryMobile);
      });
      if (isDup) { setFormError("Another vendor already uses this mobile number."); return; }

      const updatedVendorData = {
        name: form.name,
        category: form.vendorType,
        contactperson: primaryContact.name,
        email: primaryContact.email,
        phone: primaryMobile,
        location: form.place,
        status: form.status,
        notes: JSON.stringify({
          contacts: formContacts,
          officeCity: form.officeCity,
          website: form.website,
          notes: form.notes
        })
      };

      supabase.from("vendors").update(updatedVendorData).eq("id", selectedVendor.id).then(({ error }) => {
        if (error) {
          toast.error("Failed to update vendor: " + error.message);
        } else {
          setVendors(vendors.map((v) => v.id === selectedVendor.id ? {
            ...v,
            ...form,
            contacts: formContacts,
            contactPerson: primaryContact.name,
            mobile: primaryMobile,
            email: primaryContact.email,
          } as Vendor : v));
          toast.success("Vendor updated successfully");
        }
      });
    }

    setDialogType(null);
  };

  const handleDelete = () => {
    if (selectedVendor) {
      supabase.from("vendors").delete().eq("id", selectedVendor.id).then(({ error }) => {
        if (error) {
          toast.error("Failed to delete vendor: " + error.message);
        } else {
          setVendors(vendors.filter((v) => v.id !== selectedVendor.id));
          toast.success("Vendor deleted successfully");
        }
      });
    }
    setDialogType(null);
  };



  const handleImport = async (data: any[]) => {
    let maxNum = vendors.reduce((max, v) => {
      const n = parseInt(v.id.replace("VND-", ""));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);

    const newVendors: any[] = [];
    data.forEach((row) => {
      const mobile = String(row["Mobile Number"] || "").trim();
      if (!mobile) return;
      if (vendors.some((v) => v.mobile === mobile) || newVendors.some((v) => v.phone === mobile)) return;
      maxNum++;
      newVendors.push({
        id: `VND-${String(maxNum).padStart(5, "0")}`,
        location: String(row["Place"] || ""),
        name: String(row["Vendor Name"] || ""),
        contactperson: String(row["Contact Person"] || ""),
        phone: mobile,
        email: String(row["Email ID"] || ""),
        category: String(row["Vendor Type"] || "Other"),
        status: String(row["Status"] || "Active"),
        created_at: new Date().toISOString(),
        notes: JSON.stringify({
          importedFrom: "excel",
          officeCity: String(row["Office City"] || ""),
          website: String(row["Website"] || ""),
        }),
      });
    });

    if (newVendors.length === 0) return;

    const { error, data: inserted } = await supabase.from("vendors").insert(newVendors).select();
    if (error) {
      console.error("Vendor import failed:", error.message, error.details);
      toast.error(`Vendor import failed: ${error.message}`);
      return;
    }

    if (inserted) {
      const mapped = inserted.map((row: any) => ({
        ...row,
        place: row.location || "",
        officeCity: row.officeCity || "",
        mobile: row.phone || "",
        vendorType: row.category || "",
        contactPerson: row.contactperson || "",
        createdAt: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : "",
      }));
      setVendors([...mapped, ...vendors]);
      toast.success(`Successfully imported ${inserted.length} vendors`);
    }
  };

  const exportToExcel = () => {
    const headers = ["Vendor ID", "Place", "Vendor Name", "Contact Person", "Mobile", "Email", "Website", "Office City", "Vendor Type", "Status", "Created Date"];
    
    const exportableVendors = filtered.filter((v) => {
      const d = v.createdAt ? String(v.createdAt).split('T')[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const rows = exportableVendors.map((v) => [
      v.id,
      v.place,
      v.name,
      v.contactPerson,
      v.mobile,
      v.email,
      v.website,
      v.officeCity,
      v.vendorType,
      v.status,
      v.createdAt,
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");
    XLSX.writeFile(wb, `Vendors_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToWord = () => {
    const tableHeader =
      "<tr><th>Vendor ID</th><th>Place</th><th>Vendor Name</th><th>Contact Person</th><th>Mobile</th><th>Email</th><th>Vendor Type</th><th>Status</th></tr>";

    const exportableVendors = filtered.filter((v) => {
      const d = v.createdAt ? String(v.createdAt).split('T')[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableRows = exportableVendors
      .map(
        (v) =>
          `<tr><td>${v.id}</td><td>${v.place || ""}</td><td>${v.name || ""}</td><td>${v.contactPerson || ""}</td><td>${v.mobile || ""}</td><td>${v.email || ""}</td><td>${v.vendorType || ""}</td><td>${v.status || ""}</td></tr>`,
      )
      .join("");

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Vendors Export</title><style>table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; } th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head>
      <body><h2>Grand Journeys CRM - Vendors Export</h2><table>${tableHeader}${tableRows}</table></body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendors_export_${new Date().toISOString().slice(0, 10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHeader =
      "<tr><th>Vendor ID</th><th>Place</th><th>Vendor Name</th><th>Contact Person</th><th>Mobile</th><th>Email</th><th>Vendor Type</th><th>Status</th></tr>";

    const exportableVendors = filtered.filter((v) => {
      const d = v.createdAt ? String(v.createdAt).split('T')[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableRows = exportableVendors
      .map(
        (v) =>
          `<tr><td>${v.id}</td><td>${v.place || ""}</td><td>${v.name || ""}</td><td>${v.contactPerson || ""}</td><td>${v.mobile || ""}</td><td>${v.email || ""}</td><td>${v.vendorType || ""}</td><td>${v.status || ""}</td></tr>`,
      )
      .join("");

    const css = `body{font-family:sans-serif;padding:20px;color:#333}h2{color:#059669;margin-bottom:5px}p{font-size:12px;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f9fafb;font-weight:bold}tr:nth-child(even){background:#f3f4f6}`;
    const styleEl = printWindow.document.createElement("style");
    styleEl.textContent = css;
    printWindow.document.head.appendChild(styleEl);
    const titleEl = printWindow.document.createElement("title");
    titleEl.textContent = "Vendors Export PDF";
    printWindow.document.head.appendChild(titleEl);
    const bodyHtml = `<h2>Grand Journeys CRM - Vendors Export</h2><p>Generated on ${new Date().toLocaleDateString("en-IN")} | Total Vendors: ${exportableVendors.length}</p><table><thead>${tableHeader}</thead><tbody>${tableRows}</tbody></table>`;
    const wrapper = printWindow.document.createElement("div");
    wrapper.innerHTML = bodyHtml;
    printWindow.document.body.appendChild(wrapper);
    const script = printWindow.document.createElement("script");
    script.textContent =
      "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
    printWindow.document.body.appendChild(script);
  };

  // ── Helpers ──
  const TypeBadge = ({ type }: { type: string }) => (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${vendorTypeColor[type] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {type}
    </span>
  );

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : "NA";
  };
  const getInitialsColor = (index: number) => {
    const colors = [
      "bg-orange-100 text-orange-600 border-orange-200",
      "bg-green-100 text-green-600 border-green-200",
      "bg-purple-100 text-purple-600 border-purple-200",
      "bg-rose-100 text-rose-600 border-rose-200",
      "bg-pink-100 text-pink-600 border-pink-200",
      "bg-blue-100 text-blue-600 border-blue-200"
    ];
    return colors[index % colors.length];
  };

  // ── Render ──
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage service providers, DMCs, and suppliers.</p>
        </div>
        <div className="flex gap-2">
          {(auth?.role === "admin" || auth?.name?.toLowerCase().includes("aman")) && (
            <Button variant="outline" className="shadow-sm" onClick={() => setIsExportOpen(true)}>
              <Download className="mr-2 h-4 w-4" /> Export Vendor
            </Button>
          )}
          <Button onClick={openAdd} className="shadow">
            <Plus className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl p-2 px-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="flex w-full border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm pl-9 rounded-xl h-10"
              placeholder="Search vendor, contact, phone..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
            <div className="flex-shrink-0">
              <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[240px] rounded-full h-10 font-semibold bg-white dark:bg-background">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types ({stats.total})</SelectItem>
                  {VENDOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {uniqueCities.length > 0 && (
              <div className="flex-shrink-0">
                <Select value={filterCity} onValueChange={(v) => { setFilterCity(v); setPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[240px] rounded-full h-10 font-semibold bg-white dark:bg-background">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Cities ({uniqueCities.length})</SelectItem>
                    {uniqueCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="text-sm text-muted-foreground whitespace-nowrap font-medium px-2">
              {filtered.length} vendors
            </div>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-2">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 select-none">
              <TableHead className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortDir(sortField === "name" && sortDir === "asc" ? "desc" : "asc"); setSortField("name"); }}>
                <div className="flex items-center gap-1">Vendor Info {sortField === "name" ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortDir(sortField === "mobile" && sortDir === "asc" ? "desc" : "asc"); setSortField("mobile"); }}>
                <div className="flex items-center gap-1">Contact Details {sortField === "mobile" ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortDir(sortField === "officeCity" && sortDir === "asc" ? "desc" : "asc"); setSortField("officeCity"); }}>
                <div className="flex items-center gap-1">Location {sortField === "officeCity" ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortDir(sortField === "status" && sortDir === "asc" ? "desc" : "asc"); setSortField("status"); }}>
                <div className="flex items-center gap-1">Status {sortField === "status" ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 opacity-30"/>}</div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Building2 className="h-10 w-10 mb-3 opacity-50" />
                    <p>No vendors found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v, i) => {
                return (
                  <TableRow key={v.id} className="group hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => openView(v)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0 bg-primary/10 text-primary">
                          {getInitials(v.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground line-clamp-1 break-all" title={v.name}>{v.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{v.id}</span>
                            <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border bg-secondary text-secondary-foreground border-border">
                              {v.vendorType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {v.mobile || v.contacts?.[0]?.mobile || "N/A"}
                          {(v.mobile || v.contacts?.[0]?.mobile) && (
                            <a
                              href={generateWhatsAppLink(v.mobile || v.contacts?.[0]?.mobile || "", "Hello!")}
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
                        {v.email && (
                          <div className="flex items-center gap-2 text-sm text-foreground/80">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate max-w-[150px] sm:max-w-[200px]">{v.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(v.place || v.officeCity) ? (
                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {v.place || v.officeCity}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        (v.status === "Active" || v.status === "null" || !v.status) ? "bg-primary/10 text-primary border-primary/20" :
                        v.status === "Inactive" ? "bg-rose-100 text-rose-700 border-rose-200" :
                        "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {v.status === "null" || !v.status ? "Active" : v.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-50 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => openView(v)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <>{auth?.role === "admin" && (
<DropdownMenuItem onClick={() => openEdit(v)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Vendor
                          </DropdownMenuItem>
)}</>

                          <DropdownMenuSeparator />
                          {v.mobile && (
                            <>
                              <DropdownMenuItem asChild>
                                <a href={`tel:${v.mobile}`}>
                                  <Phone className="mr-2 h-4 w-4 text-emerald-600" /> Call Vendor
                                </a>
                              </DropdownMenuItem>
                            </>
                          )}
                          {v.email && (
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${v.email}`}>
                                <Mail className="mr-2 h-4 w-4 text-blue-600" /> Send Email
                              </a>
                            </DropdownMenuItem>
                          )}
                          {v.website && (
                            <DropdownMenuItem asChild>
                              <a href={v.website} target="_blank" rel="noopener noreferrer">
                                <Globe className="mr-2 h-4 w-4 text-purple-600" /> Open Website
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {isAdmin && (
                            <>{auth?.role === "admin" && (
<DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => { setSelectedVendor(v); setDialogType("delete"); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
)}</>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>


      {/* ── Import Modal ── */}
      <ImportVendorsModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImport}
        allowedTypes={VENDOR_TYPES}
      />

      {/* ── Add / Edit Modal ── */}
      <Dialog open={dialogType === "add" || dialogType === "edit"} onOpenChange={(val) => !val && setDialogType(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-card">
            <DialogTitle>{dialogType === "edit" ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
            <DialogDescription>
              {dialogType === "edit" ? "Update vendor details." : "Register a new travel vendor or supplier."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 grid grid-cols-2 gap-4 bg-secondary/10 overflow-y-auto max-h-[70vh]">
            <div className="col-span-2 space-y-1.5">
              <Label>Vendor Name <span className="text-red-500">*</span></Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Address Beach Resort" />
            </div>
            <div className="space-y-1.5">
              <Label>Place (Destination) <span className="text-red-500">*</span></Label>
              <Input value={form.place || ""} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="e.g. Dubai, UAE" />
            </div>
            <div className="space-y-1.5">
              <Label>Office City <span className="text-red-500">*</span></Label>
              <Input value={form.officeCity || ""} onChange={(e) => setForm({ ...form, officeCity: e.target.value })} placeholder="e.g. Dubai" />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://www.vendor.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor Type <span className="text-red-500">*</span></Label>
              <Select value={form.vendorType || "Hotel"} onValueChange={(v) => setForm({ ...form, vendorType: v as VendorType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status || "Active"} onValueChange={(v) => setForm({ ...form, status: v as VendorStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Contact Persons ── */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Contact Persons <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(First contact is the primary)</span>
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addContact} className="h-7 px-3 text-xs gap-1.5 rounded-lg">
                  <Plus className="h-3.5 w-3.5" /> Add Contact
                </Button>
              </div>

              <div className="space-y-3">
                {formContacts.map((contact, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2 relative">
                    {i === 0 ? (
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                        Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeContact(i)}
                        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1">Contact {i + 1}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Name {i === 0 && <span className="text-red-500">*</span>}</Label>
                        <Input
                          value={contact.name}
                          onChange={(e) => updateContact(i, "name", e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Mobile Number {i === 0 && <span className="text-red-500">*</span>}</Label>
                        <Input
                          value={contact.mobile}
                          onChange={(e) => updateContact(i, "mobile", e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email ID</Label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(i, "email", e.target.value)}
                          placeholder="e.g. vendor@example.com"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes / Remarks</Label>
              <textarea
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Partner policies, banking details, or contract descriptions..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            {formError && (
              <div className="col-span-2 flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl">
                <span className="font-medium">{formError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border bg-card gap-2">
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancel</Button>
            <Button onClick={handleSave} style={{ background: "var(--gradient-brand)" }} className="text-white">
              {dialogType === "edit" ? "Save Changes" : "Save Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Modal ── */}
      <Dialog open={dialogType === "view"} onOpenChange={(val) => !val && setDialogType(null)}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
          {selectedVendor && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-card">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-2xl border border-primary/20">
                    {selectedVendor.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl font-display truncate">{selectedVendor.name}</DialogTitle>
                    <DialogDescription className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                      <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded-md">{selectedVendor.id}</span>
                      <TypeBadge type={selectedVendor.vendorType} />
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${selectedVendor.status === "Active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>{selectedVendor.status}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-5 bg-secondary/10 overflow-y-auto max-h-[65vh]">
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contact Persons</h3>
                  <div className="space-y-3">
                    {(selectedVendor.contacts?.length
                      ? selectedVendor.contacts
                      : [{ name: selectedVendor.contactPerson, mobile: selectedVendor.mobile, email: selectedVendor.email }]
                    ).map((c, i) => (
                      <div key={i} className={`rounded-xl p-3 border text-sm ${i === 0 ? "bg-primary/5 border-primary/20" : "bg-secondary/40 border-border"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-foreground">{c.name || "-"}</span>
                          {i === 0 && (
                            <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                          {c.mobile && (
                            <div className="flex items-center gap-2">
                              <a href={`tel:${c.mobile}`} className="text-primary hover:underline flex items-center gap-1.5 text-xs font-medium">
                                <Phone className="h-3 w-3" /> {c.mobile}
                              </a>
                              <a
                                href={generateWhatsAppLink(c.mobile, "Hello!")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-500 hover:text-emerald-600 transition-colors bg-emerald-50 hover:bg-emerald-100 p-1 rounded-full ml-1"
                                title="Message on WhatsApp"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="text-primary hover:underline flex items-center gap-1.5 text-xs font-medium">
                              <Mail className="h-3 w-3" /> {c.email}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedVendor.website && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1.5 text-sm">
                        <Globe className="h-3.5 w-3.5 shrink-0" /> Visit Website
                      </a>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Location Details</h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Place (Destination)</p>
                      <p className="font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {selectedVendor.place || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Office City</p>
                      <p className="font-medium">{selectedVendor.officeCity || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Added On</p>
                      <p className="font-medium">{selectedVendor.createdAt || "-"}</p>
                    </div>
                  </div>
                </div>

                {selectedVendor.notes && (
                  <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedVendor.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="px-6 py-4 border-t border-border bg-card gap-2">
                <Button variant="outline" onClick={() => setDialogType(null)}>Close</Button>
                <Button onClick={() => openEdit(selectedVendor)}>
                  <Edit2 className="mr-2 h-4 w-4" /> Edit Vendor
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={dialogType === "delete"} onOpenChange={(val) => !val && setDialogType(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Vendor
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{selectedVendor?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancel</Button>
            <Button variant="default" onClick={handleDelete}>Yes, Delete Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Vendors</DialogTitle>
            <DialogDescription>
              Filter vendors by created date before exporting.
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
    </div>
  );
}
