import React from 'react';
import {
  X,
  Database,
  Sparkles,
  ShieldAlert,
  Server,
  FileText,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: {
    dbConnected: boolean;
    dbMode: string;
    geminiConfigured: boolean;
  };
}

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({
  isOpen,
  onClose,
  systemStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">System Diagnostics</h3>
              <p className="text-xs text-slate-500">MediSummarize Full-Stack Architecture</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-600">
          {/* Database Status */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Database className="w-4 h-4 text-sky-600" />
                <span>Database Connection</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                  systemStatus.dbConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {systemStatus.dbConnected ? 'MongoDB Live' : 'In-Memory Ready'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Current Mode:</strong> {systemStatus.dbMode}. The server attempts connection to
              MongoDB via <code>MONGODB_URI</code>. If MongoDB is not active in this container, an
              embedded in-memory failover storage is automatically activated so your testing is completely
              seamless and persistent throughout the session!
            </p>
          </div>

          {/* Gemini AI Status */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Gemini AI Engine</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                  systemStatus.geminiConfigured
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {systemStatus.geminiConfigured ? 'API Key Configured' : 'Local Extraction Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Runs server-side using <code>@google/genai</code> SDK with <code>gemini-3.6-flash</code>.
              Your API key is kept secure on the backend and never sent to the browser. If no key is set,
              a deterministic clinical extraction fallback generates structured reports without failing.
            </p>
          </div>

          {/* Safety Safeguards */}
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/70 space-y-1.5 text-amber-950">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Medical Safety Directive</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              MediSummarize strictly adheres to clinical boundary guidelines: No medical diagnosis, no treatment
              recommendations, no medication prescriptions. The AI exclusively summarizes data explicitly
              present in the uploaded document.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
