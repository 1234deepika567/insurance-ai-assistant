import React, { useState } from "react";
import UploadStage from "./components/UploadStage";
import PolicyOverview from "./components/PolicyOverview";
import SiriAgent from "./components/SiriAgent";
import { PolicyDetails, ChatMessage } from "./types";
import { 
  ShieldCheck, 
  Info, 
  FileText, 
  ArrowLeft,
  Search,
  Bell,
  HelpCircle,
  ScanLine,
  Smartphone,
  ChevronRight,
  Sparkles,
  CreditCard,
  UserCheck,
  Send,
  Zap,
  CheckCircle,
  PlusCircle,
  ShieldAlert,
  Coins
} from "lucide-react";

// Standard sample policy prefilled.
const SAMPLE_PDF_BASE64 = 
  "JVBERi0xLjQKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCjIgMCBvYmoKICA8PCAvVHlwZSAvUGFnZXMKICAgICAvS2lkcyBbMyAwIFJdCiAgICAgL0NvdW50IDEKICA+PgplbmRvYmoKMyAwIG9iagogIDw8IC9UeXBlIC9QYWdlCiAgICAgL1BhcmVudCAyIDAgUgogICAgIC9SZXNvdXJjZXMgPDwKICAgICAgICAvRm9udCA8PAogICAgICAgICAgIC9GMSA0IDAgUgogICAgICAgID4+CiAgICAgPj4KICAgICAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXQogICAgIC9Db250ZW50cyA1IDAgUgogID4+CmVuZG9iago0IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQKICAgICAvSubdHlwZSAvVHlwZTEKICAgICAvQmFzZUZvbnQgL0hlbHZldGljYQogID4+CmVuZG9iago1IDAgb2JqCiAgPDwgL1R5cGUgL0ZvbnQKICAgICAvU3VidHlwZSAvVHlwZTEKICAgICAvQmFzZUZvbnQgL0hlbHZldGljYQogID4+CmVuZG9iagp4cmVmCjAgNiAwMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA3NCAwMDAwMCBuIAowMDAwMDAwMTM3IDAwMDAwIGYgCjAwMDAwMDAzMDcgMDAwMDAgbiAKMDAwMDAwMDM3NiAwMDAwMCBuIAp0cmFpbGVyCiAgPDwgL1NpemUgNgogICAgIC9Sb290IDEgMCBSCiAgPj4Kc3RhcnR4cmVmCjcxOQolJUVPRgo=";

