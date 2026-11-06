import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { getAuth } from "@/lib/auth";
import { formatINR } from "@/lib/mock-data";
import {
  FileText,
  Plus,
  Trash2,
  Share2,
  Printer,
  Download,
  CheckCircle2,
  ChevronRight,
  Plane,
  Building2,
  ListChecks,
  User,
  MapPin,
  Calendar,
  Sparkles,
  QrCode,
  DollarSign,
  XCircle,
  History,
  Edit2,
  Eye,
  Copy,
  Check,
  ChevronsUpDown,
  MoreVertical,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  Table2,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { generateWhatsAppLink, whatsappTemplates } from "@/lib/whatsapp";
import logoImg from "../assets/Logo.svg";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandedQuotationDocument } from "@/components/quotations/BrandedQuotationDocument";

export const Route = createFileRoute("/crm/quotations")({
  component: QuotationsPage,
});

interface DayItinerary {
  day: number;
  title: string;
  description: string;
}

interface HotelOption {
  id: string;
  hotelName: string;
  rating: string;
  location: string;
  checkIn: string;
  checkOut: string;
  rooms: string;
  adults: string;
  children: string;
  roomType: string;
  nights: number;
  mealPlan: string;
  confirmationNo?: string;
}

interface FlightOption {
  id: string;
  airline: string;
  flightNo: string;
  sector: string;
  dateTime: string;
  pnr?: string;
}

interface QuoteForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  packageName: string;
  destination: string;
  durationNights: number;
  durationDays: number;
  hotels: HotelOption[];
  flights: FlightOption[];
  basePrice: number;
  gstRate: number; // 0, 5, 18
  tcsRate: number; // 0, 2, 5
  discount: number;
  discountType: "amount" | "percentage";
  inclusions: string;
  exclusions: string;
  terms: string;
  bankDetails: string;
  itinerary: DayItinerary[];
}

const DEFAULT_HOTEL: HotelOption = {
  id: "1",
  hotelName: "",
  rating: "3 Star",
  location: "",
  checkIn: "",
  checkOut: "",
  rooms: "1",
  adults: "2",
  children: "0",
  roomType: "Deluxe",
  nights: 1,
  mealPlan: "Breakfast",
  confirmationNo: "",
};

const DEFAULT_FLIGHT: FlightOption = {
  id: "1",
  airline: "",
  flightNo: "",
  sector: "",
  dateTime: "",
  pnr: "",
};

const DEFAULT_FORM: QuoteForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  packageName: "Custom Holiday Package",
  destination: "",
  durationNights: 1,
  durationDays: 2,
  hotels: [{ ...DEFAULT_HOTEL }],
  flights: [{ ...DEFAULT_FLIGHT }],
  basePrice: 25000,
  gstRate: 5,
  tcsRate: 0,
  discount: 0,
  discountType: "amount",
  inclusions:
    "Standard Hotel Room\nDaily Breakfast\nReturn Airport Transfers\nSightseeing as per itinerary\n24/7 Local Support",
  exclusions:
    "Any personal expenses\nMeals other than specified\nTips and gratuities\nTravel Insurance\nVisa fees (unless specified)",
  terms:
    "50% advance payment required for confirmation.\nCancellation policies apply as per supplier rules.\nRates are subject to availability at the time of actual booking.",
  bankDetails:
    "Bank Name: \nAccount Name: \nAccount No: \nIFSC Code: \nSWIFT Code: ",
  itinerary: [
    {
      day: 1,
      title: "Arrival & Leisure",
      description:
        "Arrive at the destination. Meet our local representative and transfer to the hotel. Spend the rest of the day relaxing.",
    },
    {
      day: 2,
      title: "Departure",
      description: "Check out from the hotel. Transfer to the airport for your flight back home.",
    },
  ],
};

const DEFAULT_HOTEL_FORM: QuoteForm = {
  customerName: "Mr. Rajesh Sharma",
  customerPhone: "919413095483",
  customerEmail: "rajesh.sharma@example.com",
  packageName: "Hotel Quotation - Dubai Luxury Stay",
  destination: "Dubai, UAE",
  durationNights: 5,
  durationDays: 6,
  hotels: [
    {
      id: "1",
      hotelName: "Grand Hyatt Dubai",
      rating: "5 Star Luxury",
      location: "Dubai Healthcare City, Dubai",
      checkIn: "12 Oct 2026",
      checkOut: "17 Oct 2026",
      rooms: "1",
      adults: "2",
      children: "1",
      roomType: "Deluxe King Room",
      nights: 5,
      mealPlan: "Daily Breakfast (CP Plan)",
      confirmationNo: "LMH/HTL/2026/001",
    },
  ],
  flights: [{ ...DEFAULT_FLIGHT }],
  basePrice: 65000,
  gstRate: 5,
  tcsRate: 0,
  discount: 0,
  discountType: "amount",
  inclusions:
    "Accommodation in 5 Star Luxury Hotel\nDaily Buffet Breakfast at Hotel Restaurant\nComplimentary High-Speed Wi-Fi in room & public areas\nAccess to Temperature-Controlled Swimming Pool & Fitness Center\nComplimentary Airport Return Transfers\nAll Applicable Hotel Taxes & Service Charges\n24/7 Dedicated Concierge & Local Support",
  exclusions:
    "Personal Expenses (Minibar, Laundry, Telephone, etc.)\nLunch & Dinner (unless specified in meal plan)\nEarly Check-in & Late Check-out (subject to hotel availability)\nOptional tours, excursions & monument entry fees\nTourism Dirham / City Tax (payable directly at hotel check-out)\nAnything not mentioned under Inclusions",
  terms:
    "Hotel standard check-in time: 02:00 PM | Check-out time: 11:00 AM.\nPrices are subject to availability at the time of final confirmation.\nValid Government ID / Passport is mandatory at check-in.\nCancellation & amendment policies apply as per hotel guidelines.\nLook My Holiday reserves the right to modify stay arrangements for operational reasons.",
  bankDetails:
    "Bank Name: HDFC Bank\nAccount Name: Look My Holiday Pvt Ltd\nAccount No: 50200012345678\nIFSC Code: HDFC0001234\nBranch: JTM Mall, Jagatpura, Jaipur",
  itinerary: [
    {
      day: 1,
      title: "Arrival & Check-in at Grand Hyatt Dubai",
      description:
        "Arrive at Dubai International Airport. Meet representative and private transfer to the hotel. Smooth check-in and welcome drink. Rest of the day free for leisure & hotel facilities.",
    },
    {
      day: 2,
      title: "Leisure, Dining & Resort Amenities",
      description:
        "Enjoy complimentary morning buffet breakfast. Spend the day exploring nearby attractions or relaxing by the infinity pool & wellness spa.",
    },
    {
      day: 3,
      title: "City Highlights & Local Experiences",
      description:
        "Buffet breakfast at the hotel restaurant. Explore iconic landmarks, shopping hubs, and cultural hotspots.",
    },
    {
      day: 4,
      title: "Resort Leisure & Evening Relaxation",
      description:
        "Relax at the luxury resort amenities, enjoy world-class in-house dining and evening experiences.",
    },
    {
      day: 5,
      title: "Check-out & Farewell Departure",
      description:
        "Enjoy breakfast at the hotel. Complete check-out formalities. Transfer to the airport with wonderful memories of your stay.",
    },
  ],
};

