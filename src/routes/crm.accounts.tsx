import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, PhoneCall, AlertCircle, TrendingDown, Wallet, Trash2, Check, ChevronsUpDown, Pencil, ChevronDown, MoreVertical, CheckCircle2, Building2, ArrowUpDown, Download, Clock, Eye, FileText, Table2, Briefcase } from "lucide-react";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { formatINR, type Expense, type PaymentFollowUp, type PaymentRequest, initialPaymentRequests } from "@/lib/mock-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function EntityCombobox({
  entityType,
  value,
  onChange,
  customers,
  vendors,
  employees
}: {
  entityType: string;
  value: string;
  onChange: (val: string) => void;
  customers: any[];
  vendors: any[];
  employees: any[];
}) {
  const [open, setOpen] = useState(false);

  let items: any[] = [];
  if (entityType === "Customer") items = customers || [];
  if (entityType === "Vendor") items = vendors || [];
  if (entityType === "Employee") items = employees || [];

  const displayItems = items.map(item => {
    const rawName = item.name || "";
    const nameParts = rawName.split('---META---');
    const name = nameParts[0] || item.id || `Unknown ${entityType}`;
    const phone = nameParts[1] || item.phone || "";
    const email = item.email || "";

    return {
      value: item.id,
      label: name,
      phone,
      email
    };
  });

  const selectedItem = displayItems.find(item => item.value === value);

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
            {selectedItem ? selectedItem.label : `Select a ${entityType?.toLowerCase() || 'entity'}`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${entityType?.toLowerCase() || 'entity'}...`} />
          <CommandList>
            <CommandEmpty>No {entityType?.toLowerCase() || 'entity'} found.</CommandEmpty>
            <CommandGroup>
              {displayItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.label}___${item.value}___${item.phone}___${item.email}`}
                  onSelect={() => {
                    onChange(item.value || "");
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
                    {(item.phone || item.email) && (
                      <span className="text-xs text-muted-foreground truncate">
                        {item.phone} {item.phone && item.email ? '•' : ''} {item.email}
                      </span>
                    )}
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

export function BookingCombobox({
  bookings,
  value,
  onChange
}: {
  bookings: any[];
  value: string;
  onChange: (val: string, booking: any) => void;
}) {
  const [open, setOpen] = useState(false);

  const displayItems = (bookings || []).map(b => {
    const isVendor = !!b.supplier;
    const entityName = b.customer || b.supplier || "Unknown Entity";
    const invoiceNo = b.saleInvoiceNo || b.purchaseInvoiceNo || b.id || "N/A";
    const label = `${invoiceNo} - ${String(entityName).split('---META---')[0]}`;

    return {
      value: String(b.id),
      invoiceNo: String(invoiceNo),
      label,
      entityName,
      bookingId: String(b.id),
      original: b
    };
  });

  const selectedItem = displayItems.find(item => item.value === value || item.invoiceNo === value);

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
            {selectedItem ? selectedItem.label : "Search by name, invoice, or ID..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search bookings..." />
          <CommandList>
            <CommandEmpty>No bookings found.</CommandEmpty>
            <CommandGroup>
              {displayItems.map((item) => (
                <CommandItem
                  key={item.bookingId}
                  value={`${item.label}___${item.bookingId}___${item.invoiceNo}`}
                  onSelect={() => {
                    onChange(item.invoiceNo, item.original);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      (value === item.value || value === item.invoiceNo) ? "opacity-100" : "opacity-0"
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

export const Route = createFileRoute("/crm/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  const auth = getAuth();
  const isAdmin = (auth?.role === "admin" || auth?.role === "manager") && !auth?.name.toLowerCase().includes("suman");
  const isManagement = auth?.name?.toLowerCase().includes("deepak") || auth?.name?.toLowerCase().includes("pushp");
  const canViewExpenses = auth?.role === "admin" || auth?.name?.toLowerCase().includes("suman") || auth?.name?.toLowerCase().includes("aman");
  const [activeTab, setActiveTab] = useState(isManagement ? "payments-approval" : canViewExpenses ? "expenses" : "follow-ups");

  // Entities for Receipts & Payments
  const [customers] = useSupabaseTable<any[]>("customers", []);
  const [vendors] = useSupabaseTable<any[]>("vendors", []);
  const [employees] = useSupabaseTable<any[]>("employees", []);
  const [bookings, setBookings] = useSupabaseTable<any[]>("bookings", []);
  const [leads] = useSupabaseTable<any[]>("leads", []);
  const [tasks] = useSupabaseTable<any[]>("tasks", []);
  const [insurancePolicies] = useSupabaseTable<any[]>("insurance_policies", []);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [customerStatusDateFrom, setCustomerStatusDateFrom] = useState("");
  const [customerStatusDateTo, setCustomerStatusDateTo] = useState("");
  const [vendorStatusDateFrom, setVendorStatusDateFrom] = useState("");
  const [vendorStatusDateTo, setVendorStatusDateTo] = useState("");
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");
  const [expenseDateFrom, setExpenseDateFrom] = useState("");
  const [expenseDateTo, setExpenseDateTo] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Transactions State
  const [transactions, setTransactions] = useSupabaseTable<any[]>("transactions", []);
  const [txSearchQuery, setTxSearchQuery] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("All");
  const [txDateFrom, setTxDateFrom] = useState("");
  const [txDateTo, setTxDateTo] = useState("");
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [invoiceMatchStatusTx, setInvoiceMatchStatusTx] = useState<"found" | "not_found" | null>(null);
  const [newTx, setNewTx] = useState({
    type: "Receipt",
    entityType: "Customer",
    entityId: "",
    invoiceId: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMode: "Bank Transfer",
    notes: "",
    company: ""
  });

  // Expenses State
  const [expenseList, setExpenseList] = useSupabaseTable<Expense[]>("expenses", []);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split("T")[0],
    category: "",
    amount: 0,
    paymentMode: "UPI",
    reference: "",
    description: "",
    status: "Paid",
  });
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Partial<Expense> | null>(null);
  // Follow-up Note State
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteType, setNoteType] = useState<"Paid" | "Unpaid" | "Partial" | "Advance" | "Full" | "">("");
  const [noteContent, setNoteContent] = useState("");
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    entityType: "Customer",
    entityId: "",
    invoiceId: "",
    pendingAmount: "",
    followUpDate: "",
    remark: ""
  });
  const [isLogFollowUpOpen, setIsLogFollowUpOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: "Expense" | "Follow-up" | "Transaction" | "PaymentRequest" } | null>(null);
  const [invoiceMatchStatus, setInvoiceMatchStatus] = useState<"typing" | "found" | "not_found" | null>(null);
  const [followUpsList, setFollowUpsList] = useSupabaseTable<PaymentFollowUp[]>("payment_followups", []);
  const [selectedFuId, setSelectedFuId] = useState<string | null>(null);
  const [logNotes, setLogNotes] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logStatus, setLogStatus] = useState("");

  // Payment Approvals State
  const [paymentRequests, setPaymentRequests] = useSupabaseTable<PaymentRequest[]>("payment_requests", initialPaymentRequests);
  const [isAddPaymentRequestOpen, setIsAddPaymentRequestOpen] = useState(false);
  const [newPaymentRequest, setNewPaymentRequest] = useState<Partial<PaymentRequest>>({
    date: new Date().toISOString().split('T')[0],
    entityType: "Vendor",
    entityId: "",
    amount: 0,
    status: "Pending Approval",
    remark: "",
    invoiceId: "",
  });

  const allBookings = useMemo(() => {
    return bookings.map(b => ({
      ...b,
      paid: b.paid || 0
    }));
  }, [bookings, transactions]);

  // Advanced Payment Approvals UI State
  const [activePaymentTab, setActivePaymentTab] = useState("unpaid");

  const [isActionPopupOpen, setIsActionPopupOpen] = useState(false);
  const [actionPopupType, setActionPopupType] = useState<PaymentRequest["status"] | "">("");
  const [actionPopupReqId, setActionPopupReqId] = useState<string | null>(null);
  const [actionPopupRemark, setActionPopupRemark] = useState("");

  const [isHistoryViewerOpen, setIsHistoryViewerOpen] = useState(false);
  const [historyReqId, setHistoryReqId] = useState<string | null>(null);

  const [isReceiptViewerOpen, setIsReceiptViewerOpen] = useState(false);
  const [receiptReqId, setReceiptReqId] = useState<string | null>(null);

  // Toast Notification Mock (Since we don't have a real toast system imported)
  const [toastMessage, setToastMessage] = useState<{ title: string, desc: string } | null>(null);
  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredExpenseList = useMemo(() => {
    return expenseList.filter(e => {
      const matchesSearch = expenseSearchQuery === "" ||
        (e.description && e.description.toLowerCase().includes(expenseSearchQuery.toLowerCase())) ||
        (e.category && e.category.toLowerCase().includes(expenseSearchQuery.toLowerCase()));
      const matchesDateFrom = expenseDateFrom === "" || (e.date && e.date >= expenseDateFrom);
      const matchesDateTo = expenseDateTo === "" || (e.date && e.date <= expenseDateTo);
      return matchesSearch && matchesDateFrom && matchesDateTo;
    }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [expenseList, expenseSearchQuery, expenseDateFrom, expenseDateTo]);

  const totalExpenses = filteredExpenseList.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingExpenses = filteredExpenseList.filter(e => e.status === "Pending").reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleSaveExpense = () => {
    if (!newExpense.amount || !newExpense.category) return;

    const exp: Expense = {
      id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
      date: newExpense.date || new Date().toISOString().split("T")[0],
      category: newExpense.category,
      amount: newExpense.amount,
      paymentMode: newExpense.paymentMode || "Cash",
      reference: newExpense.reference || "",
      description: newExpense.description || "",
      status: newExpense.status as any || "Paid",
      createdBy: auth?.name || "Unknown",
    };

    setExpenseList([exp, ...expenseList]);
    setIsAddExpenseOpen(false);
    setNewExpense({
      date: new Date().toISOString().split("T")[0],
      category: "",
      amount: 0,
      paymentMode: "UPI",
      reference: "",
      description: "",
      status: "Paid",
    });
  };

  const handleSaveLog = () => {
    if (selectedFuId) {
      setFollowUpsList(prev =>
        prev.map(f => f.id === selectedFuId
          ? {
            ...f,
            notes: logNotes || f.notes,
            nextFollowUpDate: logDate || f.nextFollowUpDate,
            outcomeLog: logStatus
              ? [...(f.outcomeLog || []), { status: logStatus, date: new Date().toISOString(), by: auth?.name || "Unknown" }]
              : f.outcomeLog || []
          }
          : f
        )
      );
    }
    setIsLogFollowUpOpen(false);
    setLogNotes("");
    setLogDate("");
    setLogStatus("");
    setSelectedFuId(null);
  };

  const handleDelete = (id: string, type: "Expense" | "Follow-up" | "Transaction" | "PaymentRequest") => {
    setDeleteTarget({ id, type });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "Expense") {
      setExpenseList(prev => prev.filter(e => e.id !== deleteTarget.id));
    } else if (deleteTarget.type === "Follow-up") {
      setFollowUpsList(prev => prev.filter(f => f.id !== deleteTarget.id));
    } else if (deleteTarget.type === "Transaction") {
      const txToDelete = transactions.find(t => t.id === deleteTarget.id);

      if (txToDelete && txToDelete.invoiceId && txToDelete.amount > 0) {
        const targetBooking = bookings.find(b =>
          String(b.id).toLowerCase() === String(txToDelete.invoiceId).toLowerCase() ||
          String(b.saleInvoiceNo || "").toLowerCase() === String(txToDelete.invoiceId).toLowerCase() ||
          String(b.purchaseInvoiceNo || "").toLowerCase() === String(txToDelete.invoiceId).toLowerCase()
        );

        if (targetBooking) {
          const currentPaid = targetBooking.paid || 0;
          const newPaid = Math.max(0, currentPaid - txToDelete.amount);

          let newPaymentStatus = targetBooking.paymentStatus;
          if (txToDelete.type === "Receipt") {
            const totalAmount = targetBooking.amount || 0;
            if (newPaid === 0) {
              newPaymentStatus = "Pending";
            } else if (newPaid < totalAmount) {
              newPaymentStatus = "Partially Paid";
            } else {
              newPaymentStatus = "Paid / Completed";
            }
          }

          const updatedBooking = {
            ...targetBooking,
            paid: newPaid,
            paymentStatus: newPaymentStatus
          };

          setBookings(bookings.map(b => b.id === targetBooking.id ? updatedBooking : b));

          // Async update to DB
          (async () => {
            try {
              await supabase.from("bookings").update({
                paid: newPaid,
                paymentStatus: newPaymentStatus
              }).eq("id", targetBooking.id);
            } catch (err) {
              console.error("Failed to update status on delete:", err);
            }
          })();
        }
      }

      setTransactions(prev => prev.filter(t => t.id !== deleteTarget.id));
    } else if (deleteTarget.type === "PaymentRequest") {
      setPaymentRequests(prev => prev.filter(r => r.id !== deleteTarget.id));
    }
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleCreateFollowUp = () => {
    if (!newFollowUp.entityId) return;

    const isCust = newFollowUp.entityType === "Customer";
    const entity = isCust
      ? customers.find(c => c.id === newFollowUp.entityId)
      : vendors.find(v => v.id === newFollowUp.entityId);

    const entityName = entity ? (entity.name ? entity.name.split('---META---')[0] : entity.id) : "Unknown";
    const entityPhone = entity ? (entity.phone || entity.mobile || "N/A") : "N/A";

    const newFu = {
      id: `PFU-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceId: newFollowUp.invoiceId || "INV-NEW",
      customerId: newFollowUp.entityId,
      customerName: String(entityName),
      customerPhone: String(entityPhone),
      invoiceDate: new Date().toISOString().split('T')[0],
      totalAmount: Number(newFollowUp.pendingAmount) || 0,
      pendingAmount: Number(newFollowUp.pendingAmount) || 0,
      nextFollowUpDate: newFollowUp.followUpDate || new Date().toISOString().split('T')[0],
      nextFollowUpTime: "10:00",
      repeat: "None" as const,
      notificationReminder: 1,
      notes: newFollowUp.remark || "New follow-up created",
      createdBy: auth?.name || "Unknown",
    };

    setFollowUpsList([newFu, ...followUpsList]);
    setIsAddFollowUpOpen(false);
    setNewFollowUp({
      entityType: "Customer",
      entityId: "",
      invoiceId: "",
      pendingAmount: "",
      followUpDate: "",
      remark: ""
    });
  };

  const handleCreatePaymentRequest = () => {
    if (!newPaymentRequest.entityId || !newPaymentRequest.amount) return;

    let entityName = "Unknown";
    if (newPaymentRequest.entityType === "Customer") {
      const c = customers.find(x => x.id === newPaymentRequest.entityId);
      if (c) entityName = c.name?.split('---META---')[0] || c.id;
    } else if (newPaymentRequest.entityType === "Vendor") {
      const v = vendors.find(x => x.id === newPaymentRequest.entityId);
      if (v) entityName = v.name?.split('---META---')[0] || v.id;
    } else if (newPaymentRequest.entityType === "Employee") {
      const e = employees.find(x => x.id === newPaymentRequest.entityId);
      if (e) entityName = e.name || e.id;
    }

    const newReq: PaymentRequest = {
      id: `PRQ-${Math.floor(1000 + Math.random() * 9000)}`,
      date: newPaymentRequest.date || new Date().toISOString().split('T')[0],
      employeeId: auth?.empId || "EMP-001",
      employeeName: auth?.name || "Current User",
      invoiceId: newPaymentRequest.invoiceId || "",
      entityType: newPaymentRequest.entityType as any,
      entityId: newPaymentRequest.entityId,
      entityName,
      amount: Number(newPaymentRequest.amount) || 0,
      status: "Pending Approval",
      remark: newPaymentRequest.remark,
      auditLog: [{
        timestamp: new Date().toISOString(),
        action: "Created Request",
        user: auth?.name || "Current User",
        remark: newPaymentRequest.remark
      }]
    };

    setPaymentRequests([newReq, ...paymentRequests]);
    setIsAddPaymentRequestOpen(false);
    setNewPaymentRequest({
      date: new Date().toISOString().split('T')[0],
      entityType: "Vendor",
      entityId: "",
      amount: 0,
      status: "Pending Approval",
      remark: "",
      invoiceId: "",
    });
  };

  const openActionPopup = (reqId: string, type: PaymentRequest["status"]) => {
    setActionPopupReqId(reqId);
    setActionPopupType(type);
    setActionPopupRemark("");
    setIsActionPopupOpen(true);
  };

  const handleActionPopupSubmit = () => {
    if (!actionPopupReqId || !actionPopupType) return;

    setPaymentRequests(prev => prev.map(req => {
      if (req.id !== actionPopupReqId) return req;

      let actionDesc: string = actionPopupType;
      if (actionPopupType === "Accounts Verified") actionDesc = "Verified by Accounts";

      const newAuditLog = [...req.auditLog, {
        timestamp: new Date().toISOString(),
        action: actionDesc,
        user: auth?.name || "Current User",
        remark: actionPopupRemark
      }];

      if (actionPopupType === "Paid") {
        const newTx = {
          id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
          date: new Date().toISOString().split('T')[0],
          type: "Payment",
          entityType: req.entityType,
          entityId: req.entityId,
          entityName: req.entityName,
          amount: req.amount,
          paymentMode: "Bank Transfer",
          reference: `Auto-generated for PRQ ${req.id}`,
          status: "Completed",
          invoiceId: req.invoiceId,
          createdBy: auth?.name || "Unknown",
        };
        setTransactions([newTx, ...transactions]);
        showToast("Payment Marked as Paid", `Receipt ${newTx.id} generated successfully.`);
        return { ...req, status: actionPopupType, receiptId: newTx.id, auditLog: newAuditLog };
      }

      showToast("Status Updated", `Request marked as ${actionPopupType}`);
      return { ...req, status: actionPopupType, auditLog: newAuditLog };
    }));

    setIsActionPopupOpen(false);
    setActionPopupReqId(null);
    setActionPopupRemark("");
  };

  const filteredTransactions = [...transactions]
    .filter((tx) => {
      const matchesSearch = txSearchQuery === "" ||
        tx.entityName?.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        tx.id?.toLowerCase().includes(txSearchQuery.toLowerCase());
      const matchesType = txTypeFilter === "All" || tx.type === txTypeFilter;
      const isBooking = !tx.module || tx.module !== "Insurance";
      const matchesFrom = !txDateFrom || (tx.date && tx.date >= txDateFrom);
      const matchesTo = !txDateTo || (tx.date && tx.date <= txDateTo);
      return matchesSearch && matchesType && isBooking && matchesFrom && matchesTo;
    })
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const customerDataList = useMemo(() => {
    const customerNameMap = new Map<string, string>();
    const addName = (name: string) => {
      if (!name) return;
      const trimmed = name.trim();
      const lower = trimmed.toLowerCase();
      if (!customerNameMap.has(lower)) {
        customerNameMap.set(lower, trimmed);
      }
    };

    customers.forEach(c => c.name && addName(c.name));
    leads.forEach(l => {
      if (l.name) addName(l.name);
      if (l.customer) addName(l.customer);
    });
    allBookings.forEach(b => {
      if (b.customer) addName(b.customer);
    });
    tasks.forEach(t => {
      if (t.customer_id) addName(t.customer_id);
      if (t.lead) addName(t.lead);
    });
    transactions.forEach(tx => {
      if (tx.entityType === "Customer") {
        const c = customers.find(c => c.id === tx.entityId);
        if (c && c.name) addName(c.name);
      }
    });
    followUpsList.forEach(fu => {
      if (fu.customerName) addName(fu.customerName);
    });

    return Array.from(customerNameMap.values())
      .filter(Boolean)
      .filter(name => name.toLowerCase().includes(customerSearchQuery.toLowerCase()))
      .map((customerName, index) => {
        const customerData = customers.find(c => c.name === customerName) || { id: `synth-${index}`, name: customerName };
        const normalizedCustomerName = (customerName || "").trim().toLowerCase();

        const cBookings = allBookings.filter(b => {
          if ((b.customer || "").trim().toLowerCase() !== normalizedCustomerName) return false;
          if (customerStatusDateFrom && b.bookingDate && b.bookingDate < customerStatusDateFrom) return false;
          if (customerStatusDateTo && b.bookingDate && b.bookingDate > customerStatusDateTo) return false;
          return true;
        });
        const cPolicies = insurancePolicies.filter(p => {
          if ((p.customerName || "").trim().toLowerCase() !== normalizedCustomerName) return false;
          if (customerStatusDateFrom && p.issueDate && p.issueDate < customerStatusDateFrom) return false;
          if (customerStatusDateTo && p.issueDate && p.issueDate > customerStatusDateTo) return false;
          return true;
        });

        let cTotalRevenue = cBookings.reduce((sum, b) => sum + (Number(b.sellingPrice) || Number(b.amount) || 0), 0);
        let cReceivedAmount = cBookings.reduce((sum, b) => sum + (Number(b.paid) || 0), 0);

        cTotalRevenue += cPolicies.reduce((sum, p) => sum + (Number(p.premiumAmount) || 0), 0);
        const policyIds = cPolicies.map(p => String(p.id));
        const bookingIds = cBookings.map(b => String(b.id));

        const cOtherTxs = transactions.filter(tx => {
          if (tx.type !== "Receipt" || tx.entityType !== "Customer") return false;
          
          // Must belong to this customer either by entityId, entityName, or by matching a policy they own
          const belongsToCustomer = 
            tx.entityId === customerData.id || 
            tx.entityName === customerName ||
            (tx.invoiceId && policyIds.includes(String(tx.invoiceId)));
            
          if (!belongsToCustomer) return false;

          if (customerStatusDateFrom && tx.date && tx.date < customerStatusDateFrom) return false;
          if (customerStatusDateTo && tx.date && tx.date > customerStatusDateTo) return false;

          // Skip receipts linked to bookings since b.paid already includes them
          if (tx.invoiceId && bookingIds.includes(String(tx.invoiceId))) return false;

          return true;
        });
        
        cReceivedAmount += cOtherTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

        const cPendingBalance = cTotalRevenue - cReceivedAmount;

        let latestActivity = new Date(customerData.createdAt || customerData.created_at || 0).getTime();
        cBookings.forEach(b => {
          const t = new Date(b.bookingDate || b.created_at || 0).getTime();
          if (t > latestActivity) latestActivity = t;
        });
        cPolicies.forEach(p => {
          const t = new Date(p.issueDate || p.created_at || 0).getTime();
          if (t > latestActivity) latestActivity = t;
        });
        cOtherTxs.forEach(tx => {
          const t = new Date(tx.date || tx.auditLog?.[0]?.timestamp || 0).getTime();
          if (t > latestActivity) latestActivity = t;
        });

        return {
          customerName,
          customerData,
          cBookings,
          cPolicies,
          cTotalRevenue,
          cReceivedAmount,
          cPendingBalance,
          latestActivity
        };
      })
      .filter(data => data.cPendingBalance !== 0 || data.cTotalRevenue !== 0)
      .sort((a, b) => b.latestActivity - a.latestActivity || a.customerName.localeCompare(b.customerName));
  }, [customers, leads, allBookings, tasks, transactions, followUpsList, insurancePolicies, customerSearchQuery, customerStatusDateFrom, customerStatusDateTo]);

  const vendorDataList = useMemo(() => {
    const allVendorNames = new Set<string>();
    vendors.forEach(v => v.name && allVendorNames.add(v.name));
    allBookings.forEach(b => {
      if (b.supplier) allVendorNames.add(b.supplier);
    });
    transactions.forEach(tx => {
      if (tx.entityType === "Vendor" && tx.entityId) {
        const vData = vendors.find(v => v.id === tx.entityId);
        if (vData && vData.name) allVendorNames.add(vData.name);
        else allVendorNames.add(tx.entityId);
      }
    });

    return Array.from(allVendorNames)
      .filter(Boolean)
      .filter(name => name.toLowerCase().includes(vendorSearchQuery.toLowerCase()))
      .map(name => {
        const vendorData = vendors.find(v => v.name === name) || { id: `synth-v-${name}`, name };
        const vBookings = allBookings.filter(b => {
          if (b.supplier !== name) return false;
          if (vendorStatusDateFrom && b.bookingDate && b.bookingDate < vendorStatusDateFrom) return false;
          if (vendorStatusDateTo && b.bookingDate && b.bookingDate > vendorStatusDateTo) return false;
          return true;
        });
        const vSpendTxs = transactions.filter(tx => {
          if (tx.entityType !== "Vendor" || (tx.entityId !== vendorData.id && tx.entityId !== name) || tx.type !== "Payment") return false;
          if (vendorStatusDateFrom && tx.date && tx.date < vendorStatusDateFrom) return false;
          if (vendorStatusDateTo && tx.date && tx.date > vendorStatusDateTo) return false;
          return true;
        });
        const vSpend = vSpendTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

        const vPending = vBookings.reduce((sum, b) => sum + (Number(b.purchasePrice) || 0), 0);
        const vTotalBilled = vPending - vSpend;

        let latestActivity = new Date(vendorData.createdAt || vendorData.created_at || 0).getTime();
        vBookings.forEach(b => {
          const t = new Date(b.bookingDate || b.created_at || 0).getTime();
          if (t > latestActivity) latestActivity = t;
        });
        vSpendTxs.forEach(tx => {
          const t = new Date(tx.date || tx.auditLog?.[0]?.timestamp || 0).getTime();
          if (t > latestActivity) latestActivity = t;
        });

        return {
          vendorName: name,
          vendorData,
          vBookings,
          vSpend,
          vTotalBilled,
          vPending,
          latestActivity
        };
      })
      .filter(data => data.vBookings.length > 0 || data.vSpend > 0)
      .sort((a, b) => b.latestActivity - a.latestActivity || a.vendorName.localeCompare(b.vendorName));
  }, [vendors, allBookings, transactions, vendorSearchQuery, vendorStatusDateFrom, vendorStatusDateTo]);

  const handleExportTransactions = () => {
    const csvRows = [
      ["Date", "Type", "Entity", "Company", "Mode", "Amount", "Added By"]
    ];

    filteredTransactions.forEach(tx => {
      csvRows.push([
        tx.date || "-",
        tx.type || "-",
        (tx.entityName?.replace(/---META---.*/, "") || "-").replace(/,/g, ""),
        (tx.company || "-").replace(/,/g, ""),
        tx.paymentMode || "-",
        String(tx.amount || "0"),
        tx.addedBy || "-"
      ]);
    });

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const csvRows = [
      ["Date", "Category", "Description", "Payment Mode", "Amount", "Status"]
    ];

    const exportableExpenses = expenseList.filter(exp => {
      const d = exp.date || "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    exportableExpenses.forEach(exp => {
      csvRows.push([
        exp.date || "-",
        exp.category || "-",
        exp.description || "-",
        exp.paymentMode || "-",
        exp.amount?.toString() || "0",
        exp.status || "-"
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToWord = () => {
    const tableHeader =
      "<tr><th>Date</th><th>Category</th><th>Description</th><th>Payment Mode</th><th>Amount</th><th>Status</th></tr>";

    const exportableExpenses = expenseList.filter(exp => {
      const d = exp.date || "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableRows = exportableExpenses
      .map(
        (exp) =>
          `<tr><td>${exp.date || ""}</td><td>${exp.category || ""}</td><td>${exp.description || ""}</td><td>${exp.paymentMode || ""}</td><td>₹${exp.amount || 0}</td><td>${exp.status || ""}</td></tr>`,
      )
      .join("");

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Expenses Export</title><style>table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; } th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head>
      <body><h2>Grand Journeys CRM - Expenses Export</h2><table>${tableHeader}${tableRows}</table></body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Expenses_${new Date().toISOString().split('T')[0]}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const exportableExpenses = expenseList.filter(exp => {
      const d = exp.date || "";
      const matchStart = exportStartDate ? d >= exportStartDate : true;
      const matchEnd = exportEndDate ? d <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableHeader =
      "<tr><th>Date</th><th>Category</th><th>Description</th><th>Payment Mode</th><th>Amount</th><th>Status</th></tr>";

    const tableRows = exportableExpenses
      .map(
        (exp) =>
          `<tr><td>${exp.date || ""}</td><td>${exp.category || ""}</td><td>${exp.description || ""}</td><td>${exp.paymentMode || ""}</td><td>₹${exp.amount || 0}</td><td>${exp.status || ""}</td></tr>`,
      )
      .join("");

    const css = `body{font-family:sans-serif;padding:20px;color:#333}h2{color:#059669;margin-bottom:5px}p{font-size:12px;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f9fafb;font-weight:bold}tr:nth-child(even){background:#f3f4f6}`;
    const styleEl = printWindow.document.createElement("style");
    styleEl.textContent = css;
    printWindow.document.head.appendChild(styleEl);
    const titleEl = printWindow.document.createElement("title");
    titleEl.textContent = "Expenses Export PDF";
    printWindow.document.head.appendChild(titleEl);
    const bodyHtml = `<h2>Grand Journeys CRM - Expenses Export</h2><p>Generated on ${new Date().toLocaleDateString("en-IN")} | Total Expenses: ${exportableExpenses.length}</p><table><thead>${tableHeader}</thead><tbody>${tableRows}</tbody></table>`;
    const wrapper = printWindow.document.createElement("div");
    wrapper.innerHTML = bodyHtml;
    printWindow.document.body.appendChild(wrapper);
    const script = printWindow.document.createElement("script");
    script.textContent =
      "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
    printWindow.document.body.appendChild(script);
  };

  const handleExportCustomerStatus = () => {
    const headers = ["Customer Name", "Phone No.", "Total Amounts", "Received Amounts", "Payments Pending"];
    const csvContent = [
      headers.join(","),
      ...customerDataList.map(c =>
        [
          `"${c.customerName.replace(/"/g, '""')}"`,
          `"${(c.customerData.phone || c.customerData.mobile || "").replace(/"/g, '""')}"`,
          c.cTotalRevenue,
          c.cReceivedAmount,
          c.cPendingBalance
        ].join(",")
      )
    ].join("\\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customer_status_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportVendorStatus = () => {
    const headers = ["Vendor Name", "Mobile", "Bookings", "Payments Pending", "Payments (Out)", "Total Billed"];
    const csvContent = [
      headers.join(","),
      ...vendorDataList.map(v =>
        [
          `"${v.vendorName.replace(/"/g, '""')}"`,
          `"${(v.vendorData.mobile || "").replace(/"/g, '""')}"`,
          v.vBookings.length,
          v.vPending,
          v.vSpend,
          v.vTotalBilled
        ].join(",")
      )
    ].join("\\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendor_status_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex-1 p-4 sm:p-8 space-y-6 relative">
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-foreground text-background px-6 py-4 rounded-xl shadow-2xl flex flex-col min-w-[250px] animate-in slide-in-from-bottom-5">
          <span className="font-semibold text-sm">{toastMessage.title}</span>
          <span className="text-xs text-gray-300 mt-1">{toastMessage.desc}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage expenses and track customer payment follow-ups.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full overflow-x-auto sm:overflow-visible flex-nowrap sm:w-auto grid-cols-2 sm:grid-cols-6 bg-secondary/50 rounded-xl p-1 shadow-sm gap-1 overflow-x-auto min-w-max">
          {canViewExpenses && <TabsTrigger value="expenses" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Expenses</TabsTrigger>}
          <TabsTrigger value="follow-ups" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Payment Follow-ups</TabsTrigger>
          <TabsTrigger value="receipts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Receipts & Payments</TabsTrigger>
          <TabsTrigger value="payments-approval" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Payments Approval</TabsTrigger>
          <TabsTrigger value="customer-status" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Customer Status</TabsTrigger>
          <TabsTrigger value="vendor-status" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Vendor Status</TabsTrigger>
        </TabsList>

        {canViewExpenses && (
          <TabsContent value="expenses" className="space-y-6 mt-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Total Expenses</p>
                  <p className="text-3xl font-display font-bold text-foreground mt-1">{formatINR(totalExpenses)}</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Pending Approvals</p>
                  <p className="text-3xl font-display font-bold text-foreground mt-1">{formatINR(pendingExpenses)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="relative w-full sm:w-64 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={expenseSearchQuery}
                  onChange={(e) => setExpenseSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full rounded-lg shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)} className="h-9 shadow-sm">
                    <Download className="mr-2 h-4 w-4" /> Export Expense
                  </Button>
                )}
                <Button onClick={() => setIsAddExpenseOpen(true)} className="h-9 shadow-sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-1">Category <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-1">Description <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-1">Payment Mode <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 font-semibold"><div className="flex items-center gap-1">Added By <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 font-semibold text-center"><div className="flex items-center justify-center gap-1">Status <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExpenseList.map(exp => (
                    <tr key={exp.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{exp.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-foreground font-medium">{exp.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{exp.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span>{exp.paymentMode}</span>
                        </div>
                        {exp.reference && <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{exp.reference}</p>}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                        {exp.createdBy || "none"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border cursor-pointer hover:opacity-80 transition-opacity ${exp.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : exp.status === 'Cancelled' ? 'bg-muted text-muted-foreground border-border' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}
                            >
                              {exp.status} <ChevronDown className="h-2.5 w-2.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-36 p-1" align="center">
                            <div className="text-[10px] text-muted-foreground px-2 py-1">Change Status</div>
                            {(["Paid", "Pending", "Cancelled"] as Expense["status"][]).map((s) => (
                              <button
                                key={s}
                                className="w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-secondary transition-colors mt-0.5"
                                onClick={() => setExpenseList(expenseList.map(e => e.id === exp.id ? { ...e, status: s } : e))}
                              >
                                {s}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32 rounded-xl">
                            <>{auth?.role === "admin" && (
                              <DropdownMenuItem onClick={() => { setEditExpense({ ...exp }); setIsEditExpenseOpen(true); }} className="cursor-pointer gap-2 py-2 text-blue-600 focus:text-blue-700">
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            )}</>
                            {isAdmin && (
                              <>{auth?.role === "admin" && (
                                <DropdownMenuItem onClick={() => handleDelete(exp.id, "Expense")} className="cursor-pointer gap-2 py-2 text-rose-600 focus:text-rose-700">
                                  <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}</>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}

        <TabsContent value="follow-ups" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers or invoices..." className="pl-9 bg-background h-10 rounded-xl" />
            </div>
            <Button onClick={() => setIsAddFollowUpOpen(true)} className="w-full sm:w-auto shadow">
              <Plus className="mr-2 h-4 w-4" /> Add Follow-up
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {followUpsList.map(fu => (
              <div 
                key={fu.id} 
                className={cn(
                  "rounded-2xl border p-5 shadow-sm transition-all duration-200 bg-card", 
                  fu.status === 'Completed' 
                    ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0 border-border/60 hover:border-emerald-500/40 hover:shadow-md" 
                    : "border-border hover:border-primary/40 hover:shadow-md"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-500/20 shrink-0">
                      {fu.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {fu.customerName}
                        {fu.status === 'Completed' && (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <PhoneCall className="h-3 w-3" /> {fu.customerPhone}
                        </p>
                        {fu.customerPhone && (
                          <a 
                            href={`https://wa.me/${fu.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${fu.customerName}, this is regarding your pending amount of ${formatINR(fu.pendingAmount)} for Invoice ${fu.invoiceId}.`)}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full p-1 transition-colors"
                            title="Message on WhatsApp"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Amount</p>
                    <p className="text-lg font-display font-bold text-rose-500">{formatINR(fu.pendingAmount)}</p>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-xl p-3 mb-4 border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Invoice ID:</span>
                    <span className="font-mono font-medium">{fu.invoiceId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">{formatINR(fu.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Added By:</span>
                    <span className="font-medium">{fu.createdBy || "none"}</span>
                  </div>
                  <div className="flex flex-col text-sm mt-2 border-t border-border/40 pt-2">
                    <span className="text-muted-foreground mb-1">Notes:</span>
                    <span className="font-medium text-left whitespace-pre-wrap break-words">{fu.notes}</span>
                  </div>
                  {(fu.outcomeLog && fu.outcomeLog.length > 0) && (
                    <div className="flex flex-col text-sm mt-2 border-t border-border/40 pt-2">
                      <span className="text-muted-foreground mb-2">Outcome / Status History:</span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {fu.outcomeLog.map((log: any, idx: number) => (
                          <div key={idx} className="bg-background rounded-md p-2.5 text-xs border border-border/50 shadow-sm relative">
                            <div className="font-medium text-foreground whitespace-pre-wrap break-words pr-4">{log.status}</div>
                            <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center justify-between border-t border-border/30 pt-1.5">
                              <span className="font-semibold text-primary/80">{log.by}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.date).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-border gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-foreground">Follow-up: {fu.nextFollowUpDate} at {fu.nextFollowUpTime}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:bg-secondary">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 rounded-xl">
                          <DropdownMenuItem onClick={() => {
                            setSelectedFuId(fu.id);
                            setLogNotes(fu.notes);
                            setLogDate(fu.nextFollowUpDate);
                            setLogStatus("");
                            setIsLogFollowUpOpen(true);
                          }} className="cursor-pointer gap-2 py-2">
                            <Eye className="h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setFollowUpsList(followUpsList.map(item => item.id === fu.id ? { ...item, status: fu.status === 'Completed' ? 'Pending' : 'Completed' } : item));
                          }} className="cursor-pointer gap-2 py-2">
                            <CheckCircle2 className="h-4 w-4" /> {fu.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(fu.id, "Follow-up")} className="cursor-pointer gap-2 py-2 text-rose-600 focus:text-rose-700">
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {fu.status !== 'Completed' && (
                      <Button size="sm" variant="outline" className="h-8 text-xs shadow-sm border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-500/50" onClick={() => {
                        setFollowUpsList(followUpsList.map(item => item.id === fu.id ? { ...item, status: 'Completed' } : item));
                      }}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete Now
                      </Button>
                    )}

                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-4 items-center flex-1">
              <div className="relative w-[200px] md:w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-9 bg-background h-10 rounded-xl"
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                />
              </div>
              <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
                <SelectTrigger className="w-[150px] bg-background h-10 rounded-xl">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Receipt">Receipts</SelectItem>
                  <SelectItem value="Payment">Payments</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input type="date" className="h-10 w-[140px] rounded-xl bg-background" value={txDateFrom} onChange={(e) => setTxDateFrom(e.target.value)} />
                <span className="text-muted-foreground text-sm">to</span>
                <Input type="date" className="h-10 w-[140px] rounded-xl bg-background" value={txDateTo} onChange={(e) => setTxDateTo(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <Button variant="outline" className="shadow-sm rounded-xl px-4 h-10" onClick={handleExportTransactions}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button className="shadow-sm rounded-xl px-5 h-10" onClick={() => setIsAddTxOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-2">No Receipts or Payments Yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Track all your incoming receipts and outgoing payments here.
              </p>
              <Button className="shadow-sm" onClick={() => setIsAddTxOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Type <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Entity <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Company <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Mode <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-1">Added By <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{tx.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${(tx.type === 'Receipt' || tx.entityType === 'Customer') && tx.entityType !== 'Vendor' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {(tx.type === 'Receipt' || tx.entityType === 'Customer') && tx.entityType !== 'Vendor' ? 'Receipt' : 'Payment'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{tx.entityName}</div>
                        <div className="text-xs text-muted-foreground">{tx.entityType}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                        {tx.company || "-"}
                      </td>
                      <td className="px-6 py-4">{tx.paymentMode}</td>
                      <td className={`px-6 py-4 text-right font-bold ${(tx.type === 'Receipt' || tx.entityType === 'Customer') && tx.entityType !== 'Vendor' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {(tx.type === 'Receipt' || tx.entityType === 'Customer') && tx.entityType !== 'Vendor' ? '+' : '-'}{formatINR(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground font-medium">
                        {tx.createdBy || "none"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin && auth?.role === "admin" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-secondary">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 rounded-xl">
                              <DropdownMenuItem onClick={() => handleDelete(tx.id, "Transaction")} className="cursor-pointer gap-2 py-2 text-rose-600 focus:text-rose-700">
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="payments-approval" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Payment Requests</h3>
            <Button onClick={() => setIsAddPaymentRequestOpen(true)} className="shadow">
              <Plus className="mr-2 h-4 w-4" /> Request Payment
            </Button>
          </div>

          <Tabs value={activePaymentTab} onValueChange={setActivePaymentTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="unpaid">Unpaid / Pending</TabsTrigger>
              <TabsTrigger value="paid">Paid History</TabsTrigger>
            </TabsList>

            {["unpaid", "paid"].map(tabValue => {
              const filteredRequests = [...paymentRequests].filter(req =>
                tabValue === "paid" ? req.status === "Paid" : req.status !== "Paid"
              ).sort((a, b) => {
                const timeA = new Date(a.auditLog?.[0]?.timestamp || a.date || 0).getTime();
                const timeB = new Date(b.auditLog?.[0]?.timestamp || b.date || 0).getTime();
                return timeB - timeA;
              });

              return (
                <TabsContent key={tabValue} value={tabValue} className="mt-0">
                  {filteredRequests.length === 0 ? (
                    <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
                      <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        No {tabValue === "paid" ? "paid" : "unpaid"} payment requests found.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
                          <tr>
                            <th className="px-6 py-4"><div className="flex items-center gap-1">Request ID <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                            <th className="px-6 py-4"><div className="flex items-center gap-1">Employee <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                            <th className="px-6 py-4"><div className="flex items-center gap-1">Entity <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                            <th className="px-6 py-4"><div className="flex items-center gap-1">Amount <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                            <th className="px-6 py-4"><div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4 font-medium">{req.id}</td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-foreground">{req.employeeName}</div>
                                <div className="text-xs text-muted-foreground">{req.date}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-foreground">{req.entityName}</div>
                                <div className="text-xs text-muted-foreground">{req.entityType} {req.invoiceId ? `• ${req.invoiceId}` : ''}</div>
                              </td>
                              <td className="px-6 py-4 font-bold text-foreground">
                                {formatINR(req.amount)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  req.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' :
                                  req.status === 'Approved' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25' :
                                  req.status === 'Rejected' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25' :
                                  req.status === 'Accounts Verified' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25' :
                                  'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:bg-secondary/40 hover:text-foreground" onClick={() => { setHistoryReqId(req.id); setIsHistoryViewerOpen(true); }}>
                                  History
                                </Button>
                                {!isManagement && req.status === 'Pending Approval' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-transparent hover:bg-purple-500/15 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-500/50" 
                                    onClick={() => openActionPopup(req.id, "Accounts Verified")}
                                  >
                                    Verify
                                  </Button>
                                )}
                                {req.status === 'Accounts Verified' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-500/50" 
                                      onClick={() => openActionPopup(req.id, "Approved")}
                                    >
                                      Approve
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-transparent hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-500/50" 
                                      onClick={() => openActionPopup(req.id, "Rejected")}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {!isManagement && req.status === 'Approved' && (
                                  <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm" onClick={() => openActionPopup(req.id, "Paid")}>
                                    Mark Paid
                                  </Button>
                                )}
                                {req.status === 'Paid' && req.receiptId && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-500/15 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-500/50" 
                                    onClick={() => { setReceiptReqId(req.id); setIsReceiptViewerOpen(true); }}
                                  >
                                    View Receipt
                                  </Button>
                                )}
                                {auth?.role === 'admin' && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-secondary">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32 rounded-xl">
                                      <DropdownMenuItem onClick={() => handleDelete(req.id, "PaymentRequest")} className="cursor-pointer gap-2 py-2 text-rose-600 focus:text-rose-700">
                                        <Trash2 className="h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>

        <TabsContent value="customer-status" className="space-y-6 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers..." className="pl-9 bg-background/50 h-9" value={customerSearchQuery} onChange={(e) => setCustomerSearchQuery(e.target.value)} />
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleExportCustomerStatus} className="h-9 ml-auto">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl w-10"></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Customer Name <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Phone No. <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Total Amounts <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Received Amounts <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 text-right rounded-tr-xl"><div className="flex items-center justify-end gap-1">Payments Pending <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {customerDataList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 opacity-20" />
                          <p>No customers found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : customerDataList.map(({
                    customerName,
                    customerData,
                    cBookings,
                    cPolicies,
                    cTotalRevenue,
                    cReceivedAmount,
                    cPendingBalance
                  }) => {
                    const isExpanded = expandedCustomer === customerData.id;

                    const vendorSet = new Set<string>();
                    cBookings.forEach(b => {
                      if (b.supplier) vendorSet.add(b.supplier);
                    });
                    const cVendors = Array.from(vendorSet);

                    return (
                      <React.Fragment key={customerData.id}>
                        <tr
                          onClick={() => setExpandedCustomer(isExpanded ? null : customerData.id)}
                          className="hover:bg-secondary/20 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </td>
                          <td className="px-6 py-4 font-bold text-foreground">
                            {customerName}
                            {customerData.company && <div className="text-xs font-normal text-muted-foreground mt-0.5">{customerData.company}</div>}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {customerData.phone || <span className="italic opacity-50">N/A</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-foreground">
                              {formatINR(cTotalRevenue)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatINR(cReceivedAmount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-bold ${cPendingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {formatINR(cPendingBalance)}
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-secondary/5 border-b border-border">
                            <td colSpan={6} className="p-0">
                              <div className="p-6 grid grid-cols-1 gap-6 animate-in slide-in-from-top-2 duration-200">

                                {/* Bookings List */}
                                <div className="bg-background rounded-xl border border-border p-4 space-y-3">
                                  <h4 className="font-semibold flex justify-between items-center text-sm">
                                    <span>Bookings</span>
                                    <span className="bg-secondary px-2 py-0.5 rounded-full text-[10px]">{cBookings.length}</span>
                                  </h4>
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                    {cBookings.length > 0 ? cBookings.map((bk: any, i: number) => (
                                      <div key={i} className="text-xs p-2 rounded-lg border border-border/50 bg-secondary/10">
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="font-medium">
                                            {bk.bookingType || "Booking"}
                                            {(bk.details?.sector || bk.details?.destination || bk.details?.city) ? ` - ${bk.details?.sector || bk.details?.destination || bk.details?.city}` : ""}
                                          </span>
                                          <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary">{bk.status || "Pending"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-background/50 p-1.5 rounded border border-border/30">
                                          <div className="flex flex-col">
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Price</span>
                                            <span className="font-medium text-primary">{formatINR(bk.sellingPrice || bk.amount || 0)}</span>
                                          </div>
                                          <div className="flex flex-col text-center">
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Paid</span>
                                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatINR(bk.paid || 0)}</span>
                                          </div>
                                          <div className="flex flex-col text-right">
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Pending</span>
                                            <span className="font-medium text-rose-600 dark:text-rose-400">{formatINR((bk.sellingPrice || bk.amount || 0) - (bk.paid || 0))}</span>
                                          </div>
                                        </div>
                                        <div className="text-muted-foreground mt-2 text-[10px] flex justify-between">
                                          <span>{bk.bookingDate || "-"}</span>
                                        </div>
                                      </div>
                                    )) : <div className="text-xs text-muted-foreground italic">No bookings found.</div>}
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vendor-status" className="space-y-6 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search vendors..." className="pl-9 bg-background/50 h-9" value={vendorSearchQuery} onChange={(e) => setVendorSearchQuery(e.target.value)} />
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleExportVendorStatus} className="h-9 ml-auto">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl w-10"></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Vendor Name <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Mobile <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Bookings <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Payments Pending <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4"><div className="flex items-center gap-1">Payments (Out) <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                    <th className="px-6 py-4 text-right rounded-tr-xl"><div className="flex items-center justify-end gap-1">Total Amounts <ArrowUpDown className="w-3 h-3 opacity-30" /></div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {vendorDataList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 opacity-20" />
                          <p>No vendors found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : vendorDataList.map(({ vendorName, vendorData, vBookings, vSpend, vTotalBilled, vPending }, index) => {
                    const isExpanded = expandedVendor === vendorData.id;

                    const customerSet = new Set<string>();
                    vBookings.forEach(b => {
                      if (b.customer) customerSet.add(b.customer);
                    });
                    const vCustomers = Array.from(customerSet);

                    return (
                      <React.Fragment key={vendorData.id}>
                        <tr
                          onClick={() => setExpandedVendor(isExpanded ? null : vendorData.id)}
                          className="hover:bg-secondary/20 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </td>
                          <td className="px-6 py-4 font-bold text-foreground">
                            {vendorName}
                            {vendorData.serviceType && <div className="text-xs font-normal text-muted-foreground mt-0.5">{vendorData.serviceType}</div>}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {vendorData.mobile || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium">{vBookings.length} Total</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-rose-600 dark:text-rose-400">{formatINR(vPending)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(vSpend)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{formatINR(vTotalBilled)}</span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-secondary/5 border-b border-border">
                            <td colSpan={7} className="p-0">
                              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                                {/* Bookings List */}
                                <div className="bg-background rounded-xl border border-border p-4 space-y-3">
                                  <h4 className="font-semibold flex justify-between items-center text-sm">
                                    <span>Bookings via Vendor</span>
                                    <span className="bg-secondary px-2 py-0.5 rounded-full text-[10px]">{vBookings.length}</span>
                                  </h4>
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                    {vBookings.length > 0 ? vBookings.map((bk: any, i: number) => (
                                      <div key={i} className="text-xs p-2 rounded-lg border border-border/50 bg-secondary/10">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-medium">
                                            {bk.bookingType || "Booking"}
                                            {(bk.details?.sector || bk.details?.destination || bk.details?.city) ? ` - ${bk.details?.sector || bk.details?.destination || bk.details?.city}` : ""}
                                          </span>
                                          <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary">{bk.status}</span>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                          <span className="text-muted-foreground">{bk.customer}</span>
                                          <span className="text-muted-foreground">{bk.bookingDate}</span>
                                        </div>
                                      </div>
                                    )) : <div className="text-xs text-muted-foreground italic">No bookings found for this vendor.</div>}
                                  </div>
                                </div>

                                {/* Customers List */}
                                <div className="bg-background rounded-xl border border-border p-4 space-y-3">
                                  <h4 className="font-semibold flex justify-between items-center text-sm">
                                    <span>Associated Customers</span>
                                    <span className="bg-secondary px-2 py-0.5 rounded-full text-[10px]">{vCustomers.length}</span>
                                  </h4>
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                    {vCustomers.length > 0 ? vCustomers.map((cust, i) => (
                                      <div key={i} className="text-xs p-2 rounded-lg border border-border/50 bg-secondary/10 font-medium flex justify-between items-center gap-2">
                                        <span>{cust}</span>
                                        <div className="text-[9px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground">
                                          {vBookings.filter(b => b.customer === cust).length} Bookings
                                        </div>
                                      </div>
                                    )) : <div className="text-xs text-muted-foreground italic">No customers linked.</div>}
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTxOpen} onOpenChange={(open) => {
        setIsAddTxOpen(open);
        if (!open) setEditingTxId(null);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTxId ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
            <DialogDescription>{editingTxId ? "Modify transaction details." : "Record a new receipt or payment."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newTx.type} onValueChange={v => setNewTx({ ...newTx, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receipt">Receipt (In)</SelectItem>
                    <SelectItem value="Payment">Payment (Out)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={newTx.entityType} onValueChange={v => setNewTx({ ...newTx, entityType: v, entityId: "", type: v === "Customer" ? "Receipt" : v === "Vendor" ? "Payment" : newTx.type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Booking ID / Vendor ID (Auto-fill)</Label>
                {invoiceMatchStatusTx === "found" && <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Match Found!</span>}
                {invoiceMatchStatusTx === "not_found" && <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">Not Found</span>}
              </div>
              <BookingCombobox
                bookings={allBookings}
                value={newTx.invoiceId || ""}
                onChange={(val, matchingBooking) => {
                  let updates: any = { invoiceId: val };

                  if (!val || !val.trim()) {
                    setInvoiceMatchStatusTx(null);
                    setNewTx({ ...newTx, ...updates });
                    return;
                  }

                  if (matchingBooking) {
                    setInvoiceMatchStatusTx("found");
                    const isVendorMatch = !!matchingBooking.supplier;

                    if (isVendorMatch) {
                      const pending = (matchingBooking.purchasePrice || 0) - (matchingBooking.paid || 0);
                      updates.amount = pending > 0 ? pending : 0;

                      if (matchingBooking.supplier) {
                        const v = vendors.find(vend => vend.name && vend.name.includes(matchingBooking.supplier));
                        if (v) {
                          updates.entityType = "Vendor";
                          updates.entityId = v.id;
                        }
                      }
                    } else {
                      const pending = (matchingBooking.amount || 0) - (matchingBooking.paid || 0);
                      updates.amount = pending > 0 ? pending : 0;

                      if (matchingBooking.customer) {
                        const c = customers.find(cust => cust.name && cust.name.includes(matchingBooking.customer));
                        if (c) {
                          updates.entityType = "Customer";
                          updates.entityId = c.id;
                        }
                      }
                    }
                  } else {
                    setInvoiceMatchStatusTx("not_found");
                  }

                  setNewTx({ ...newTx, ...updates });
                }}
              />
            </div>

            {(newTx.type === "Receipt" || newTx.type === "Payment") && newTx.invoiceId && (() => {
              const selectedBooking = bookings.find(b =>
                String(b.id).toLowerCase() === String(newTx.invoiceId).toLowerCase() ||
                String(b.saleInvoiceNo || "").toLowerCase() === String(newTx.invoiceId).toLowerCase() ||
                String(b.purchaseInvoiceNo || "").toLowerCase() === String(newTx.invoiceId).toLowerCase()
              );
              if (!selectedBooking) return null;

              const isPayment = newTx.type === "Payment";
              const totalAmt = isPayment
                ? (Number(selectedBooking.purchasePrice) || 0)
                : (Number(selectedBooking.sellingPrice) || Number(selectedBooking.amount) || 0);

              let currentPaid = 0;
              if (isPayment) {
                const vendorTxs = transactions.filter(t => t.type === "Payment" && (t.invoiceId === newTx.invoiceId || t.invoiceId === selectedBooking.id));
                currentPaid = vendorTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              } else {
                currentPaid = Number(selectedBooking.paid) || 0;
              }

              const oldTxAmount = editingTxId ? (transactions.find(t => t.id === editingTxId)?.amount || 0) : 0;
              currentPaid = Math.max(0, currentPaid - oldTxAmount);

              const newPaid = currentPaid + (Number(newTx.amount) || 0);
              const remaining = Math.max(0, totalAmt - newPaid);

              return (
                <div className="bg-muted/30 border border-border p-3 rounded-xl grid grid-cols-3 gap-2 text-sm mt-2">
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase font-semibold">{isPayment ? "Vendor Cost" : "Total Amount"}</div>
                    <div className="font-semibold text-foreground">{formatINR(totalAmt)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase font-semibold">Amount Paid</div>
                    <div className="font-semibold text-emerald-600">{formatINR(newPaid)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase font-semibold">Remaining Balance</div>
                    <div className="font-semibold text-rose-600">{formatINR(remaining)}</div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label>Select {newTx.entityType}</Label>
              <EntityCombobox
                entityType={newTx.entityType}
                value={newTx.entityId}
                onChange={v => {
                  let pending = 0;
                  if (v) {
                    if (newTx.entityType === "Customer") {
                      const matched = customers.find(c => c.id === v);
                      if (matched) {
                        const customerName = matched.name?.split('---META---')[0];
                        const customerBookings = bookings.filter(b => (b.customer || "").trim().toLowerCase() === (customerName || "").trim().toLowerCase());
                        const customerPolicies = insurancePolicies.filter(p => (p.customerName || "").trim().toLowerCase() === (customerName || "").trim().toLowerCase());
                        
                        const bAmount = customerBookings.reduce((sum, b) => sum + (Number(b.sellingPrice) || Number(b.amount) || 0), 0);
                        const bPaid = customerBookings.reduce((sum, b) => sum + (Number(b.paid) || 0), 0);
                        
                        const pAmount = customerPolicies.reduce((sum, p) => sum + (Number(p.premiumAmount) || 0), 0);
                        
                        const policyIds = customerPolicies.map(p => String(p.id));
                        const bookingIds = customerBookings.map(b => String(b.id));

                        const cOtherTxs = transactions.filter(tx => {
                          if (tx.type !== "Receipt" || tx.entityType !== "Customer") return false;
                          const belongsToCustomer = tx.entityId === matched.id || tx.entityName === customerName || (tx.invoiceId && policyIds.includes(String(tx.invoiceId)));
                          if (!belongsToCustomer) return false;
                          if (tx.invoiceId && bookingIds.includes(String(tx.invoiceId))) return false;
                          return true;
                        });
                        const otherPaid = cOtherTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

                        pending = Math.max(0, (bAmount + pAmount) - (bPaid + otherPaid));
                      }
                    } else if (newTx.entityType === "Vendor") {
                      const matched = vendors.find(v2 => v2.id === v);
                      if (matched) {
                        const vendorName = matched.name?.split('---META---')[0];
                        const vendorBookings = bookings.filter(b => b.supplier === vendorName);
                        const totalAmount = vendorBookings.reduce((sum, b) => sum + (Number(b.purchasePrice) || 0), 0);
                        const vendorTxs = transactions.filter(t => t.type === "Payment" && t.entityType === "Vendor" && (t.entityId === matched.id || t.entityId === vendorName));
                        const totalPaid = vendorTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                        pending = Math.max(0, totalAmount - totalPaid);
                      }
                    }
                  }
                  // Clear invoiceId so we don't force a specific booking on direct payments
                  setNewTx({ ...newTx, entityId: v, amount: pending > 0 ? pending : (newTx.amount || 0), invoiceId: "" });
                }}
                customers={customers}
                vendors={vendors}
                employees={employees}
              />
            </div>

            {(newTx.type === "Receipt" || newTx.type === "Payment") && newTx.entityId && (() => {
              let totalAmount = 0;
              let totalPaid = 0;
              let isMatch = false;

              if (newTx.entityType === "Customer") {
                const matched = customers.find(c => c.id === newTx.entityId);
                if (matched) {
                  const customerName = matched.name?.split('---META---')[0];
                  const customerBookings = bookings.filter(b => (b.customer || "").trim().toLowerCase() === (customerName || "").trim().toLowerCase());
                  const customerPolicies = insurancePolicies.filter(p => (p.customerName || "").trim().toLowerCase() === (customerName || "").trim().toLowerCase());
                  
                  const bAmount = customerBookings.reduce((sum, b) => sum + (Number(b.sellingPrice) || Number(b.amount) || 0), 0);
                  const bPaid = customerBookings.reduce((sum, b) => sum + (Number(b.paid) || 0), 0);
                  
                  const pAmount = customerPolicies.reduce((sum, p) => sum + (Number(p.premiumAmount) || 0), 0);
                  
                  const policyIds = customerPolicies.map(p => String(p.id));
                  const bookingIds = customerBookings.map(b => String(b.id));

                  const cOtherTxs = transactions.filter(tx => {
                    if (tx.type !== "Receipt" || tx.entityType !== "Customer") return false;
                    const belongsToCustomer = tx.entityId === matched.id || tx.entityName === customerName || (tx.invoiceId && policyIds.includes(String(tx.invoiceId)));
                    if (!belongsToCustomer) return false;
                    if (tx.invoiceId && bookingIds.includes(String(tx.invoiceId))) return false;
                    return true;
                  });
                  const otherPaid = cOtherTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

                  totalAmount = bAmount + pAmount;
                  totalPaid = bPaid + otherPaid;
                  isMatch = customerBookings.length > 0 || customerPolicies.length > 0 || cOtherTxs.length > 0;
                }
              } else if (newTx.entityType === "Vendor") {
                const matched = vendors.find(v => v.id === newTx.entityId);
                if (matched) {
                  const vendorName = matched.name?.split('---META---')[0];
                  const vendorBookings = bookings.filter(b => b.supplier === vendorName);
                  totalAmount = vendorBookings.reduce((sum, b) => sum + (Number(b.purchasePrice) || 0), 0);

                  const vendorTxs = transactions.filter(t => t.type === "Payment" && t.entityType === "Vendor" && (t.entityId === matched.id || t.entityId === vendorName));
                  totalPaid = vendorTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

                  isMatch = vendorBookings.length > 0 || vendorTxs.length > 0;
                }
              }

              if (!isMatch) return null;

              const oldTxAmount = editingTxId ? (transactions.find(t => t.id === editingTxId)?.amount || 0) : 0;
              const currentPaid = Math.max(0, totalPaid - oldTxAmount);
              const newTotalPaid = currentPaid + (Number(newTx.amount) || 0);
              const remaining = Math.max(0, totalAmount - newTotalPaid);

              return (
                <div className="bg-muted/30 border border-border p-3 rounded-xl grid grid-cols-3 gap-2 text-sm mt-2">
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase font-semibold">Total Cost</div>
                    <div className="font-semibold text-foreground">{formatINR(totalAmount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase font-semibold">Amount Paid So Far</div>
                    <div className="font-semibold text-emerald-600">{formatINR(newTotalPaid)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px] uppercase font-semibold">Pending Balance</div>
                    <div className="font-semibold text-rose-600">{formatINR(remaining)}</div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" value={newTx.amount || ""} onChange={e => setNewTx({ ...newTx, amount: Number(e.target.value) })} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={newTx.paymentMode} onValueChange={v => setNewTx({ ...newTx, paymentMode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes/Reference</Label>
                <Input placeholder="Optional" value={newTx.notes} onChange={e => setNewTx({ ...newTx, notes: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Company</Label>
                <Input placeholder="e.g. LookMyHolidays" value={newTx.company || ""} onChange={e => setNewTx({ ...newTx, company: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddTxOpen(false); setEditingTxId(null); }}>Cancel</Button>
            <Button onClick={() => {
              if (!newTx.entityId) return;
              let entityName = "";
              if (newTx.entityType === "Customer") {
                const c = customers.find(x => x.id === newTx.entityId);
                entityName = c ? (c.name ? c.name.split('---META---')[0] : c.id || "Unknown Customer") : "";
              } else if (newTx.entityType === "Vendor") {
                const v = vendors.find(x => x.id === newTx.entityId);
                entityName = v ? (v.name ? v.name.split('---META---')[0] : v.id || "Unknown Vendor") : "";
              } else if (newTx.entityType === "Employee") {
                const e = employees.find(x => x.id === newTx.entityId);
                entityName = e ? (e.name ? e.name.split('---META---')[0] : e.id || "Unknown Employee") : "";
              }

              const txWithId = {
                id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
                ...newTx,
                entityName,
                createdBy: auth?.name || "Unknown",
              };

              // Update booking paid amount if invoiceId exists
              if (newTx.invoiceId && newTx.amount > 0) {
                const targetBooking = bookings.find(b =>
                  String(b.id).toLowerCase() === String(newTx.invoiceId).toLowerCase() ||
                  String(b.saleInvoiceNo || "").toLowerCase() === String(newTx.invoiceId).toLowerCase() ||
                  String(b.purchaseInvoiceNo || "").toLowerCase() === String(newTx.invoiceId).toLowerCase()
                );

                if (targetBooking) {
                  const currentPaid = targetBooking.paid || 0;
                  const oldTx = editingTxId ? transactions.find(t => t.id === editingTxId) : null;
                  const oldAmount = oldTx ? (Number(oldTx.amount) || 0) : 0;

                  const newPaid = currentPaid - oldAmount + newTx.amount;

                  let newPaymentStatus = targetBooking.paymentStatus;
                  let newCustomerStatus = "";

                  if (newTx.type === "Receipt") {
                    const totalAmount = targetBooking.amount || 0;
                    if (newPaid === 0) {
                      newPaymentStatus = "Pending";
                      newCustomerStatus = "Payment Pending";
                    } else if (newPaid < totalAmount) {
                      newPaymentStatus = "Partially Paid";
                      newCustomerStatus = "Partial Payment Received";
                    } else {
                      newPaymentStatus = "Paid / Completed";
                      newCustomerStatus = "Payment Received";
                    }
                  }

                  const updatedBooking = {
                    ...targetBooking,
                    paid: newPaid,
                    paymentStatus: newPaymentStatus
                  };

                  setBookings(bookings.map(b => b.id === targetBooking.id ? updatedBooking : b));

                  // Async update to database for Booking and Customer
                  (async () => {
                    try {
                      await supabase.from("bookings").update({
                        paid: newPaid,
                        paymentStatus: newPaymentStatus
                      }).eq("id", targetBooking.id);

                      if (newTx.type === "Receipt" && targetBooking.customer && newCustomerStatus) {
                        const { data: cData } = await supabase
                          .from("customers")
                          .select("id")
                          .ilike("name", `%${targetBooking.customer}%`)
                          .limit(1);
                        if (cData && cData.length > 0) {
                          await supabase
                            .from("customers")
                            .update({ status: newCustomerStatus })
                            .eq("id", cData[0].id);
                        }
                      }
                    } catch (err) {
                      console.error("Failed to update status in Supabase:", err);
                    }
                  })();
                }
              }

              if (editingTxId) {
                setTransactions(transactions.map(t => t.id === editingTxId ? { ...txWithId, id: editingTxId } : t));
              } else {
                setTransactions([txWithId, ...transactions]);
              }
              setIsAddTxOpen(false);
              setEditingTxId(null);
              setNewTx({ ...newTx, entityId: "", amount: 0, notes: "", company: "" });
            }}>{editingTxId ? "Update Transaction" : "Save Transaction"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>Record a new company expense.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" value={newExpense.amount || ""} onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input placeholder="e.g. Travel, Office Supplies" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Brief description of the expense" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={newExpense.paymentMode} onValueChange={v => setNewExpense({ ...newExpense, paymentMode: v })}>
                  <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newExpense.status} onValueChange={v => setNewExpense({ ...newExpense, status: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference No. (Optional)</Label>
              <Input placeholder="Transaction ID, Cheque No, etc." value={newExpense.reference} onChange={e => setNewExpense({ ...newExpense, reference: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveExpense}>Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the expense details below.</DialogDescription>
          </DialogHeader>
          {editExpense && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={editExpense.date} onChange={e => setEditExpense({ ...editExpense, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={editExpense.amount || ""} onChange={e => setEditExpense({ ...editExpense, amount: Number(e.target.value) })} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="e.g. Travel, Office Supplies" value={editExpense.category} onChange={e => setEditExpense({ ...editExpense, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Brief description" value={editExpense.description} onChange={e => setEditExpense({ ...editExpense, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={editExpense.paymentMode} onValueChange={v => setEditExpense({ ...editExpense, paymentMode: v })}>
                    <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editExpense.status} onValueChange={v => setEditExpense({ ...editExpense, status: v as any })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reference No. (Optional)</Label>
                <Input placeholder="Transaction ID, Cheque No, etc." value={editExpense.reference} onChange={e => setEditExpense({ ...editExpense, reference: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditExpenseOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!editExpense?.id) return;
              setExpenseList(expenseList.map(e => e.id === editExpense.id ? { ...e, ...editExpense } as Expense : e));
              setIsEditExpenseOpen(false);
              setEditExpense(null);
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {noteType} Note</DialogTitle>
            <DialogDescription>
              Please provide details or remarks for marking this as {noteType}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter your notes here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
            <Button onClick={() => { setIsNoteOpen(false); setNoteContent(""); }}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddFollowUpOpen} onOpenChange={setIsAddFollowUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Follow-up</DialogTitle>
            <DialogDescription>
              Create a new payment follow-up for a customer or vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={newFollowUp.entityType} onValueChange={v => setNewFollowUp({ ...newFollowUp, entityType: v, entityId: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select {newFollowUp.entityType}</Label>
                <EntityCombobox
                  entityType={newFollowUp.entityType}
                  value={newFollowUp.entityId}
                  onChange={v => {
                    let pending = 0;
                    let invoiceId = "";
                    if (v) {
                      if (newFollowUp.entityType === "Customer") {
                        const matched = customers.find(c => c.id === v);
                        if (matched) {
                          const customerBookings = bookings.filter(b => b.customer === matched.name?.split('---META---')[0]);
                          pending = customerBookings.reduce((sum, b) => sum + ((b.amount || 0) - (b.paid || 0)), 0);
                          const unpaid = customerBookings.find(b => ((b.amount || 0) - (b.paid || 0)) > 0);
                          if (unpaid) invoiceId = unpaid.id;
                        }
                      } else if (newFollowUp.entityType === "Vendor") {
                        const matched = vendors.find(v2 => v2.id === v);
                        if (matched) {
                          const vendorBookings = bookings.filter(b => b.supplier === matched.name?.split('---META---')[0]);
                          pending = vendorBookings.reduce((sum, b) => sum + ((b.purchasePrice || 0) - (b.paid || 0)), 0);
                          const unpaid = vendorBookings.find(b => ((b.purchasePrice || 0) - (b.paid || 0)) > 0);
                          if (unpaid) invoiceId = unpaid.id;
                        }
                      }
                    }
                    setNewFollowUp({
                      ...newFollowUp,
                      entityId: v,
                      pendingAmount: pending > 0 ? String(pending) : newFollowUp.pendingAmount,
                      invoiceId: invoiceId || newFollowUp.invoiceId
                    });
                  }}
                  customers={customers}
                  vendors={vendors}
                  employees={employees}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Booking ID / Vendor ID (Auto-fill)</Label>
                {invoiceMatchStatus === "found" && <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Match Found!</span>}
                {invoiceMatchStatus === "not_found" && <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">Not Found</span>}
              </div>
              <BookingCombobox
                bookings={allBookings}
                value={newFollowUp.invoiceId || ""}
                onChange={(val, matchingBooking) => {
                  let updates: any = { invoiceId: val };

                  if (!val || !val.trim()) {
                    setInvoiceMatchStatus(null);
                    setNewFollowUp({ ...newFollowUp, ...updates });
                    return;
                  }

                  if (matchingBooking) {
                    setInvoiceMatchStatus("found");
                    const isVendorMatch = !!matchingBooking.supplier;

                    if (isVendorMatch) {
                      const pending = (matchingBooking.purchasePrice || 0) - (matchingBooking.paid || 0);
                      updates.pendingAmount = pending > 0 ? pending.toString() : "0";

                      if (matchingBooking.supplier) {
                        const v = vendors.find(vend => vend.name && vend.name.includes(matchingBooking.supplier));
                        if (v) {
                          updates.entityType = "Vendor";
                          updates.entityId = v.id;
                        }
                      }
                    } else {
                      const pending = (matchingBooking.amount || 0) - (matchingBooking.paid || 0);
                      updates.pendingAmount = pending > 0 ? pending.toString() : "0";

                      if (matchingBooking.customer) {
                        const c = customers.find(cust => cust.name && cust.name.includes(matchingBooking.customer));
                        if (c) {
                          updates.entityType = "Customer";
                          updates.entityId = c.id;
                        }
                      }
                    }
                  } else {
                    setInvoiceMatchStatus("not_found");
                  }

                  setNewFollowUp({ ...newFollowUp, ...updates });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Pending Amount (₹)</Label>
              <Input type="number" placeholder="Enter amount" value={newFollowUp.pendingAmount} onChange={e => setNewFollowUp({ ...newFollowUp, pendingAmount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Input type="date" value={newFollowUp.followUpDate} onChange={e => setNewFollowUp({ ...newFollowUp, followUpDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Remark</Label>
              <Textarea placeholder="Enter any remarks..." className="min-h-[80px]" value={newFollowUp.remark} onChange={e => setNewFollowUp({ ...newFollowUp, remark: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFollowUpOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFollowUp}>Create Follow-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Request Dialog */}
      <Dialog open={isAddPaymentRequestOpen} onOpenChange={setIsAddPaymentRequestOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Payment Request</DialogTitle>
            <DialogDescription>Submit a payment request for approval.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={newPaymentRequest.entityType} onValueChange={v => setNewPaymentRequest({ ...newPaymentRequest, entityType: v as any, entityId: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select {newPaymentRequest.entityType}</Label>
                <EntityCombobox
                  entityType={newPaymentRequest.entityType || ""}
                  value={newPaymentRequest.entityId || ""}
                  onChange={v => {
                    let pending = 0;
                    let invoiceId = "";
                    if (v) {
                      if (newPaymentRequest.entityType === "Customer") {
                        const matched = customers.find(c => c.id === v);
                        if (matched) {
                          const customerBookings = bookings.filter(b => b.customer === matched.name?.split('---META---')[0]);
                          pending = customerBookings.reduce((sum, b) => sum + ((b.amount || 0) - (b.paid || 0)), 0);
                          const unpaid = customerBookings.find(b => ((b.amount || 0) - (b.paid || 0)) > 0);
                          if (unpaid) invoiceId = unpaid.id;
                        }
                      } else if (newPaymentRequest.entityType === "Vendor") {
                        const matched = vendors.find(v2 => v2.id === v);
                        if (matched) {
                          const vendorBookings = bookings.filter(b => b.supplier === matched.name?.split('---META---')[0]);
                          pending = vendorBookings.reduce((sum, b) => sum + ((b.purchasePrice || 0) - (b.paid || 0)), 0);
                          const unpaid = vendorBookings.find(b => ((b.purchasePrice || 0) - (b.paid || 0)) > 0);
                          if (unpaid) invoiceId = unpaid.id;
                        }
                      }
                    }
                    setNewPaymentRequest({ ...newPaymentRequest, entityId: v, amount: pending > 0 ? pending : (newPaymentRequest.amount || 0), invoiceId: invoiceId || newPaymentRequest.invoiceId });
                  }}
                  customers={customers}
                  vendors={vendors}
                  employees={employees}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Booking ID / Invoice No (Optional)</Label>
              <BookingCombobox
                bookings={allBookings}
                value={newPaymentRequest.invoiceId || ""}
                onChange={(val, matchingBooking) => {
                  let updates: any = { invoiceId: val };

                  if (matchingBooking) {
                    const isVendorMatch = !!matchingBooking.supplier;
                    if (isVendorMatch) {
                      const pending = (matchingBooking.purchasePrice || 0) - (matchingBooking.paid || 0);
                      updates.amount = pending > 0 ? pending : 0;
                      if (matchingBooking.supplier) {
                        const v = vendors.find(vend => vend.name && vend.name.includes(matchingBooking.supplier));
                        if (v) {
                          updates.entityType = "Vendor";
                          updates.entityId = v.id;
                        }
                      }
                    } else {
                      const pending = (matchingBooking.amount || 0) - (matchingBooking.paid || 0);
                      updates.amount = pending > 0 ? pending : 0;
                      if (matchingBooking.customer) {
                        const c = customers.find(cust => cust.name && cust.name.includes(matchingBooking.customer));
                        if (c) {
                          updates.entityType = "Customer";
                          updates.entityId = c.id;
                        }
                      }
                    }
                  }

                  setNewPaymentRequest({ ...newPaymentRequest, ...updates });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" placeholder="Enter amount" value={newPaymentRequest.amount || ""} onChange={e => setNewPaymentRequest({ ...newPaymentRequest, amount: Number(e.target.value) })} />
            </div>

            <div className="space-y-2">
              <Label>Remarks / Justification</Label>
              <Textarea placeholder="Explain the purpose of this payment..." className="min-h-[80px]" value={newPaymentRequest.remark} onChange={e => setNewPaymentRequest({ ...newPaymentRequest, remark: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPaymentRequestOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePaymentRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLogFollowUpOpen} onOpenChange={(open) => {
        setIsLogFollowUpOpen(open);
        if (!open) {
          setLogNotes("");
          setLogDate("");
          setSelectedFuId(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Follow-up</DialogTitle>
            <DialogDescription>
              Record the details of your latest communication and schedule the next step.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Interaction Notes</Label>
              <Textarea
                placeholder="What was discussed?"
                className="min-h-[100px]"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Next Follow-up Date</Label>
              <Input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Outcome / Status</Label>
              <Input
                placeholder="e.g. Call back tomorrow, Not interested, etc."
                value={logStatus}
                onChange={(e) => setLogStatus(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogFollowUpOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLog}>Save Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
        setIsDeleteModalOpen(open);
        if (!open) setDeleteTarget(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.type}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteTarget?.type?.toLowerCase()}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Popup Dialog */}
      <Dialog open={isActionPopupOpen} onOpenChange={setIsActionPopupOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {actionPopupType === "Accounts Verified" ? "Verify Request" :
                actionPopupType === "Approved" ? "Approve Request" :
                  actionPopupType === "Rejected" ? "Reject Request" :
                    actionPopupType === "Paid" ? "Mark as Paid" : "Update Status"}
            </DialogTitle>
            <DialogDescription>
              Please provide any remarks or justification (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Remark / Notes</Label>
              <Textarea
                placeholder="Type your notes here..."
                className="min-h-[100px]"
                value={actionPopupRemark}
                onChange={(e) => setActionPopupRemark(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionPopupOpen(false)}>Cancel</Button>
            <Button
              onClick={handleActionPopupSubmit}
              className={actionPopupType === 'Rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Viewer Dialog */}
      <Dialog open={isHistoryViewerOpen} onOpenChange={setIsHistoryViewerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approval Audit History</DialogTitle>
            <DialogDescription>Full trail of actions for this request.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {historyReqId && (
              <div className="space-y-6">
                {(paymentRequests.find(r => r.id === historyReqId)?.auditLog || []).map((log, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 bg-primary rounded-full mt-1"></div>
                      {idx !== ((paymentRequests.find(r => r.id === historyReqId)?.auditLog || []).length || 1) - 1 && (
                        <div className="w-px h-full bg-border mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold text-foreground">{log.action}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">By: {log.user}</p>
                      {log.remark && (
                        <div className="bg-muted p-3 rounded-lg text-sm text-foreground">
                          {log.remark}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryViewerOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer Dialog */}
      <Dialog open={isReceiptViewerOpen} onOpenChange={setIsReceiptViewerOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receiptReqId && (
            <div className="bg-card border border-border p-8 rounded-xl shadow-sm text-center">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
              <p className="text-muted-foreground mb-8">
                Request ID: {receiptReqId} <br />
                Receipt ID: {paymentRequests.find(r => r.id === receiptReqId)?.receiptId}
              </p>

              <div className="bg-secondary/30 rounded-xl p-6 text-left grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date</p>
                  <p className="font-medium text-foreground">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Entity</p>
                  <p className="font-medium text-foreground">{paymentRequests.find(r => r.id === receiptReqId)?.entityName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{formatINR(paymentRequests.find(r => r.id === receiptReqId)?.amount || 0)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => window.print()} variant="outline" className="mr-auto">Print</Button>
            <Button onClick={() => setIsReceiptViewerOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Expenses</DialogTitle>
            <DialogDescription>
              Filter expenses by date before exporting.
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
    </main>
  );
}
