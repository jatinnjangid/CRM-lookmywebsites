import React from "react";
import { Shield, ShieldAlert, ShieldCheck, Banknote, Landmark, IndianRupee, PieChart, Users } from "lucide-react";
import { getAuth } from "@/lib/auth";

interface InsuranceDashboardProps {
  stats: {
    totalPolicies: number;
    activePolicies: number;
    expiredPolicies: number;
    todaysRenewals: number;
    pendingPayments: number;
    fullPaid: number;
    totalPremium: number;
    totalProfit: number;
    totalPendingAmount: number;
    companiesCount: number;
    vendorsCount: number;
  };
}

export function InsuranceDashboard({ stats }: InsuranceDashboardProps) {
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const auth = getAuth();
  const isAdmin = auth?.role === "admin";

  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 mb-8 ${isAdmin ? "md:grid-cols-3 lg:grid-cols-6" : "md:grid-cols-5"}`}>
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
          Total Policies
        </p>
        <p className="text-xl xl:text-2xl font-display font-bold text-foreground">
          {stats.totalPolicies}
        </p>
      </div>

      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <ShieldCheck className="h-10 w-10 text-emerald-600" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
          Active Policies
        </p>
        <p className="text-xl xl:text-2xl font-display font-bold text-emerald-600">
          {stats.activePolicies}
        </p>
      </div>

      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <ShieldAlert className="h-10 w-10 text-rose-600" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
          Expired Policies
        </p>
        <p className="text-xl xl:text-2xl font-display font-bold text-rose-600">
          {stats.expiredPolicies}
        </p>
      </div>

      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <ShieldAlert className="h-10 w-10 text-amber-600" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
          Today's Renewals
        </p>
        <p className="text-xl xl:text-2xl font-display font-bold text-amber-600">
          {stats.todaysRenewals}
        </p>
      </div>

      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Banknote className="h-10 w-10 text-blue-600" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
          Total Gen Insurance
        </p>
        <p className="text-xl xl:text-2xl font-display font-bold text-blue-600 truncate">
          {formatINR(stats.totalPremium)}
        </p>
      </div>
      {isAdmin && (
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Banknote className="h-10 w-10 text-purple-600" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            Total Profit
          </p>
          <p className="text-xl xl:text-2xl font-display font-bold text-purple-600 truncate">
            {formatINR(stats.totalProfit)}
          </p>
        </div>
      )}
    </div>
  );
}
