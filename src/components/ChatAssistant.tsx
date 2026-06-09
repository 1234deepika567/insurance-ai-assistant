import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { 
  Send, 
  FileText, 
  Bot, 
  User, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff 
} from "lucide-react";
import { ChatMessage } from "../types";

interface ChatAssistantProps {
  pdfBase64: string;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const PLANNED_SUGGESTIONS = [
  "What is covered under this policy?",
  "When does this policy expire?",
  "Can you list the key exclusions?",
  "How do I file a claim?",
  "What is the premium amount?",
  "What is the policy number?"
];

// Check speech recognition support
const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognitionSupported = !!SpeechRecognitionClass;

export default function ChatAssistant({ pdfBase64, chatHistory, setChatHistory }: ChatAssistantProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [autoReadAloud, setAutoReadAloud] = useState<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (recognitionSupported) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      
      rec.onstart = () => {
        setIsListening(true);
      };
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputValue(prev => prev + (prev ? " " : "") + transcript);
        }
      };
      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }

    // Clean up active speech synthesis on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Trigger auto read-aloud when a new assistant message is posted
  useEffect(() => {
    if (chatHistory.length > 0) {
      const latestMsg = chatHistory[chatHistory.length - 1];
      if (latestMsg.sender === "assistant" && autoReadAloud && !latestMsg.isError) {
        handleSpeak(latestMsg.text, latestMsg.id);
      }
    }
  }, [chatHistory, autoReadAloud]);

  // Auto-scroll to the bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isSending]);

  const handleSpeak = (text: string, msgId: string) => {
    if (!window.speechSynthesis) {
      alert("Your browser does not support Speech Synthesis.");
      return;
    }

    if (currentlySpeakingId === msgId) {
      // If active speaking is clicked again, stop it
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    // Terminate any active speaking
    window.speechSynthesis.cancel();

    // Sanitize markdown markup for clean speech synthesis output
    const cleanSpeechText = text
      .replace(/\*\*/g, "") // Bold markers
      .replace(/\*/g, "") // Italic markers
      .replace(/#/g, "") // Header markers
      .replace(/`[^`]+`/g, "") // Code elements
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Links fallback to text
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    
    // Attempt standard friendly English voice selection
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      v.name.includes("Google US English") || 
      v.name.includes("Microsoft Zira") || 
      v.name.includes("Samantha") ||
      v.lang.startsWith("en-US")
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };
    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    setCurrentlySpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    // Quit voice input immediately on submit
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, userMsg]);
    setInputValue("");
    setIsSending(true);

    try {
      // 2. Query endpoint
      const response = await fetch("/api/chat-policy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pdfBase64,
          message: textToSend,
          history: chatHistory // Sends prior history context
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with policy helper API");
      }

      const result = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: result.answer || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, assistantMsg]);

    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "Sorry, I had trouble processing your question. Please ensure your Gemini API configuration is correct and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setChatHistory(prev => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInputValue(""); // Clean slate for voice dictation
      recognitionRef.current.start();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setCurrentlySpeakingId(null);
      setChatHistory([
        {
          id: "welcome",
          sender: "assistant",
          text: "Hello! I have scanned your uploaded insurance policy document. You can ask me any question regarding your **coverage, expiration date, premium, exclusions, claim procedures, or benefit specifications**. I will answer strictly from your uploaded policy text.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div id="chat-assistant" className="flex flex-col h-full bg-slate-50/50 rounded-2xl shadow-lg border border-slate-150 overflow-hidden animate-fade-in text-left">
      {/* Header Panel */}
      <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100/60 text-blue-700 rounded-xl">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Policy Concierge AI
            </h3>
            <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
              Policy Context Active
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Auto Read Aloud Toggle Switch */}
          <button
            onClick={() => {
              const newVal = !autoReadAloud;
              setAutoReadAloud(newVal);
              if (!newVal && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                setCurrentlySpeakingId(null);
              }
            }}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold border ${
              autoReadAloud 
                ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                : "bg-slate-100/80 border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
            title={autoReadAloud ? "Turn off automatic voice speak" : "Turn on automatic voice speak"}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{autoReadAloud ? "Auto Voice: On" : "Auto Voice: Off"}</span>
          </button>

          {chatHistory.length > 1 && (
            <button
              id="btn-clear-chat"
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-105 transition-colors border border-transparent hover:border-slate-200"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Discussion Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {chatHistory.map(msg => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar */}
              <div className={`p-2 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center border ${
                isUser ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-blue-600"
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Speech bubble */}
              <div className="space-y-1">
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  isUser 
                    ? "bg-slate-900 text-white rounded-tr-none text-left" 
                    : msg.isError
                    ? "bg-red-50 text-red-700 border border-red-150 rounded-tl-none text-left"
                    : "bg-white text-slate-700 border border-slate-150/80 rounded-tl-none text-left"
                }`}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div className="markdown-body prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}
                </div>

                {/* Additional controls like Audio play/pause for Bot responses */}
                {!isUser && !msg.isError && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <button
                      onClick={() => handleSpeak(msg.text, msg.id)}
                      className={`text-[11px] font-bold tracking-tight inline-flex items-center gap-1 p-1 px-2.5 rounded-full transition-all ${
                        currentlySpeakingId === msg.id 
                          ? "bg-red-500 text-white shadow-sm ring-2 ring-red-100" 
                          : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {currentlySpeakingId === msg.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-white" />
                          Stop Speaking
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-blue-500" />
                          Speak Answer
                        </>
                      )}
                    </button>
                  </div>
                )}

                <p className={`text-[10px] text-slate-400 px-1 ${isUser ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="p-2 bg-white border border-slate-100 text-blue-600 rounded-xl h-9 w-9 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-150/80 rounded-tl-none flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Input Prompts */}
      <div className="p-4 bg-white border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          Suggested Questions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PLANNED_SUGGESTIONS.map((suggestion, idx) => (
            <button
              id={`suggestion-${idx}`}
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              disabled={isSending}
              className="text-xs bg-slate-50 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-full border border-slate-150 hover:border-blue-200 transition-colors active:scale-95 text-left disabled:opacity-50 disabled:pointer-events-none"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Messaging input form */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 pt-2">
          {/* Mic Button Option */}
          {recognitionSupported ? (
            <button
              id="voice-dictation-btn"
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 active:scale-90 ${
                isListening 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800"
              }`}
              title={isListening ? "Stop listening" : "Speak your question / Start microphone"}
            >
              <Mic className={`w-4 h-4 ${isListening ? "animate-bounce" : ""}`} />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="p-3 bg-slate-50 border border-slate-100 text-slate-300 rounded-xl cursor-not-allowed"
              title="Speech-to-text not supported in browser"
            >
              <MicOff className="w-4 h-4" />
            </button>
          )}

          <input
            id="chat-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSending}
            placeholder={isListening ? "Listening closely... Speak now!" : "Ask anything about exclusions, coverage, claims..."}
            className={`flex-1 border focus:bg-white text-sm px-4 py-3 rounded-xl focus:outline-none transition-all placeholder:text-slate-400 text-slate-800 disabled:opacity-70 ${
              isListening ? "bg-red-50/50 border-red-300 focus:border-red-400 placeholder:text-red-400 text-red-900" : "bg-slate-50 border-slate-200 focus:border-blue-500"
            }`}
          />
          
          <button
            id="chat-submit"
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-150 text-white disabled:text-slate-400 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 active:scale-95 disabled:scale-100"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        {isListening && (
          <div className="text-center text-xs font-semibold text-rose-500 animate-pulse pl-1">
            ● Native dictation mode active — start speaking to fill text. Click microphone again to turn off.
          </div>
        )}
      </div>
    </div>
  );
}