function QuotationsPage() {
  const auth = getAuth();
  const isAdmin = auth?.role === "admin" || auth?.role === "manager";
  const [customers] = useSupabaseTable<any[]>("customers", []);
  const [packages] = useSupabaseTable<any[]>("packages", []);
  const [quotations, setQuotations] = useSupabaseTable<any[]>("quotations", []);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);

  const [form, setForm] = useState<QuoteForm>({ ...DEFAULT_FORM });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);

  // Dashboard view toggle
  const [activeView, setActiveView] = useState<"dashboard" | "builder">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Export State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Dashboard filtering and sorting
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [agentFilter, setAgentFilter] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Combobox states
  const [customerOpen, setCustomerOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);

  // Sync itinerary days count with durationDays
  useEffect(() => {
    const targetDays = Math.max(2, Number(form.durationDays) || 2);
    setForm((f) => {
      let current = [...f.itinerary];
      let updated = false;

      if (current.length < targetDays) {
        // Add days
        for (let i = current.length + 1; i <= targetDays; i++) {
          current.push({
            day: i,
            title: `Day ${i} Itinerary`,
            description: "Activity details to be specified.",
          });
        }
        updated = true;
      } else if (current.length > targetDays) {
        // Trim days
        current.length = targetDays;
        updated = true;
      }

      if (updated || Number(f.durationDays) !== targetDays) {
        return { ...f, itinerary: current, durationDays: targetDays };
      }
      return f;
    });
  }, [form.durationDays]);

  // Handle customer select auto-fill
  const handleCustomerSelect = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setForm((f) => ({
        ...f,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email || "",
      }));
    }
  };

  // Handle package select auto-fill
  const handlePackageSelect = (pkgId: string) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg) {
      const nights = parseInt(pkg.nights?.split("N")[0]) || 4;
      const days = parseInt(pkg.nights?.split("/")[1]?.replace(/[^\d]/g, "")) || 5;

      setForm((f) => ({
        ...f,
        packageName: pkg.title,
        destination: pkg.destination,
        durationNights: nights,
        durationDays: days,
        hotelNights: nights,
        basePrice: pkg.priceNum || parseInt(pkg.price.replace(/[^\d]/g, "")) || 25000,
        inclusions: pkg.incl?.join("\n") || f.inclusions,
        description: pkg.description,
        itinerary:
          pkg.itinerary && pkg.itinerary.length > 0
            ? pkg.itinerary.map((it: any) => ({
              day: it.day,
              title: it.title,
              description: it.description,
            }))
            : f.itinerary,
      }));
    }
  };

  const gstAmount = Math.round((form.basePrice * form.gstRate) / 100);
  const tcsAmount = Math.round((form.basePrice * form.tcsRate) / 100);
  const discountAmount = form.discountType === "percentage"
    ? Math.round((form.basePrice * form.discount) / 100)
    : form.discount;
  const totalAmount = Math.max(0, form.basePrice + gstAmount + tcsAmount - discountAmount);

  const handleItineraryChange = (idx: number, field: keyof DayItinerary, val: string) => {
    setForm((f) => {
      const copy = [...f.itinerary];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...f, itinerary: copy };
    });
  };

  // Save quotation to Database
  const handleSaveQuotation = async () => {
    const maxNumber = quotations.reduce((max: number, q: any) => {
      if (q.id && q.id.startsWith("QT-")) {
        const num = parseInt(q.id.replace("QT-", ""), 10);
        if (!isNaN(num) && num > max) return num;
      }
      return max;
    }, 0);
    const id = editingQuoteId || `QT-${String(maxNumber + 1).padStart(3, "0")}`;
    const newQuoteObj = {
      id,
      customer_name: form.customerName,
      customer_phone: form.customerPhone,
      customer_email: form.customerEmail,
      package_name: form.packageName,
      destination: form.destination,
      total_amount: totalAmount,
      created_at: editingQuoteId ? (quotations.find(q => q.id === editingQuoteId)?.created_at || new Date().toISOString()) : new Date().toISOString(),
      details: form,
      agent_name: auth?.name || "Admin",
    };

    if (editingQuoteId) {
      setQuotations(quotations.map(q => q.id === editingQuoteId ? newQuoteObj : q));
    } else {
      setQuotations([newQuoteObj, ...quotations]);
    }

    setSavedQuoteId(id);
    setPreviewOpen(true);
    setEditingQuoteId(null);
    setActiveView("dashboard");
  };

  // Generate WhatsApp Message
  const getWhatsAppMessage = () => {
    const portalUrl = window.location.origin + `/crm/portal?quoteId=${savedQuoteId || "QT-102"}`;
    return whatsappTemplates.quotation(
      form.customerName || "Customer",
      form.packageName,
      formatINR(totalAmount),
      portalUrl,
    );
  };

  const shareOnWhatsApp = () => {
    const link = generateWhatsAppLink(form.customerPhone || "919876543210", getWhatsAppMessage());
    window.open(link, "_blank");
  };

  // Trigger PDF print view with clean iframe printing (guarantees all 5 pages and backgrounds)
  const handlePrint = () => {
    const printContent = document.getElementById("quotation-print-area");
    if (!printContent) {
      window.print();
      return;
    }

    // Create an isolated iframe to print all pages cleanly without dialog clipping
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((node) => node.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${savedQuoteId || "LookMyHoliday"}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            *, *:before, *:after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #quotation-print-area {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print-page {
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: none !important;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div id="quotation-print-area">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Iframe print error, falling back to window.print", err);
        window.print();
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 400);
  };

  const handleViewQuote = (quote: any) => {
    let parsedDetails = quote.details;
    if (typeof parsedDetails === "string") {
      try {
        parsedDetails = JSON.parse(parsedDetails);
      } catch (e) {
        console.error("Failed to parse quote details", e);
      }
    }
    const clonedDetails = parsedDetails ? JSON.parse(JSON.stringify(parsedDetails)) : { ...DEFAULT_FORM };
    setSavedQuoteId(quote.id);
    setForm(clonedDetails);
    setPreviewOpen(true);
  };

  const handleEditQuote = (quote: any) => {
    let parsedDetails = quote.details;
    if (typeof parsedDetails === "string") {
      try {
        parsedDetails = JSON.parse(parsedDetails);
      } catch (e) {
        console.error("Failed to parse quote details", e);
      }
    }
    const clonedDetails = parsedDetails ? JSON.parse(JSON.stringify(parsedDetails)) : { ...DEFAULT_FORM };
    setEditingQuoteId(quote.id);
    setSavedQuoteId(quote.id);
    setForm(clonedDetails);
    setActiveView("builder");
    toast.success(`Quote ${quote.id} loaded for editing`);
  };

  // Simulated AI Itinerary generator helper
  const handleGenerateAIItinerary = () => {
    if (!form.destination) {
      toast.error("Please specify a Destination first to generate AI Itinerary.");
      return;
    }
    const dest = form.destination.toLowerCase();
    let aiItinerary: DayItinerary[] = [];

    if (dest.includes("dubai")) {
      aiItinerary = [
        {
          day: 1,
          title: "Arrive in Dubai & Marina Dhow Cruise",
          description:
            "Arrive in Dubai. Meet representative and transfer to hotel. In the evening, enjoy a premium Marina Dhow Cruise with buffet dinner.",
        },
        {
          day: 2,
          title: "Dubai City Tour & Burj Khalifa 124th Floor",
          description:
            "Half-day Dubai city tour covering Dubai Museum, Jumeirah Mosque, Burj Al Arab photo op. Evening entry to Burj Khalifa Observatory.",
        },
        {
          day: 3,
          title: "Desert Safari with BBQ Dinner",
          description:
            "Morning at leisure. Afternoon 4x4 dune bashing, camel riding, sandboarding, belly dancing show, and BBQ dinner at desert camp.",
        },
        {
          day: 4,
          title: "Abu Dhabi Day Tour & Yas Island",
          description:
            "Full-day excursion to Abu Dhabi. Visit the magnificent Sheikh Zayed Grand Mosque, Heritage Village, and drive past Yas Marina.",
        },
        {
          day: 5,
          title: "Departure with memories",
          description: "Breakfast at hotel. Private transfer to airport for final departure.",
        },
      ];
    } else if (dest.includes("thailand") || dest.includes("phuket")) {
      aiItinerary = [
        {
          day: 1,
          title: "Arrive in Phuket & Patong Leisure",
          description:
            "Arrive in Phuket. Check in to Patong beach resort. Evening stroll around Bangla Road and local street food tour.",
        },
        {
          day: 2,
          title: "Phi Phi Island Speedboat Tour",
          description:
            "Full-day speedboat excursion to Phi Phi Don and Phi Phi Ley. Enjoy snorkeling, swimming in Maya Bay, and lunch.",
        },
        {
          day: 3,
          title: "Transfer to Krabi & Ao Nang Beach",
          description:
            "Scenic road transfer to Krabi. Check in to Ao Nang beach resort. Sunset walk along the cliffs.",
        },
        {
          day: 4,
          title: "Four Island Tour by Longtail Boat",
          description:
            "Island hopping tour of Phranang Cave, Tup Island, Chicken Island, and Poda Island with picnic lunch.",
        },
        {
          day: 5,
          title: "Departure from Krabi",
          description: "Breakfast at hotel. Private transfer to Krabi International Airport.",
        },
      ];
    } else {
      aiItinerary = [
        {
          day: 1,
          title: `Welcome to ${form.destination}`,
          description: `Arrive at the airport. Transfer to your resort/hotel. Leisure day to explore.`,
        },
        {
          day: 2,
          title: "Historical & Local Landmarks",
          description:
            "Guided sightseeing tour of top-rated local heritage landmarks and scenic valleys.",
        },
        {
          day: 3,
          title: "Scenic Nature Trails & Excursions",
          description:
            "Experience panoramic viewpoints, waterfall treks, and premium activities in the area.",
        },
        {
          day: 4,
          title: "Local Craft Shopping & Cultural Show",
          description:
            "Visit traditional artisan markets and watch a native dance/music show in the evening.",
        },
        {
          day: 5,
          title: "Farewell Transfer",
          description: "Check out and ride comfortably to the airport for your flight back.",
        },
      ];
    }

    setForm((f) => ({
      ...f,
      durationDays: aiItinerary.length,
      durationNights: aiItinerary.length - 1,
      itinerary: aiItinerary,
    }));
    toast.success(`Generated ${aiItinerary.length}-day itinerary for ${form.destination}!`);
  };

  const handleAddHotel = () => {
    setForm(f => ({ ...f, hotels: [...(f.hotels || []), { ...DEFAULT_HOTEL, id: Math.random().toString(36).substr(2, 9) }] }));
  };
  const handleRemoveHotel = (id: string) => {
    setForm(f => ({ ...f, hotels: f.hotels.filter(h => h.id !== id) }));
  };
  const handleUpdateHotel = (id: string, field: string, value: any) => {
    setForm(f => ({ ...f, hotels: f.hotels.map(h => h.id === id ? { ...h, [field]: value } : h) }));
  };

  const handleAddFlight = () => {
    setForm(f => ({ ...f, flights: [...(f.flights || []), { ...DEFAULT_FLIGHT, id: Math.random().toString(36).substr(2, 9) }] }));
  };
  const handleRemoveFlight = (id: string) => {
    setForm(f => ({ ...f, flights: f.flights.filter(fl => fl.id !== id) }));
  };
  const handleUpdateFlight = (id: string, field: string, value: any) => {
    setForm(f => ({ ...f, flights: f.flights.map(fl => fl.id === id ? { ...fl, [field]: value } : fl) }));
  };


  const filteredQuotationsList = [...new globalThis.Map(quotations.map(q => [q.id, q])).values()]
    .filter((q) =>
      !searchQuery ||
      q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.package_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.destination?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((q) => agentFilter === "All" || q.agent_name === agentFilter)
    .filter((q) => {
      if (!dateFrom && !dateTo) return true;
      const qDate = new Date(q.created_at).getTime();
      const from = dateFrom ? new Date(dateFrom).getTime() : 0;
      const to = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;
      return qDate >= from && qDate <= to;
    })
    .filter((q) => {
      if (activeTab === "all") return true;
      if (activeTab === "hotel") return q.package_name?.toLowerCase().includes("hotel");
      if (activeTab === "package") return q.package_name?.toLowerCase().includes("package");
      return true;
    });

  const exportToExcel = () => {
    const exportableQuotations = filteredQuotationsList.filter(q => {
      const d = q.created_at ? new Date(q.created_at).toISOString().split("T")[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const csvContent = [
      ["Quote ID", "Date", "Customer Name", "Package / Dest", "Amount", "Generated By"],
      ...exportableQuotations.map(q => [
        `"${q.id}"`,
        `"${new Date(q.created_at).toLocaleDateString("en-IN")}"`,
        `"${(q.customer_name || "").replace(/"/g, '""')}"`,
        `"${(q.package_name || q.destination || "").replace(/"/g, '""')}"`,
        q.total_amount || 0,
        `"${(q.agent_name || "").replace(/"/g, '""')}"`
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `quotations_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToWord = () => {
    const exportableQuotations = filteredQuotationsList.filter(q => {
      const d = q.created_at ? new Date(q.created_at).toISOString().split("T")[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableHeader =
      "<tr><th>Quote ID</th><th>Date</th><th>Customer Name</th><th>Package / Dest</th><th>Amount</th><th>Generated By</th></tr>";
    const tableRows = exportableQuotations
      .map(
        (q) =>
          `<tr><td>${q.id}</td><td>${new Date(q.created_at).toLocaleDateString("en-IN")}</td><td>${q.customer_name || ""}</td><td>${q.package_name || q.destination || ""}</td><td>₹${q.total_amount || 0}</td><td>${q.agent_name || ""}</td></tr>`,
      )
      .join("");
    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Quotations Export</title><style>table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; } th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head>
      <body><h2>LookMyHolidays CRM - Quotations Export</h2><table>${tableHeader}${tableRows}</table></body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quotations_export_${new Date().toISOString().slice(0, 10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const exportableQuotations = filteredQuotationsList.filter(q => {
      const d = q.created_at ? new Date(q.created_at).toISOString().split("T")[0] : "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableHeader =
      "<tr><th>Quote ID</th><th>Date</th><th>Customer Name</th><th>Package / Dest</th><th>Amount</th><th>Generated By</th></tr>";
    const tableRows = exportableQuotations
      .map(
        (q) =>
          `<tr><td>${q.id}</td><td>${new Date(q.created_at).toLocaleDateString("en-IN")}</td><td>${q.customer_name || ""}</td><td>${q.package_name || q.destination || ""}</td><td>₹${q.total_amount || 0}</td><td>${q.agent_name || ""}</td></tr>`,
      )
      .join("");
    const css = `body{font-family:sans-serif;padding:20px;color:#333}h2{color:#059669;margin-bottom:5px}p{font-size:12px;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f9fafb;font-weight:bold}tr:nth-child(even){background:#f3f4f6}`;
    const styleEl = printWindow.document.createElement("style");
    styleEl.textContent = css;
    printWindow.document.head.appendChild(styleEl);
    const titleEl = printWindow.document.createElement("title");
    titleEl.textContent = "Quotations Export PDF";
    printWindow.document.head.appendChild(titleEl);
    const bodyHtml = `<h2>LookMyHolidays CRM - Quotations Export</h2><p>Generated on ${new Date().toLocaleDateString("en-IN")} | Total Quotations: ${exportableQuotations.length}</p><table><thead>${tableHeader}</thead><tbody>${tableRows}</tbody></table>`;
    const wrapper = printWindow.document.createElement("div");
    wrapper.innerHTML = bodyHtml;
    printWindow.document.body.appendChild(wrapper);
    const script = printWindow.document.createElement("script");
    script.textContent =
      "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
    printWindow.document.body.appendChild(script);
  };

  return (
    <div className="space-y-8 print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Quotation Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage, view, and share all generated quotations.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setForm({ ...DEFAULT_HOTEL_FORM });
                setEditingQuoteId(null);
                setActiveView("builder");
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-5 shadow flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Hotel Quote
            </Button>
            <Button
              onClick={() => {
                setForm({ ...DEFAULT_FORM, packageName: "Package Quote" });
                setEditingQuoteId(null);
                setActiveView("builder");
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-5 shadow flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Package Quote
            </Button>
            <Button
              onClick={() => {
                setForm({ ...DEFAULT_FORM });
                setEditingQuoteId(null);
                setActiveView("builder");
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-5 shadow flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Create New Quote
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6 print:hidden">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Total Quotes",
              value: quotations.length,
              icon: <FileText className="h-4 w-4" />,
              color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25",
              sub: "All generated quotes",
            },
            {
              label: "Hotel Quotes",
              value: quotations.filter(q => q.package_name?.toLowerCase().includes("hotel")).length,
              icon: <Building2 className="h-4 w-4" />,
              color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
              sub: "Hotel only quotes",
            },
            {
              label: "Package Quotes",
              value: quotations.filter(q => q.package_name?.toLowerCase().includes("package")).length,
              icon: <Plane className="h-4 w-4" />,
              color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25",
              sub: "Holiday packages",
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

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Single-row toolbar: tabs left, controls right */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 animate-in fade-in duration-300">
            <TabsList>
              <TabsTrigger value="all">All Quotes</TabsTrigger>
              <TabsTrigger value="hotel">Hotel Quotes</TabsTrigger>
              <TabsTrigger value="package">Package Quotes</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-[200px] md:w-[250px] rounded-lg shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 bg-background border border-input rounded-lg px-3 h-9 shadow-sm">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 cursor-pointer text-foreground appearance-none pr-4"
                >
                  <option value="All">All Agents</option>
                  {Array.from(new Set(quotations.map(q => q.agent_name).filter(Boolean))).map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)} className="h-9 shadow-sm">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          {["all", "hotel", "package"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="mt-0">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground select-none">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "id" && sortOrder === "asc" ? "desc" : "asc"); setSortField("id"); }}>
                          <div className="flex items-center gap-1">Quote ID {sortField === "id" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "created_at" && sortOrder === "asc" ? "desc" : "asc"); setSortField("created_at"); }}>
                          <div className="flex items-center gap-1">Date {sortField === "created_at" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "customer_name" && sortOrder === "asc" ? "desc" : "asc"); setSortField("customer_name"); }}>
                          <div className="flex items-center gap-1">Customer Name {sortField === "customer_name" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "package_name" && sortOrder === "asc" ? "desc" : "asc"); setSortField("package_name"); }}>
                          <div className="flex items-center gap-1">Package / Dest {sortField === "package_name" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "total_amount" && sortOrder === "asc" ? "desc" : "asc"); setSortField("total_amount"); }}>
                          <div className="flex items-center gap-1">Amount (₹) {sortField === "total_amount" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => { setSortOrder(sortField === "agent_name" && sortOrder === "asc" ? "desc" : "asc"); setSortField("agent_name"); }}>
                          <div className="flex items-center gap-1">Generated By {sortField === "agent_name" ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}</div>
                        </th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredQuotationsList
                        .sort((a, b) => {
                          const valA = a[sortField];
                          const valB = b[sortField];
                          if (!valA && valB) return sortOrder === "asc" ? -1 : 1;
                          if (valA && !valB) return sortOrder === "asc" ? 1 : -1;
                          if (!valA && !valB) return 0;

                          if (sortField === "total_amount") {
                            return sortOrder === "asc" ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
                          }
                          if (sortField === "created_at") {
                            return sortOrder === "asc"
                              ? new Date(valA).getTime() - new Date(valB).getTime()
                              : new Date(valB).getTime() - new Date(valA).getTime();
                          }

                          const strA = String(valA).toLowerCase();
                          const strB = String(valB).toLowerCase();
                          if (strA < strB) return sortOrder === "asc" ? -1 : 1;
                          if (strA > strB) return sortOrder === "asc" ? 1 : -1;
                          return 0;
                        })
                        .map((quote) => (
                          <tr key={quote.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap font-medium text-primary">{quote.id}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{new Date(quote.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">{quote.customer_name}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <p className="text-foreground">{quote.package_name}</p>
                              <p className="text-xs text-muted-foreground">{quote.destination}</p>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap font-bold text-amber-600 dark:text-amber-500">
                              {formatINR(quote.total_amount)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">{quote.agent_name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg">
                                    <DropdownMenuItem
                                      onClick={() => handleViewQuote(quote)}
                                      className="cursor-pointer gap-2 text-xs font-medium py-2 rounded-lg"
                                    >
                                      <Eye className="h-4 w-4 text-primary" /> View / Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleEditQuote(quote)}
                                      className="cursor-pointer gap-2 text-xs font-medium py-2 rounded-lg"
                                    >
                                      <Edit2 className="h-4 w-4 text-amber-600" /> Edit Quote
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        handleViewQuote(quote);
                                        setTimeout(() => handlePrint(), 300);
                                      }}
                                      className="cursor-pointer gap-2 text-xs font-medium py-2 rounded-lg"
                                    >
                                      <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" /> Print / Save PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const portalUrl = window.location.origin + `/crm/portal?quoteId=${quote.id}`;
                                        const msg = whatsappTemplates.quotation(
                                          quote.customer_name || "Customer",
                                          quote.package_name || "Quotation",
                                          formatINR(quote.total_amount),
                                          portalUrl
                                        );
                                        const link = generateWhatsAppLink(quote.customer_phone || "919876543210", msg);
                                        window.open(link, "_blank");
                                      }}
                                      className="cursor-pointer gap-2 text-xs font-medium py-2 rounded-lg text-emerald-600 focus:text-emerald-600"
                                    >
                                      <Share2 className="h-4 w-4" /> Share WhatsApp
                                    </DropdownMenuItem>
                                    {isAdmin && (
                                      <DropdownMenuItem
                                        onClick={() => setDeleteQuoteId(quote.id)}
                                        className="cursor-pointer gap-2 text-xs font-medium py-2 rounded-lg text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {filteredQuotationsList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                            No quotations found. Click "Create New Quote" to build one!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={activeView === "builder"} onOpenChange={(open) => {
        if (!open) {
          setForm({ ...DEFAULT_FORM });
          setEditingQuoteId(null);
          setActiveView("dashboard");
        }
      }}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col rounded-3xl p-0 bg-background">
          <DialogHeader className="p-6 border-b shrink-0 bg-background/95 backdrop-blur z-10">
            <div>
              <DialogTitle className="font-display text-2xl font-bold">
                {form.packageName === "Hotel Quote" ? "Hotel Quotation Builder" :
                  form.packageName === "Package Quote" ? "Package Quotation Builder" :
                    "Quotation Builder"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1 text-sm text-left">
                Create, style, and share customized travel itineraries and payment estimates.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-6 relative">
            <div className="grid gap-6 lg:grid-cols-3 print:hidden">
              {/* Left Side: Builder Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer & Package Auto-fill hooks */}
                <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div>
                    <Label
                      htmlFor="cust-select"
                      className="mb-2 block font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      Auto-fill Customer Profile
                    </Label>
                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={customerOpen}
                          className="w-full justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal h-10"
                        >
                          <span className="truncate">
                            {form.customerName
                              ? customers.find((c) => c.name === form.customerName)?.name ||
                              "-- Select Existing Client --"
                              : "-- Select Existing Client --"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search client..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((c) => (
                                <CommandItem
                                  key={c.id}
                                  value={c.name}
                                  onSelect={() => {
                                    handleCustomerSelect(c.id);
                                    setCustomerOpen(false);
                                  }}
                                >
                                  {c.name} ({c.phone})
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      form.customerName === c.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {form.packageName !== "Hotel Quote" && (
                    <div>
                      <Label
                        htmlFor="pkg-select"
                        className="mb-2 block font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                      >
                        Auto-fill Package Template
                      </Label>
                      <Popover open={packageOpen} onOpenChange={setPackageOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={packageOpen}
                            className="w-full justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal h-10"
                          >
                            <span className="truncate">
                              {form.packageName && form.packageName !== "Custom Holiday Package"
                                ? packages.find((p) => p.title === form.packageName)?.title ||
                                "-- Select Package --"
                                : "-- Select Package --"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search package..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No package found.</CommandEmpty>
                              <CommandGroup>
                                {packages.map((p) => (
                                  <CommandItem
                                    key={p.id}
                                    value={p.title}
                                    onSelect={() => {
                                      handlePackageSelect(p.id);
                                      setPackageOpen(false);
                                    }}
                                  >
                                    {p.title}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        form.packageName === p.title ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Customer Inputs */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider">
                    1. Client Details
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="cname">Client Name</Label>
                      <Input
                        id="cname"
                        placeholder="Priya Sharma"
                        value={form.customerName}
                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        className="rounded-xl mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cphone">Client Mobile</Label>
                      <Input
                        id="cphone"
                        placeholder="9876543210"
                        value={form.customerPhone}
                        onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                        className="rounded-xl mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cemail">Client Email</Label>
                      <Input
                        id="cemail"
                        placeholder="priya@example.com"
                        value={form.customerEmail}
                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                        className="rounded-xl mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Package Details */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider">
                      2. {form.packageName === "Hotel Quote" ? "Hotel Configuration" : "Trip & Package Configuration"}
                    </h3>
                    {form.packageName !== "Hotel Quote" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAIItinerary}
                        className="rounded-full text-xs gap-1 border-primary/30 hover:bg-primary/5 text-primary"
                      >
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" /> AI Generate Itinerary
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="pkgname" className="font-semibold text-sm mb-1.5 block">Trip Title</Label>
                      <Input
                        id="pkgname"
                        placeholder="e.g. Dubai Marina & Desert Retreat"
                        value={form.packageName}
                        onChange={(e) => setForm({ ...form, packageName: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dest" className="font-semibold text-sm mb-1.5 block">Destination</Label>
                      <Input
                        id="dest"
                        placeholder="e.g. Dubai"
                        value={form.destination}
                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                        className="rounded-xl h-10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="days" className="font-semibold text-sm mb-1.5 block">Days</Label>
                        <Input
                          id="days"
                          type="number"
                          min="2"
                          value={form.durationDays}
                          onChange={(e) => setForm({ ...form, durationDays: Math.max(2, Number(e.target.value)) })}
                          className="rounded-xl h-10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nights" className="font-semibold text-sm mb-1.5 block">Nights</Label>
                        <Input
                          id="nights"
                          type="number"
                          value={form.durationNights}
                          onChange={(e) => setForm({ ...form, durationNights: Number(e.target.value) })}
                          className="rounded-xl h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-sm">Hotel Options</h4>
                      <Button type="button" onClick={handleAddHotel} variant="outline" size="sm" className="rounded-full h-8 px-3 text-xs border-border/80 text-foreground">
                        <Plus className="h-3 w-3 mr-1" /> Add Hotel
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {form.hotels?.map((hotel) => (
                        <div key={hotel.id} className="rounded-2xl border border-border/80 p-5 space-y-5 relative group">
                          <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveHotel(hotel.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>

                          <div className="grid gap-4 sm:grid-cols-12">
                            <div className="sm:col-span-5">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Hotel Name</Label>
                              <Input placeholder="e.g. Hotel Shompen" className="rounded-xl h-10 bg-background" value={hotel.hotelName} onChange={(e) => handleUpdateHotel(hotel.id, 'hotelName', e.target.value)} />
                            </div>
                            <div className="sm:col-span-3">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Rating</Label>
                              <select className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={hotel.rating} onChange={(e) => handleUpdateHotel(hotel.id, 'rating', e.target.value)}>
                                <option>3 Star</option>
                                <option>4 Star</option>
                                <option>5 Star</option>
                              </select>
                            </div>
                            <div className="sm:col-span-4">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Location</Label>
                              <Input placeholder="e.g. Port Blair" className="rounded-xl h-10 bg-background" value={hotel.location} onChange={(e) => handleUpdateHotel(hotel.id, 'location', e.target.value)} />
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-5">
                            <div>
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Check-in</Label>
                              <div className="relative">
                                <Input placeholder="dd/mm/yyyy" className="rounded-xl h-10 pl-3 pr-10 bg-background" value={hotel.checkIn} onChange={(e) => handleUpdateHotel(hotel.id, 'checkIn', e.target.value)} />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Check-out</Label>
                              <div className="relative">
                                <Input placeholder="dd/mm/yyyy" className="rounded-xl h-10 pl-3 pr-10 bg-background" value={hotel.checkOut} onChange={(e) => handleUpdateHotel(hotel.id, 'checkOut', e.target.value)} />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Rooms</Label>
                              <Input placeholder="1" className="rounded-xl h-10 bg-background" value={hotel.rooms} onChange={(e) => handleUpdateHotel(hotel.id, 'rooms', e.target.value)} />
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Adults</Label>
                              <Input placeholder="2" className="rounded-xl h-10 bg-background" value={hotel.adults} onChange={(e) => handleUpdateHotel(hotel.id, 'adults', e.target.value)} />
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Children</Label>
                              <Input placeholder="0" className="rounded-xl h-10 bg-background" value={hotel.children} onChange={(e) => handleUpdateHotel(hotel.id, 'children', e.target.value)} />
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-12">
                            <div className="sm:col-span-3">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Room Type</Label>
                              <Input placeholder="Deluxe" className="rounded-xl h-10 bg-background" value={hotel.roomType} onChange={(e) => handleUpdateHotel(hotel.id, 'roomType', e.target.value)} />
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Nights</Label>
                              <Input type="number" placeholder="1" className="rounded-xl h-10 bg-background" value={hotel.nights} onChange={(e) => handleUpdateHotel(hotel.id, 'nights', Number(e.target.value))} />
                            </div>
                            <div className="sm:col-span-3">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Meal Type</Label>
                              <Input placeholder="Half Board" className="rounded-xl h-10 bg-background" value={hotel.mealPlan} onChange={(e) => handleUpdateHotel(hotel.id, 'mealPlan', e.target.value)} />
                            </div>
                            <div className="sm:col-span-4">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Confirmation No.</Label>
                              <Input placeholder="e.g. HTL-12345" className="rounded-xl h-10 bg-background" value={hotel.confirmationNo || ''} onChange={(e) => handleUpdateHotel(hotel.id, 'confirmationNo', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-sm">Flight Options</h4>
                      <Button type="button" onClick={handleAddFlight} variant="outline" size="sm" className="rounded-full h-8 px-3 text-xs border-border/80 text-foreground">
                        <Plus className="h-3 w-3 mr-1" /> Add Flight
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {form.flights?.map((flight) => (
                        <div key={flight.id} className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center relative group bg-muted/10 p-4 rounded-2xl border border-border/50">
                          <div>
                            <Input placeholder="Airline (e.g. Emirates)" className="rounded-xl h-10 bg-background" value={flight.airline} onChange={(e) => handleUpdateFlight(flight.id, 'airline', e.target.value)} />
                          </div>
                          <div>
                            <Input placeholder="Flight No." className="rounded-xl h-10 bg-background" value={flight.flightNo} onChange={(e) => handleUpdateFlight(flight.id, 'flightNo', e.target.value)} />
                          </div>
                          <div>
                            <Input placeholder="Sector (e.g. DEL-DXB)" className="rounded-xl h-10 bg-background" value={flight.sector} onChange={(e) => handleUpdateFlight(flight.id, 'sector', e.target.value)} />
                          </div>
                          <div>
                            <Input placeholder="Date & Time" className="rounded-xl h-10 bg-background" value={flight.dateTime} onChange={(e) => handleUpdateFlight(flight.id, 'dateTime', e.target.value)} />
                          </div>
                          <div>
                            <Input placeholder="PNR" className="rounded-xl h-10 bg-background" value={flight.pnr || ''} onChange={(e) => handleUpdateFlight(flight.id, 'pnr', e.target.value)} />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveFlight(flight.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Day Wise Itinerary */}
                {form.packageName !== "Hotel Quote" && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                    <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider">
                      3. Day-Wise Program
                    </h3>
                    <div className="space-y-4">
                      {form.itinerary.map((day, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-border/80 bg-secondary/20 space-y-2 relative group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-12 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shrink-0">
                              Day {day.day}
                            </span>
                            <Input
                              placeholder="Day Title"
                              value={day.title}
                              onChange={(e) => handleItineraryChange(idx, "title", e.target.value)}
                              className="rounded-xl h-8 text-xs bg-background"
                            />
                            {idx >= 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setForm(f => {
                                    const newItin = [...f.itinerary];
                                    newItin.splice(idx, 1);
                                    newItin.forEach((d, i) => d.day = i + 1);
                                    return { ...f, itinerary: newItin, durationDays: newItin.length };
                                  });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <Textarea
                            placeholder="Day details and highlights"
                            value={day.description}
                            onChange={(e) => handleItineraryChange(idx, "description", e.target.value)}
                            className="rounded-xl text-xs bg-background"
                            rows={2}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full rounded-xl border-dashed border-2 mt-2"
                        onClick={() => setForm(f => ({ ...f, durationDays: Number(f.durationDays) + 1 }))}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Another Day
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side Column: Pricing & Share */}
              <div className="space-y-6">
                {/* Pricing & GST Ledger */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider">
                    {form.packageName === "Hotel Quote" ? "3. Pricing Estimate" : "4. Pricing Estimate"}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="basep">Base Package Price (₹)</Label>
                      <Input
                        id="basep"
                        type="number"
                        value={form.basePrice}
                        onChange={(e) => setForm({ ...form, basePrice: Math.max(0, Number(e.target.value)) })}
                        className="rounded-xl mt-1.5 font-bold"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gstrate">GST Rate</Label>
                      <select
                        id="gstrate"
                        value={form.gstRate}
                        onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary mt-1.5"
                      >
                        <option value="0">None</option>
                        <option value="5">5% GST (Standard Tour)</option>
                        <option value="18">18% GST (Hotel/Flights)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="tcsrate">TCS Rate (International Pack)</Label>
                      <select
                        id="tcsrate"
                        value={form.tcsRate}
                        onChange={(e) => setForm({ ...form, tcsRate: Number(e.target.value) })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary mt-1.5"
                      >
                        <option value="0">None</option>
                        <option value="2">2% TCS (With PAN)</option>
                        <option value="5">5% TCS (Without PAN)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="disc">Special Discount</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <select
                          value={form.discountType}
                          onChange={(e) => setForm({ ...form, discountType: e.target.value as "amount" | "percentage" })}
                          className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-28 shrink-0"
                        >
                          <option value="amount">₹ Flat</option>
                          <option value="percentage">% Perc</option>
                        </select>
                        <Input
                          id="disc"
                          type="number"
                          value={form.discount}
                          onChange={(e) => setForm({ ...form, discount: Math.max(0, Number(e.target.value)) })}
                          className="rounded-xl flex-1"
                          placeholder={form.discountType === "percentage" ? "e.g. 5" : "e.g. 1000"}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-2 space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                        <span>Base Price:</span>
                        <span>{formatINR(form.basePrice)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                        <span>GST Amount ({form.gstRate}%):</span>
                        <span>{formatINR(gstAmount)}</span>
                      </div>
                      {form.tcsRate > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                          <span>TCS Amount ({form.tcsRate}%):</span>
                          <span>{formatINR(tcsAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                        <span>Discount {form.discountType === "percentage" ? `(${form.discount}%)` : ""}:</span>
                        <span className="text-emerald-600">- {formatINR(discountAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-3 font-display font-bold text-lg text-primary">
                        <span>Total Cost:</span>
                        <span>{formatINR(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inclusions & Exclusions */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider">
                    {form.packageName === "Hotel Quote" ? "4. Inclusions & Exclusions" : "5. Inclusions & Exclusions"}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="incls">Inclusions</Label>
                      <Textarea
                        id="incls"
                        value={form.inclusions}
                        onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
                        className="rounded-xl text-xs mt-1.5"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="excls">Exclusions</Label>
                      <Textarea
                        id="excls"
                        value={form.exclusions}
                        onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
                        className="rounded-xl text-xs mt-1.5"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="terms">Terms & Policies</Label>
                      <Textarea
                        id="terms"
                        value={form.terms}
                        onChange={(e) => setForm({ ...form, terms: e.target.value })}
                        className="rounded-xl text-xs mt-1.5"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankDetails">Bank Details</Label>
                      <Textarea
                        id="bankDetails"
                        value={form.bankDetails}
                        onChange={(e) => setForm({ ...form, bankDetails: e.target.value })}
                        className="rounded-xl text-xs mt-1.5"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Recent Quotations */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
                    <History className="h-4 w-4" /> Recent Quotes
                  </h3>
                  {!quotations || quotations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No recent quotes</p>
                  ) : (
                    <div className="space-y-3">
                      {quotations.slice(0, 5).map((q: any) => (
                        <div key={q.id} className="flex flex-col gap-1.5 p-3 rounded-xl border border-border bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs">{q.id} - {q.customer_name}</span>
                            <span className="font-bold text-primary text-xs">{formatINR(q.total_amount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="truncate max-w-[150px]">{q.package_name}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View / Share"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => handleViewQuote(q)}
                              >
                                <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => {
                                  handleEditQuote(q);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete"
                                  className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setQuotations(quotations.filter((quote: any) => quote.id !== q.id));
                                    toast.success(`Quote ${q.id} deleted`);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 bg-card border-t border-border shrink-0 flex justify-end gap-3 z-10">
            <Button
              variant="outline"
              onClick={() => {
                setForm({ ...DEFAULT_FORM });
                setEditingQuoteId(null);
                setActiveView("dashboard");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuotation}
              className="shadow-md border-0 text-white"
              style={{ background: "var(--gradient-brand, var(--color-brand, #0f172a))" }}
            >
              Generate Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branded A4 PDF & Share Preview Panel */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[1020px] max-h-[92vh] h-[92vh] flex flex-col rounded-3xl p-0 border border-border shadow-2xl bg-card print:max-w-none print:w-full print:h-auto print:shadow-none print:border-none print:bg-card text-card-foreground overflow-hidden print:overflow-visible">
          <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0 print:hidden z-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-left">
                <DialogTitle className="font-display font-bold text-lg">Quotation Preview & Sharing</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Share directly with client or download offline PDF invoice format
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl gap-2 text-xs"
                  onClick={() => {
                    setPreviewOpen(false);
                    if (savedQuoteId) {
                      setEditingQuoteId(savedQuoteId);
                    }
                    setActiveView("builder");
                  }}
                >
                  <Edit2 className="h-4 w-4" /> Edit Quote
                </Button>
                <Button variant="outline" className="rounded-xl gap-2 text-xs" onClick={handlePrint}>
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
                <Button
                  style={{ background: "var(--gradient-brand)" }}
                  className="rounded-xl gap-2 text-xs text-primary-foreground shadow-md"
                  onClick={shareOnWhatsApp}
                >
                  <Share2 className="h-4 w-4" /> Share WhatsApp
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/90 dark:bg-slate-900/90 print:p-0 print:bg-white text-card-foreground print:overflow-visible">
            <BrandedQuotationDocument
              form={form}
              quoteId={savedQuoteId || "LMH/2026/001"}
              agentName={auth?.name || "Look My Holiday Team"}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuoteId} onOpenChange={(open) => !open && setDeleteQuoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this quote?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quotation and remove it from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary"
              onClick={() => {
                if (deleteQuoteId) {
                  setQuotations(quotations.filter((q) => q.id !== deleteQuoteId));
                  setDeleteQuoteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Quotations</DialogTitle>
            <DialogDescription>
              Filter quotations by creation date before exporting.
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
