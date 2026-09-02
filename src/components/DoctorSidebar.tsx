import React from 'react';
import {
  Users,
  FileText,
  Activity,
  LogOut,
  ShieldCheck,
  Stethoscope,
  Database,
  ExternalLink,
} from 'lucide-react';
import { IDoctor } from '../types';

interface DoctorSidebarProps {
  doctor: IDoctor;
  activeTab: 'dashboard' | 'patients' | 'reports' | 'system';
  onSelectTab: (tab: 'dashboard' | 'patients' | 'reports' | 'system') => void;
  onLogout: () => void;
  patientCount: number;
  reportCount: number;
}

export const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  doctor,
  activeTab,
  onSelectTab,
  onLogout,
  patientCount,
  reportCount,
}) => {
  return (
    <aside
      id="doctor-sidebar"
      className="w-full lg:w-64 glass-card bg-white/50 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] flex flex-col justify-between shrink-0 my-4 ml-4 mr-0 lg:mr-0 rounded-2xl lg:rounded-3xl overflow-hidden self-start sticky top-20"
    >
      <div className="p-5 space-y-6">
        {/* Doctor Profile Banner */}
        <div className="p-3.5 bg-white/60 backdrop-blur-xs border border-white/80 rounded-2xl flex items-center gap-3 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200 shrink-0">
            {doctor.name.split(' ').map(n => n[0]).slice(0, 2).join('') || 'DR'}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate font-display">
              {doctor.name}
            </h4>
            <p className="text-[11px] text-blue-600 font-medium truncate">{doctor.specialty}</p>
            <p className="text-[10px] text-slate-400 truncate">{doctor.email}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          <button
            type="button"
            id="sidebar-dashboard-tab"
            onClick={() => onSelectTab('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4" />
              <span>Overview & Metrics</span>
            </div>
          </button>

          <button
            type="button"
            id="sidebar-patients-tab"
            onClick={() => onSelectTab('patients')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'patients'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>Patient Directory</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                activeTab === 'patients'
                  ? 'bg-white/25 text-white'
                  : 'bg-blue-50/70 text-blue-700 border border-blue-100/60'
              }`}
            >
              {patientCount}
            </span>
          </button>

          <button
            type="button"
            id="sidebar-reports-tab"
            onClick={() => onSelectTab('reports')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              <span>Medical Reports</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                activeTab === 'reports'
                  ? 'bg-white/25 text-white'
                  : 'bg-blue-50/70 text-blue-700 border border-blue-100/60'
              }`}
            >
              {reportCount}
            </span>
          </button>

          <button
            type="button"
            id="sidebar-system-tab"
            onClick={() => onSelectTab('system')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'system'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4" />
              <span>System Diagnostics</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Footer / Safety & Logout */}
      <div className="p-4 border-t border-white/50 bg-white/30 backdrop-blur-xs space-y-3">
        <div className="p-2.5 bg-white/60 border border-white/80 rounded-xl text-[11px] text-slate-600 leading-relaxed shadow-2xs">
          <div className="flex items-center gap-1 font-semibold text-slate-800 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Clinical Verification</span>
          </div>
          AI summaries must be correlated with original PDFs.
        </div>

        <button
          type="button"
          id="doctor-logout-btn"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50/80 bg-white/60 backdrop-blur-xs border border-rose-200/80 rounded-xl transition shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
