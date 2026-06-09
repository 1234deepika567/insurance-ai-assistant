import React, { useState } from "react";
import { PolicyDetails } from "../types";
import { 
  ShieldCheck, 
  Hash, 
  User, 
  DollarSign, 
  Calendar, 
  Activity, 
  PlusCircle, 
  HelpCircle, 
  AlertCircle, 
  ChevronRight,
  RefreshCw
} from "lucide-react";

interface PolicyOverviewProps {
  details: PolicyDetails;
  fileName: string;
  onReset: () => void;
}

export default function PolicyOverview({ details, fileName, onReset }: PolicyOverviewProps) {
  const [activeTab, setActiveTab] = useState<"core" | "coverage" | "claims" | "exclusions">("core");

  const metadataList = [
    { label: "Policy Number", value: details.policyNumber, icon: Hash, color: "text-purple-600 bg-purple-50" },
    { label: "Insured Name", value: details.insuredName, icon: User, color: "text-blue-600 bg-blue-50" },
    { label: "Premium Amount", value: details.premiumAmount, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
    { label: "Expiry Date", value: details.expiryDate, icon: Calendar, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div id="policy-overview" className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-slate-205 overflow-hidden animate-fade-in">
      {/* File Banner */}
      <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-mono">ACTIVE POLICY ANALYSIS</p>
            <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">{fileName}</p>
          </div>
        </div>
        <button
          id="btn-upload-new"
          onClick={onReset}
          className="p-2 text-xs font-semibold bg-slate-800 hover:bg-slate-705 text-slate-200 hover:text-white rounded-lg flex items-center gap-1.5 transition-all active:scale-95 border border-slate-700 hover:border-slate-600"
          title="Upload New Policy"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Change File</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Quick Readout */}
        <div className="grid grid-cols-2 gap-4">
          {metadataList.map((meta, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${meta.color}`}>
                <meta.icon className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">{meta.label}</span>
                <span className="text-sm font-bold text-slate-800 block truncate" title={meta.value}>{meta.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* High-Level Summary Card */}
        <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/60 text-slate-700 text-sm italic">
          <span className="font-extrabold text-blue-800 not-italic block text-xs tracking-wider uppercase mb-1">Quick Policy Scope:</span>
          "{details.highLevelSummary}"
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("core")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-nowrap border-b-2 transition-all ${
              activeTab === "core" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Core Summary
          </button>
          <button
            onClick={() => setActiveTab("coverage")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-nowrap border-b-2 transition-all ${
              activeTab === "coverage" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Coverage & Benefits
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-nowrap border-b-2 transition-all ${
              activeTab === "claims" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Claims Info
          </button>
          <button
            onClick={() => setActiveTab("exclusions")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-nowrap border-b-2 transition-all ${
              activeTab === "exclusions" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Exclusions
          </button>
        </div>

        {/* Tab Panel Content */}
        <div className="space-y-4 pt-2">
          {activeTab === "core" && (
            <div className="space-y-4 animate-fade-in text-left">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  Policy Overview
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  This document serves as an official contract between the policyholder (<strong>{details.insuredName}</strong>) and the insurer. The policy is actively identified by number <strong>{details.policyNumber}</strong>, requiring a structural premium of <strong>{details.premiumAmount}</strong> with an absolute coverage expiry scheduled for <strong>{details.expiryDate}</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === "coverage" && (
            <div className="space-y-4 animate-fade-in text-left">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Coverage Details
                </h4>
                <div className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {details.coverageDetails}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                  Benefits & Co-Pays
                </h4>
                <div className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {details.benefitDetails}
                </div>
              </div>
            </div>
          )}

          {activeTab === "claims" && (
            <div className="space-y-4 animate-fade-in text-left">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                  Claims Filing Procedures
                </h4>
                <div className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap text-left">
                  {details.claimDetails}
                </div>
              </div>
            </div>
          )}

          {activeTab === "exclusions" && (
            <div className="space-y-4 animate-fade-in text-left">
              <div>
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Critical Limitations & Exclusions
                </h4>
                <div className="text-sm text-slate-600 leading-relaxed bg-red-50/20 p-4 rounded-xl border border-red-100/60 whitespace-pre-wrap">
                  {details.exclusions}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Note */}
      <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
        Analyzed with Gemini-3.5-Flash for peak precision.
      </div>
    </div>
  );
}
