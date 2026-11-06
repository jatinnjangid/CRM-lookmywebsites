import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { getAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Stamp,
  Edit,
  Trash2,
  Globe,
  FileSpreadsheet,
  ShieldCheck,
  Check,
  ChevronsUpDown,
  Download,
  Filter,
  Copy,
  MoreVertical,
  Table2,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VisaBookingForm } from "@/components/visa/VisaBookingForm";

const BRAND_STYLE = { background: "var(--gradient-brand)" };

export const Route = createFileRoute("/crm/visa")({ component: VisaPage });

/* ─── Types ─── */
type VisaStatus = "Pending Documents" | "Documents Complete" | "Submitted" | "Under Review" | "Approved" | "Rejected";

interface VisaDoc {
  name: string;
  received: boolean;
}
interface VisaApp {
  id: string;
  customer: string;
  phone?: string;
  email?: string;
  avatar: string;
  country: string;
  flag: string;
  visaType: string;
  appliedOn: string;
  travelDate: string;
  status: VisaStatus;
  embassyRef?: string;
  docs: VisaDoc[];
}

interface VisaRequirement {
  id: string;
  country: string;
  visaType: string;
  docs: { name: string; shortName: string }[];
  formUrls: string[];
  currency: string;
  visaFees: number;
  vfsFees: number;
  otherFees: number;
  serviceFees: number;
  consulateFees: number;
  urgentFees: number;
  urgentFees2: number;
  extraName1: string;
  extraFees1: number;
  extraName2: string;
  extraFees2: number;
  extraName3: string;
  extraFees3: number;
  timeRequired: string;
  remark1: string;
  remark2: string;
  remark3: string;
  supportFiles?: { name: string; data: string; size: number }[];
}

const STATUS_STYLE: Record<VisaStatus, string> = {
  "Pending Documents": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
  "Documents Complete": "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25",
  Submitted: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
  "Under Review": "bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25",
  Approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  Rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
};

const STATUS_ICON: Record<VisaStatus, React.ReactNode> = {
  "Pending Documents": <AlertTriangle className="h-3.5 w-3.5" />,
  "Documents Complete": <ShieldCheck className="h-3.5 w-3.5" />,
  Submitted: <Clock className="h-3.5 w-3.5" />,
  "Under Review": <FileText className="h-3.5 w-3.5" />,
  Approved: <CheckCircle2 className="h-3.5 w-3.5" />,
  Rejected: <XCircle className="h-3.5 w-3.5" />,
};

const ALL_STATUSES: VisaStatus[] = [
  "Pending Documents",
  "Documents Complete",
  "Submitted",
  "Under Review",
  "Approved",
  "Rejected",
];

export const COUNTRY_CODES: Record<string, string> = {
  Afghanistan: "af",
  Albania: "al",
  Algeria: "dz",
  Andorra: "ad",
  Angola: "ao",
  "Antigua and Barbuda": "ag",
  Argentina: "ar",
  Armenia: "am",
  Australia: "au",
  Austria: "at",
  Azerbaijan: "az",
  Bahamas: "bs",
  Bahrain: "bh",
  Bangladesh: "bd",
  Barbados: "bb",
  Belarus: "by",
  Belgium: "be",
  Belize: "bz",
  Benin: "bj",
  Bhutan: "bt",
  Bolivia: "bo",
  "Bosnia and Herzegovina": "ba",
  Botswana: "bw",
  Brazil: "br",
  Brunei: "bn",
  Bulgaria: "bg",
  "Burkina Faso": "bf",
  Burundi: "bi",
  "Cabo Verde": "cv",
  Cambodia: "kh",
  Cameroon: "cm",
  Canada: "ca",
  "Central African Republic": "cf",
  Chad: "td",
  Chile: "cl",
  China: "cn",
  Colombia: "co",
  Comoros: "km",
  Congo: "cg",
  "Costa Rica": "cr",
  Croatia: "hr",
  Cuba: "cu",
  Cyprus: "cy",
  Czechia: "cz",
  Denmark: "dk",
  Djibouti: "dj",
  Dominica: "dm",
  "Dominican Republic": "do",
  Ecuador: "ec",
  Egypt: "eg",
  "El Salvador": "sv",
  "Equatorial Guinea": "gq",
  Eritrea: "er",
  Estonia: "ee",
  Eswatini: "sz",
  Ethiopia: "et",
  Fiji: "fj",
  Finland: "fi",
  France: "fr",
  "France / Schengen": "fr",
  Gabon: "ga",
  Gambia: "gm",
  Georgia: "ge",
  Germany: "de",
  Ghana: "gh",
  Greece: "gr",
  Grenada: "gd",
  Guatemala: "gt",
  Guinea: "gn",
  "Guinea-Bissau": "gw",
  Guyana: "gy",
  Haiti: "ht",
  Honduras: "hn",
  Hungary: "hu",
  Iceland: "is",
  India: "in",
  Indonesia: "id",
  Iran: "ir",
  Iraq: "iq",
  Ireland: "ie",
  Israel: "il",
  Italy: "it",
  Jamaica: "jm",
  Japan: "jp",
  Jordan: "jo",
  Kazakhstan: "kz",
  Kenya: "ke",
  Kiribati: "ki",
  Kuwait: "kw",
  Kyrgyzstan: "kg",
  Laos: "la",
  Latvia: "lv",
  Lebanon: "lb",
  Lesotho: "ls",
  Liberia: "lr",
  Libya: "ly",
  Liechtenstein: "li",
  Lithuania: "lt",
  Luxembourg: "lu",
  Madagascar: "mg",
  Malawi: "mw",
  Malaysia: "my",
  Maldives: "mv",
  Mali: "ml",
  Malta: "mt",
  "Marshall Islands": "mh",
  Mauritania: "mr",
  Mauritius: "mu",
  Mexico: "mx",
  Micronesia: "fm",
  Moldova: "md",
  Monaco: "mc",
  Mongolia: "mn",
  Montenegro: "me",
  Morocco: "ma",
  Mozambique: "mz",
  Myanmar: "mm",
  Namibia: "na",
  Nauru: "nr",
  Nepal: "np",
  Netherlands: "nl",
  "New Zealand": "nz",
  Nicaragua: "ni",
  Niger: "ne",
  Nigeria: "ng",
  "North Korea": "kp",
  "North Macedonia": "mk",
  Norway: "no",
  Oman: "om",
  Pakistan: "pk",
  Palau: "pw",
  Palestine: "ps",
  Panama: "pa",
  "Papua New Guinea": "pg",
  Paraguay: "py",
  Peru: "pe",
  Philippines: "ph",
  Poland: "pl",
  Portugal: "pt",
  Qatar: "qa",
  Romania: "ro",
  Russia: "ru",
  Rwanda: "rw",
  "Saint Kitts and Nevis": "kn",
  "Saint Lucia": "lc",
  "Saint Vincent and the Grenadines": "vc",
  Samoa: "ws",
  "San Marino": "sm",
  "Sao Tome and Principe": "st",
  "Saudi Arabia": "sa",
  Senegal: "sn",
  Serbia: "rs",
  Seychelles: "sc",
  "Sierra Leone": "sl",
  Singapore: "sg",
  Slovakia: "sk",
  Slovenia: "si",
  "Solomon Islands": "sb",
  Somalia: "so",
  "South Africa": "za",
  "South Korea": "kr",
  "South Sudan": "ss",
  Spain: "es",
  "Sri Lanka": "lk",
  Sudan: "sd",
  Suriname: "sr",
  Sweden: "se",
  Switzerland: "ch",
  Syria: "sy",
  Taiwan: "tw",
  Tajikistan: "tj",
  Tanzania: "tz",
  Thailand: "th",
  "Timor-Leste": "tl",
  Togo: "tg",
  Tonga: "to",
  "Trinidad and Tobago": "tt",
  Tunisia: "tn",
  Turkey: "tr",
  Turkmenistan: "tm",
  Tuvalu: "tv",
  UAE: "ae",
  Uganda: "ug",
  Ukraine: "ua",
  "United Kingdom": "gb",
  "United States": "us",
  Uruguay: "uy",
  Uzbekistan: "uz",
  Vanuatu: "vu",
  "Vatican City": "va",
  Venezuela: "ve",
  Vietnam: "vn",
  Yemen: "ye",
  Zambia: "zm",
  Zimbabwe: "zw",
};

