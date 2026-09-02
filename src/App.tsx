import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PatientPortal } from './pages/PatientPortal';
import { DoctorPortal } from './pages/DoctorPortal';
import { ToastContainer } from './components/Toast';
import { SystemInfoModal } from './components/SystemInfoModal';
import { ToastMessage } from './types';
import { api } from './services/api';

export default function App() {
  const [activePortal, setActivePortal] = useState<'patient' | 'doctor'>(() => {
    return window.location.hash === '#doctor' ? 'doctor' : 'patient';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    dbConnected: false,
    dbMode: 'Checking...',
    geminiConfigured: false,
  });

  const showToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
      const id = Date.now().toString() + Math.random().toString().slice(2, 6);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      setSystemStatus({
        dbConnected: data.database.connected,
        dbMode: data.database.mode,
        geminiConfigured: data.geminiConfigured,
      });
    } catch (err: any) {
      setSystemStatus({
        dbConnected: false,
        dbMode: 'In-Memory Fallback Active',
        geminiConfigured: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    const handleHashChange = () => {
      if (window.location.hash === '#doctor') {
        setActivePortal('doctor');
      } else if (window.location.hash === '#patient') {
        setActivePortal('patient');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [fetchHealth]);

  const handleSelectPortal = (portal: 'patient' | 'doctor') => {
    setActivePortal(portal);
    window.location.hash = portal;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-200 selection:text-sky-900 font-sans relative text-slate-800">
      {/* Frosted Glass Mesh Backdrop */}
      <div className="mesh-bg" />

      {/* Top Navigation */}
      <Navbar
        activePortal={activePortal}
        onSelectPortal={handleSelectPortal}
        systemStatus={systemStatus}
        onOpenSystemInfo={() => setIsSystemInfoOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        {activePortal === 'patient' ? (
          <PatientPortal
            onShowToast={showToast}
            onNavigateToDoctorPortal={() => handleSelectPortal('doctor')}
          />
        ) : (
          <DoctorPortal
            onShowToast={showToast}
            systemStatus={systemStatus}
            onRefreshHealth={fetchHealth}
          />
        )}
      </div>

      {/* Global Safety & Compliance Footer */}
      <footer className="w-full bg-white/50 backdrop-blur-md border-t border-white/60 py-6 px-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-semibold text-slate-700">
            MediSummarize — Clinical Document Extraction & Information Management
          </p>
          <p className="text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Safety Directive: AI summaries are generated exclusively from text explicitly present in uploaded reports.
            This summary is not a medical diagnosis or medical advice. Always consult a qualified healthcare
            professional for clinical decision making.
          </p>
          <p className="text-[10px] text-slate-400 pt-1">
            Storage Engine: {systemStatus.dbMode} • AI Engine: Google Gemini • Masked Identity Safeguards Active
          </p>
        </div>
      </footer>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* System Diagnostics Modal */}
      <SystemInfoModal
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
        systemStatus={systemStatus}
      />
    </div>
  );
}
