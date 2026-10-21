import React, { useState, useMemo, useEffect } from "react";
import { formatINR } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Search, Download } from "lucide-react";
import { InsurancePaymentModal } from "./InsurancePaymentModal";
import { supabase } from "@/lib/supabase";
import { getAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";

export function InsuranceVendorStatusView({ policies, vendors, setPolicies }: { policies: any[], vendors: any[], setPolicies: any }) {
  const auth = getAuth();
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data } = await supabase.from('transactions').select('*').eq('entityType', 'Vendor');
      if (data) setTransactions(data);
    };
    fetchTransactions();
  }, []);

  const getVendorName = (p: any) => p.vendor_id === "other" ? (p.custom_vendor || "Other") : (vendors.find(v => v.id === p.vendor_id)?.name || p.vendor_id);

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
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
    });
  }, [policies, dateFrom, dateTo]);

  const handleExportVendorStatus = () => {
    const csvData = [
      ["Vendor Name", "Policies Count", "Vendor Pending Amount", "Payments (Out)", "Total Balance", "Status", "Associated Policies", "Associated Customers"]
    ];

    uniqueVendors.forEach(vendorName => {
      const vPolicies = filteredPolicies.filter(p => getVendorName(p) === vendorName);
      
      const vendorPendingAmount = vPolicies.reduce((sum, p) => sum + (Number(p.vendor_paid) || 0), 0);
      const paymentsOut = vPolicies.reduce((sum, p) => sum + (Number(p.payments_out) || 0), 0);
      const rawBalance = vendorPendingAmount - paymentsOut;
      const status = rawBalance === 0 ? "Paid" : rawBalance < 0 ? "Extra Pay" : paymentsOut > 0 ? "Partial" : "Pending";

      const policiesText = vPolicies.map(p => `${p.vehicle_number || "No Vehicle No."} (${p.customer_name || "Unknown"})`).join("; ");
      
      const customerSet = new Set<string>();
      vPolicies.forEach(p => {
        if (p.customer_name) customerSet.add(p.customer_name);
      });
      const vCustomers = Array.from(customerSet);
      const customersText = vCustomers.map(cust => `${cust} (${vPolicies.filter(p => p.customer_name === cust).length} Policies)`).join("; ");

      csvData.push([
        vendorName || "Unknown",
        vPolicies.length.toString(),
        vendorPendingAmount.toString(),
        paymentsOut.toString(),
        rawBalance.toString(),
        status,
        policiesText,
        customersText
      ]);
    });

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `General_Insurance_Vendor_Status_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const vendorStats = filteredPolicies.reduce((acc, p) => {
    const vendPaid = Number(p.vendor_paid) || 0; // Vendor Pending Amount
    const paymentsOut = Number(p.payments_out) || 0;
    const pending = vendPaid - paymentsOut;
    return {
      totalPaid: acc.totalPaid + paymentsOut,
      totalPending: acc.totalPending + pending
    };
  }, { totalPaid: 0, totalPending: 0 });

  const handleSavePayment = async (amount: number, date: string, mode: string, reference: string) => {
    if (!selectedPolicy) return;

    // Create payment transaction
    const { error: txError } = await supabase.from("transactions").insert([{
      id: `TXN-${Math.floor(Math.random() * 1000000)}`,
      date,
      type: "Payment",
      entityType: "Vendor",
      entityName: getVendorName(selectedPolicy),
      amount,
      paymentMode: mode,
      notes: JSON.stringify({
        _isMeta: true,
        module: "Insurance",
        text: `Vendor payment for policy ${selectedPolicy.policy_number}`,
        createdBy: auth?.name || "Unknown",
        reference,
        status: "Completed",
        invoiceId: selectedPolicy.policy_number || selectedPolicy.id,
      })
    }]);

    if (txError) throw txError;

    // Update policy record (accumulate payments_out instead of vendor_paid)
    const currentPaymentsOut = Number(selectedPolicy.payments_out) || 0;
    const newPaymentsOut = currentPaymentsOut + amount;

    const { error: policyError } = await supabase.from("insurance_policies")
      .update({ 
        notes: JSON.stringify({
          ...(typeof selectedPolicy.notes === 'string' && selectedPolicy.notes.includes('_isMeta') ? JSON.parse(selectedPolicy.notes) : { _isMeta: true, text: selectedPolicy.notes || "" }),
          payments_out: newPaymentsOut
        })
      })
      .eq("id", selectedPolicy.id);

    if (policyError) throw policyError;

    // Update local state
    if (setPolicies) {
      setPolicies((prev: any[]) => prev.map(p => 
        p.id === selectedPolicy.id 
          ? { ...p, payments_out: newPaymentsOut } 
          : p
      ));
    }
    
    // Optimistically update transactions
    setTransactions(prev => [{
      id: `TXN-${Math.floor(Math.random() * 1000000)}`,
      date,
      type: "Payment",
      entityType: "Vendor",
      entityName: getVendorName(selectedPolicy),
      amount,
      paymentMode: mode,
      notes: JSON.stringify({
        _isMeta: true,
        reference,
      })
    }, ...prev]);
  };

  // Group policies by vendor
  const allVendorNames = new Set<string>();
  filteredPolicies.forEach(p => {
    const name = getVendorName(p);
    if (name) allVendorNames.add(name);
  });

  const uniqueVendors = Array.from(allVendorNames)
    .filter(Boolean)
    .filter(name => name.toLowerCase().includes(vendorSearchQuery.toLowerCase()))
    .sort();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Policies Handled</p>
          <h3 className="text-3xl font-bold text-foreground">{filteredPolicies.length}</h3>
        </div>
        
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Paid to Vendors</p>
          <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-500">{formatINR(vendorStats.totalPaid)}</h3>
        </div>
        
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Total Pending Amounts</p>
          <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-500">{formatINR(vendorStats.totalPending)}</h3>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              className="pl-9 bg-background/50"
              value={vendorSearchQuery}
              onChange={(e) => setVendorSearchQuery(e.target.value)}
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
        <Button variant="outline" onClick={handleExportVendorStatus} className="gap-2 shrink-0">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground font-semibold">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl w-10"></th>
                <th className="px-6 py-4">Vendor Name</th>
                <th className="px-6 py-4">Policies</th>
                <th className="px-6 py-4 text-right">Vendor Pending Amount</th>
                <th className="px-6 py-4 text-right">Payments (Out)</th>
                <th className="px-6 py-4 text-right">Total Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {uniqueVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No vendors found.</p>
                    </div>
                  </td>
                </tr>
              ) : uniqueVendors.map((vendorName, index) => {
                const vendorId = vendorName; // We use the name as ID here since we don't always have a strict vendor object
                const isExpanded = expandedVendor === vendorId;
                
                const vPolicies = filteredPolicies.filter(p => getVendorName(p) === vendorName);
                
                const vendorPendingAmount = vPolicies.reduce((sum, p) => sum + (Number(p.vendor_paid) || 0), 0);
                const paymentsOut = vPolicies.reduce((sum, p) => sum + (Number(p.payments_out) || 0), 0);
                const rawBalance = vendorPendingAmount - paymentsOut;
                
                const status = rawBalance === 0 ? "Paid" : rawBalance < 0 ? "Extra Pay" : paymentsOut > 0 ? "Partial" : "Pending";
                
                const customerSet = new Set<string>();
                vPolicies.forEach(p => {
                  if (p.customer_name) customerSet.add(p.customer_name);
                });
                const vCustomers = Array.from(customerSet);
                
                const vendorTxns = transactions.filter(t => t.entityName === vendorName).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                return (
                  <React.Fragment key={vendorId}>
                    <tr 
                      onClick={() => setExpandedVendor(isExpanded ? null : vendorId)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {vendorName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{vPolicies.length}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        {formatINR(vendorPendingAmount)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-500">
                        {formatINR(paymentsOut)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-500">
                        {rawBalance < 0 ? `- ${formatINR(Math.abs(rawBalance))}` : formatINR(rawBalance)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : status === 'Extra Pay' ? 'bg-blue-500/10 text-blue-500' : status === 'Partial' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {rawBalance > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              const policyToPay = vPolicies.find(p => (Number(p.vendor_paid) || 0) - (Number(p.payments_out) || 0) > 0) || vPolicies[0];
                              setSelectedPolicy(policyToPay);
                            }} 
                            className="h-8"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Pay Vendor
                          </Button>
                        )}
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-secondary/5 border-b border-border">
                        <td colSpan={7} className="p-0">
                          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                            {/* Policies List */}
                            <div className="bg-background rounded-xl border border-border p-4 space-y-3">
                              <h4 className="font-semibold flex justify-between items-center text-sm">
                                <span>Policies via Vendor</span>
                                <span className="bg-secondary px-2 py-0.5 rounded-full text-[10px]">{vPolicies.length}</span>
                              </h4>
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {vPolicies.length > 0 ? vPolicies.map((p, i) => (
                                  <div key={i} className="text-xs p-2 rounded-lg border border-border/50 bg-secondary/10">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="font-medium text-blue-600 dark:text-blue-400">{p.vehicle_number || "No Vehicle No."}</span>
                                      {(() => {
                                        const polVendorPending = Number(p.vendor_paid) || 0;
                                        const polPaymentsOut = Number(p.payments_out) || 0;
                                        const polTotalBal = Math.max(polVendorPending - polPaymentsOut, 0);
                                        const polStatus = polTotalBal === 0 ? "Paid" : polPaymentsOut > 0 ? "Partial" : "Pending";
                                        return (
                                          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm ${polStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : polStatus === 'Partial' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {polStatus}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    <div className="flex justify-between mt-1">
                                      <span className="text-muted-foreground">{p.customer_name || "Unknown"}</span>
                                      <span className="text-muted-foreground">{p.issue_date || "-"}</span>
                                    </div>
                                  </div>
                                )) : <div className="text-xs text-muted-foreground italic">No policies found for this vendor.</div>}
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
                                      {vPolicies.filter(p => p.customer_name === cust).length} Policies
                                    </div>
                                  </div>
                                )) : <div className="text-xs text-muted-foreground italic">No customers found for this vendor.</div>}
                              </div>
                            </div>
                            
                            {/* Payment History List */}
                            <div className="bg-background rounded-xl border border-border p-4 space-y-3">
                              <h4 className="font-semibold flex justify-between items-center text-sm">
                                <span>Payment History</span>
                                <span className="bg-secondary px-2 py-0.5 rounded-full text-[10px]">{vendorTxns.length}</span>
                              </h4>
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {vendorTxns.length > 0 ? vendorTxns.map((txn, i) => (
                                  <div key={i} className="text-xs p-2 rounded-lg border border-border/50 bg-secondary/10 flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                      <span className="font-medium text-emerald-600 dark:text-emerald-500">{formatINR(txn.amount)}</span>
                                      <span className="text-muted-foreground">{txn.date}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-muted-foreground">{txn.paymentMode}</span>
                                      {txn.notes && (() => {
                                        try {
                                          const notesObj = JSON.parse(txn.notes);
                                          return <span className="text-muted-foreground truncate max-w-[100px]">{notesObj.reference || "No Ref"}</span>
                                        } catch(e) {
                                          return <span className="text-muted-foreground truncate max-w-[100px]">{txn.notes}</span>
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )) : <div className="text-xs text-muted-foreground italic">No payment history found.</div>}
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
      
      {selectedPolicy && (() => {
        const vendorPending = Number(selectedPolicy.vendor_paid) || 0;
        const paymentsOut = Number(selectedPolicy.payments_out) || 0;
        const maxAmount = Math.max(vendorPending - paymentsOut, 0);
        
        return (
          <InsurancePaymentModal
            isOpen={!!selectedPolicy}
            onClose={() => setSelectedPolicy(null)}
            title={`Pay Vendor: ${getVendorName(selectedPolicy) || 'Unknown'}`}
            maxAmount={maxAmount}
            policy={selectedPolicy}
            onSubmit={handleSavePayment}
          />
        );
      })()}
    </div>
  );
}
