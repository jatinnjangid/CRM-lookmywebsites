import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Booking, BookingType, PaymentMode, PaymentStatus } from "@/lib/mock-data";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { Plane, Train, Hotel, Map, Car, FileText, Shield, Bus, Calculator, Plus, X, Check, ChevronsUpDown, Trash2, Paperclip } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
interface AddBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (booking: Booking) => void;
  defaultCustomer?: string;
  editingBooking?: Booking | any;
}

const getFormType = (bt: string) => {
  if (!bt) return "";
  if (bt === "Air Ticket" || bt === "Air") return "Air Ticket";
  if (bt === "Hotel Booking" || bt === "Hotel") return "Hotel";
  if (bt === "Visa") return "Visa";
  if (bt === "Travel Insurance" || bt === "General Insurance" || bt === "Insurance") return "Travel Insurance";
  if (bt === "Train Ticket" || bt === "Train") return "Train Ticket";
  if (bt === "Bus Ticket" || bt === "Bus") return "Bus Ticket";
  if (bt === "Cruise Booking" || bt === "Cruise") return "Cruise";
  if (bt === "Passport Assistance" || bt === "Visa Assistance") return "Assistance";
  if (bt === "Forex Exchange" || bt === "Forex") return "Forex";
  if (bt === "Corporate Travel" || bt === "MICE Events" || bt === "Conference Booking" || bt === "Corporate") return "Corporate";
  if (bt === "Taxi Booking" || bt === "Car Rental" || bt === "Airport Transfer" || bt === "Taxi") return "Taxi";
  const packages = [
    "International Package","Domestic Package","Honeymoon Package",
    "Family Package","Group Tour","Corporate Tour","Luxury Tour","Adventure Tour",
    "Holiday Package", "Holiday"
  ];
  if (packages.includes(bt)) return "Holiday Package";
  return "Generic";
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

function SearchableSelect({
  value,
  onChange,
  items,
  placeholder,
  emptyText
}: {
  value: string;
  onChange: (val: string) => void;
  items: { value: string; label: string }[];
  placeholder: string;
  emptyText: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedItem = items.find(item => item.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-background px-3 h-10 rounded-md border-input"
        >
          <span className="truncate">
            {selectedItem ? selectedItem.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.label}___${item.value}`}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate">{item.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function AddBookingModal({ open, onOpenChange, onSave, defaultCustomer, editingBooking }: AddBookingModalProps) {
  const [bookingType, setBookingType] = useState<BookingType | "">("");
  const [customers] = useSupabaseTable<any[]>("customers", []);
  const [packages] = useSupabaseTable<any[]>("packages", []);
  const [vendors] = useSupabaseTable<any[]>("vendors", []);
  const [folders, setFolders] = useSupabaseTable<any[]>("folders", []);

  // Common Header
  const [supplier, setSupplier] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [customer, setCustomer] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [bookedBy, setBookedBy] = useState("");
  const [company, setCompany] = useState("");
  const [reference, setReference] = useState("");
  const [saleInvoiceNo, setSaleInvoiceNo] = useState("");
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState("");
  const [remarks, setRemarks] = useState("");

  // Core Financials
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [ticketAmount, setTicketAmount] = useState<number>(0); // For Bus

  const [refundDate, setRefundDate] = useState("");
  const [refundAmount, setRefundAmount] = useState<number>(0);

  // Payment Details
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Pending");

  // Attachments
  const [ticketFileName, setTicketFileName] = useState<string | null>(null);
  const [passportFileName, setPassportFileName] = useState<string | null>(null);
  const [otherFileName, setOtherFileName] = useState<string | null>(null);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [otherFile, setOtherFile] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [bankDetails, setBankDetails] = useState("");

  // Details Object
  const [details, setDetails] = useState<any>({});

  // Included Services for Packages
  const [includedServices, setIncludedServices] = useState({ flight: false, hotel: false, taxi: false, train: false, bus: false, visa: false, insurance: false });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (editingBooking) {
        setBookingType(editingBooking.bookingType || "Holiday Package");
        setSupplier(editingBooking.supplier || "");
        setBookingDate(editingBooking.bookingDate || new Date().toISOString().slice(0, 10));
        setCustomer(editingBooking.customer || "");
        setMobileNumber(editingBooking.mobileNumber || "");
        setBookedBy(editingBooking.bookedBy || "");
        setCompany(editingBooking.company || "");
        setReference(editingBooking.reference || "");
        setSaleInvoiceNo(editingBooking.saleInvoiceNo || "");
        setPurchaseInvoiceNo(editingBooking.purchaseInvoiceNo || "");
        setRemarks(editingBooking.remarks || "");

        setSellingPrice(editingBooking.amount || editingBooking.sellingPrice || 0);
        setPurchasePrice(editingBooking.purchasePrice || 0);
        setGstAmount(editingBooking.gstAmount || 0);
        setTicketAmount(editingBooking.ticketAmount || 0);
        setRefundDate(editingBooking.refundDate || "");
        setRefundAmount(editingBooking.refundAmount || 0);

        setAmountPaid(editingBooking.paid || editingBooking.amountPaid || 0);
        setPaymentMode(editingBooking.paymentMode || "Cash");
        setPaymentStatus(editingBooking.status || "Pending");
        setTransactionId(editingBooking.transactionId || "");
        setBankDetails(editingBooking.details?.bankDetails || "");

        setDetails(editingBooking.details || {});
        setIncludedServices(editingBooking.includedServices || { flight: false, hotel: false, taxi: false, train: false, bus: false, visa: false, insurance: false });
      } else {
        setBookingType("");
        setSupplier("");
        setBookingDate(new Date().toISOString().slice(0, 10));
        setCustomer(defaultCustomer || "");
        setMobileNumber("");
        setBookedBy("");
        setCompany("");
        setReference("");
        setSaleInvoiceNo("");
        setPurchaseInvoiceNo("");
        setRemarks("");

        setSellingPrice(0);
        setPurchasePrice(0);
        setGstAmount(0);
        setTicketAmount(0);
        setRefundDate("");
        setRefundAmount(0);

        setAmountPaid(0);
        setPaymentMode("Cash");
        setPaymentStatus("Pending");
        setTransactionId("");
        setBankDetails("");

        setDetails({});
        setIncludedServices({ flight: false, hotel: false, taxi: false, train: false, bus: false, visa: false, insurance: false });
      }
    }
  }, [open, editingBooking, defaultCustomer]);

  // Auto-fill mobile number if customer is set but mobile is empty (e.g. from defaultCustomer)
  useEffect(() => {
    if (customer && !mobileNumber && customers && customers.length > 0) {
      const found = customers.find(c => c.name === customer);
      if (found && found.phone) {
        setMobileNumber(found.phone);
      }
    }
  }, [customer, customers, mobileNumber]);

  // Handle Detail Change
  const updateDetail = (key: string, value: any) => {
    setDetails((prev: any) => ({ ...prev, [key]: value }));
  };

  const profit = useMemo(() => {
    return (sellingPrice || 0) - (purchasePrice || 0);
  }, [sellingPrice, purchasePrice]);

  const margin = useMemo(() => {
    if (!sellingPrice || sellingPrice === 0) return 0;
    return Number(((profit / sellingPrice) * 100).toFixed(2));
  }, [profit, sellingPrice]);

  const pendingAmount = useMemo(() => {
    return (sellingPrice || 0) - (amountPaid || 0);
  }, [sellingPrice, amountPaid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) {
      alert("Customer name is required.");
      return;
    }

    const filesToUpload: { file: File, type: string }[] = [];
    if (ticketFile) filesToUpload.push({ file: ticketFile, type: "Ticket" });
    if (passportFile) filesToUpload.push({ file: passportFile, type: "Passport" });
    if (otherFile) filesToUpload.push({ file: otherFile, type: "Other" });

    if (filesToUpload.length > 0) {
      const passengerName = details.passengerName || customer || "Unknown Customer";
      let targetFolder = folders.find((f: any) => f.name === passengerName);
      let isNewFolder = false;
      if (!targetFolder) {
        targetFolder = {
          id: `F-${Date.now().toString(36)}`,
          name: passengerName,
          color: "bg-blue-100 text-blue-600 border-blue-200",
          iconColor: "#3b82f6",
          createdAt: new Date().toISOString(),
          description: `Bookings for ${passengerName}`,
          files: [],
        };
        isNewFolder = true;
      }

      const newFiles = await Promise.all(filesToUpload.map(async ({ file }) => {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return {
          id: `U-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          dataUrl,
        };
      }));

      const updatedFolder = {
        ...targetFolder,
        files: [...(targetFolder.files || []), ...newFiles],
      };

      if (isNewFolder) {
        setFolders((prev: any) => [...prev, updatedFolder]);
      } else {
        setFolders((prev: any) => prev.map((f: any) => f.id === updatedFolder.id ? updatedFolder : f));
      }
    }

    const newBooking: Booking = {
      id: editingBooking?.id || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingType: bookingType as BookingType,
      supplier,
      bookingDate,
      customer,
      mobileNumber,
      bookedBy,
      company,
      reference,
      saleInvoiceNo,
      purchaseInvoiceNo,
      remarks,
      sellingPrice,
      purchasePrice,
      gstAmount,
      ticketAmount,
      profit,
      margin,
      refundDate,
      refundAmount,

      amount: sellingPrice,
      paid: amountPaid,
      paymentMode,
      transactionId,
      status: paymentStatus,

      // Legacy fallbacks
      package:
        details.packageType ||
        details.hotelName ||
        details.airline ||
        details.trainName ||
        bookingType,
      travelDate: details.travelDate || details.checkIn || details.processDate || bookingDate,

      details: {
        ...details,
        bankDetails,
        attachments: {
          ticket: ticketFileName,
          passport: passportFileName,
          other: otherFileName
        }
      },
    };

    onSave(newBooking);
    onOpenChange(false);
  };

  const renderSectionHeader = (title: string) => (
    <div className="col-span-full border-b border-border pb-2 mt-4 mb-2 flex items-center gap-2">
      <div className="h-4 w-1 bg-red-500 rounded-full"></div>
      <h3 className="text-sm font-bold tracking-tight">{title}</h3>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl border border-border p-0 shadow-2xl bg-card">
        <div className="sticky top-0 z-10 bg-card border-b border-border p-6 pb-4 flex items-start justify-between">
          <DialogHeader className="pr-8">
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              {editingBooking ? "Edit Booking" : (bookingType ? `New ${bookingType} Booking` : "Add New Booking")}
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              {bookingType ? "Fill in the details below." : "Select a booking type to continue."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {bookingType && (
          <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-secondary/30">
            {!editingBooking && (
              <button
                type="button"
                onClick={() => setBookingType("")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="text-base">←</span>
                <span className="hidden sm:inline">All Services</span>
              </button>
            )}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-lg">{SERVICES.flatMap(g => g.items).find(i => i.label === bookingType)?.icon || "📋"}</span>
              <span className="text-sm font-bold text-foreground">{bookingType}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 pt-2">
          {/* Booking Type Selector */}
          {!bookingType ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-6">
                {SERVICES.map((group) => (
                  <div key={group.group}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${SVC_BADGE[group.group] ?? "bg-gray-100 text-gray-600"}`}>
                        {group.group}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {group.items.map((item) => {
                        const isSelected = bookingType === item.label;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setBookingType(item.label as any)}
                            className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl border bg-gradient-to-br p-3 text-center transition-all duration-200 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] ${
                              isSelected
                                ? "bg-primary/10 border-primary/50 text-primary ring-1 ring-primary/20 scale-[1.03] shadow-md"
                                : SVC_COLOR[group.group] ?? "hover:bg-secondary border-border"
                            }`}
                          >
                            <span className="text-2xl leading-none">{item.icon}</span>
                            <span className="text-[10px] sm:text-[11px] font-semibold leading-tight text-foreground line-clamp-2">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderSectionHeader("Common Details")}

            <div className="space-y-2">
              <Label>Supplier *</Label>
              <SearchableSelect
                value={supplier}
                onChange={(val) => setSupplier(val)}
                items={vendors.map(v => ({ value: v.name, label: v.name }))}
                placeholder="Select a supplier..."
                emptyText="No supplier found."
              />
            </div>
            <div className="space-y-2">
              <Label>Booking Date *</Label>
              <Input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <SearchableSelect
                value={customer}
                onChange={(val) => {
                  setCustomer(val);
                  const found = customers.find(c => c.name === val);
                  if (found && found.phone) {
                    setMobileNumber(found.phone);
                  }
                }}
                items={customers.map(c => ({ value: c.name, label: c.name }))}
                placeholder="Select a customer..."
                emptyText="No customer found."
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number *</Label>
              <Input
                required
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Booked By</Label>
              <Input
                value={bookedBy}
                onChange={(e) => setBookedBy(e.target.value)}
                placeholder="Agent/Employee name"
              />
            </div>

            <div className="space-y-2">
              <Label>Reference</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ref ID"
              />
            </div>


            {renderSectionHeader("Booking Details")}

            {/* DYNAMIC FORM FIELDS BASED ON TYPE */}
            {getFormType(bookingType) === "Train Ticket" && (
              <>
                <div className="space-y-2">
                  <Label>Travel Date *</Label>
                  <Input
                    type="date"
                    required
                    value={details.travelDate || ""}
                    onChange={(e) => updateDetail("travelDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sector *</Label>
                  <Input
                    required
                    value={details.sector || ""}
                    onChange={(e) => updateDetail("sector", e.target.value)}
                    placeholder="DEL - MUM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Train Name *</Label>
                  <Input
                    required
                    value={details.trainName || ""}
                    onChange={(e) => updateDetail("trainName", e.target.value)}
                    placeholder="Rajdhani Exp"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PNR *</Label>
                  <Input
                    required
                    value={details.pnr || ""}
                    onChange={(e) => updateDetail("pnr", e.target.value)}
                    placeholder="PNR12345"
                  />
                </div>
                
                <div className="space-y-2 ">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {getFormType(bookingType) === "Air Ticket" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Trip Type *</Label>
                  <div className="flex bg-slate-100 p-1 rounded-full w-full max-w-md border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateDetail("tripType", "One Way")}
                      className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${(!details.tripType || details.tripType === "One Way")
                          ? "bg-white text-[#E42E3D] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      One Way
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDetail("tripType", "Round Trip")}
                      className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${details.tripType === "Round Trip"
                          ? "bg-white text-[#E42E3D] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      Round Trip
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dep. Date *</Label>
                  <Input
                    type="date"
                    required
                    value={details.travelDate || ""}
                    onChange={(e) => updateDetail("travelDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sector *</Label>
                  <Input
                    required
                    value={details.sector || ""}
                    onChange={(e) => updateDetail("sector", e.target.value)}
                    placeholder="DEL - MUM"
                  />
                </div>
                {details.tripType === "Round Trip" && (
                  <div className="space-y-2">
                    <Label>Arrival Date</Label>
                    <Input
                      type="date"
                      value={details.arrivalDate || ""}
                      onChange={(e) => updateDetail("arrivalDate", e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>PNR *</Label>
                  <Input
                    required
                    value={details.pnr || ""}
                    onChange={(e) => updateDetail("pnr", e.target.value)}
                    placeholder="PNR12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Airline *</Label>
                  <Input
                    required
                    value={details.airline || ""}
                    onChange={(e) => updateDetail("airline", e.target.value)}
                    placeholder="IndiGo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Flight Number</Label>
                  <Input
                    value={details.flightNumber || ""}
                    onChange={(e) => updateDetail("flightNumber", e.target.value)}
                    placeholder="6E-123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departure Time</Label>
                  <Input
                    type="time"
                    value={details.departureTime || ""}
                    onChange={(e) => updateDetail("departureTime", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arrival Time</Label>
                  <Input
                    type="time"
                    value={details.arrivalTime || ""}
                    onChange={(e) => updateDetail("arrivalTime", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. of Pax *</Label>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={details.noOfPax || ""}
                    onChange={(e) => updateDetail("noOfPax", e.target.value)}
                    placeholder="1"
                  />
                </div>
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

              </>
            )}

            {getFormType(bookingType) === "Hotel" && (
              <>
                <div className="space-y-2">
                  <Label>Check In *</Label>
                  <Input
                    type="date"
                    required
                    value={details.checkIn || ""}
                    onChange={(e) => updateDetail("checkIn", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check Out *</Label>
                  <Input
                    type="date"
                    required
                    value={details.checkOut || ""}
                    onChange={(e) => updateDetail("checkOut", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hotel Name *</Label>
                  <Input
                    required
                    value={details.hotelName || ""}
                    onChange={(e) => updateDetail("hotelName", e.target.value)}
                    placeholder="Taj Hotel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    required
                    value={details.city || ""}
                    onChange={(e) => updateDetail("city", e.target.value)}
                    placeholder="Goa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meal Plan</Label>
                  <Input
                    value={details.mealPlan || ""}
                    onChange={(e) => updateDetail("mealPlan", e.target.value)}
                    placeholder="CP/MAP"
                  />
                </div>

                <div className="space-y-2">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {getFormType(bookingType) === "Holiday Package" && (
              <>
                <div className="col-span-1 md:col-span-2 mb-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Auto-fill from Packages</Label>
                  <SearchableSelect
                    value="" // It's just for auto-fill, no need to store selected package id in state right now, but wait, SearchableSelect doesn't have an empty value handling well if value is not in items.
                    onChange={(val) => {
                      const pkg = packages.find(p => p.id === val);
                      if (pkg) {
                        setDetails((prev: any) => ({
                          ...prev,
                          destination: pkg.destination || "",
                          packageType: pkg.title || "",
                        }));
                        const basePrice = pkg.priceNum || parseInt((pkg.price || "").replace(/[^\d]/g, "")) || 0;
                        if (basePrice > 0) {
                          setSellingPrice(basePrice);
                        }
                      }
                    }}
                    items={packages.map(p => ({ value: p.id, label: p.title }))}
                    placeholder="-- Select Package --"
                    emptyText="No package found."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Travel From *</Label>
                  <Input
                    type="date"
                    required
                    value={details.travelFrom || ""}
                    onChange={(e) => updateDetail("travelFrom", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Travel To *</Label>
                  <Input
                    type="date"
                    required
                    value={details.travelTo || ""}
                    onChange={(e) => updateDetail("travelTo", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination *</Label>
                  <Input
                    required
                    value={details.destination || ""}
                    onChange={(e) => updateDetail("destination", e.target.value)}
                    placeholder="Maldives"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Package Type *</Label>
                  <Input
                    required
                    value={details.packageType || ""}
                    onChange={(e) => updateDetail("packageType", e.target.value)}
                    placeholder="Honeymoon"
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. of Pax *</Label>
                  <Input
                    type="number"
                    required
                    value={details.noOfPax || ""}
                    onChange={(e) => updateDetail("noOfPax", Number(e.target.value))}
                    placeholder="2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="col-span-1 md:col-span-2 mt-4 space-y-4 border-t pt-4">
                  <Label className="text-sm font-bold tracking-tight">Included Services</Label>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-flight" checked={includedServices.flight} onCheckedChange={(c) => setIncludedServices(p => ({ ...p, flight: !!c }))} />
                      <label htmlFor="include-flight" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Flight</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-hotel" checked={includedServices.hotel} onCheckedChange={(c) => setIncludedServices(p => ({ ...p, hotel: !!c }))} />
                      <label htmlFor="include-hotel" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-taxi" checked={includedServices.taxi} onCheckedChange={(c) => setIncludedServices(p => ({ ...p, taxi: !!c }))} />
                      <label htmlFor="include-taxi" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Taxi</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-train" checked={includedServices.train} onCheckedChange={(c) => setIncludedServices(p => ({ ...p, train: !!c }))} />
                      <label htmlFor="include-train" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Train Ticket</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-bus" checked={includedServices.bus} onCheckedChange={(c) => setIncludedServices(p => ({ ...p, bus: !!c }))} />
                      <label htmlFor="include-bus" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Bus Ticket</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-visa" checked={includedServices.visa} onCheckedChange={(c) => setIncludedServices(p => ({ ...p, visa: !!c }))} />
                      <label htmlFor="include-visa" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Visa</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-insurance" checked={includedServices.insurance} onCheckedChange={(c) => setIncludedServices(p => ({ ...p, insurance: !!c }))} />
                      <label htmlFor="include-insurance" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Travel Insurance</label>
                    </div>
                  </div>
                </div>

                {includedServices.flight && (
                  <div className="col-span-1 md:col-span-2 space-y-4 border rounded-xl p-4 bg-secondary/10 mt-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><Plane className="h-4 w-4" /> Flight Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Airline</Label><Input value={details.airline || ""} onChange={(e) => updateDetail("airline", e.target.value)} placeholder="IndiGo" /></div>
                      <div className="space-y-2"><Label>Flight Number</Label><Input value={details.flightNumber || ""} onChange={(e) => updateDetail("flightNumber", e.target.value)} placeholder="6E-123" /></div>
                      <div className="space-y-2"><Label>Departure Airport</Label><Input value={details.departureAirport || ""} onChange={(e) => updateDetail("departureAirport", e.target.value)} placeholder="DEL" /></div>
                      <div className="space-y-2"><Label>Departure Time</Label><Input type="datetime-local" value={details.departureTime || ""} onChange={(e) => updateDetail("departureTime", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Arrival Airport</Label><Input value={details.arrivalAirport || ""} onChange={(e) => updateDetail("arrivalAirport", e.target.value)} placeholder="BOM" /></div>
                      <div className="space-y-2"><Label>Arrival Time</Label><Input type="datetime-local" value={details.arrivalTime || ""} onChange={(e) => updateDetail("arrivalTime", e.target.value)} /></div>
                    </div>
                  </div>
                )}

                {includedServices.hotel && (
                  <div className="col-span-1 md:col-span-2 space-y-4 border rounded-xl p-4 bg-secondary/10 mt-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><Hotel className="h-4 w-4" /> Hotel Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Hotel Name</Label><Input value={details.hotelName || ""} onChange={(e) => updateDetail("hotelName", e.target.value)} placeholder="Taj Hotel" /></div>
                      <div className="space-y-2"><Label>City</Label><Input value={details.city || ""} onChange={(e) => updateDetail("city", e.target.value)} placeholder="Mumbai" /></div>
                      <div className="space-y-2"><Label>Check In</Label><Input type="date" value={details.checkIn || ""} onChange={(e) => updateDetail("checkIn", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Check Out</Label><Input type="date" value={details.checkOut || ""} onChange={(e) => updateDetail("checkOut", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Room Type</Label><Input value={details.roomType || ""} onChange={(e) => updateDetail("roomType", e.target.value)} placeholder="Deluxe" /></div>
                      <div className="space-y-2"><Label>Meal Plan</Label><Input value={details.mealPlan || ""} onChange={(e) => updateDetail("mealPlan", e.target.value)} placeholder="CP" /></div>
                    </div>
                  </div>
                )}

                {includedServices.taxi && (
                  <div className="col-span-1 md:col-span-2 space-y-4 border rounded-xl p-4 bg-secondary/10 mt-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><Car className="h-4 w-4" /> Taxi Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Trip Type</Label><Input value={details.tripType || ""} onChange={(e) => updateDetail("tripType", e.target.value)} placeholder="One Way / Round Trip" /></div>
                      <div className="space-y-2"><Label>Vehicle Type</Label><Input value={details.vehicleType || ""} onChange={(e) => updateDetail("vehicleType", e.target.value)} placeholder="Sedan, SUV" /></div>
                      <div className="space-y-2"><Label>Pickup Location</Label><Input value={details.pickupLocation || ""} onChange={(e) => updateDetail("pickupLocation", e.target.value)} placeholder="Airport" /></div>
                      <div className="space-y-2"><Label>Drop Location</Label><Input value={details.dropLocation || ""} onChange={(e) => updateDetail("dropLocation", e.target.value)} placeholder="Hotel" /></div>
                      <div className="space-y-2"><Label>Pickup Time</Label><Input type="datetime-local" value={details.pickupTime || ""} onChange={(e) => updateDetail("pickupTime", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Driver Name</Label><Input value={details.driverName || ""} onChange={(e) => updateDetail("driverName", e.target.value)} placeholder="John Doe" /></div>
                      <div className="space-y-2"><Label>Vehicle Number</Label><Input value={details.vehicleNumber || ""} onChange={(e) => updateDetail("vehicleNumber", e.target.value)} placeholder="MH 01 AB 1234" /></div>
                    </div>
                  </div>
                )}

                {includedServices.train && (
                  <div className="col-span-1 md:col-span-2 space-y-4 border rounded-xl p-4 bg-secondary/10 mt-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><Train className="h-4 w-4" /> Train Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Train Name/No.</Label><Input value={details.trainName || ""} onChange={(e) => updateDetail("trainName", e.target.value)} placeholder="Rajdhani Exp" /></div>
                      <div className="space-y-2"><Label>Travel Date</Label><Input type="date" value={details.travelDate || ""} onChange={(e) => updateDetail("travelDate", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Sector</Label><Input value={details.sector || ""} onChange={(e) => updateDetail("sector", e.target.value)} placeholder="DEL - MUM" /></div>
                      
                      <div className="space-y-2 col-span-1 md:col-span-2 mt-2">
                        <div className="space-y-2 mb-4">
                          <Label>Lead Passenger Name</Label>
                          <Input
                            value={details.passengerName || ""}
                            onChange={(e) => updateDetail("passengerName", e.target.value)}
                            placeholder="E.g. Romesh Kumar"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Additional Passengers</Label>
                          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => updateDetail("additionalNames", [...(Array.isArray(details.additionalNames) ? details.additionalNames : []), ""])}>
                            <Plus className="h-3 w-3 mr-1" /> Add Name
                          </Button>
                        </div>
                        {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 mt-2">
                            <Input value={name} onChange={(e) => { const n = [...(details.additionalNames as string[])]; n[index] = e.target.value; updateDetail("additionalNames", n); }} placeholder="Passenger Name" />
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-red-500 hover:bg-red-50" onClick={() => { const n = [...(details.additionalNames as string[])]; n.splice(index, 1); updateDetail("additionalNames", n); }}><X className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {includedServices.bus && (
                  <div className="col-span-1 md:col-span-2 space-y-4 border rounded-xl p-4 bg-secondary/10 mt-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><Bus className="h-4 w-4" /> Bus Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Bus Operator</Label><Input value={details.busOperator || ""} onChange={(e) => updateDetail("busOperator", e.target.value)} placeholder="Zingbus" /></div>
                      <div className="space-y-2"><Label>Travel Date</Label><Input type="date" value={details.travelDate || ""} onChange={(e) => updateDetail("travelDate", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Sector</Label><Input value={details.sector || ""} onChange={(e) => updateDetail("sector", e.target.value)} placeholder="DEL - MANALI" /></div>
                      
                      <div className="space-y-2 col-span-1 md:col-span-2 mt-2">
                        <div className="space-y-2 mb-4">
                          <Label>Lead Passenger Name</Label>
                          <Input
                            value={details.passengerName || ""}
                            onChange={(e) => updateDetail("passengerName", e.target.value)}
                            placeholder="E.g. Romesh Kumar"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Additional Passengers</Label>
                          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => updateDetail("additionalNames", [...(Array.isArray(details.additionalNames) ? details.additionalNames : []), ""])}>
                            <Plus className="h-3 w-3 mr-1" /> Add Name
                          </Button>
                        </div>
                        {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 mt-2">
                            <Input value={name} onChange={(e) => { const n = [...(details.additionalNames as string[])]; n[index] = e.target.value; updateDetail("additionalNames", n); }} placeholder="Passenger Name" />
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-red-500 hover:bg-red-50" onClick={() => { const n = [...(details.additionalNames as string[])]; n.splice(index, 1); updateDetail("additionalNames", n); }}><X className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {includedServices.visa && (
                  <div className="col-span-1 md:col-span-2 space-y-4 border rounded-xl p-4 bg-secondary/10 mt-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Visa Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Country</Label><Input value={details.country || ""} onChange={(e) => updateDetail("country", e.target.value)} placeholder="Dubai" /></div>
                      <div className="space-y-2"><Label>Visa Type</Label><Input value={details.visaType || ""} onChange={(e) => updateDetail("visaType", e.target.value)} placeholder="Tourist 30 Days" /></div>
                      <div className="space-y-2"><Label>Process Date</Label><Input type="date" value={details.processDate || ""} onChange={(e) => updateDetail("processDate", e.target.value)} /></div>
                      <div className="space-y-2"><Label>Application Status</Label><Input value={details.applicationStatus || ""} onChange={(e) => updateDetail("applicationStatus", e.target.value)} placeholder="Submitted" /></div>
                      
                      <div className="space-y-2 col-span-1 md:col-span-2 mt-2">
                        <div className="space-y-2 mb-4">
                          <Label>Lead Passenger Name</Label>
                          <Input
                            value={details.passengerName || ""}
                            onChange={(e) => updateDetail("passengerName", e.target.value)}
                            placeholder="E.g. Romesh Kumar"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Additional Passengers</Label>
                          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => updateDetail("additionalNames", [...(Array.isArray(details.additionalNames) ? details.additionalNames : []), ""])}>
                            <Plus className="h-3 w-3 mr-1" /> Add Name
                          </Button>
                        </div>
                        {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 mt-2">
                            <Input value={name} onChange={(e) => { const n = [...(details.additionalNames as string[])]; n[index] = e.target.value; updateDetail("additionalNames", n); }} placeholder="Passenger Name" />
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-red-500 hover:bg-red-50" onClick={() => { const n = [...(details.additionalNames as string[])]; n.splice(index, 1); updateDetail("additionalNames", n); }}><X className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {includedServices.insurance && (
                  <div className="col-span-1 md:col-span-2 space-y-4 border rounded-xl p-4 bg-secondary/10 mt-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Travel Insurance Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Policy Type *</Label>
                        <Select required value={details.policyType} onValueChange={(val) => updateDetail("policyType", val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Policy Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Four Wheeler">Four Wheeler</SelectItem>
                            <SelectItem value="Two Wheeler">Two Wheeler</SelectItem>
                            <SelectItem value="Health">Health</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Life">Life</SelectItem>
                            <SelectItem value="General">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Query Type</Label>
                        <Select value={details.queryType} onValueChange={(val) => updateDetail("queryType", val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Query Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Renewal">Renewal</SelectItem>
                            <SelectItem value="Portability">Portability</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Insurance Date *</Label>
                        <Input
                          type="date"
                          required
                          value={details.insuranceDate || ""}
                          onChange={(e) => updateDetail("insuranceDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input
                          type="date"
                          value={details.expiryDate || ""}
                          onChange={(e) => updateDetail("expiryDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label>Client / Company</Label>
                        <Input
                          value={details.clientCompany || ""}
                          onChange={(e) => updateDetail("clientCompany", e.target.value)}
                          placeholder="e.g. Acme Corp or Customer Name"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </>
            )}

            {getFormType(bookingType) === "Taxi" && (
              <>
                <div className="col-span-1 md:col-span-2">
                  <div className="flex p-1 bg-secondary/30 rounded-lg w-full mb-4 border">
                    <button
                      type="button"
                      onClick={() => updateDetail("taxiPricingMode", "day")}
                      className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${details.taxiPricingMode !== "km"
                        ? "bg-background shadow text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                    >
                      Day Wise Pricing
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDetail("taxiPricingMode", "km")}
                      className={`flex-1 text-sm font-semibold py-2 rounded-md transition-all ${details.taxiPricingMode === "km"
                        ? "bg-background shadow text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                    >
                      KM Wise Pricing
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Travel Date *</Label>
                  <Input
                    type="date"
                    required
                    value={details.travelDate || ""}
                    onChange={(e) => updateDetail("travelDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location / City Route *</Label>
                  <Input
                    required
                    value={details.cityRoute || ""}
                    onChange={(e) => updateDetail("cityRoute", e.target.value)}
                    placeholder="Delhi - Agra"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type *</Label>
                  <Input
                    required
                    value={details.vehicleType || ""}
                    onChange={(e) => updateDetail("vehicleType", e.target.value)}
                    placeholder="Innova Crysta"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle No.</Label>
                  <Input
                    value={details.vehicleNo || ""}
                    onChange={(e) => updateDetail("vehicleNo", e.target.value)}
                    placeholder="DL 1C AA 1111"
                  />
                </div>

                {details.taxiPricingMode !== "km" ? (
                  /* DAY WISE MODE */
                  <>
                    <div className="space-y-2">
                      <Label>Rate per Day *</Label>
                      <Input
                        type="number"
                        required
                        value={details.ratePerDay || ""}
                        onChange={(e) => updateDetail("ratePerDay", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>No. of Days  *</Label>
                      <Input
                        type="number"
                        required
                        value={details.days || ""}
                        onChange={(e) => updateDetail("days", Number(e.target.value))}
                        placeholder="3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Extra Hrs Charge </Label>
                      <Input
                        type="number"
                        value={details.extraHrsCharge || ""}
                        onChange={(e) => updateDetail("extraHrsCharge", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nights Charge </Label>
                      <Input
                        type="number"
                        value={details.nightsCharge || ""}
                        onChange={(e) => updateDetail("nightsCharge", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Driver Charge </Label>
                      <Input
                        type="number"
                        value={details.driverCharge || ""}
                        onChange={(e) => updateDetail("driverCharge", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parking Charge </Label>
                      <Input
                        type="number"
                        value={details.parkingCharge || ""}
                        onChange={(e) => updateDetail("parkingCharge", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Charges </Label>
                      <Input
                        type="number"
                        value={details.otherCharges || ""}
                        onChange={(e) => updateDetail("otherCharges", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                      <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider">
                        Pricing Estimate
                      </h3>
                      <div className="space-y-3">
                        <div className="border-t border-border pt-4 mt-2 space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                            <span>Base Rate ({details.ratePerDay || 0} × {details.days || 0} days):</span>
                            <span>₹ {(details.ratePerDay || 0) * (details.days || 0)}</span>
                          </div>
                          {(details.extraHrsCharge || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Extra Hrs Charge:</span>
                              <span>₹ {details.extraHrsCharge}</span>
                            </div>
                          )}
                          {(details.nightsCharge || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Nights Charge:</span>
                              <span>₹ {details.nightsCharge}</span>
                            </div>
                          )}
                          {(details.driverCharge || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Driver Charge:</span>
                              <span>₹ {details.driverCharge}</span>
                            </div>
                          )}
                          {(details.parkingCharge || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Parking Charge:</span>
                              <span>₹ {details.parkingCharge}</span>
                            </div>
                          )}
                          {(details.otherCharges || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Other Charges:</span>
                              <span>₹ {details.otherCharges}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-border pt-3 font-display font-bold text-lg text-primary">
                            <span>Total Cost:</span>
                            <span>₹ {((details.ratePerDay || 0) * (details.days || 0)) + (details.extraHrsCharge || 0) + (details.nightsCharge || 0) + (details.driverCharge || 0) + (details.parkingCharge || 0) + (details.otherCharges || 0)}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          className="w-full mt-4"
                          onClick={() => {
                            const total = ((details.ratePerDay || 0) * (details.days || 0)) + (details.extraHrsCharge || 0) + (details.nightsCharge || 0) + (details.driverCharge || 0) + (details.parkingCharge || 0) + (details.otherCharges || 0);
                            setSellingPrice(total);
                          }}
                        >
                          Apply to Total Amount
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* KM WISE MODE */
                  <>
                    <div className="space-y-2">
                      <Label>Rate per KM  *</Label>
                      <Input
                        type="number"
                        required
                        value={details.ratePerKm || ""}
                        onChange={(e) => updateDetail("ratePerKm", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total KM  *</Label>
                      <Input
                        type="number"
                        required
                        value={details.totalKm || ""}
                        onChange={(e) => updateDetail("totalKm", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Night Charge </Label>
                      <Input
                        type="number"
                        value={details.nightChargeKm || ""}
                        onChange={(e) => updateDetail("nightChargeKm", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Driver Charge </Label>
                      <Input
                        type="number"
                        value={details.driverChargeKm || ""}
                        onChange={(e) => updateDetail("driverChargeKm", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parking Charge </Label>
                      <Input
                        type="number"
                        value={details.parkingChargeKm || ""}
                        onChange={(e) => updateDetail("parkingChargeKm", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Toll Tax </Label>
                      <Input
                        type="number"
                        value={details.tollTaxKm || ""}
                        onChange={(e) => updateDetail("tollTaxKm", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Charges </Label>
                      <Input
                        type="number"
                        value={details.otherChargesKm || ""}
                        onChange={(e) => updateDetail("otherChargesKm", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                      <h3 className="font-display font-bold text-sm text-primary uppercase tracking-wider">
                        Pricing Estimate
                      </h3>
                      <div className="space-y-3">
                        <div className="border-t border-border pt-4 mt-2 space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                            <span>Base Rate ({details.ratePerKm || 0} × {details.totalKm || 0} km):</span>
                            <span>₹ {(details.ratePerKm || 0) * (details.totalKm || 0)}</span>
                          </div>
                          {(details.nightChargeKm || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Night Charge:</span>
                              <span>₹ {details.nightChargeKm}</span>
                            </div>
                          )}
                          {(details.driverChargeKm || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Driver Charge:</span>
                              <span>₹ {details.driverChargeKm}</span>
                            </div>
                          )}
                          {(details.parkingChargeKm || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Parking Charge:</span>
                              <span>₹ {details.parkingChargeKm}</span>
                            </div>
                          )}
                          {(details.tollTaxKm || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Toll Tax:</span>
                              <span>₹ {details.tollTaxKm}</span>
                            </div>
                          )}
                          {(details.otherChargesKm || 0) > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                              <span>Other Charges:</span>
                              <span>₹ {details.otherChargesKm}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-border pt-3 font-display font-bold text-lg text-primary">
                            <span>Total Cost:</span>
                            <span>₹ {((details.ratePerKm || 0) * (details.totalKm || 0)) + (details.nightChargeKm || 0) + (details.driverChargeKm || 0) + (details.parkingChargeKm || 0) + (details.tollTaxKm || 0) + (details.otherChargesKm || 0)}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          className="w-full mt-4"
                          onClick={() => {
                            const total = ((details.ratePerKm || 0) * (details.totalKm || 0)) + (details.nightChargeKm || 0) + (details.driverChargeKm || 0) + (details.parkingChargeKm || 0) + (details.tollTaxKm || 0) + (details.otherChargesKm || 0);
                            setSellingPrice(total);
                          }}
                        >
                          Apply to Total Amount
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {getFormType(bookingType) === "Visa" && (
              <>
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Input
                    required
                    value={details.country || ""}
                    onChange={(e) => updateDetail("country", e.target.value)}
                    placeholder="Dubai"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visa Type *</Label>
                  <Input
                    required
                    value={details.visaType || ""}
                    onChange={(e) => updateDetail("visaType", e.target.value)}
                    placeholder="Tourist 30 Days"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Process Date *</Label>
                  <Input
                    type="date"
                    required
                    value={details.processDate || ""}
                    onChange={(e) => updateDetail("processDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Application Status</Label>
                  <Input
                    value={details.applicationStatus || ""}
                    onChange={(e) => updateDetail("applicationStatus", e.target.value)}
                    placeholder="Submitted"
                  />
                </div>
                
                <div className="space-y-2 ">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {getFormType(bookingType) === "Travel Insurance" && (
              <div className="col-span-1 md:col-span-2 border rounded-xl p-6 bg-secondary/5 space-y-6">
                <h4 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">Trip Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Policy Type *</Label>
                    <Select required value={details.policyType} onValueChange={(val) => updateDetail("policyType", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Policy Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Trip">Single Trip</SelectItem>
                        <SelectItem value="Multi Trip">Multi Trip</SelectItem>
                        <SelectItem value="Student Travel">Student Travel</SelectItem>
                        <SelectItem value="Senior Citizen">Senior Citizen</SelectItem>
                        <SelectItem value="Family Travel">Family Travel</SelectItem>
                        <SelectItem value="Corporate Travel">Corporate Travel</SelectItem>
                        <SelectItem value="Domestic">Domestic</SelectItem>
                        <SelectItem value="International">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Query Type</Label>
                    <Select value={details.queryType} onValueChange={(val) => updateDetail("queryType", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Query Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Renewal">Renewal</SelectItem>
                        <SelectItem value="Portability">Portability</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Date *</Label>
                    <Input
                      type="date"
                      required
                      value={details.insuranceDate || ""}
                      onChange={(e) => updateDetail("insuranceDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={details.expiryDate || ""}
                      onChange={(e) => updateDetail("expiryDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label>Client / Company</Label>
                    <Input
                      value={details.clientCompany || ""}
                      onChange={(e) => updateDetail("clientCompany", e.target.value)}
                      placeholder="e.g. Acme Corp or Customer Name"
                    />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <div className="space-y-2 mb-4">
                      <Label>Lead Passenger Name</Label>
                      <Input
                        value={details.passengerName || ""}
                        onChange={(e) => updateDetail("passengerName", e.target.value)}
                        placeholder="E.g. Romesh Kumar"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Additional Passenger Names</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                          updateDetail("additionalNames", [...current, ""]);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Name
                      </Button>
                    </div>
                    {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 mt-2">
                        <Input
                          value={name}
                          onChange={(e) => {
                            const newNames = [...(details.additionalNames as string[])];
                            newNames[index] = e.target.value;
                            updateDetail("additionalNames", newNames);
                          }}
                          placeholder="Passenger Name"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newNames = (details.additionalNames as string[]).filter((_, i) => i !== index);
                            updateDetail("additionalNames", newNames);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {getFormType(bookingType) === "Bus Ticket" && (
              <>
                <div className="space-y-2">
                  <Label>Travel Date *</Label>
                  <Input
                    type="date"
                    required
                    value={details.travelDate || ""}
                    onChange={(e) => updateDetail("travelDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sector *</Label>
                  <Input
                    required
                    value={details.sector || ""}
                    onChange={(e) => updateDetail("sector", e.target.value)}
                    placeholder="DEL - MANALI"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bus Operator *</Label>
                  <Input
                    required
                    value={details.busOperator || ""}
                    onChange={(e) => updateDetail("busOperator", e.target.value)}
                    placeholder="Zingbus"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PNR / Ticket No.</Label>
                  <Input
                    value={details.pnr || ""}
                    onChange={(e) => updateDetail("pnr", e.target.value)}
                    placeholder="TKT123"
                  />
                </div>
                
                <div className="space-y-2 ">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {getFormType(bookingType) === "Cruise" && (
              <>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Cruise Destination *</Label>
                  <Input
                    required
                    value={details.cruiseDestination || ""}
                    onChange={(e) => updateDetail("cruiseDestination", e.target.value)}
                    placeholder="e.g. Dubai"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    required
                    value={details.cruiseDate || ""}
                    onChange={(e) => updateDetail("cruiseDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Travellers</Label>
                  <Input
                    type="number"
                    min="1"
                    value={details.travellers || ""}
                    onChange={(e) => updateDetail("travellers", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {getFormType(bookingType) === "Assistance" && (
              <>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Applicant Location *</Label>
                  <Input
                    required
                    value={details.applicantLocation || ""}
                    onChange={(e) => updateDetail("applicantLocation", e.target.value)}
                    placeholder="e.g. Dubai"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    required
                    value={details.assistanceDate || ""}
                    onChange={(e) => updateDetail("assistanceDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Travellers</Label>
                  <Input
                    type="number"
                    min="1"
                    value={details.travellers || ""}
                    onChange={(e) => updateDetail("travellers", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {getFormType(bookingType) === "Forex" && (
              <>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Currency / Destination *</Label>
                  <Input
                    required
                    value={details.currencyDestination || ""}
                    onChange={(e) => updateDetail("currencyDestination", e.target.value)}
                    placeholder="e.g. USD / Dubai"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    required
                    value={details.forexDate || ""}
                    onChange={(e) => updateDetail("forexDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Travellers</Label>
                  <Input
                    type="number"
                    min="1"
                    value={details.travellers || ""}
                    onChange={(e) => updateDetail("travellers", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {getFormType(bookingType) === "Corporate" && (
              <>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Company Name *</Label>
                  <Input
                    required
                    value={details.companyName || ""}
                    onChange={(e) => updateDetail("companyName", e.target.value)}
                    placeholder="e.g. TCS, Infosys..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event / Trip Type</Label>
                  <Input
                    value={details.tripType || ""}
                    onChange={(e) => updateDetail("tripType", e.target.value)}
                    placeholder="e.g. Annual Meet, Team Outing..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    value={details.corporateDestination || ""}
                    onChange={(e) => updateDetail("corporateDestination", e.target.value)}
                    placeholder="e.g. Goa, Singapore..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    required
                    value={details.corporateDate || ""}
                    onChange={(e) => updateDetail("corporateDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pax</Label>
                  <Input
                    type="number"
                    min="1"
                    value={details.pax || ""}
                    onChange={(e) => updateDetail("pax", parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <div className="space-y-2 mb-4">
                    <Label>Lead Passenger Name</Label>
                    <Input
                      value={details.passengerName || ""}
                      onChange={(e) => updateDetail("passengerName", e.target.value)}
                      placeholder="E.g. Romesh Kumar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Additional Passenger Names</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const current = Array.isArray(details.additionalNames) ? details.additionalNames : [];
                        updateDetail("additionalNames", [...current, ""]);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Name
                    </Button>
                  </div>
                  {(Array.isArray(details.additionalNames) ? details.additionalNames : []).map((name: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 mt-2">
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames[index] = e.target.value;
                          updateDetail("additionalNames", newNames);
                        }}
                        placeholder="Passenger Name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const newNames = [...(details.additionalNames as string[])];
                          newNames.splice(index, 1);
                          updateDetail("additionalNames", newNames);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {renderSectionHeader("Financial Details")}

            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Selling Price (₹)</Label>
                <Input
                  type="number"
                  required
                  value={sellingPrice || ""}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Purchase Price (₹)</Label>
                <Input
                  type="number"
                  required
                  value={purchasePrice || ""}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between w-full h-full rounded-xl bg-secondary/30 p-4 border border-border">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Profit</p>
                  <p className={`font-mono font-bold ${profit > 0 ? "text-emerald-600" : profit < 0 ? "text-red-500" : "text-gray-700"}`}>
                    ₹{profit.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Margin %</p>
                  <p className={`font-mono font-bold ${margin > 0 ? "text-emerald-600" : margin < 0 ? "text-red-500" : "text-gray-700"}`}>
                    {margin}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Pending Amount</p>
                  <p className="font-mono font-bold text-orange-600">
                    ₹{pendingAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2 col-span-full">
                <Label>Bank Details</Label>
                <Textarea
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  placeholder="Account Number, IFSC Code, Bank Name, etc."
                  className="rounded-xl min-h-[80px]"
                />
              </div>
            </div>


            {renderSectionHeader("Attachments & Remarks")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-full">
              <div className="space-y-3">
                <p className="text-sm font-medium">Attachments</p>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between p-3 border rounded-xl bg-card relative overflow-hidden group">
                    <span className="text-sm font-medium z-10">1. Ticket / Voucher</span>
                    <input 
                      type="file" 
                      title=""
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      onChange={(e) => setTicketFileName(e.target.files?.[0]?.name || null)} 
                    />
                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-full shadow-sm text-xs border-dashed border-2 group-hover:bg-accent z-10 pointer-events-none">
                      <Paperclip className="w-3.5 h-3.5 mr-1" /> {ticketFileName ? 'Change File' : 'Upload File'}
                    </Button>
                  </div>
                  {ticketFileName && <p className="text-xs text-muted-foreground px-2 truncate max-w-full">Uploaded: {ticketFileName}</p>}
                </div>
                
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between p-3 border rounded-xl bg-card relative overflow-hidden group">
                    <span className="text-sm font-medium z-10">2. Passport / ID Copy</span>
                    <input 
                      type="file" 
                      title=""
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      onChange={(e) => setPassportFileName(e.target.files?.[0]?.name || null)} 
                    />
                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-full shadow-sm text-xs border-dashed border-2 group-hover:bg-accent z-10 pointer-events-none">
                      <Paperclip className="w-3.5 h-3.5 mr-1" /> {passportFileName ? 'Change File' : 'Upload File'}
                    </Button>
                  </div>
                  {passportFileName && <p className="text-xs text-muted-foreground px-2 truncate max-w-full">Uploaded: {passportFileName}</p>}
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between p-3 border rounded-xl bg-card relative overflow-hidden group">
                    <span className="text-sm font-medium z-10">3. Other Document</span>
                    <input 
                      type="file" 
                      title=""
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      onChange={(e) => setOtherFileName(e.target.files?.[0]?.name || null)} 
                    />
                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-full shadow-sm text-xs border-dashed border-2 group-hover:bg-accent z-10 pointer-events-none">
                      <Paperclip className="w-3.5 h-3.5 mr-1" /> {otherFileName ? 'Change File' : 'Upload File'}
                    </Button>
                  </div>
                  {otherFileName && <p className="text-xs text-muted-foreground px-2 truncate max-w-full">Uploaded: {otherFileName}</p>}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Remark</p>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any remarks or notes..."
                  className="min-h-[160px] resize-none bg-card rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-card border-t border-border p-4 -mx-6 -mb-6 mt-6 flex justify-end gap-3 z-10">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="shadow-md border-0 text-white"
              style={{ background: "var(--gradient-brand, var(--color-brand, #0f172a))" }}
            >
              Save Booking
            </Button>
          </div>
          </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
