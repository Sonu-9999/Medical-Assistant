import React from 'react';
import {
  FileText,
  User,
  Stethoscope,
  Database,
  Sparkles,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  activePortal: 'patient' | 'doctor';
  onSelectPortal: (portal: 'patient' | 'doctor') => void;
  systemStatus: {
    dbConnected: boolean;
    dbMode: string;
    geminiConfigured: boolean;
  };
  onOpenSystemInfo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePortal,
  onSelectPortal,
  systemStatus,
  onOpenSystemInfo,
}) => {
  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 w-full bg-white/50 backdrop-blur-md border-b border-white/50 shadow-xs transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/80 text-white font-bold">
            MS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-800 tracking-tight font-display">
                Medi<span className="text-blue-600">Summarize</span>
              </span>
              
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Intelligent Document Management & Grounded Medical Summarization
            </p>
          </div>
        </div>

        {/* Portal Switcher */}
        <div className="flex items-center bg-white/40 backdrop-blur-xs p-1 rounded-xl border border-white/60 shadow-2xs">
          <button
            id="nav-patient-portal-btn"
            onClick={() => onSelectPortal('patient')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activePortal === 'patient'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-blue-600" />
            <span>Patient Portal</span>
          </button>
          <button
            id="nav-doctor-portal-btn"
            onClick={() => onSelectPortal('doctor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activePortal === 'doctor'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>Doctor Portal</span>
          </button>
        </div>

        {/* System Diagnostics & Guide */}
        <div className="hidden lg:flex items-center gap-2.5">
          <button
            id="system-status-indicator"
            onClick={onOpenSystemInfo}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/50 hover:bg-white/70 backdrop-blur-xs border border-white/60 rounded-xl text-xs text-slate-700 transition shadow-2xs"
            title="Click to view Database & AI configuration details"
          >
            <Database
              className={`w-3.5 h-3.5 ${
                systemStatus.dbConnected ? 'text-emerald-600' : 'text-amber-500'
              }`}
            />
            <span className="font-medium text-[11px]">
              {systemStatus.dbConnected ? 'MongoDB Connected' : 'In-Memory Ready'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <Sparkles
              className={`w-3.5 h-3.5 ${
                systemStatus.geminiConfigured ? 'text-blue-600' : 'text-slate-400'
              }`}
            />
            <span className="text-[11px]">Gemini 2.5</span>
          </button>

          <button
            id="open-guide-btn"
            onClick={onOpenSystemInfo}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white/40 hover:bg-white/70 backdrop-blur-xs border border-white/60 rounded-xl transition shadow-2xs"
            aria-label="View system architecture and setup guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