export default function App() {
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [policyDetails, setPolicyDetails] = useState<PolicyDetails | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorString, setErrorString] = useState<string | null>(null);

  // Flow State Management
  // 1. "phonepe-home" - The classic purple PhonePe financial launcher
  // 2. "phonepe-upload" - The document request stage
  // 3. "phonepe-active" - The active workspace with Neo at the bottom
  const [currentScreen, setCurrentScreen] = useState<"phonepe-home" | "phonepe-upload" | "phonepe-active">("phonepe-home");
  const [activeMode, setActiveMode] = useState<"choose" | "chat" | "speak">("chat");
  const [policyId, setPolicyId] = useState<string | null>(null);

  // Phonepe mock state values
  const userProfileName = policyDetails ? policyDetails.insuredName : "Valued Policyholder";
  const userUpiId = policyDetails
    ? `${policyDetails.insuredName.toLowerCase().replace(/[^a-z0-9]/g, "")}@ybl`
    : "policyholder@ybl";

  // Handles actual compilation and API analysis of PDF
  const handleAnalyzePolicy = async (base64Data: string, name: string) => {
    setIsLoading(true);
    setErrorString(null);

    // Direct transition to show parsing step
    setCurrentScreen("phonepe-upload");

    try {
      const response = await fetch("/api/analyze-policy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfBase64: base64Data,
          fileName: name,
        }),
      });

      if (!response.ok) {
        throw new Error("Target server returned an error while analyzing document.");
      }

      const result = await response.json();
      if (result.success && result.analysis) {
        setPdfBase64(base64Data);
        setFileName(name);
        setPolicyId(result.policyId || null);
        setPolicyDetails(result.analysis);
        
        // Populate initial welcome dialogues with friendly Indian accent style
        setChatHistory([
          {
            id: "welcome",
            sender: "assistant",
            text: `Hi ${result.analysis.insuredName || "Valued Policyholder"}! How can I guide you today about coverage, premium, or exclusions?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        
        // Enter the full-blown active policy workspace
        setCurrentScreen("phonepe-active");
      } else {
        throw new Error(result.error || "Failed to analyze policy content.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorString(err.message || "An unexpected error occurred while analyzing the insurance policy PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSample = () => {
    handleAnalyzePolicy(SAMPLE_PDF_BASE64, "Gold_Shield_Medical_Policy.pdf");
  };

  const [reinitializedSuccessMessage, setReinitializedSuccessMessage] = useState<string | null>(null);

  const handleReset = () => {
    setPdfBase64(null);
    setFileName("");
    setPolicyDetails(null);
    setChatHistory([]);
    setErrorString(null);
    setCurrentScreen("phonepe-home");
    setActiveMode("choose");
  };

  const handleReinitializeTokens = async () => {
    setIsLoading(true);
    setReinitializedSuccessMessage(null);
    setErrorString(null);
    try {
      const response = await fetch("/api/reinitialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        setPdfBase64(null);
        setFileName("");
        setPolicyDetails(null);
        setChatHistory([]);
        setPolicyId(null);
        setCurrentScreen("phonepe-home");
        setActiveMode("chat");
        setReinitializedSuccessMessage("Tokens and policy context cache have been completely reinitialized across the PhonePe network!");
        setTimeout(() => setReinitializedSuccessMessage(null), 6000);
      } else {
        throw new Error("Failed to clear backend scanned policy caches.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorString("Failed to automatically reinitialize all backend tokens. Please try manual refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="phonepe-unified-app" className="min-h-screen bg-slate-100 flex flex-col font-sans select-text text-slate-800">
      
      {/* 1. BRAND GLOBAL HEADER */}
      <header className="bg-[#5f259f] text-white shrink-0 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReset}
              className="p-1 px-2.5 bg-purple-950/40 hover:bg-purple-900 rounded-lg text-white font-bold text-xs flex items-center gap-1 border border-purple-800 transition-all"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>PhonePe Super App</span>
            </button>
            <div className="h-6 w-[1px] bg-purple-750 hidden sm:block" />
            <div className="hidden sm:block">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-250 block font-mono">
                AI Insure Vault
              </span>
              <span className="text-xs text-slate-200">Siri voice active (en-IN)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReinitializeTokens}
              title="Reinitialize system API keys & tokens"
              className="text-[10px] bg-purple-950/60 hover:bg-purple-900 font-extrabold px-2.5 py-1.5 rounded-lg text-white border border-purple-800/40 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>🔄 Reinitialize Tokens</span>
            </button>

            <div className="bg-emerald-500 text-[10px] font-bold uppercase text-white px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              Live: India English Accents
            </div>
            
            {policyDetails && (
              <button 
                id="header-nav-reset"
                onClick={handleReset}
                className="text-xs bg-red-650 hover:bg-red-705 font-bold px-3 py-1.5 rounded-lg text-white transition-colors cursor-pointer flex items-center gap-1 shadow"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change Policy
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE BODY CONTAINER */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col items-center justify-start">
        
        {/* Reinitialized Success Alert Bar */}
        {reinitializedSuccessMessage && (
          <div className="w-full max-w-4xl mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 flex items-start gap-4 animate-fade-in text-left shadow-sm">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">System Cache & Credentials Flushed</p>
              <p className="text-xs text-emerald-700 mt-1">{reinitializedSuccessMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert Bar */}
        {errorString && (
          <div className="w-full max-w-4xl mb-6 p-4 bg-red-50 text-red-800 rounded-2xl border border-red-200 flex items-start gap-3 animate-fade-in text-left shadow-sm">
            <div className="p-2 bg-red-100 rounded-xl text-red-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Policy Scanning Blocked</p>
              <p className="text-xs text-red-700 mt-1">{errorString}</p>
              <div className="mt-3 flex items-center gap-3.5 flex-wrap">
                <button 
                  onClick={handleReset} 
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-lg transition-colors. cursor-pointer"
                >
                  ← Return to PhonePe Home
                </button>
                <button
                  onClick={handleReinitializeTokens}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <span>🔄 Reinitialize All Tokens & Try Again</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            STATE 1: "phonepe-home" - POLISHED PHONEPE FINANCIAL PORTAL
            ======================================================= */}
        {currentScreen === "phonepe-home" && (
          <div id="phonepe-home-screen" className="w-full max-w-lg mx-auto bg-white rounded-[32px] border-[8px] border-slate-900 shadow-3xl overflow-hidden flex flex-col relative animate-fade-in">
            {/* Phone notch bar simulated */}
            <div className="bg-slate-900 text-slate-100 px-6 py-2.5 flex justify-between items-center text-[11px] font-mono select-none shrink-0 border-b border-slate-800">
              <div className="font-bold text-[11px]">10:45 AM 🇮🇳</div>
              <div className="w-20 h-4 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-slate-800 px-1 py-0.5 rounded leading-none text-emerald-400 font-bold">5G Volte</span>
                <div className="w-5 h-2.5 bg-slate-100/30 rounded-sm p-0.5 flex">
                  <div className="w-3/4 h-full bg-emerald-400 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Simulated PhonePe Viewport */}
            <div className="flex-1 flex flex-col overflow-y-auto max-h-[820px] scrollbar-none pb-8 text-left bg-slate-50">
              
              {/* PhonePe Indigo Header Section */}
              <div className="bg-[#5f259f] p-4 text-white rounded-b-3xl shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  
                  {/* Persona Avatar */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-950 text-white rounded-2xl flex items-center justify-center font-extrabold text-sm border-2 border-purple-400 shadow-inner">
                      {policyDetails ? policyDetails.insuredName.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "DP"}
                    </div>
                    <div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-xs text-purple-200">Your Location</span>
                        <ChevronRight className="w-3 h-3 text-purple-300" />
                      </div>
                      <p className="text-xs font-bold font-sans text-white">Bengaluru, Marathahalli 🇮🇳</p>
                    </div>
                  </div>

                  {/* Header Utility items */}
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 bg-purple-900/50 hover:bg-purple-900 rounded-lg text-purple-200 transition-colors" title="Scan QR Code">
                      <ScanLine className="w-4.5 h-4.5 text-white" />
                    </button>
                    <button className="p-1.5 bg-purple-900/50 hover:bg-purple-900 rounded-lg text-purple-200 transition-colors" title="Notifications">
                      <Bell className="w-4.5 h-4.5 text-white" />
                    </button>
                    <button className="p-1.5 bg-purple-900/50 hover:bg-purple-900 rounded-lg text-purple-200 transition-colors" title="Help Desk">
                      <HelpCircle className="w-4.5 h-4.5 text-white" />
                    </button>
                  </div>

                </div>

                {/* Input Search Mock */}
                <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2 text-white/50 border border-white/15">
                  <Search className="w-4 h-4 text-purple-300" />
                  <span className="text-xs text-purple-100 flex-1">Search mobile, bills, or insurance policies...</span>
                </div>
              </div>

              {/* Main Scrolling Canvas Container */}
              <div className="p-4 space-y-5">
                
                {/* 1. Money Transfer Grid card */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-tight mb-3">
                    Transfer Money
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    
                    <button className="flex flex-col items-center group cursor-pointer">
                      <div className="w-11 h-11 bg-purple-50 group-hover:bg-[#5f259f]/10 text-[#5f259f] rounded-2xl flex items-center justify-center transition-all shadow-inner">
                        <Smartphone className="w-5 h-5 font-bold" />
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1 text-nowrap">To Mobile</span>
                    </button>

                    <button className="flex flex-col items-center group cursor-pointer">
                      <div className="w-11 h-11 bg-purple-50 group-hover:bg-[#5f259f]/10 text-[#5f259f] rounded-2xl flex items-center justify-center transition-all shadow-inner">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1 text-nowrap">To Bank/UPI</span>
                    </button>

                    <button className="flex flex-col items-center group cursor-pointer">
                      <div className="w-11 h-11 bg-purple-50 group-hover:bg-[#5f259f]/10 text-[#5f259f] rounded-2xl flex items-center justify-center transition-all shadow-inner">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1 text-nowrap">To Self</span>
                    </button>

                    <button className="flex flex-col items-center group cursor-pointer">
                      <div className="w-11 h-11 bg-purple-50 group-hover:bg-[#5f259f]/10 text-[#5f259f] rounded-2xl flex items-center justify-center transition-all shadow-inner">
                        <Coins className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1 text-nowrap">Check Balance</span>
                    </button>

                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">My UPI ID: {userUpiId}</span>
                    <span className="text-purple-600 font-bold text-[10px] cursor-pointer hover:underline">MANAGE</span>
                  </div>
                </div>

                {/* 2. GLOWING SIRI AI PROMOTIONAL POSTER BANNER */}
                <div 
                  onClick={() => setCurrentScreen("phonepe-upload")}
                  className="bg-gradient-to-r from-indigo-900 to-purple-800 rounded-2xl p-4.5 text-white border border-indigo-750/50 shadow-md relative overflow-hidden group cursor-pointer hover:shadow-indigo-500/10 transition-all"
                >
                  <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_bottom_right,rgba(165,180,252,0.2),transparent_70%)] pointer-events-none" />
                  
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 max-w-[80%]">
                      <div className="inline-flex items-center gap-1 bg-amber-400 text-[#5f259f] text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 text-[#5f259f]" />
                        Siri Insure Scan
                      </div>
                      <h4 className="text-sm font-extrabold text-white leading-tight pt-1">
                        PDF Policy Verification Center
                      </h4>
                      <p className="text-[10.5px] text-indigo-200">
                        Is your insurance actually valid? Let Siri scan exclusions, limits, and co-pays over voice instantly.
                      </p>
                    </div>
                    <div className="h-9 w-9 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center border border-indigo-500/25 shrink-0">
                      <Zap className="w-4 h-4 animate-bounce text-amber-400" />
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2 border-t border-indigo-800/60 flex items-center justify-between text-[10px] text-indigo-300 font-bold">
                    <span>⚡ GET INSTANT INDIAN SPEECH ANALYSIS</span>
                    <span className="text-white hover:underline flex items-center gap-0.5">
                      TAP HERE <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* 3. INSURANCE CATEGORIES: THE USER'S DIRECT LAUNCH TRAFFIC GRID */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                      Insurance Options (AI Scan Enabled)
                    </h3>
                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">NEW</span>
                  </div>

                  {/* Grid layout containing policies options */}
                  <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center pb-1">
                    
                    {/* Bike Insurance */}
                    <button 
                      onClick={() => setCurrentScreen("phonepe-upload")}
                      className="flex flex-col items-center group cursor-pointer focus:outline-none"
                    >
                      <div className="w-12 h-12 bg-indigo-50/70 group-hover:bg-indigo-100/80 text-indigo-600 rounded-xl flex items-center justify-center transition-all border border-indigo-100/50">
                        🛵
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1.5 leading-none">Bike Policy</span>
                    </button>

                    {/* Car Insurance */}
                    <button 
                      onClick={() => setCurrentScreen("phonepe-upload")}
                      className="flex flex-col items-center group cursor-pointer focus:outline-none"
                    >
                      <div className="w-12 h-12 bg-indigo-50/70 group-hover:bg-indigo-100/80 text-indigo-600 rounded-xl flex items-center justify-center transition-all border border-indigo-100/50">
                        🚗
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1.5 leading-none">Car Policy</span>
                    </button>

                    {/* Health / Siri AI (Highly pulsed item requested by user) */}
                    <button 
                      onClick={() => setCurrentScreen("phonepe-upload")}
                      className="flex flex-col items-center group cursor-pointer relative"
                    >
                      <div className="absolute -top-1.5 -right-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[7.5px] font-bold px-1 py-0.5 rounded-full scale-90 border border-white animate-pulse">
                        Siri AI
                      </div>
                      
                      <div className="w-12 h-12 bg-purple-100/80 group-hover:bg-purple-200/90 text-purple-700 rounded-xl flex items-center justify-center transition-all border border-purple-300 animate-pulse-border ring-2 ring-purple-150">
                        🏥
                      </div>
                      <span className="text-[10px] text-[#5f259f] font-extrabold mt-1.5 leading-none">Health Scan</span>
                    </button>

                    {/* Term Life */}
                    <button 
                      onClick={() => setCurrentScreen("phonepe-upload")}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-indigo-50/70 group-hover:bg-indigo-100/80 text-indigo-600 rounded-xl flex items-center justify-center transition-all border border-indigo-100/50">
                        🛡️
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1.5 leading-none">Term Life</span>
                    </button>

                    {/* Personal Accident */}
                    <button 
                      onClick={() => setCurrentScreen("phonepe-upload")}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-indigo-50/70 group-hover:bg-indigo-100/80 text-indigo-600 rounded-xl flex items-center justify-center transition-all border border-indigo-100/50">
                        👤
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1.5 leading-none">Accident</span>
                    </button>

                    {/* Travel Safeguard */}
                    <button 
                      onClick={() => setCurrentScreen("phonepe-upload")}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-indigo-50/70 group-hover:bg-indigo-100/80 text-[#5f259f] rounded-xl flex items-center justify-center transition-all border border-indigo-100/50">
                        ✈️
                      </div>
                      <span className="text-[10px] text-slate-700 font-bold mt-1.5 leading-none">Travel AI Unit</span>
                    </button>

                  </div>
                </div>

                {/* 4. UTILITIES & RECHARGES GRID */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-tight mb-2.5">
                    Recharge & Pay Bills
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-center text-slate-500">
                    <div className="flex flex-col items-center opacity-70">
                      <span className="text-lg">📱</span>
                      <span className="text-[9px] mt-1">Recharge</span>
                    </div>
                    <div className="flex flex-col items-center opacity-70">
                      <span className="text-lg">📺</span>
                      <span className="text-[9px] mt-1">DTH/Cable</span>
                    </div>
                    <div className="flex flex-col items-center opacity-70">
                      <span className="text-lg">💡</span>
                      <span className="text-[9px] mt-1">Electricity</span>
                    </div>
                    <div className="flex flex-col items-center opacity-70">
                      <span className="text-lg">🏠</span>
                      <span className="text-[9px] mt-1">Rent bill</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom bar dock mimics PhonePe tabs */}
              <div className="sticky bottom-0 bg-white border-t border-slate-150 py-2.5 flex justify-around text-center mt-auto shrink-0 z-10 select-none">
                <div className="text-purple-700 font-bold text-[10px] flex flex-col items-center">
                  <span className="text-sm">🏠</span>
                  <span className="mt-0.5">Home</span>
                </div>
                <div className="text-slate-400 text-[10px] flex flex-col items-center">
                  <span className="text-sm opacity-50">🧭</span>
                  <span className="mt-0.5">Stores</span>
                </div>
                <div className="text-slate-400 text-[10px] flex flex-col items-center cursor-pointer" onClick={() => setCurrentScreen("phonepe-upload")}>
                  <span className="text-sm">🏥</span>
                  <span className="mt-0.5">Insurance</span>
                </div>
                <div className="text-slate-400 text-[10px] flex flex-col items-center">
                  <span className="text-sm opacity-50">💸</span>
                  <span className="mt-0.5">Wealth</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            STATE 2: "phonepe-upload" - CORE POLICY UPLOADING DESK
            ======================================================= */}
        {currentScreen === "phonepe-upload" && (
          <div id="phonepe-upload-drawer" className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in">
            
            {/* Header with quick back anchor */}
            <div className="flex items-center justify-between">
              <button 
                id="btn-back-home"
                onClick={() => setCurrentScreen("phonepe-home")}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-205 flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-purple-700" />
                <span>← Back to PhonePe Main</span>
              </button>
              
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                Step 2 of 3: Policy Document Upload
              </span>
            </div>

            {/* Custom Phonepe-styled Upload stage wrapper */}
            <div className="bg-white p-6.5 rounded-3xl shadow-xl border border-slate-200">
              
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="h-10 w-10 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold mb-3">
                  🏥
                </span>
                <h2 className="text-xl font-extrabold text-[#5f259f] tracking-tight">
                  Upload Policy File for Indian Neo AI Assessment
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a standard medical, travel, health, or personal accidental insurance policy contract in PDF format. We will extract all terms instantly!
                </p>
              </div>

              {/* Document upload stage renderer */}
              <UploadStage
                onFileSelected={handleAnalyzePolicy}
                onUseSample={handleUseSample}
                isLoading={isLoading}
              />

            </div>
          </div>
        )}

        {/* =======================================================
            STATE 3: "phonepe-active" - VERIFIED PHONEPE INSURANCE SPACE
            ======================================================= */}
        {currentScreen === "phonepe-active" && policyDetails && (
          <div id="phonepe-active-workspace" className="w-full max-w-7xl mx-auto flex flex-col space-y-4 animate-fade-in text-left">
            
            {/* Context breadcrumb & control bar */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  id="btn-back-to-phonepe"
                  onClick={handleReset}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <ArrowLeft className="w-4 h-4 text-[#5f259f]" />
                  <span>← Back to PhonePe Home</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5 font-medium">
                <span className="font-mono">Document:</span>
                <span className="font-bold text-[#5f259f] truncate max-w-[150px]">{fileName}</span>
              </div>
            </div>

            {/* Mode selection if "choose" */}
            {activeMode === "choose" ? (
              <div id="ai-mode-picker" className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-250 p-7 space-y-6 my-4 animate-fade-in text-left">
                <div className="text-center space-y-2">
                  <span className="h-11 w-11 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-purple-150 shadow-inner">
                    ✨
                  </span>
                  <h2 className="text-xl font-extrabold text-[#5f259f] tracking-tight">
                    Select Your AI Interaction Option
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Gold Shield scanner successfully analyzed <b>{fileName}</b>. Choose an interaction mode below:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-1">
                  
                  {/* Option 1: Chat Bot */}
                  <div 
                    onClick={() => setActiveMode("chat")}
                    className="border border-slate-200 hover:border-[#5f259f] rounded-2xl p-5 hover:bg-slate-50/50 cursor-pointer shadow-xs transition-all flex flex-col justify-between text-left space-y-4 group relative"
                  >
                    <div className="space-y-2">
                      <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm group-hover:bg-[#5f259f] group-hover:text-white transition-colors">
                        💬
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-purple-700 transition-colors">
                        Conversational AI Chat Bot
                      </h3>
                      <p className="text-[11.5px] text-slate-500 leading-normal">
                        Type queries, view complete message transactions list, browse suggestions, and parse medical tables interactively.
                      </p>
                    </div>
                    <button 
                      className="w-full py-2.5 bg-slate-900 hover:bg-[#5f259f] text-white text-[11px] font-bold rounded-xl transition-all shadow-sm"
                    >
                      Launch Chat Bot
                    </button>
                  </div>

                  {/* Option 2: Siri Speak Only */}
                  <div 
                    onClick={() => setActiveMode("speak")}
                    className="border border-slate-200 hover:border-[#5f259f] rounded-2xl p-5 hover:bg-slate-50/50 cursor-pointer shadow-xs transition-all flex flex-col justify-between text-left space-y-4 group relative"
                  >
                    <div className="space-y-2">
                      <div className="h-9 w-9 rounded-xl bg-purple-100/50 text-[#5f259f] flex items-center justify-center font-bold text-sm group-hover:bg-[#5f259f] group-hover:text-white transition-colors animate-pulse">
                        🎙️
                      </div>
                      <h3 className="font-bold text-[#5f259f] text-sm group-hover:text-purple-700 transition-colors">
                        Siri Voice (Speak Only)
                      </h3>
                      <p className="text-[11.5px] text-slate-500 leading-normal">
                        Hands-free pure voice mode. Speak directly and Siri reads back policy answers—<b>no other text, log feeds, or inputs</b>.
                      </p>
                    </div>
                    <button 
                      className="w-full py-2.5 bg-[#5f259f] hover:bg-purple-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-md"
                    >
                      Launch Speak Mode
                    </button>
                  </div>

                </div>

                <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] text-slate-400">
                  <span>Owner verified:</span>
                  <span className="font-mono font-bold text-slate-600">{policyDetails.insuredName} (#{policyDetails.policyNumber})</span>
                </div>
              </div>
            ) : (
              <>
                {/* Dynamic layout: Split view showing scanned policy parameters & chatbot side-by-side in Chat mode, or sleek single orb focus in Speak mode */}
                {activeMode === "chat" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[580px] w-full">
                    {/* Left Side: Policy overview & parameter summary tabs */}
                    <div className="lg:col-span-5 flex flex-col min-h-[520px]">
                      <PolicyOverview
                        details={policyDetails}
                        fileName={fileName}
                        onReset={handleReset}
                      />
                    </div>

                    {/* Right Side: The Interactive AI Chatbot */}
                    <div className="lg:col-span-7 flex flex-col min-h-[580px]">
                      <SiriAgent
                        pdfBase64={pdfBase64!}
                        policyId={policyId}
                        policyDetails={policyDetails}
                        chatHistory={chatHistory}
                        setChatHistory={setChatHistory}
                        mode="chat"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-4xl mx-auto min-h-[580px]">
                    <SiriAgent
                      pdfBase64={pdfBase64!}
                      policyId={policyId}
                      policyDetails={policyDetails}
                      chatHistory={chatHistory}
                      setChatHistory={setChatHistory}
                      mode="speak"
                    />
                  </div>
                )}

                {/* Elegant Two Interaction Mode Options at the end of the active page */}
                <div id="bottom-controls-section" className="flex flex-col items-center justify-center pt-5 pb-2 bg-gradient-to-r from-purple-50/70 to-indigo-50/70 rounded-3xl p-6 mt-4 gap-4 shadow-xs border border-purple-100/50 max-w-4xl mx-auto w-full">
                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] font-sans font-black tracking-widest text-[#5f259f] uppercase block">PhonePe AI Assistance Segment</span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#1a082e]">Choose your interaction format at the bottom of the page:</h4>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full max-w-md">
                    {/* Option 1: Chat Mode Tab */}
                    <button
                      id="bottom-tab-chat"
                      onClick={() => {
                        if (window.speechSynthesis) window.speechSynthesis.cancel();
                        setActiveMode("chat");
                      }}
                      className={`flex-1 py-3.5 px-5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-98 ${
                        activeMode === "chat"
                          ? "bg-[#5f259f] text-white border-transparent shadow-lg scale-102 font-black"
                          : "bg-white text-[#5f259f] border-purple-100 hover:bg-purple-100/40"
                      }`}
                    >
                      <span className="text-2xl">💬</span>
                      <span className="text-xs font-extrabold">Conversational Chat</span>
                      <span className="text-[9.5px] opacity-80 font-normal">Text dialogue & prompts</span>
                    </button>
                    
                    {/* Option 2: Speak Mode Tab */}
                    <button
                      id="bottom-tab-speak"
                      onClick={() => {
                        if (window.speechSynthesis) window.speechSynthesis.cancel();
                        setActiveMode("speak");
                      }}
                      className={`flex-1 py-3.5 px-5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-98 ${
                        activeMode === "speak"
                          ? "bg-[#5f259f] text-white border-transparent shadow-lg scale-102 font-black"
                          : "bg-white text-[#5f259f] border-purple-100 hover:bg-purple-100/40"
                      }`}
                    >
                      <span className="text-2xl">🎙️</span>
                      <span className="text-xs font-extrabold">Speak with Neo</span>
                      <span className="text-[9.5px] opacity-80 font-normal">Custom audio assistant</span>
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