export const COUNTRIES_LIST = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "France / Schengen",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "UAE",
  "Uganda",
  "Ukraine",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];
const VISA_TYPES_LIST = [
  "Tourist – Visa on Arrival",
  "Schengen Tourist",
  "Free 30-day on Arrival",
  "Tourist e-Visa",
  "30-day Tourist Visa",
  "14-day Tourist Visa",
  "Business Visa",
  "Student Visa",
  "Transit Visa",
  "Multiple Entry Tourist Visa",
];
const CURRENCY_LIST = ["INR", "USD", "EUR", "AED", "SGD", "THB", "GBP", "IDR"];

function VisaPage() {
  const auth = getAuth();
  const isAdmin = auth?.role === "admin" || auth?.role === "manager";

  const [apps, setApps] = useSupabaseTable<VisaApp[]>("visa", []);
  const [customers] = useSupabaseTable<any[]>("customers", []);
  const [requirements, setRequirements] = useSupabaseTable<VisaRequirement[]>(
    "visa_requirements",
    []
  );
  const location = useRouterState({ select: (s) => s.location });
  const [activeSubTab, setActiveSubTab] = useState<"applications" | "booking" | "requirements">("applications");

  // Sync tab from URL search param (?tab=booking / ?tab=applications)
  useEffect(() => {
    const params = new URLSearchParams(location.searchStr);
    const tab = params.get("tab");
    if (tab === "booking") setActiveSubTab("booking");
    else if (tab === "requirements") setActiveSubTab("requirements");
    else setActiveSubTab("applications"); // handles "applications" or no param
  }, [location.searchStr]);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<VisaStatus | "All">("All");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteAppTargetId, setDeleteAppTargetId] = useState<string | null>(null);
  const [deleteBookingTargetId, setDeleteBookingTargetId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [visaBookings, setVisaBookings] = useSupabaseTable<any[]>("crm_visa_bookings", []);
  const [isVisaBookingModalOpen, setIsVisaBookingModalOpen] = useState(false);
  const [selectedVisaBooking, setSelectedVisaBooking] = useState<any>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  const [bookingDateFrom, setBookingDateFrom] = useState("");
  const [bookingDateTo, setBookingDateTo] = useState("");

  const filteredVisaBookings = visaBookings.filter((b: any) => {
    if (bookingDateFrom && b.travel_date && b.travel_date < bookingDateFrom) return false;
    if (bookingDateTo && b.travel_date && b.travel_date > bookingDateTo) return false;
    return true;
  });

  const exportToExcel = () => {
    const csvRows = [
      ["Customer", "Mobile", "Country", "Visa Type", "Travel Date", "Supplier", "Purchase Price", "Selling Price", "Profit", "Status"]
    ];

    visaBookings.forEach((b: any) => {
      const d = b.travel_date ? String(b.travel_date).split('T')[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;

      if (matchStart && matchEnd) {
        csvRows.push([
          `"${(b.customer_name || "-").replace(/"/g, '""')}"`,
          `"${b.mobile_number || "-"}"`,
          `"${(b.country || "-").replace(/"/g, '""')}"`,
          `"${b.visa_type || "-"}"`,
          `"${b.travel_date || "-"}"`,
          `"${(b.supplier || "-").replace(/"/g, '""')}"`,
          String(b.purchase_price || "0"),
          String(b.selling_price || "0"),
          String(b.profit || "0"),
          `"${b.status || "-"}"`
        ]);
      }
    });

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `visa-bookings-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToWord = () => {
    const tableHeader =
      "<tr><th>Customer</th><th>Mobile</th><th>Country</th><th>Visa Type</th><th>Travel Date</th><th>Supplier</th><th>Selling Price</th><th>Profit</th><th>Status</th></tr>";

    const exportableBookings = visaBookings.filter((b: any) => {
      const d = b.travel_date ? String(b.travel_date).split('T')[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableRows = exportableBookings
      .map(
        (b: any) =>
          `<tr><td>${b.customer_name || "-"}</td><td>${b.mobile_number || "-"}</td><td>${b.country || "-"}</td><td>${b.visa_type || "-"}</td><td>${b.travel_date || "-"}</td><td>${b.supplier || "-"}</td><td>₹${b.selling_price || 0}</td><td>₹${b.profit || 0}</td><td>${b.status || "-"}</td></tr>`,
      )
      .join("");

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Visa Bookings Export</title><style>table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; } th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head>
      <body><h2>Grand Journeys CRM - Visa Bookings Export</h2><table>${tableHeader}${tableRows}</table></body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `visa-bookings-${new Date().toISOString().split("T")[0]}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHeader =
      "<tr><th>Customer</th><th>Mobile</th><th>Country</th><th>Visa Type</th><th>Travel Date</th><th>Supplier</th><th>Selling Price</th><th>Profit</th><th>Status</th></tr>";

    const exportableBookings = visaBookings.filter((b: any) => {
      const d = b.travel_date ? String(b.travel_date).split('T')[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableRows = exportableBookings
      .map(
        (b: any) =>
          `<tr><td>${b.customer_name || "-"}</td><td>${b.mobile_number || "-"}</td><td>${b.country || "-"}</td><td>${b.visa_type || "-"}</td><td>${b.travel_date || "-"}</td><td>${b.supplier || "-"}</td><td>₹${b.selling_price || 0}</td><td>₹${b.profit || 0}</td><td>${b.status || "-"}</td></tr>`,
      )
      .join("");

    const css = `body{font-family:sans-serif;padding:20px;color:#333}h2{color:#059669;margin-bottom:5px}p{font-size:12px;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f9fafb;font-weight:bold}tr:nth-child(even){background:#f3f4f6}`;
    const styleEl = printWindow.document.createElement("style");
    styleEl.textContent = css;
    printWindow.document.head.appendChild(styleEl);
    const titleEl = printWindow.document.createElement("title");
    titleEl.textContent = "Visa Bookings Export PDF";
    printWindow.document.head.appendChild(titleEl);
    const bodyHtml = `<h2>Grand Journeys CRM - Visa Bookings Export</h2><p>Generated on ${new Date().toLocaleDateString("en-IN")} | Total Bookings: ${exportableBookings.length}</p><table><thead>${tableHeader}</thead><tbody>${tableRows}</tbody></table>`;
    const wrapper = printWindow.document.createElement("div");
    wrapper.innerHTML = bodyHtml;
    printWindow.document.body.appendChild(wrapper);
    const script = printWindow.document.createElement("script");
    script.textContent =
      "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
    printWindow.document.body.appendChild(script);
  };

  // Visa Application Form state
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [appCustomerOpen, setAppCustomerOpen] = useState(false);
  const [appCustomer, setAppCustomer] = useState("");
  const [appCustomerPhone, setAppCustomerPhone] = useState("");
  const [appCustomerEmail, setAppCustomerEmail] = useState("");
  const [appCountryOpen, setAppCountryOpen] = useState(false);
  const [appCountry, setAppCountry] = useState("");
  const [appVisaTypeOpen, setAppVisaTypeOpen] = useState(false);
  const [appVisaType, setAppVisaType] = useState("");

  const [appTravelDate, setAppTravelDate] = useState("");

  const getFlagEmoji = (countryName: string) => {
    const flags: Record<string, string> = {
      Indonesia: "🇮🇩",
      France: "🇫🇷",
      "France / Schengen": "🇫🇷",
      Maldives: "🇲🇻",
      Singapore: "🇸🇬",
      UAE: "🇦🇪",
      Thailand: "🇹🇭",
      "United Kingdom": "🇬🇧",
      "United States": "🇺🇸",
      Canada: "🇨🇦",
      Australia: "🇦🇺",
      Germany: "🇩🇪",
      Italy: "🇮🇹",
      Spain: "🇪🇸",
      Japan: "🇯🇵",
      Switzerland: "🇨🇭",
      Vietnam: "🇻🇳",
      Malaysia: "🇲🇾",
    };
    return flags[countryName] || "🏳️";
  };

  const getRandomAvatar = () => {
    const avatars = [
      "/avatars/aman.jpeg",
      "/avatars/deepak.jpeg",
      "/avatars/manvendra.png",
      "/avatars/nikita.jpeg",
      "/avatars/pushplata.png",
      "/avatars/suman.jpeg",
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appCustomer) {
      toast.error("Please select a Customer Name.");
      return;
    }
    if (!appCountry) {
      toast.error("Please select a Country.");
      return;
    }
    if (!appVisaType) {
      toast.error("Please select a Visa Type.");
      return;
    }
    if (!appTravelDate) {
      toast.error("Please select a Travel Date.");
      return;
    }

    const match = requirements.find(
      (r) =>
        (r.country || "").toLowerCase() === appCountry.toLowerCase() &&
        (r.visaType || "").toLowerCase() === appVisaType.toLowerCase(),
    );

    const initialDocs = match
      ? (match.docs || []).map((d) => ({ name: d.name, received: false }))
      : [
        { name: "Passport copy (front & back)", received: false },
        { name: "Passport-size photo", received: false },
        { name: "Flight tickets", received: false },
        { name: "Hotel bookings", received: false },
      ];

    const nextNumber = (apps?.length || 0) + 1;
    const newIdStr = String(nextNumber).padStart(3, '0');

    const newApp: VisaApp = {
      id: `V-${newIdStr}`,
      customer: appCustomer,
      phone: appCustomerPhone,
      email: appCustomerEmail,
      avatar: getRandomAvatar(),
      country: appCountry,
      flag: getFlagEmoji(appCountry),
      visaType: appVisaType,
      appliedOn: new Date()
        .toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .toUpperCase(),
      travelDate: appTravelDate,
      status: "Pending Documents",
      embassyRef: undefined,
      docs: initialDocs,
    };

    setApps((prev) => [newApp, ...prev]);
    setAppModalOpen(false);

    // Reset Form
    setAppCustomer("");
    setAppCustomerPhone("");
    setAppCustomerEmail("");
    setAppCountry("");
    setAppVisaType("");

    setAppTravelDate("");
  };

  // Requirement configuration states
  const [reqFormMode, setReqFormMode] = useState<"list" | "add" | "edit">("list");
  const [editingReq, setEditingReq] = useState<VisaRequirement | null>(null);
  const [reqQ, setReqQ] = useState("");

  // Requirement form state
  const [formCountry, setFormCountry] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [formVisaType, setFormVisaType] = useState("");
  const [formDocs, setFormDocs] = useState<{ name: string; shortName: string }[]>([
    { name: "", shortName: "" },
  ]);
  const [formUrls, setFormUrls] = useState<string[]>([""]);
  const [formCurrency, setFormCurrency] = useState("INR");
  const [formVisaFees, setFormVisaFees] = useState("");
  const [formVfsFees, setFormVfsFees] = useState("");
  const [formOtherFees, setFormOtherFees] = useState("");
  const [formServiceFees, setFormServiceFees] = useState("");
  const [formConsulateFees, setFormConsulateFees] = useState("");
  const [formUrgentFees, setFormUrgentFees] = useState("");
  const [formUrgentFees2, setFormUrgentFees2] = useState("");
  const [formExtraName1, setFormExtraName1] = useState("");
  const [formExtraFees1, setFormExtraFees1] = useState("");
  const [formExtraName2, setFormExtraName2] = useState("");
  const [formExtraFees2, setFormExtraFees2] = useState("");
  const [formExtraName3, setFormExtraName3] = useState("");
  const [formExtraFees3, setFormExtraFees3] = useState("");
  const [formTimeRequired, setFormTimeRequired] = useState("");
  const [formRemark1, setFormRemark1] = useState("");
  const [formRemark2, setFormRemark2] = useState("");
  const [formRemark3, setFormRemark3] = useState("");
  const [formFiles, setFormFiles] = useState<{ name: string; data: string; size: number }[]>([]);

  const resetReqForm = () => {
    setFormCountry("");
    setFormVisaType("");
    setFormDocs([{ name: "", shortName: "" }]);
    setFormUrls([""]);
    setFormCurrency("INR");
    setFormVisaFees("");
    setFormVfsFees("");
    setFormOtherFees("");
    setFormServiceFees("");
    setFormConsulateFees("");
    setFormUrgentFees("");
    setFormUrgentFees2("");
    setFormExtraName1("");
    setFormExtraFees1("");
    setFormExtraName2("");
    setFormExtraFees2("");
    setFormExtraName3("");
    setFormExtraFees3("");
    setFormTimeRequired("");
    setFormRemark1("");
    setFormRemark2("");
    setFormRemark3("");
    setFormFiles([]);
    setEditingReq(null);
  };

  const handleOpenAddReq = () => {
    resetReqForm();
    setReqFormMode("add");
  };

  const handleOpenEditReq = (req: VisaRequirement) => {
    setEditingReq(req);
    setFormCountry(req.country);
    setFormVisaType(req.visaType);
    setFormDocs((req.docs || []).length > 0 ? (req.docs || []) : [{ name: "", shortName: "" }]);
    setFormUrls((req.formUrls || []).length > 0 ? req.formUrls : [""]);
    setFormCurrency(req.currency);
    setFormVisaFees(req.visaFees ? String(req.visaFees) : "");
    setFormVfsFees(req.vfsFees ? String(req.vfsFees) : "");
    setFormOtherFees(req.otherFees ? String(req.otherFees) : "");
    setFormServiceFees(req.serviceFees ? String(req.serviceFees) : "");
    setFormConsulateFees(req.consulateFees ? String(req.consulateFees) : "");
    setFormUrgentFees(req.urgentFees ? String(req.urgentFees) : "");
    setFormUrgentFees2(req.urgentFees2 ? String(req.urgentFees2) : "");
    setFormExtraName1(req.extraName1 || "");
    setFormExtraFees1(req.extraFees1 ? String(req.extraFees1) : "");
    setFormExtraName2(req.extraName2 || "");
    setFormExtraFees2(req.extraFees2 ? String(req.extraFees2) : "");
    setFormExtraName3(req.extraName3 || "");
    setFormExtraFees3(req.extraFees3 ? String(req.extraFees3) : "");
    setFormTimeRequired(req.timeRequired || "");
    setFormRemark1(req.remark1 || "");
    setFormRemark2(req.remark2 || "");
    setFormRemark3(req.remark3 || "");
    setFormFiles(req.supportFiles || []);
    setReqFormMode("edit");
  };

  const handleAddDocRow = () => {
    setFormDocs([...formDocs, { name: "", shortName: "" }]);
  };

  const handleRemoveDocRow = (idx: number) => {
    if (formDocs.length > 1) {
      setFormDocs(formDocs.filter((_, i) => i !== idx));
    }
  };

  const handleDocChange = (idx: number, field: "name" | "shortName", value: string) => {
    setFormDocs(
      formDocs.map((doc, i) =>
        i === idx ? { name: doc.name, shortName: doc.shortName, [field]: value } : doc,
      ),
    );
  };

  const handleAddUrlRow = () => {
    setFormUrls([...formUrls, ""]);
  };

  const handleRemoveUrlRow = (idx: number) => {
    if (formUrls.length > 1) {
      setFormUrls(formUrls.filter((_, i) => i !== idx));
    }
  };

  const handleUrlChange = (idx: number, value: string) => {
    setFormUrls(formUrls.map((url, i) => (i === idx ? value : url)));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormFiles((prev) => [
            ...prev,
            {
              name: file.name,
              data: event.target?.result as string,
              size: file.size,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (idx: number) => {
    setFormFiles(formFiles.filter((_, i) => i !== idx));
  };

  const handleSaveReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCountry || !formVisaType) return;

    // Filter empty documents/URLs
    const cleanDocs = formDocs.filter((d) => d.name.trim() !== "");
    const cleanUrls = formUrls.filter((u) => u.trim() !== "");

    const newReq: VisaRequirement = {
      id: editingReq ? editingReq.id : `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      country: formCountry,
      visaType: formVisaType,
      docs: cleanDocs,
      formUrls: cleanUrls,
      currency: formCurrency,
      visaFees: Number(formVisaFees) || 0,
      vfsFees: Number(formVfsFees) || 0,
      otherFees: Number(formOtherFees) || 0,
      serviceFees: Number(formServiceFees) || 0,
      consulateFees: Number(formConsulateFees) || 0,
      urgentFees: Number(formUrgentFees) || 0,
      urgentFees2: Number(formUrgentFees2) || 0,
      extraName1: formExtraName1,
      extraFees1: Number(formExtraFees1) || 0,
      extraName2: formExtraName2,
      extraFees2: Number(formExtraFees2) || 0,
      extraName3: formExtraName3,
      extraFees3: Number(formExtraFees3) || 0,
      timeRequired: formTimeRequired,
      remark1: formRemark1,
      remark2: formRemark2,
      remark3: formRemark3,
      supportFiles: formFiles,
    };

    if (editingReq) {
      setRequirements(requirements.map((r) => (r.id === editingReq.id ? newReq : r)));
    } else {
      setRequirements([newReq, ...requirements]);
    }
    setReqFormMode("list");
    resetReqForm();
  };

  const handleDeleteReq = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      setRequirements(requirements.filter((r) => r.id !== deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const confirmDeleteApp = () => {
    if (deleteAppTargetId) {
      setApps(apps.filter((a) => a.id !== deleteAppTargetId));
      setDeleteAppTargetId(null);
    }
  };


  const filteredApps = apps.filter(
    (a) =>
      (filter === "All" || a.status === filter) &&
      (q === "" ||
        (a.customer || "").toLowerCase().includes(q.toLowerCase()) ||
        (a.country || "").toLowerCase().includes(q.toLowerCase())),
  );

  const filteredReqs = requirements.filter(
    (r) =>
      reqQ === "" ||
      (r.country || "").toLowerCase().includes(reqQ.toLowerCase()) ||
      (r.visaType || "").toLowerCase().includes(reqQ.toLowerCase()),
  );

  const counts: Record<string, number> = { All: apps.length };
  ALL_STATUSES.forEach((s) => {
    counts[s] = apps.filter((a) => a.status === s).length;
  });

  const toggleDoc = (appId: string, docName: string) => {
    setApps(
      apps.map((app) => {
        if (app.id === appId) {
          const newDocs = (app.docs || []).map((doc) =>
            doc.name === docName ? { name: doc.name, received: !doc.received } : doc,
          );

          const allDocsReceived = newDocs.every((d) => d.received);
          let newStatus = app.status;

          if (allDocsReceived && app.status === "Pending Documents") {
            newStatus = "Documents Complete";
          } else if (!allDocsReceived && app.status === "Documents Complete") {
            newStatus = "Pending Documents";
          }

          return {
            ...app,
            docs: newDocs,
            status: newStatus,
          };
        }
        return app;
      }),
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* If requirement configuration form mode is active, show full-page mockup form directly */}
      {activeSubTab === "requirements" && reqFormMode !== "list" ? (
        <div className="max-w-4xl mx-auto">
          {/* Mockup Form card */}
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden border-t-4 border-t-rose-500">
            <form onSubmit={handleSaveReq}>
              {/* Form Top Title Bar */}
              <div className="bg-background border-b border-border px-6 py-4 flex items-center gap-2">
                <span className="bg-[#1d1d1f] text-white text-[10px] font-mono px-2 py-0.5 rounded tracking-wide shrink-0 inline-flex items-center justify-center font-extrabold select-none">
                  VISA
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-foreground leading-tight">
                    Visa Document
                  </h2>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                    Visa Document
                  </p>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Form Section Header */}
                <div className="border-b border-border pb-3">
                  <h3 className="font-display text-sm font-bold text-rose-500 tracking-wide">
                    Visa Information (Fees Per Person)
                  </h3>
                </div>

                {/* Countries / Visa Type */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      Countries <span className="text-rose-500">*</span>
                    </label>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryOpen}
                          className={`flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${!formCountry && "text-muted-foreground"}`}
                        >
                          {formCountry ? (
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full bg-secondary">
                                <img
                                  height="20"
                                  title={COUNTRY_CODES[formCountry]}
                                  src={`https://react-circle-flags.pages.dev/${COUNTRY_CODES[formCountry] || "un"}.svg`}
                                  alt=""
                                />
                              </div>
                              <span className="truncate">{formCountry}</span>
                            </div>
                          ) : (
                            <span className="font-normal">Select Country</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search country..." className="h-9 text-xs" />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {COUNTRIES_LIST.map((country) => (
                                <CommandItem
                                  key={country}
                                  value={country}
                                  onSelect={(currentValue) => {
                                    const actualCountry =
                                      COUNTRIES_LIST.find(
                                        (c) => c.toLowerCase() === currentValue.toLowerCase(),
                                      ) || country;
                                    setFormCountry(
                                      actualCountry === formCountry ? "" : actualCountry,
                                    );
                                    setCountryOpen(false);
                                  }}
                                  className="flex items-center w-full gap-2 px-2 py-1.5 text-sm"
                                >
                                  <div className="flex flex-grow w-0 space-x-2 overflow-hidden items-center">
                                    <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full bg-secondary">
                                      <img
                                        height="20"
                                        title={COUNTRY_CODES[country]}
                                        src={`https://react-circle-flags.pages.dev/${COUNTRY_CODES[country] || "un"}.svg`}
                                        alt=""
                                      />
                                    </div>
                                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                                      {country}
                                    </span>
                                  </div>
                                  <Check
                                    className={`ml-auto h-4 w-4 shrink-0 ${formCountry === country ? "opacity-100" : "opacity-0"}`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      Visa Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formVisaType}
                      required
                      onChange={(e) => setFormVisaType(e.target.value)}
                      className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select Visa</option>
                      {VISA_TYPES_LIST.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Documents checklist configuration - directly inline */}
                <div className="space-y-4 pt-2">
                  {formDocs.map((doc, idx) => (
                    <div key={`form-doc-${idx}`} className="space-y-2">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            Document {idx + 1}{" "}
                            {idx === 0 && <span className="text-rose-500">*</span>}
                          </label>
                          <Input
                            placeholder="Document"
                            required={idx === 0}
                            value={doc.name}
                            onChange={(e) => handleDocChange(idx, "name", e.target.value)}
                            className="h-9 text-xs rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            Short Name for auto mails {idx + 1}{" "}
                            {idx === 0 && <span className="text-rose-500">*</span>}
                          </label>
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Short Name for auto mails"
                              required={idx === 0}
                              value={doc.shortName}
                              onChange={(e) => handleDocChange(idx, "shortName", e.target.value)}
                              className="h-9 text-xs rounded-lg flex-1"
                            />
                            {formDocs.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                                onClick={() => handleRemoveDocRow(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex">
                    <button
                      type="button"
                      onClick={handleAddDocRow}
                      className="text-rose-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 mt-1.5 transition-colors"
                    >
                      <span className="text-sm">⊕</span>Add More
                    </button>
                  </div>
                </div>

                {/* Form URLs configuration - directly inline */}
                <div className="space-y-4 pt-2">
                  {formUrls.map((url, idx) => (
                    <div key={`url-${idx}`} className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Form Url {idx + 1}
                        </label>
                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Form Url"
                            value={url}
                            onChange={(e) => handleUrlChange(idx, e.target.value)}
                            className="h-9 text-xs rounded-lg flex-1"
                          />
                          {formUrls.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                              onClick={() => handleRemoveUrlRow(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex">
                    <button
                      type="button"
                      onClick={handleAddUrlRow}
                      className="text-rose-500 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 mt-1.5 transition-colors"
                    >
                      <span className="text-sm">⊕</span>Add More
                    </button>
                  </div>
                </div>

                {/* Inline fees 6-col grids */}
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-6 border-t border-border pt-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Currency</label>
                    <select
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value)}
                      className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      {CURRENCY_LIST.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Visa Fees <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Visa Fees"
                      required
                      value={formVisaFees}
                      onChange={(e) => setFormVisaFees(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">VFS Fees</label>
                    <Input
                      type="number"
                      placeholder="VFS Fees"
                      value={formVfsFees}
                      onChange={(e) => setFormVfsFees(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Other Fees
                    </label>
                    <Input
                      type="number"
                      placeholder="Other Fees"
                      value={formOtherFees}
                      onChange={(e) => setFormOtherFees(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Service Fees
                    </label>
                    <Input
                      type="number"
                      placeholder="Service Fees"
                      value={formServiceFees}
                      onChange={(e) => setFormServiceFees(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Consulate Fees
                    </label>
                    <Input
                      type="number"
                      placeholder="Consulate Fees"
                      value={formConsulateFees}
                      onChange={(e) => setFormConsulateFees(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Extra & Urgent fees row */}
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Urgent Fees
                    </label>
                    <Input
                      type="number"
                      placeholder="Urgent Fees"
                      value={formUrgentFees}
                      onChange={(e) => setFormUrgentFees(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Urgent Fees 2
                    </label>
                    <Input
                      type="number"
                      placeholder="Urgent Fees 2"
                      value={formUrgentFees2}
                      onChange={(e) => setFormUrgentFees2(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Extra Name 1
                    </label>
                    <Input
                      placeholder="Extra Name"
                      value={formExtraName1}
                      onChange={(e) => setFormExtraName1(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Extra Fees 1
                    </label>
                    <Input
                      type="number"
                      placeholder="Extra Fees"
                      value={formExtraFees1}
                      onChange={(e) => setFormExtraFees1(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Extra Name 2
                    </label>
                    <Input
                      placeholder="Extra Name"
                      value={formExtraName2}
                      onChange={(e) => setFormExtraName2(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Extra Fees 2
                    </label>
                    <Input
                      type="number"
                      placeholder="Extra Fees"
                      value={formExtraFees2}
                      onChange={(e) => setFormExtraFees2(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Third row fields */}
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-6">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Extra Name 3
                    </label>
                    <Input
                      placeholder="Extra Name"
                      value={formExtraName3}
                      onChange={(e) => setFormExtraName3(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Extra Fees 3
                    </label>
                    <Input
                      type="number"
                      placeholder="Extra Fees"
                      value={formExtraFees3}
                      onChange={(e) => setFormExtraFees3(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Time Required
                    </label>
                    <Input
                      placeholder="Time Required"
                      value={formTimeRequired}
                      onChange={(e) => setFormTimeRequired(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-xs font-semibold text-muted-foreground">Remark 1</label>
                    <Input
                      placeholder="Remark"
                      value={formRemark1}
                      onChange={(e) => setFormRemark1(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Remarks 2 & 3 */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Remark 2</label>
                    <Input
                      placeholder="Remark"
                      value={formRemark2}
                      onChange={(e) => setFormRemark2(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Remark 3</label>
                    <Input
                      placeholder="Remark"
                      value={formRemark3}
                      onChange={(e) => setFormRemark3(e.target.value)}
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Files Upload row */}
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="file"
                      id="req-support-files-inline"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById("req-support-files-inline")?.click()}
                      variant="outline"
                      className="h-9 text-xs border border-border bg-background hover:bg-secondary rounded-lg gap-1.5"
                    >
                      Choose Files
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {formFiles.length > 0
                        ? `${formFiles.length} file(s) selected`
                        : "No file chosen"}
                    </span>
                  </div>
                  {formFiles.length > 0 && (
                    <div className="space-y-2">
                      {formFiles.map((file, idx) => (
                        <div
                          key={file.name}
                          className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/20"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                            <span className="text-xs font-medium truncate">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-rose-500 shrink-0"
                            onClick={() => handleRemoveFile(idx)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="bg-secondary/10 border-t border-border px-6 py-4 flex gap-2 justify-start">
                <Button
                  type="submit"
                  className="rounded-lg text-xs font-semibold px-6 bg-rose-500 hover:bg-rose-600 text-white shadow-sm h-9"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReqFormMode("list")}
                  className="rounded-lg text-xs font-semibold px-6 border border-border bg-background hover:bg-secondary h-9"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">
                {activeSubTab === "booking" ? "Visa Booking" : "Visa Applications"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeSubTab === "booking"
                  ? "Manage and track all visa booking records."
                  : "Track applications, document checklists, and country-wise requirements."}
              </p>
            </div>
            <div className="flex gap-2">
              {activeSubTab === "applications" ? (
                <Button
                  onClick={() => setAppModalOpen(true)}
                  className="gap-2 rounded-xl"
                  style={BRAND_STYLE}
                >
                  <Plus className="h-4 w-4" /> New Application
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="shadow-sm rounded-xl" onClick={() => setIsExportOpen(true)}>
                    <Download className="mr-2 h-4 w-4" /> Export Booking
                  </Button>
                  <Button
                    onClick={() => { setSelectedVisaBooking(null); setIsVisaBookingModalOpen(true); }}
                    className="gap-2 rounded-xl"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    <Plus className="h-4 w-4" /> New Booking
                  </Button>
                </>
              )}
            </div>
          </div>

          {activeSubTab === "applications" ? (
            <>
              {/* Stat strip and Pipeline dashboard */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Total Applications",
                    value: apps.length,
                    icon: <FileText className="h-4 w-4" />,
                    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
                    sub: "All applications",
                  },
                  {
                    label: "Approved",
                    value: counts["Approved"] || 0,
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
                    sub: "Successfully processed",
                  },
                  {
                    label: "Pending Action",
                    value: (counts["Pending Documents"] || 0) + (counts["Under Review"] || 0),
                    icon: <Clock className="h-4 w-4" />,
                    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
                    sub: "Awaiting documents/review",
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
              <div className="flex w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-card custom-scrollbar">
                {ALL_STATUSES.map((s) => {
                  const count = counts[s] || 0;
                  const pct = apps.length ? (count / apps.length) * 100 : 0;
                  const colorClass =
                    s === "Approved" ? "bg-emerald-500" :
                      s === "Rejected" ? "bg-red-500" :
                        s === "Submitted" ? "bg-blue-500" :
                          s === "Under Review" ? "bg-violet-500" :
                            s === "Documents Complete" ? "bg-cyan-500" : "bg-amber-500";

                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(filter === s ? "All" : s)}
                      className={`flex flex-1 min-w-[120px] flex-col items-center gap-1 border-r border-border px-4 py-4 text-center transition-colors last:border-r-0 hover:bg-secondary/50 ${filter === s ? "bg-secondary" : ""}`}
                    >
                      <span className={`text-xl font-display font-bold ${filter === s ? "text-primary" : ""}`}>
                        {count}
                      </span>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className={`h-full rounded-full ${colorClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{s}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-3 pb-4">
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search customer or country..."
                    className="pl-9 rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm ml-auto">
                  <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">Status:</span>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as typeof filter)}
                    className="h-9 cursor-pointer appearance-none rounded-full border border-border bg-card text-card-foreground pl-4 pr-9 py-1.5 font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23111827%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[right_1rem_center] bg-no-repeat"
                  >
                    {["All", ...ALL_STATUSES].map((s) => (
                      <option key={s} value={s}>
                        {s} {counts[s] !== undefined ? `(${counts[s]})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Applications list */}
              <div className="space-y-3">
                {filteredApps.map((app) => {
                  const docsReceived = (app.docs || []).filter((d) => d.received).length;
                  const isOpen = expanded === app.id;
                  return (
                    <div
                      key={app.id}
                      className="overflow-hidden rounded-2xl border border-border bg-card shadow-card hover:shadow-md transition-shadow"
                    >
                      {/* Main row */}
                      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                          {app.customer.charAt(0).toUpperCase()}
                        </div>
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => setExpanded(isOpen ? null : app.id)}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold hover:text-primary transition-colors">{app.customer}</p>
                            <span className="text-xs text-muted-foreground">{app.id}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {app.phone && <span className="mr-2">📞 {app.phone}</span>}
                            {app.email && <span>✉️ {app.email}</span>}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-foreground">
                            {app.flag} {app.country} · {app.visaType}
                          </p>
                        </div>

                        {/* Dates */}
                        <div className="hidden text-xs text-muted-foreground sm:block">
                          <p>
                            Applied:{" "}
                            <span className="font-medium text-foreground">{app.appliedOn}</span>
                          </p>
                          <p>
                            Travel:{" "}
                            <span className="font-medium text-foreground">{app.travelDate}</span>
                          </p>
                        </div>

                        {/* Doc progress */}
                        <div className="hidden w-28 sm:block">
                          <p className="mb-1 text-xs text-muted-foreground">
                            Docs {docsReceived}/{(app.docs || []).length}
                          </p>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={Object.assign(
                                {},
                                { width: `${(app.docs || []).length > 0 ? Math.round((docsReceived / (app.docs || []).length) * 100) : 0}%` },
                              )}
                            />
                          </div>
                        </div>

                        {/* Status badge - click to change */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${STATUS_STYLE[app.status]}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {STATUS_ICON[app.status]} {app.status}
                              <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-52 p-1" align="start" onClick={(e) => e.stopPropagation()}>
                            <div className="text-[11px] text-muted-foreground font-medium px-2 py-1.5">Change Status</div>
                            <div className="text-[10px] text-muted-foreground/70 px-2 pb-1 italic">Auto: Pending / Documents Complete</div>
                            {(["Submitted", "Under Review", "Approved", "Rejected"] as VisaStatus[]).map((s) => (
                              <button
                                key={s}
                                className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-secondary transition-colors ${app.status === s ? "bg-secondary" : ""}`}
                                onClick={() => {
                                  setApps(apps.map((a) => a.id === app.id ? { ...a, status: s } : a));
                                }}
                              >
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[s]}`}>
                                  {STATUS_ICON[s]} {s}
                                </span>
                                {app.status === s && <Check className="h-3 w-3 ml-auto text-primary" />}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>

                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Application Detail Dialog */}
              {(() => {
                const detailApp = apps.find((a) => a.id === expanded);
                if (!detailApp) return null;
                const docsReceivedCount = (detailApp.docs || []).filter((d) => d.received).length;
                return (
                  <Dialog open={!!expanded} onOpenChange={(open) => { if (!open) setExpanded(null); }}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20 text-sm">
                            {detailApp.customer.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-base font-semibold">{detailApp.customer}</p>
                            <p className="text-xs text-muted-foreground font-normal">{detailApp.id} · {detailApp.flag} {detailApp.country}</p>
                          </div>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="grid gap-6 md:grid-cols-3 mt-2">
                        {/* Left: Application Details */}
                        <div className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Application Details</p>
                          <div className="space-y-3 text-sm">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-muted-foreground">Visa Type</label>
                              <Input
                                value={detailApp.visaType}
                                onChange={(e) => setApps(apps.map((a) => a.id === detailApp.id ? { ...a, visaType: e.target.value } : a))}
                                className="h-8 text-sm rounded-lg bg-background"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-muted-foreground">Travel Date</label>
                              <Input
                                type="date"
                                value={detailApp.travelDate}
                                onChange={(e) => setApps(apps.map((a) => a.id === detailApp.id ? { ...a, travelDate: e.target.value } : a))}
                                className="h-8 text-sm rounded-lg bg-background"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground pt-1">
                              Docs: {docsReceivedCount}/{(detailApp.docs || []).length} received
                            </div>
                          </div>
                        </div>

                        {/* Right: Document Checklist */}
                        <div className="md:col-span-2">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Stamp className="h-3.5 w-3.5" /> Document Checklist
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(detailApp.docs || []).map((doc) => (
                              <button
                                key={doc.name}
                                onClick={() => toggleDoc(detailApp.id, doc.name)}
                                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors text-left ${doc.received ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50" : "border-border bg-background hover:bg-secondary/50"}`}
                              >
                                {doc.received ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                ) : (
                                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-border" />
                                )}
                                <span className={doc.received ? "text-foreground" : "text-muted-foreground"}>
                                  {doc.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="mt-4 flex gap-2">
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => { setDeleteAppTargetId(detailApp.id); setExpanded(null); }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="rounded-xl text-xs font-semibold shadow-sm"
                          style={{ background: "var(--gradient-brand)" }}
                          onClick={() => { toast.success("Application saved successfully"); setExpanded(null); }}
                        >
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                );
              })()}
            </>
          ) : (
            <div className="space-y-4">
              {/* Dashboard cards for Bookings */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Total Bookings",
                    value: filteredVisaBookings.length,
                    icon: <Briefcase className="h-4 w-4" />,
                    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
                    sub: "Total visa bookings",
                  },
                  {
                    label: "Total Sales",
                    value: `₹${filteredVisaBookings.reduce((sum: number, b: any) => {
                      const val = Number(b.selling_price);
                      return sum + (isNaN(val) ? 0 : val);
                    }, 0).toLocaleString()}`,
                    icon: <Globe className="h-4 w-4" />,
                    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
                    sub: "Overall revenue",
                  },
                  ...(isAdmin ? [{
                    label: "Total Profit",
                    value: `₹${filteredVisaBookings.reduce((sum: number, b: any) => {
                      const val = Number(b.profit);
                      return sum + (isNaN(val) ? 0 : val);
                    }, 0).toLocaleString()}`,
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25",
                    sub: "Overall profit margin",
                  }] : []),
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

              {filteredVisaBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 mt-8 text-center border-2 border-dashed rounded-xl">
                  <h2 className="text-xl font-bold mb-2">No Visa Bookings</h2>
                  <p className="text-muted-foreground">Click "New Booking" to create your first visa booking.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Customer</th>
                          <th className="px-4 py-3 font-semibold">Country</th>
                          <th className="px-4 py-3 font-semibold">Visa Type</th>
                          <th className="px-4 py-3 font-semibold">Supplier</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold text-right">Selling Price</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredVisaBookings.map((booking: any) => (
                          <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{booking.customer_name}</div>
                              <div className="text-xs text-muted-foreground">{booking.mobile_number}</div>
                            </td>
                            <td className="px-4 py-3">{booking.country}</td>
                            <td className="px-4 py-3">{booking.visa_type}</td>
                            <td className="px-4 py-3">{booking.supplier}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${booking.application_status === "Approved" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" :
                                  booking.application_status === "Rejected" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25" :
                                    booking.application_status === "Submitted" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25" :
                                      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25"
                                }`}>
                                {booking.application_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">₹{Number(booking.selling_price).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreVertical className="h-4 w-4 text-slate-500" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedVisaBooking(booking);
                                        setIsVisaBookingModalOpen(true);
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => setDeleteBookingTargetId(booking.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Visa Configuration"
        description="Are you sure you want to delete this visa requirements configuration? This action cannot be undone."
      />
      <DeleteConfirmModal
        isOpen={deleteAppTargetId !== null}
        onClose={() => setDeleteAppTargetId(null)}
        onConfirm={confirmDeleteApp}
        title="Delete Visa Application"
        description="Are you sure you want to delete this customer's visa application? All checklist progress will be lost."
      />
      <DeleteConfirmModal
        isOpen={deleteBookingTargetId !== null}
        onClose={() => setDeleteBookingTargetId(null)}
        onConfirm={() => {
          if (deleteBookingTargetId) {
            setVisaBookings(prev => prev.filter(b => b.id !== deleteBookingTargetId));
            setDeleteBookingTargetId(null);
            toast.success("Booking deleted successfully");
          }
        }}
        title="Delete Visa Booking"
        description="Are you sure you want to delete this visa booking? This action cannot be undone."
      />

      {isVisaBookingModalOpen && (
        <VisaBookingForm
          initialData={selectedVisaBooking}
          onClose={() => setIsVisaBookingModalOpen(false)}
          onSave={(data) => {
            if (selectedVisaBooking) {
              setVisaBookings(prev => prev.map(b => b.id === data.id ? data : b));
            } else {
              setVisaBookings(prev => [data, ...prev]);
            }
            setIsVisaBookingModalOpen(false);
          }}
        />
      )}

      <Dialog open={appModalOpen} onOpenChange={setAppModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              New Visa Application
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Add a new visa application track for a customer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddApplication} className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <Popover open={appCustomerOpen} onOpenChange={setAppCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={appCustomerOpen}
                    className="w-full justify-between rounded-xl border border-border bg-background px-3 py-2 h-auto text-sm focus:outline-none focus:ring-2 focus:ring-primary font-normal text-left"
                  >
                    {appCustomer
                      ? customers.find((c) => c.name === appCustomer)?.name || appCustomer
                      : "Select a customer..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." className="h-9 text-xs" />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={(currentValue) => {
                              const custName = currentValue === appCustomer.toLowerCase() ? "" : currentValue;
                              const cust = customers.find(x => x.name.toLowerCase() === custName.toLowerCase());
                              if (cust) {
                                setAppCustomerPhone(cust.phone || "");
                                setAppCustomerEmail(cust.email || "");
                                setAppCustomer(cust.name);
                              } else {
                                setAppCustomerPhone("");
                                setAppCustomerEmail("");
                                setAppCustomer("");
                              }
                              setAppCustomerOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${appCustomer === c.name ? "opacity-100" : "opacity-0"
                                }`}
                            />
                            <div className="flex flex-col">
                              <span>{c.name}</span>
                              {c.phone && <span className="text-[10px] text-muted-foreground">{c.phone}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mobile Number
                </label>
                <Input
                  value={appCustomerPhone}
                  onChange={(e) => setAppCustomerPhone(e.target.value)}
                  className="rounded-xl bg-background border-border h-10 text-sm px-3"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={appCustomerEmail}
                  onChange={(e) => setAppCustomerEmail(e.target.value)}
                  className="rounded-xl bg-background border-border h-10 text-sm px-3"
                  placeholder="e.g. email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Country <span className="text-red-500">*</span>
                </label>
                <Popover open={appCountryOpen} onOpenChange={setAppCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={appCountryOpen}
                      className="w-full justify-between rounded-xl border border-border bg-background px-3 py-2 h-auto text-sm focus:outline-none focus:ring-2 focus:ring-primary font-normal text-left"
                    >
                      <span className="flex items-center truncate">
                        {appCountry ? (
                          <>
                            <img
                              alt={appCountry}
                              title={COUNTRY_CODES[appCountry] || "un"}
                              src={`https://react-circle-flags.pages.dev/${(COUNTRY_CODES[appCountry] || "un").toLowerCase()}.svg`}
                              className="mr-2 h-4 w-4 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {appCountry}
                          </>
                        ) : (
                          "Select Country"
                        )}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search country..." className="h-9 text-xs" />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {COUNTRIES_LIST.map((c) => (
                            <CommandItem
                              key={c}
                              value={c}
                              onSelect={(currentValue) => {
                                const country = currentValue === appCountry.toLowerCase() ? "" : currentValue;
                                const actualCountry = COUNTRIES_LIST.find(x => x.toLowerCase() === country.toLowerCase()) || "";
                                setAppCountry(actualCountry);
                                setAppCountryOpen(false);
                              }}
                              className="flex items-center w-full gap-2 px-2 py-1.5 text-sm"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 shrink-0 ${appCountry === c ? "opacity-100" : "opacity-0"}`}
                              />
                              <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full bg-secondary">
                                <img
                                  height="20"
                                  width="20"
                                  alt={c}
                                  title={COUNTRY_CODES[c] || "un"}
                                  src={`https://react-circle-flags.pages.dev/${(COUNTRY_CODES[c] || "un").toLowerCase()}.svg`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{c}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Visa Type <span className="text-red-500">*</span>
                </label>
                <Popover open={appVisaTypeOpen} onOpenChange={setAppVisaTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={appVisaTypeOpen}
                      className="w-full justify-between rounded-xl border border-border bg-background px-3 py-2 h-auto text-sm focus:outline-none focus:ring-2 focus:ring-primary font-normal text-left"
                    >
                      {appVisaType || "Select Visa Type"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search visa type..." className="h-9 text-xs" />
                      <CommandList>
                        <CommandEmpty>No visa type found.</CommandEmpty>
                        <CommandGroup>
                          {VISA_TYPES_LIST.map((t) => (
                            <CommandItem
                              key={t}
                              value={t}
                              onSelect={(currentValue) => {
                                const vType = currentValue === appVisaType.toLowerCase() ? "" : currentValue;
                                const actualVType = VISA_TYPES_LIST.find(x => x.toLowerCase() === vType.toLowerCase()) || "";
                                setAppVisaType(actualVType);
                                setAppVisaTypeOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${appVisaType === t ? "opacity-100" : "opacity-0"
                                  }`}
                              />
                              {t}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Travel Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={appTravelDate}
                  onChange={(e) => setAppTravelDate(e.target.value)}
                  required
                  className="rounded-xl bg-background border-border"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-4 mt-6">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => setAppModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl px-6 text-white"
                style={BRAND_STYLE}
              >
                Add Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Visa Bookings</DialogTitle>
            <DialogDescription>
              Filter visa bookings by travel date before exporting.
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
