import React, { useRef, useState } from "react";
import { UploadCloud, FileText, ShieldAlert, Sparkles } from "lucide-react";

interface UploadStageProps {
  onFileSelected: (base64: string, fileName: string) => void;
  onUseSample: () => void;
  isLoading: boolean;
}

export default function UploadStage({ onFileSelected, onUseSample, isLoading }: UploadStageProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF document.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onFileSelected(reader.result, file.name);
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="upload-stage" className="w-full max-w-3xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border border-slate-150 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight">
          Insurance Policy Assistant
        </h1>
        <p className="mt-2 text-slate-500 max-w-lg mx-auto">
          Upload your insurance policy PDF to analyze coverage details, premiums, key benefits, claims processes, and critical exclusions in seconds.
        </p>
      </div>

      <div
        id="drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={isLoading ? undefined : onButtonClick}
        className={`relative group border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all duration-300 text-center select-none ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
            : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/50"
        } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-slate-50 group-hover:bg-blue-50 rounded-full text-slate-400 group-hover:text-blue-500 transition-colors duration-200">
            <FileText className="w-12 h-12" />
          </div>
          
          <div>
            <p className="text-slate-800 font-medium">
              Drag & drop your policy PDF here, or{" "}
              <span className="text-blue-600 font-semibold group-hover:underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports PDF files up to 25MB</p>
          </div>
        </div>

        {isDragActive && (
          <div className="absolute inset-0 bg-blue-50/90 rounded-xl flex items-center justify-center border-2 border-blue-500">
            <p className="text-blue-600 text-lg font-semibold animate-bounce">
              Drop the PDF now to upload!
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Don't have a policy PDF handy?</p>
            <p className="text-xs text-slate-500">Test the assistant instantly using our sample travel/health document.</p>
          </div>
        </div>
        
        <button
          id="btn-sample-policy"
          type="button"
          onClick={onUseSample}
          disabled={isLoading}
          className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold shadow-md active:scale-95 transition-all text-nowrap"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Try Sample Policy
        </button>
      </div>

      {isLoading && (
        <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-4 animate-pulse">
          <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-blue-700 font-medium">
            Formulating request, reading PDF text, and identifying core insurance parameters... Please wait.
          </p>
        </div>
      )}
    </div>
  );
}
