import { useState, useMemo, useEffect } from "react";
import { formatINR } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download, History, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InsurancePaymentModal } from "./InsurancePaymentModal";
import { supabase } from "@/lib/supabase";
import { getAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/* ─── Payment History Modal ─── */
function PaymentHistoryModal({ policy, isOpen, onClose }: { policy: any; isOpen: boolean; onClose: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !policy) return;
    setLoading(true);

    (async () => {
      // Fetch transactions that reference this policy
      const policyRef = policy.policy_number || policy.id;
      const customerName = policy.customer_name || "";

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
      } else {
        const filtered = (data || []).filter((tx: any) => {
          const notesStr = typeof tx.notes === "string" ? tx.notes : "";
          
          let meta: any = {};
          if (notesStr) {
            try {
              const parsed = JSON.parse(notesStr);
              if (parsed._isMeta) meta = parsed;
            } catch { }
          }
          
          const matchesPolicyInNotes = policyRef ? notesStr.includes(policyRef) : false;
          const matchesInvoiceId = 
            (policyRef && meta.invoiceId === policyRef) || 
            (policy.id && meta.invoiceId === policy.id) || 
            (policy.policy_number && meta.invoiceId === policy.policy_number);
          
          return matchesPolicyInNotes || matchesInvoiceId;
        });
        setTransactions(filtered);
      }
      setLoading(false);
    })();
  }, [isOpen, policy]);

  const parseNotes = (notes: any) => {
    if (!notes) return {};
    if (typeof notes === "string") {
      try {
        const parsed = JSON.parse(notes);
        if (parsed._isMeta) return parsed;
      } catch { }
    }
    return {};
  };

  const customerPaid = Number(policy?.customer_paid) || 0;
  const addPayment = Number(policy?.amount_paid) || 0;
  const outstanding = Math.max(customerPaid - addPayment, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Payment History
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {policy?.customer_name} — {policy?.policy_number || "Draft"}
          </p>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 py-3 border-y border-border">
          <div className="text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="text-sm font-bold text-foreground">{formatINR(customerPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Paid</p>
            <p className="text-sm font-bold text-emerald-600">{formatINR(addPayment)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
            <p className={`text-sm font-bold ${outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>{formatINR(outstanding)}</p>
          </div>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No payment records found</p>
            </div>
          ) : (
            transactions.map((tx, idx) => {
              const meta = parseNotes(tx.notes);
              const mode = meta.paymentMode || tx.paymentMode || tx.payment_mode || "—";
              const ref = meta.reference || tx.reference || "—";
              const createdBy = meta.createdBy || "";
              const amount = Number(tx.amount) || 0;

              return (
                <div key={tx.id || idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-emerald-600 text-xs font-bold">₹</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{formatINR(amount)}</p>
                      <span className="text-[10px] text-muted-foreground">{tx.date || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600">{mode}</span>
                      {ref !== "—" && (
                        <span className="text-[10px] text-muted-foreground truncate">Ref: {ref}</span>
                      )}
                    </div>
                    {createdBy && (
                      <p className="text-[10px] text-muted-foreground mt-1">By: {createdBy}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Customer Status View ─── */
export function InsuranceCustomerStatusView({ policies, setPolicies }: { policies: any[], setPolicies: any }) {
  const auth = getAuth();
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [historyPolicy, setHistoryPolicy] = useState<any>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredPolicies = useMemo(() => {
    return policies
      .filter(p => p.customer_name?.toLowerCase().includes(customerSearchQuery.toLowerCase()))
      .filter(p => {
        if (!dateFrom && !dateTo) return true;
        const pDate = new Date(p.issue_date || 0).getTime();
        const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
        const toTime = dateTo ? new Date(dateTo).getTime() : Infinity;
        
        if (dateTo) {
            const toDateObj = new Date(dateTo);
            toDateObj.setHours(23, 59, 59, 999);
            return pDate >= fromTime && pDate <= toDateObj.getTime();
        }
        
        return pDate >= fromTime && pDate <= toTime;
      })
      .sort((a, b) => new Date(b.issue_date || 0).getTime() - new Date(a.issue_date || 0).getTime());
  }, [policies, customerSearchQuery, dateFrom, dateTo]);

  const handleExportCustomerStatus = () => {
    const csvData = [
      ["Customer Name", "Phone", "Vehicle No.", "School Name", "Customer Paid Amount", "Add Payment", "Total Outstanding", "Status"]
    ];

    filteredPolicies.forEach(p => {
      const customerPaidAmount = Number(p.customer_paid) || 0;
      const addPayment = Number(p.amount_paid) || 0;
      const outstanding = customerPaidAmount - addPayment;
      const status = outstanding === 0 ? "Paid" : outstanding < 0 ? "Extra Pay" : addPayment > 0 ? "Partial" : "Pending";

      csvData.push([
        p.customer_name || "Unknown",
        p.mobile_number || "",
        p.vehicle_number || "-",
        p.school_name || "-",
        customerPaidAmount.toString(),
        addPayment.toString(),
        outstanding.toString(),
        status
      ]);
    });

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `General_Insurance_Customer_Status_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const customerStats = filteredPolicies.reduce((acc, p) => {
    const customerPaidAmount = Number(p.customer_paid) || 0;
    const addPayment = Number(p.amount_paid) || 0;
    const outstanding = customerPaidAmount - addPayment;
    
    return {
      total: acc.total + customerPaidAmount,
      paid: acc.paid + addPayment,
      pending: acc.pending + outstanding
    };
  }, { total: 0, paid: 0, pending: 0 });

  const handleSavePayment = async (amount: number, date: string, mode: string, reference: string, nextFollowUp?: string) => {
    if (!selectedPolicy) return;

    // Create transaction record
    const { error: txError } = await supabase.from("transactions").insert([{
      id: `TXN-${Math.floor(Math.random() * 1000000)}`,
      date,
      type: "Payment",
      entityType: "Customer",
      entityName: selectedPolicy.customer_name || "Unknown",
      amount,
      paymentMode: mode,
      notes: JSON.stringify({
        _isMeta: true,
        module: "Insurance",
        text: `Customer payment for policy ${selectedPolicy.policy_number}`,
        createdBy: auth?.name || "Unknown",
        reference,
        status: "Completed",
        invoiceId: selectedPolicy.policy_number || selectedPolicy.id,
      })
    }]);

    if (txError) throw txError;

    // Update policy record
    const customerPaidAmount = Number(selectedPolicy.customer_paid) || 0;
    const currentAddPayment = Number(selectedPolicy.amount_paid) || 0;
    const newAddPayment = currentAddPayment + amount;
    
    const outstanding = customerPaidAmount - newAddPayment;

    let newStatus = "Pending";
    if (outstanding === 0) {
      newStatus = "Paid";
    } else if (outstanding < 0) {
      newStatus = "Extra Pay";
    } else if (newAddPayment > 0) {
      newStatus = "Partial";
    }

    const { error: policyError } = await supabase.from("insurance_policies")
      .update({
        amount_paid: newAddPayment,
        payment_status: newStatus
      })
      .eq("id", selectedPolicy.id);

    if (policyError) {
      console.error("Error updating policy:", policyError);
      throw policyError;
    }

    if (newStatus === "Partial" && nextFollowUp) {
      await supabase.from("payment_followups").insert([{
        invoiceId: selectedPolicy.policy_number || selectedPolicy.id,
        customerId: "",
        customerName: selectedPolicy.customer_name || "Unknown",
        customerPhone: selectedPolicy.mobile_number || "",
        invoiceDate: selectedPolicy.issue_date || new Date().toISOString().split('T')[0],
        totalAmount: customerPaidAmount,
        pendingAmount: outstanding,
        nextFollowUpDate: nextFollowUp,
        nextFollowUpTime: "10:00",
        status: "Pending",
        notes: `Follow-up for General Insurance policy ${selectedPolicy.policy_number || ""}`,
        createdBy: auth?.name || "Unknown"
      }]);
    }

    // Update local state
    if (setPolicies) {
      setPolicies((prev: any[]) => prev.map(p =>
        p.id === selectedPolicy.id
          ? { ...p, amount_paid: newAddPayment, payment_status: newStatus }
          : p
      ));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Customer Amount</p>
          <h3 className="text-3xl font-bold text-foreground">{formatINR(customerStats.total)}</h3>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Paid (Add Payment)</p>
          <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{formatINR(customerStats.paid)}</h3>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Outstanding</p>
          <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-500">{formatINR(customerStats.pending)}</h3>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="pl-9 bg-background/50"
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-[140px]"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[140px]"
            />
          </div>
        </div>
        <Button variant="outline" onClick={handleExportCustomerStatus} className="gap-2 shrink-0">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Vehicle No.</th>
                <th className="px-6 py-4">School Name</th>

                <th className="px-6 py-4 text-right">Customer Paid Amount</th>
                <th className="px-6 py-4 text-right">Add Payment</th>
                <th className="px-6 py-4 text-right">Total Outstanding</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No policies found.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((p) => {
                    const customerPaidAmount = Number(p.customer_paid) || 0;
                    const addPayment = Number(p.amount_paid) || 0;
                    const outstanding = customerPaidAmount - addPayment;
                    const status = outstanding === 0 ? "Paid" : outstanding < 0 ? "Extra Pay" : addPayment > 0 ? "Partial" : "Pending";

                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{p.customer_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{p.mobile_number}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">
                          {p.vehicle_number || "-"}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {p.school_name || "-"}
                        </td>


                        <td className="px-6 py-4 text-right font-medium text-foreground">
                          {formatINR(customerPaidAmount)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-500">
                          {formatINR(addPayment)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-foreground">
                          {outstanding < 0 ? `- ${formatINR(Math.abs(outstanding))}` : formatINR(outstanding)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : status === 'Extra Pay' ? 'bg-blue-500/10 text-blue-500' : status === 'Partial' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setHistoryPolicy(p)}
                              className="h-8 px-2 text-muted-foreground hover:text-primary"
                              title="Payment History"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            {outstanding > 0 && (
                              <Button size="sm" variant="outline" onClick={() => setSelectedPolicy(p)} className="h-8">
                                <Plus className="h-4 w-4 mr-1" />
                                Pay
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPolicy && (
        <InsurancePaymentModal
          isOpen={!!selectedPolicy}
          onClose={() => setSelectedPolicy(null)}
          title={`Add Customer Payment: ${selectedPolicy.customer_name || 'Unknown'}`}
          maxAmount={Math.max((Number(selectedPolicy.customer_paid) || 0) - (Number(selectedPolicy.amount_paid) || 0), 0)}
          policy={selectedPolicy}
          onSubmit={handleSavePayment}
        />
      )}

      <PaymentHistoryModal
        policy={historyPolicy}
        isOpen={!!historyPolicy}
        onClose={() => setHistoryPolicy(null)}
      />
    </div>
  );
}

