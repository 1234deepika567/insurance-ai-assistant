import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Bot, 
  Square,
  MessageSquare,
  Play,
  CheckCircle,
  Send,
  HelpCircle,
  AlertTriangle,
  User,
  Activity,
  FileText
} from "lucide-react";
import { ChatMessage, PolicyDetails } from "../types";

interface SiriAgentProps {
  pdfBase64: string;
  policyId: string | null;
  policyDetails: PolicyDetails;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  mode: "chat" | "speak";
}

// Check Speech Recognition capability
const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const speechSupported = !!SpeechRecognitionClass;

export default function SiriAgent({ pdfBase64, policyId, policyDetails, chatHistory, setChatHistory, mode }: SiriAgentProps) {
  const [agentState, setAgentState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [keyboardInput, setKeyboardInput] = useState<string>("");
  const [agentSpeechText, setAgentSpeechText] = useState<string>("");
  const [activeQuery, setActiveQuery] = useState<string>("");
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Proactive Dynamic Questions extracted directly from scanned policy details
  const dynamicDocQuestions = [
    `Who is covered under policy #${policyDetails.policyNumber}?`,
    `What is are the key benefits listed for ${policyDetails.insuredName}?`,
    `What are the critical exclusions and pre-existing clauses?`,
    `How do I file or submit a claim online?`,
    `What is the premium amount of ${policyDetails.premiumAmount}?`,
    `When does this policy expire?`
  ];

  // Auto scroll dialogs to bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chatHistory, transcript, agentState]);

  useEffect(() => {
    // Setup en-IN Speech Recognition
    if (speechSupported) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-IN"; // Sets standard Indian pronunciation support

      rec.onstart = () => {
        setAgentState("listening");
        setTranscript("");
        setIsInteracting(true);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };

      rec.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setTranscript(text);
      };

      rec.onerror = (event: any) => {
        console.error("Neo Indian mic error", event);
        setAgentState("idle");
      };

      rec.onend = () => {
        setAgentState(prev => {
          if (prev === "listening") {
            return "idle";
          }
          return prev;
        });
      };

      recognitionRef.current = rec;
    }

    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadSyncVoices = () => {
        if (!synthRef.current) return;
        const voicesList = synthRef.current.getVoices();
        setAvailableVoices(voicesList);
        
        // Find optimal en-IN natural Indian voice tone (Veena, Heera, Rishi, Google India, etc.)
        const indianVoice = voicesList.find(v => 
          v.lang.includes("en-IN") || 
          v.name.toLowerCase().includes("india") || 
          v.name.toLowerCase().includes("indian") || 
          v.name.toLowerCase().includes("veena") || 
          v.name.toLowerCase().includes("heera") || 
          v.name.toLowerCase().includes("rishi") || 
          v.name.toLowerCase().includes("ravi") || 
          v.name.toLowerCase().includes("priya")
        );
        
        if (indianVoice) {
          setSelectedVoiceName(indianVoice.name);
        } else if (voicesList.length > 0) {
          const defaultEng = voicesList.find(v => v.lang.startsWith("en-") || v.lang.startsWith("en")) || voicesList[0];
          setSelectedVoiceName(defaultEng.name);
        }
      };

      loadSyncVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadSyncVoices;
      }
    }

    // Trigger an ambient welcome prompt so the user knows Neo is active for them
    const timer = setTimeout(() => {
      const welcome = `Hi ${policyDetails.insuredName || "Valued Policyholder"}!`;
      setAgentSpeechText(welcome);
      if (mode === "speak") {
        speakAloudText(welcome);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [policyDetails]);

  // When speech dictation completes and is idle, auto submit the text
  useEffect(() => {
    if (agentState === "idle" && transcript.trim() !== "" && !isSpeakingAny()) {
      handleQuerySubmit(transcript);
    }
  }, [agentState, transcript]);

  const isSpeakingAny = () => {
    return synthRef.current?.speaking || synthRef.current?.pending;
  };

  const primeSpeechSynthesizer = () => {
    if (!synthRef.current) return;
    try {
      const primeUtterance = new SpeechSynthesisUtterance(" ");
      primeUtterance.volume = 0.01;
      synthRef.current.cancel(); 
      synthRef.current.speak(primeUtterance);
    } catch (e) {
      console.warn("Speech system prime alert", e);
    }
  };

  const handleQuerySubmit = async (queryText: string) => {
    if (!queryText.trim() || agentState === "thinking") return;
    
    primeSpeechSynthesizer();
    setActiveQuery(queryText);
    setAgentState("thinking");
    setTranscript("");
    setKeyboardInput("");
    setIsInteracting(true);

    // Save User message immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const response = await fetch("/api/chat-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64, // Always send base64 to remain completely robust against server restarts / cache misses
          policyId, // RAM lookup - avoids re-transmitting heavy raw documents when cache hits
          message: queryText,
          history: chatHistory
        })
      });

      if (!response.ok) {
        throw new Error("Target server error");
      }

      const result = await response.json();
      const answer = result.answer || "This information is not explicitly mentioned in the scanned premium document.";
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, assistantMsg]);
      setAgentSpeechText(answer);

      if (mode === "speak" && autoSpeak) {
        setTimeout(() => {
          speakAloudText(answer);
        }, 80);
      } else {
        setAgentState("idle");
      }

    } catch (err) {
      console.error(err);
      const errAnswer = "I'm sorry, I encountered an issue querying the policy database. Please verify your internet connection or try again.";
      setAgentSpeechText(errAnswer);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: errAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setChatHistory(prev => [...prev, assistantMsg]);

      if (mode === "speak" && autoSpeak) {
        setTimeout(() => {
          speakAloudText(errAnswer);
        }, 80);
      } else {
        setAgentState("idle");
      }
    }
  };

  const speakAloudText = (text: string) => {
    if (mode === "chat") return; // Completely disabled voice option in chatbot mode
    if (!synthRef.current) return;

    synthRef.current.cancel();
    setAgentState("speaking");

    // Clear Markdown symbols for pronunciation purity
    const sanitizedText = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/`[^`]+`/g, "")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(sanitizedText);
    utterance.volume = 1.0;
    utterance.rate = 0.98; // natural steady pacing
    utterance.pitch = 1.0;
    
    const voices = synthRef.current.getVoices();
    
    // Choose selected or Indian en-IN voice
    let speechVoice = voices.find(v => v.name === selectedVoiceName);

    if (!speechVoice) {
      speechVoice = voices.find(v => 
        v.lang.includes("en-IN") || 
        v.name.toLowerCase().includes("india") || 
        v.name.toLowerCase().includes("indian") || 
        v.name.toLowerCase().includes("veena") || 
        v.name.toLowerCase().includes("heera") || 
        v.name.toLowerCase().includes("rishi") || 
        v.name.toLowerCase().includes("priya")
      ) || voices.find(v => v.lang.startsWith("en-")) || voices[0];
    }

    if (speechVoice) {
      utterance.voice = speechVoice;
      if (selectedVoiceName !== speechVoice.name) {
        setSelectedVoiceName(speechVoice.name);
      }
    }

    utterance.onend = () => {
      setAgentState("idle");
    };
    utterance.onerror = (e) => {
      console.error("Indian Voice Speech Unit Error", e);
      setAgentState("idle");
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handleToggleNeoListen = () => {
    primeSpeechSynthesizer();

    if (!recognitionRef.current) {
      alert("A microphone permission is needed or speech recognition is not supported in this frame. No worries! You can type in the Chatbox or click any Suggested Question.");
      return;
    }

    if (agentState === "listening") {
      recognitionRef.current.stop();
      setAgentState("idle");
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech recognition busy", e);
      }
    }
  };

  const handleStopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setAgentState("idle");
  };

  const handleRepronounce = (text: string) => {
    speakAloudText(text);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyboardInput.trim()) {
      handleQuerySubmit(keyboardInput);
    }
  };

  if (mode === "speak") {
    return (
      <div id="phonepe-active-dashboard" className="flex flex-col h-full bg-[#130724] text-white rounded-3xl shadow-2xl relative overflow-hidden border border-purple-950 p-6 sm:p-8 justify-between min-h-[540px] animate-fade-in text-center">
        
        {/* Marketplace atmosphere layout: Beautiful subtle glowing radial gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_75%)] pointer-events-none animate-pulse duration-[8s]" />
        
        {/* Minimal indicator */}
        <div className="flex items-center justify-center gap-2 z-10 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${agentState === "speaking" ? "bg-emerald-400" : agentState === "listening" ? "bg-red-500" : "bg-purple-500"} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${agentState === "speaking" ? "bg-emerald-400" : agentState === "listening" ? "bg-red-500" : "bg-purple-500"}`}></span>
          </span>
          <span className="text-[10px] font-sans font-bold tracking-widest text-purple-300 uppercase">
            {agentState === "listening" ? "Neo is Listening" : agentState === "thinking" ? "Neo is Thinking" : agentState === "speaking" ? "Neo is Speaking" : "Neo Voice Search"}
          </span>
        </div>

        {/* Center Section: Glowing Marketplace Microphone Orb and Sound wave ripples */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-10 py-6">
          
          <div className="relative">
            {/* Soft Ambient halo ring behind the mic */}
            <div className={`absolute -inset-10 rounded-full transition-all duration-700 blur-2xl ${
              agentState === "listening" ? "bg-rose-600/25 scale-110" :
              agentState === "thinking" ? "bg-[#5f259f]/30 animate-pulse" :
              agentState === "speaking" ? "bg-emerald-500/20 scale-105" :
              "bg-purple-600/10"
            }`} />

            <button
              id="neo-speak-mode-orb"
              onClick={agentState === "speaking" ? handleStopSpeaking : handleToggleNeoListen}
              className={`w-36 h-36 rounded-full bg-gradient-to-tr from-[#9b51e0] via-[#5f259f] to-[#e84393] relative flex items-center justify-center shadow-[0_0_40px_rgba(155,81,224,0.4)] transition-all focus:outline-none cursor-pointer duration-500 ${
                agentState === "listening" ? "scale-105 ring-[12px] ring-rose-500/10 text-white" : 
                agentState === "thinking" ? "animate-pulse ring-[12px] ring-purple-600/15" : 
                agentState === "speaking" ? "scale-105 ring-[12px] ring-emerald-500/10" : 
                "hover:scale-105 hover:shadow-[0_0_50px_rgba(155,81,224,0.6)]"
              }`}
            >
              {agentState === "listening" && (
                <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping [animation-duration:1.5s]" />
              )}

              {/* Centered state graphics */}
              <div className="z-20 text-white flex flex-col items-center">
                {agentState === "idle" && (
                  <div className="flex flex-col items-center space-y-1">
                    <Mic className="w-14 h-14 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-purple-200">Tap to Talk</span>
                  </div>
                )}
                
                {agentState === "listening" && (
                  <div className="flex flex-col items-center space-y-1.5">
                    <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-red-100">Listening...</span>
                  </div>
                )}
                
                {agentState === "thinking" && (
                  <div className="flex flex-col items-center space-y-1.5">
                    <div className="w-10 h-10 border-4 border-purple-200 border-t-white rounded-full animate-spin" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-purple-200">Scanning...</span>
                  </div>
                )}
                
                {agentState === "speaking" && (
                  <div className="flex flex-col items-center space-y-1">
                    <Square className="w-8 h-8 text-white fill-current" />
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-200">Stop AI</span>
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Action indicator labels - strict clean layout */}
          <div className="text-center space-y-1 w-full max-w-sm">
            <h3 className="text-base font-extrabold tracking-tight text-white/95">
              {agentState === "idle" && "Neo Marketplace Voice Search"}
              {agentState === "listening" && "Listening to your voice..."}
              {agentState === "thinking" && "Neo reading policy terms..."}
              {agentState === "speaking" && "Neo is answering..."}
            </h3>
          </div>

        </div>

        {/* Dynamic visual glassmorphic dialogue caption / live block */}
        <div className="z-10 shrink-0 space-y-3.5">
          <div className="bg-[#1b0d35]/65 border border-purple-900/45 p-4.5 rounded-2xl text-center shadow-lg backdrop-blur-md">
            <span className="text-[9px] font-extrabold tracking-widest text-purple-400 block uppercase mb-2">
              REAL-TIME VOICE ASSISTANT FEEDBACK
            </span>
            
            <div className="min-h-[58px] flex items-center justify-center">
              <p className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-100 max-w-xs sm:max-w-md mx-auto italic">
                {agentState === "idle" && `"${agentSpeechText || ("Hi " + (policyDetails.insuredName || "Valued Policyholder") + "!")}"`}
                {agentState === "listening" && (transcript ? `"${transcript}"` : `"Go ahead, ask a question about your policy benefits..."`)}
                {agentState === "thinking" && `"Neo is processing policy rules instantly..."`}
                {agentState === "speaking" && `"${agentSpeechText}"`}
              </p>
            </div>
          </div>

          {/* Glowing Animated Sound Wave lines (Marketplace style) represented when active */}
          <div className="flex items-center justify-center gap-1.5 h-6">
            {agentState === "speaking" && (
              <div className="flex items-end gap-1 h-5">
                <span className="w-1 bg-[#e84393] h-3 rounded-full animate-bounce [animation-duration:0.3s]" />
                <span className="w-1 bg-purple-400 h-5 rounded-full animate-bounce [animation-duration:0.45s]" />
                <span className="w-1 bg-cyan-400  h-4 rounded-full animate-bounce [animation-duration:0.35s]" />
                <span className="w-1 bg-teal-400  h-5 rounded-full animate-bounce [animation-duration:0.5s]" />
                <span className="w-1 bg-[#6c5ce7] h-2 rounded-full animate-bounce [animation-duration:0.4s]" />
              </div>
            )}
            {agentState === "listening" && (
              <div className="flex items-end gap-1 h-5">
                <span className="w-1 bg-rose-500 h-1.5 rounded-full animate-pulse [animation-duration:0.2s]" />
                <span className="w-1 bg-amber-400 h-3 rounded-full animate-pulse [animation-duration:0.4s]" />
                <span className="w-1 bg-rose-500 h-2 rounded-full animate-pulse [animation-duration:0.3s]" />
              </div>
            )}
            {agentState === "idle" && (
              <span className="text-[9px] font-mono font-bold text-purple-400 tracking-wider">
                ● NEO VOICE ENGINE IDLE
              </span>
            )}
            {agentState === "thinking" && (
              <span className="text-[9px] font-mono font-bold text-purple-300 tracking-widest animate-pulse">
                ⚡ SECURING POLICY INTERFERENCE...
              </span>
            )}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div id="phonepe-active-dashboard" className="flex flex-col h-full bg-slate-900 text-white rounded-3xl shadow-2xl relative overflow-hidden border border-slate-700">
      
      {/* 1. TOP MARQUEE BANNER: PhonePe Premium Verified Stamp */}
      <div className="bg-gradient-to-r from-violet-850 to-indigo-900 px-5 py-3.5 border-b border-indigo-950 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                VERIFIED BY NEO AI
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-100 mt-0.5">
              Insured: {policyDetails.insuredName} ({policyDetails.policyNumber})
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-indigo-200 block font-mono">Premium Status</span>
          <span className="text-xs font-bold text-teal-400 font-mono">Paid: {policyDetails.premiumAmount}</span>
        </div>
      </div>

      {/* 2. CORE WORKSPACE SCROLLBOARD: Interactive Chatbot & Questioning */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent bg-slate-950/70"
      >
        
        {/* Dynamic Warning Highlight Block (Parsed directly from text) */}
        <div className="p-3.5 bg-indigo-950/40 border border-indigo-900/60 rounded-2xl flex gap-3 text-left animate-fade-in">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Neo Scanned Policy Exclusions Caution</span>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed italic">
              "Note itemized boundaries: {policyDetails.exclusions ? policyDetails.exclusions.substring(0, 140) + '...' : 'pre-existing conditions, intentional/war damages are strictly excluded.'}"
            </p>
          </div>
        </div>

        {/* AI Powered Questioning Segment */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 text-left">
            <Bot className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Scanned Document Questions (Click to Ask)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
            {dynamicDocQuestions.map((q, idx) => (
              <button
                key={idx}
                id={`dynamic-active-q-${idx}`}
                onClick={() => handleQuerySubmit(q)}
                disabled={agentState === "thinking" || agentState === "listening"}
                className="text-left text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white p-2.5 rounded-xl transition-all font-medium flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span className="truncate pr-2">{q}</span>
                <Play className="w-2.5 h-2.5 text-indigo-400 shrink-0 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Conversational Log Screen */}
        <div className="space-y-4 pt-1 text-left">
          <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 font-mono">
              Policy Transaction Dialogue
            </span>
            <span className="text-[10.5px] text-indigo-400 flex items-center gap-1 font-sans">
              <Activity className="w-3.5 h-3.5" />
              Real-time reading
            </span>
          </div>

          {!isInteracting && chatHistory.length <= 1 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
              <Bot className="w-10 h-10 text-slate-600 animate-pulse" />
              <p className="text-xs font-semibold">"Neo auto-scan model logged online."</p>
              <p className="text-[10.5px] max-w-xs text-slate-600">
                Type in the keyboard below separate from Neo, tap dynamic questions, or press the core Neo voice orb at the bottom to talk!
              </p>
            </div>
          ) : (
            chatHistory.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-fade-in`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`text-[10px] font-mono tracking-widest uppercase font-bold ${isUser ? "text-cyan-400" : "text-indigo-400"}`}>
                      {isUser ? "You Typed / Spoke" : "Neo AI India Response"}
                    </span>
                    <span className="text-[8px] text-slate-600 font-mono">{msg.timestamp}</span>
                  </div>

                  <div 
                    className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed transition-all shadow-md ${
                      isUser 
                        ? "bg-cyan-600/15 text-cyan-100 border border-cyan-500/30 rounded-tr-none" 
                        : "bg-slate-900 border border-slate-800 rounded-tl-none text-slate-200 font-sans"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}

          {agentState === "thinking" && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse pl-1">
              <Bot className="w-4 h-4 animate-spin" />
              <span>Neo is reading policy parameters... please be patient...</span>
            </div>
          )}
        </div>

      </div>

      {/* 3. MIDDLE SEPARATE TEXT KEYBOARD PANEL: Dedicated typing is separate from Neo speech */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 p-3 shrink-0 z-10 flex flex-col gap-2">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <input
            id="separate-keyboard-input"
            type="text"
            value={keyboardInput}
            onChange={(e) => setKeyboardInput(e.target.value)}
            disabled={agentState === "thinking" || agentState === "listening"}
            placeholder="Type your question here (Separate Keyboard Input)..."
            className="flex-1 bg-slate-950/80 border border-slate-800 text-xs px-3 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
          />
          <button
            id="keyboard-submit-btn"
            type="submit"
            disabled={!keyboardInput.trim() || agentState === "thinking" || agentState === "listening"}
            className="h-9 w-9 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-md shrink-0 duration-200"
            title="Submit keyboard text query separate from Neo dictation"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
