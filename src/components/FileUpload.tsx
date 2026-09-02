import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  FileCheck2,
  Download,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File | null) => void;
  selectedFile: File | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadStageMessage?: string;
  onUpload: () => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  selectedFile,
  isUploading,
  uploadProgress,
  uploadStageMessage,
  onUpload,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);

    // Validate mime type and extension
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMessage('Invalid file format. Please upload a PDF document (.pdf).');
      return;
    }

    // Validate size limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelected(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to load sample PDF into upload queue directly
  const loadSamplePdf = async (filename: string, displayName: string) => {
    try {
      setErrorMessage(null);
      const res = await fetch(`/sample-reports/${filename}`);
      if (!res.ok) throw new Error('Sample file not found');
      const blob = await res.blob();
      const sampleFile = new File([blob], displayName, { type: 'application/pdf' });
      onFileSelected(sampleFile);
    } catch (err: any) {
      setErrorMessage(`Could not load sample file: ${err.message}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div id="medical-report-upload-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900 font-display">
            Upload Previous Medical Reports
          </h3>
          <p className="text-xs text-slate-500">
            Upload diagnostic blood tests, discharge summaries, or clinical reports in PDF format (up to 10 MB).
          </p>
        </div>

        {/* Quick sample PDF test helpers */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] hidden sm:inline">Try Demo PDF:</span>
          <button
            type="button"
            onClick={() => loadSamplePdf('CBC_Metabolic_Report_Sample.pdf', 'CBC_Metabolic_Report_Sample.pdf')}
            disabled={isUploading}
            className="px-2.5 py-1 bg-white/60 hover:bg-white/90 text-blue-700 border border-white/80 rounded-lg font-medium transition text-[11px] shadow-2xs backdrop-blur-xs"
          >
            + CBC Blood Test
          </button>
          <button
            type="button"
            onClick={() => loadSamplePdf('Thyroid_Lipid_Report_Sample.pdf', 'Thyroid_Lipid_Report_Sample.pdf')}
            disabled={isUploading}
            className="px-2.5 py-1 bg-white/60 hover:bg-white/90 text-blue-700 border border-white/80 rounded-lg font-medium transition text-[11px] shadow-2xs backdrop-blur-xs"
          >
            + Thyroid & Lipid
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-50/80 backdrop-blur-xs border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        id="pdf-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[1.005] backdrop-blur-xs'
            : selectedFile
            ? 'border-emerald-300 bg-emerald-50/50 backdrop-blur-xs'
            : 'border-slate-300/80 hover:border-blue-400 bg-white/40 hover:bg-white/60 backdrop-blur-xs shadow-2xs'
        } ${disabled || isUploading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="pdf-file-input"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50/80 text-blue-600 flex items-center justify-center ring-4 ring-white/60 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                <span className="text-blue-600 hover:underline">Click to browse</span> or drag & drop PDF here
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Strictly PDF documents only (Max size 10 MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 bg-white/80 backdrop-blur-xs border border-white/80 rounded-xl shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 text-left">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Ready for AI Extraction
                  </span>
                </div>
              </div>
            </div>

            {!isUploading && (
              <button
                type="button"
                id="remove-selected-file-btn"
                onClick={clearFile}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Remove selected PDF"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Upload & AI Extraction Progress */}
        {isUploading && (
          <div className="mt-4 pt-4 border-t border-slate-200/60 text-left">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5 text-blue-700">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>{uploadStageMessage || 'Processing Report with Gemini AI...'}</span>
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Extracting clinical text and evaluating test parameters through grounded Gemini intelligence...
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedFile && !isUploading && (
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={clearFile}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 border border-white/80 rounded-xl transition shadow-2xs backdrop-blur-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            id="upload-and-summarize-btn"
            onClick={onUpload}
            className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200/80 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upload & Extract Summary</span>
          </button>
        </div>
      )}
    </div>
  );
};
