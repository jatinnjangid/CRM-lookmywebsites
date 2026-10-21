import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download, Shield, FileText, Table2, Briefcase } from "lucide-react";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { InsuranceDashboard } from "@/components/insurance/InsuranceDashboard";
import { InsuranceTable } from "@/components/insurance/InsuranceTable";
import { InsuranceForm } from "@/components/insurance/InsuranceForm";
import { RenewalsView } from "@/components/insurance/RenewalsView";
import { InsuranceVendorsView } from "@/components/insurance/InsuranceVendorsView";
import { InsuranceCompaniesView } from "@/components/insurance/InsuranceCompaniesView";
import { InsuranceTransactionsView } from "@/components/insurance/InsuranceTransactionsView";
import { InsuranceCustomerStatusView } from "@/components/insurance/InsuranceCustomerStatusView";
import { InsuranceVendorStatusView } from "@/components/insurance/InsuranceVendorStatusView";
import { getAuth } from "@/lib/auth";

export const Route = createFileRoute("/crm/insurance")({
  component: GeneralInsurancePage,
});

export type TabType = "Policies" | "Renewals" | "Vendors" | "Companies" | "CustomerStatus" | "VendorStatus" | "GenTransactions" | "Claims";

function GeneralInsurancePage() {
  const auth = getAuth();
  const isAdmin = (auth?.role === "admin" || auth?.role === "manager") && !auth?.name.toLowerCase().includes("suman");

  const [activeTab, setActiveTab] = useState<TabType>("Policies");
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [policyToDelete, setPolicyToDelete] = useState<any>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportCustomer, setExportCustomer] = useState("all");

  const [policies, setPolicies] = useSupabaseTable<any[]>("insurance_policies", []);
  const [companies] = useSupabaseTable<any[]>("insurance_companies", []);
  const [vendors] = useSupabaseTable<any[]>("insurance_vendors", []);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let active = 0, expired = 0, todaysRenewals = 0;
    let pending = 0, fullPaid = 0;
    let totalPremium = 0, totalProfit = 0, totalPendingAmount = 0;

    policies.forEach(p => {
      const expiry = new Date(p.expiry_date);
      expiry.setHours(0, 0, 0, 0);

      if (p.status === 'Expired' || expiry.getTime() < today.getTime()) expired++;
      else active++;

      if (expiry.getTime() === today.getTime()) todaysRenewals++;

      if (p.payment_status === 'Pending' || p.payment_status === 'Partial') pending++;
      else if (p.payment_status === 'Full Paid') fullPaid++;

      totalPremium += (Number(p.total_premium) || 0);
      totalProfit += (Number(p.profit) || 0);
      const paid = Number(p.customer_paid) || Number(p.amount_paid) || 0;
      const amountPending = (Number(p.total_premium) || 0) - paid;
      if (amountPending > 0) totalPendingAmount += amountPending;
    });

    return {
      totalPolicies: policies.length,
      activePolicies: active,
      expiredPolicies: expired,
      todaysRenewals,
      pendingPayments: pending,
      fullPaid,
      totalPremium,
      totalProfit,
      totalPendingAmount,
      companiesCount: companies.length,
      vendorsCount: vendors.length
    };
  }, [policies, companies, vendors]);

  const handleAddNew = () => {
    setEditingPolicy(null);
    setShowForm(true);
  };

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    setShowForm(true);
  };

  const handleDuplicate = (policy: any) => {
    // When duplicating or renewing, clear the ID and specific fields like policy number
    const dup = { ...policy };
    delete dup.id;
    delete dup.created_at;
    dup.policy_number = "";
    dup.payment_status = "Pending";
    dup.customer_paid = 0;
    dup.vendor_paid = 0;
    dup.transaction_reference = "";

    // Auto increment dates by 1 year for quick renewals
    if (dup.issue_date) {
      const issue = new Date(dup.issue_date);
      issue.setFullYear(issue.getFullYear() + 1);
      dup.issue_date = issue.toISOString().split('T')[0];
    }
    if (dup.expiry_date) {
      const exp = new Date(dup.expiry_date);
      exp.setFullYear(exp.getFullYear() + 1);
      dup.expiry_date = exp.toISOString().split('T')[0];
    }

    setEditingPolicy(dup);
    setShowForm(true);
  };

  const handleDelete = (policy: any) => {
    setPolicyToDelete(policy);
  };

  const confirmDeletePolicy = async () => {
    if (policyToDelete) {
      const filtered = policies.filter(p => p.id !== policyToDelete.id);
      setPolicies(filtered);
      const idToDelete = policyToDelete.id;
      setPolicyToDelete(null);
      await supabase.from("insurance_policies").delete().eq("id", idToDelete);
    }
  };

  const handleSavePolicy = async (updatedData: any) => {
    const validColumns = [
      'id', 'school_name', 'reference_name', 'customer_name', 'mobile_number', 'alternate_mobile', 
      'email', 'address', 'city', 'state', 'customer_id', 'company_id', 'vendor_id', 'policy_number', 
      'issue_date', 'expiry_date', 'vehicle_number', 'vehicle_model', 'seating_capacity', 'chassis_number', 
      'engine_number', 'fuel_type', 'registration_date', 'policy_type', 'idv_value', 'previous_policy_number', 
      'previous_insurer', 'ncb_percentage', 'od_premium', 'tp_premium', 'net_premium', 'gst', 'total_premium', 
      'customer_paid', 'vendor_paid', 'profit', 'payment_date', 'payment_mode', 'transaction_reference', 
      'payment_status', 'notes', 'status', 'created_at', 'paid_by', 'amount_paid'
    ];

    const dbPayload: any = {};
    const metaObj: any = {};
    let hasMeta = false;

    // Separate valid columns and extra fields
    Object.keys(updatedData).forEach(key => {
      if (validColumns.includes(key)) {
        dbPayload[key] = updatedData[key];
      } else {
        metaObj[key] = updatedData[key];
        hasMeta = true;
      }
    });

    if (hasMeta) {
      const currentNotes = dbPayload.notes || "";
      dbPayload.notes = JSON.stringify({ _isMeta: true, text: currentNotes, ...metaObj });
    }

    if (updatedData.id) {
      const newPolicies = policies.map(p => p.id === updatedData.id ? updatedData : p);
      setPolicies(newPolicies);
      
      const { id, ...rest } = dbPayload;
      await supabase.from("insurance_policies").update(rest).eq("id", id);
    } else {
      const newId = crypto.randomUUID();
      const newCreatedAt = new Date().toISOString();
      
      const newPolicy = {
        ...updatedData,
        id: newId,
        created_at: newCreatedAt
      };
      setPolicies([newPolicy, ...policies]);
      
      dbPayload.id = newId;
      dbPayload.created_at = newCreatedAt;
      await supabase.from("insurance_policies").insert([dbPayload]);
    }
    setShowForm(false);
  };

  const uniqueCustomers = useMemo(() => {
    const customers = new Set<string>();
    policies.forEach(p => {
      if (p.customer_name) customers.add(p.customer_name);
    });
    return Array.from(customers).sort();
  }, [policies]);

  const getFilteredExportPolicies = () => {
    let filtered = [...policies];
    if (exportStartDate) {
      filtered = filtered.filter(p => p.issue_date >= exportStartDate);
    }
    if (exportEndDate) {
      filtered = filtered.filter(p => p.issue_date <= exportEndDate);
    }
    if (exportCustomer !== "all") {
      filtered = filtered.filter(p => p.customer_name === exportCustomer);
    }
    return filtered;
  };

  const exportToExcel = () => {
    const filtered = getFilteredExportPolicies();
    if (filtered.length === 0) {
      alert("No policies match the selected filters.");
      return;
    }

    const headers = [
      "Policy No", "Issue Date", "Expiry Date", "Client / Company", "School Name", "Reference Name", 
      "Referred By", "Customer Name", "Mobile Number", "Alt. Mobile", "Email", "City", "State", "Address", 
      "Additional Passenger Names", "Insurance Company", "Vendor", "Vehicle Number", "Vehicle Model", 
      "Seating Capacity", "Registration Date", "Policy Type", "IDV Value", "Previous Policy No", 
      "Previous Insurer", "NCB %", "OD Premium", "TP Premium", "Net Premium", "GST", "Total Premium", 
      "Customer Paid Amounts", "Vendor Paid", "Calculated Profit", "Transaction Ref.", "Payment Status", "Remarks"
    ];
    
    const csvRows = [headers.join(",")];
    
    for (const p of filtered) {
      const row = [
        p.policy_number || "",
        p.issue_date || "",
        p.expiry_date || "",
        `"${p.company_name || ""}"`,
        `"${p.school_name || ""}"`,
        `"${p.reference_name || ""}"`,
        `"${p.referred_by || ""}"`,
        `"${p.customer_name || ""}"`,
        p.mobile_number || "",
        p.alternate_mobile || "",
        p.email || "",
        `"${p.city || ""}"`,
        `"${p.state || ""}"`,
        `"${p.address || ""}"`,
        `"${p.additional_passenger_names || ""}"`,
        `"${p.insurance_company || p.company_id || ""}"`,
        `"${p.vendor_name || p.vendor_id || ""}"`,
        p.vehicle_number || "",
        `"${p.vehicle_model || ""}"`,
        p.seating_capacity || "",
        p.registration_date || "",
        p.policy_type || "",
        p.idv_value || "",
        p.previous_policy_number || "",
        `"${p.previous_insurer || ""}"`,
        p.ncb_percentage || "",
        p.od_premium || 0,
        p.tp_premium || 0,
        p.net_premium || 0,
        p.gst || "",
        p.total_premium || 0,
        p.customer_paid || p.amount_paid || 0,
        p.vendor_paid || 0,
        p.profit || 0,
        `"${p.transaction_reference || ""}"`,
        p.payment_status || "",
        `"${p.notes || ""}"`
      ];
      csvRows.push(row.join(","));
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `insurance_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToWord = () => {
    const filtered = getFilteredExportPolicies();
    if (filtered.length === 0) {
      alert("No policies match the selected filters.");
      return;
    }

    const tableHeader =
      "<tr><th>Policy No</th><th>Customer</th><th>Mobile</th><th>Vehicle No</th><th>Total Premium</th><th>Profit</th><th>Issue Date</th><th>Expiry Date</th><th>Status</th></tr>";

    const tableRows = filtered
      .map(
        (p) =>
          `<tr><td>${p.policy_number || ""}</td><td>${p.customer_name || ""}</td><td>${p.mobile_number || ""}</td><td>${p.vehicle_number || ""}</td><td>₹${p.total_premium || 0}</td><td>₹${p.profit || 0}</td><td>${p.issue_date || ""}</td><td>${p.expiry_date || ""}</td><td>${p.status || ""}</td></tr>`,
      )
      .join("");

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Insurance Export</title><style>table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; } th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head>
      <body><h2>Grand Journeys CRM - Insurance Export</h2><table>${tableHeader}${tableRows}</table></body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `insurance_export_${new Date().toISOString().slice(0, 10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const filtered = getFilteredExportPolicies();
    if (filtered.length === 0) {
      alert("No policies match the selected filters.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHeader =
      "<tr><th>Policy No</th><th>Customer</th><th>Mobile</th><th>Vehicle No</th><th>Total Premium</th><th>Profit</th><th>Issue Date</th><th>Expiry Date</th><th>Status</th></tr>";

    const tableRows = filtered
      .map(
        (p) =>
          `<tr><td>${p.policy_number || ""}</td><td>${p.customer_name || ""}</td><td>${p.mobile_number || ""}</td><td>${p.vehicle_number || ""}</td><td>₹${p.total_premium || 0}</td><td>₹${p.profit || 0}</td><td>${p.issue_date || ""}</td><td>${p.expiry_date || ""}</td><td>${p.status || ""}</td></tr>`,
      )
      .join("");

    const css = `body{font-family:sans-serif;padding:20px;color:#333}h2{color:#059669;margin-bottom:5px}p{font-size:12px;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f9fafb;font-weight:bold}tr:nth-child(even){background:#f3f4f6}`;
    const styleEl = printWindow.document.createElement("style");
    styleEl.textContent = css;
    printWindow.document.head.appendChild(styleEl);
    const titleEl = printWindow.document.createElement("title");
    titleEl.textContent = "Insurance Export PDF";
    printWindow.document.head.appendChild(titleEl);
    const bodyHtml = `<h2>Grand Journeys CRM - Insurance Export</h2><p>Generated on ${new Date().toLocaleDateString("en-IN")} | Total Policies: ${filtered.length}</p><table><thead>${tableHeader}</thead><tbody>${tableRows}</tbody></table>`;
    const wrapper = printWindow.document.createElement("div");
    wrapper.innerHTML = bodyHtml;
    printWindow.document.body.appendChild(wrapper);
    const script = printWindow.document.createElement("script");
    script.textContent =
      "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
    printWindow.document.body.appendChild(script);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 h-full overflow-y-auto w-full max-w-full m-0 bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            General Insurance
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage insurance policies, renewals, companies, and vendors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button variant="outline" className="hidden md:flex" onClick={() => setIsExportOpen(true)}>
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          )}
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> New Policy
          </Button>
        </div>
      </div>

      <InsuranceDashboard stats={stats} />

      <div className="flex justify-center w-full">
        <div className="flex flex-wrap items-center justify-center gap-1 bg-muted/50 p-1 rounded-xl w-fit shadow-xs">
          <Button
            variant={activeTab === "Policies" ? "default" : "ghost"}
            size="sm"
            className={activeTab === "Policies" ? "bg-card text-foreground shadow-sm rounded-lg" : "text-muted-foreground hover:text-foreground"}
            onClick={() => setActiveTab("Policies")}
          >
            All Policies
          </Button>
          <Button
            variant={activeTab === "Renewals" ? "default" : "ghost"}
            size="sm"
            className={activeTab === "Renewals" ? "bg-card text-foreground shadow-sm rounded-lg" : "text-muted-foreground hover:text-foreground"}
            onClick={() => setActiveTab("Renewals")}
          >
            Upcoming Renewals
          </Button>
          <Button
            variant={activeTab === "Vendors" ? "default" : "ghost"}
            size="sm"
            className={activeTab === "Vendors" ? "bg-card text-foreground shadow-sm rounded-lg" : "text-muted-foreground hover:text-foreground"}
            onClick={() => setActiveTab("Vendors")}
          >
            Vendors
          </Button>
          <Button
            variant={activeTab === "Companies" ? "default" : "ghost"}
            size="sm"
            className={activeTab === "Companies" ? "bg-card text-foreground shadow-sm rounded-lg" : "text-muted-foreground hover:text-foreground"}
            onClick={() => setActiveTab("Companies")}
          >
            Companies
          </Button>
          <Button
            variant={activeTab === "CustomerStatus" ? "default" : "ghost"}
            size="sm"
            className={activeTab === "CustomerStatus" ? "bg-card text-foreground shadow-sm rounded-lg" : "text-muted-foreground hover:text-foreground"}
            onClick={() => setActiveTab("CustomerStatus")}
          >
            Customer Status
          </Button>
          <Button
            variant={activeTab === "VendorStatus" ? "default" : "ghost"}
            size="sm"
            className={activeTab === "VendorStatus" ? "bg-card text-foreground shadow-sm rounded-lg" : "text-muted-foreground hover:text-foreground"}
            onClick={() => setActiveTab("VendorStatus")}
          >
            Vendor Status
          </Button>
          <Button
            variant={activeTab === "GenTransactions" ? "default" : "ghost"}
            size="sm"
            className={activeTab === "GenTransactions" ? "bg-card text-foreground shadow-sm rounded-lg" : "text-muted-foreground hover:text-foreground"}
            onClick={() => setActiveTab("GenTransactions")}
          >
            Gen Transactions
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "Policies" && (
          <div className="animate-in fade-in duration-300">
            <InsuranceTable
              policies={policies}
              companies={companies}
              vendors={vendors}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          </div>
        )}

        {activeTab === "Renewals" && (
          <RenewalsView
            policies={policies}
            companies={companies}
            vendors={vendors}
            onRenew={handleDuplicate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {activeTab === "Vendors" && <InsuranceVendorsView />}
        {activeTab === "Companies" && <InsuranceCompaniesView />}
        
        {activeTab === "CustomerStatus" && (
          <InsuranceCustomerStatusView policies={policies} setPolicies={setPolicies} />
        )}
        
        {activeTab === "VendorStatus" && (
          <InsuranceVendorStatusView policies={policies} vendors={vendors} setPolicies={setPolicies} />
        )}

        {activeTab === "GenTransactions" && (
          <InsuranceTransactionsView policies={policies} />
        )}

        {activeTab === "Claims" && (
          <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-2">Claims Management</h3>
            <p className="text-muted-foreground text-center max-w-md">The Claims module is currently under construction. Check back soon for updates.</p>
          </div>
        )}
      </div>

      {showForm && (
        <InsuranceForm
          onClose={() => setShowForm(false)}
          initialData={editingPolicy}
          onSave={handleSavePolicy}
          companies={companies}
          vendors={vendors}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!policyToDelete}
        onClose={() => setPolicyToDelete(null)}
        onConfirm={confirmDeletePolicy}
        title="Delete Policy"
        description="Are you sure you want to permanently delete this policy? This action cannot be undone."
      />

      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Insurance Data</DialogTitle>
            <DialogDescription>
              Filter policies by issue date or customer before exporting.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  className="rounded-xl"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={exportCustomer} onValueChange={setExportCustomer}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {uniqueCustomers.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 py-4">
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
