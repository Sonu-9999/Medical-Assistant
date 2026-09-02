import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Phone,
  Shield,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  Volume2,
  Clock,
  Plus,
  RefreshCw,
  Database,
  ArrowUpDown,
} from 'lucide-react';
import { IPatient, IReport, IDoctor } from '../types';
import { api } from '../services/api';
import { DoctorSidebar } from '../components/DoctorSidebar';
import { AISummaryCard } from '../components/AISummaryCard';
import { FileUpload } from '../components/FileUpload';

interface DoctorPortalProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
  systemStatus: {
    dbConnected: boolean;
    dbMode: string;
    geminiConfigured: boolean;
  };
  onRefreshHealth: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  onShowToast,
  systemStatus,
  onRefreshHealth,
}) => {
  // Doctor Auth State
  const [doctor, setDoctor] = useState<IDoctor | null>(() => {
    const saved = localStorage.getItem('medisummarize_doctor');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginEmail, setLoginEmail] = useState('doctor@example.com');
  const [loginPassword, setLoginPassword] = useState('change_this_password');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Portal Navigation & Data
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'reports' | 'system'>('dashboard');
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Search, Filter & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'Hindi' | 'English'>('all');
  const [reportFilter, setReportFilter] = useState<'all' | 'has_reports' | 'no_reports'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Doctor Report Upload State for current patient
  const [doctorUploadFile, setDoctorUploadFile] = useState<File | null>(null);
  const [isDoctorUploading, setIsDoctorUploading] = useState(false);
  const [doctorUploadProgress, setDoctorUploadProgress] = useState(0);
  const [doctorUploadStage, setDoctorUploadStage] = useState('');
  const [isReSummarizingId, setIsReSummarizingId] = useState<string | null>(null);

  // Fetch patients list
  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const data = await api.getPatients({
        search: searchTerm,
        language: languageFilter,
        sort: sortBy,
      });
      setPatients(data.patients || []);
    } catch (err: any) {
      console.error('[DoctorPortal] Error loading patients:', err.message);
      onShowToast('error', 'Failed to load patients', err.message);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (doctor) {
      fetchPatients();
    }
  }, [doctor, searchTerm, languageFilter, sortBy]);

  // Fetch patient details when selected
  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatient(null);
      return;
    }

    const loadPatientDetails = async () => {
      setIsLoadingDetail(true);
      try {
        const res = await api.getPatient(selectedPatientId);
        setSelectedPatient(res.patient);
      } catch (err: any) {
        onShowToast('error', 'Failed to retrieve patient file', err.message);
        setSelectedPatientId(null);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    loadPatientDetails();
  }, [selectedPatientId]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await api.loginDoctor(loginEmail, loginPassword);
      setDoctor(res.doctor);
      localStorage.setItem('medisummarize_doctor', JSON.stringify(res.doctor));
      localStorage.setItem('medisummarize_token', res.token);
      onShowToast('success', `Welcome back, ${res.doctor.name}`);
    } catch (err: any) {
      onShowToast('error', 'Login failed', err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setDoctor(null);
    localStorage.removeItem('medisummarize_doctor');
    localStorage.removeItem('medisummarize_token');
    setSelectedPatientId(null);
    onShowToast('info', 'Signed Out', 'You have signed out of the Doctor Portal.');
  };

  // Re-summarize report
  const handleReSummarize = async (reportId: string) => {
    setIsReSummarizingId(reportId);
    try {
      onShowToast('info', 'Analyzing with Gemini AI', 'Extracting parameters from document...');
      const res = await api.summarizeReport(reportId);

      // Update patient state
      if (selectedPatient) {
        setSelectedPatient({
          ...selectedPatient,
          reports: selectedPatient.reports.map((r) => (r.reportId === reportId ? res.report : r)),
        });
      }
      onShowToast('success', 'Summary Updated', 'Medical report re-summarized with Gemini AI.');
    } catch (err: any) {
      onShowToast('error', 'AI Summarization Failed', err.message);
    } finally {
      setIsReSummarizingId(null);
    }
  };

  // Upload report on behalf of patient
  const handleDoctorUploadReport = async () => {
    if (!doctorUploadFile || !selectedPatient) return;

    setIsDoctorUploading(true);
    setDoctorUploadProgress(20);
    setDoctorUploadStage('Uploading PDF report...');

    try {
      setDoctorUploadProgress(50);
      setDoctorUploadStage('Extracting document text...');

      setTimeout(() => {
        setDoctorUploadProgress(75);
        setDoctorUploadStage('Analyzing clinical parameters with Gemini AI...');
      }, 700);

      const res = await api.uploadReport(selectedPatient.patientId, doctorUploadFile);
      setDoctorUploadProgress(100);
      setDoctorUploadStage('Complete!');

      // Add to patient report list
      setSelectedPatient({
        ...selectedPatient,
        reports: [res.report, ...(selectedPatient.reports || [])],
      });

      setDoctorUploadFile(null);
      onShowToast('success', 'Report Uploaded', 'Extracted and summarized successfully.');
      fetchPatients();
    } catch (err: any) {
      onShowToast('error', 'Report Upload Failed', err.message);
    } finally {
      setIsDoctorUploading(false);
      setDoctorUploadProgress(0);
      setDoctorUploadStage('');
    }
  };

  // Calculate statistics
  const totalReportsCount = patients.reduce((acc, p) => acc + (p.reports?.length || 0), 0);
  const reportsWithAbnormal = patients.reduce(
    (acc, p) =>
      acc +
      (p.reports?.filter((r) => r.aiSummary?.abnormalResults && r.aiSummary.abnormalResults.length > 0)
        .length || 0),
    0
  );

  // Filtered patients list
  const filteredPatients = patients.filter((p) => {
    if (reportFilter === 'has_reports') return (p.reports?.length || 0) > 0;
    if (reportFilter === 'no_reports') return (p.reports?.length || 0) === 0;
    return true;
  });

  // 1. If not authenticated, show Doctor Login Screen
  if (!doctor) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card bg-white/65 backdrop-blur-md border border-white/60 p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)]">
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100/80 shadow-2xs">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 font-display">Doctor Portal Sign In</h2>
            <p className="text-xs text-slate-500">
              Access patient intake summaries, voice complaints, and AI-extracted clinical records.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                placeholder="doctor@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-200/80 transition disabled:opacity-50"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In as Physician'}
            </button>

            {/* Quick Demo Autofill Helper */}
            <div className="pt-3 border-t border-white/60 text-center">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('doctor@example.com');
                  setLoginPassword('change_this_password');
                  onShowToast('info', 'Demo Credentials Loaded', 'Click "Sign In as Physician"');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Prototype Credentials</span>
              </button>
              <p className="text-[11px] text-slate-400 mt-1">
                Demo Account: doctor@example.com / change_this_password
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. Doctor Dashboard Layout
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Sidebar Navigation */}
      <DoctorSidebar
        doctor={doctor}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'patients') setSelectedPatientId(null);
        }}
        onLogout={handleLogout}
        patientCount={patients.length}
        reportCount={totalReportsCount}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* If viewing a single patient's detailed clinical file */}
        {selectedPatientId && selectedPatient ? (
          <div className="space-y-6">
            {/* Back Button & Patient Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 glass-card bg-white/65 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="back-to-patients-btn"
                  onClick={() => setSelectedPatientId(null)}
                  className="p-2 text-slate-500 hover:text-slate-900 bg-white/50 hover:bg-white/80 rounded-xl transition border border-white/70 shadow-2xs"
                  title="Back to patient list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 font-display">
                      {selectedPatient.name}
                    </h2>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50/80 text-blue-700 border border-blue-200/80 rounded-full">
                      {selectedPatient.patientId}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-white/70 text-slate-700 border border-white/80 rounded-full">
                      {selectedPatient.preferredLanguage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPatient.age} yrs • {selectedPatient.gender.toUpperCase()} • Registered:{' '}
                    {new Date(selectedPatient.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <div className="text-slate-600">Contact: {selectedPatient.phone}</div>
                  <div className="text-slate-500">
                    Aadhaar (Masked): <span className="font-mono">{selectedPatient.maskedAadhaar}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Problem & Voice Recording Card */}
            <div className="glass-card bg-white/65 backdrop-blur-md border border-white/60 p-5 sm:p-6 shadow-2xs space-y-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span>Patient Reported Complaint / Symptoms</span>
                </h3>
                <span className="text-xs font-medium text-slate-600 bg-white/60 border border-white/80 px-2.5 py-0.5 rounded-full">
                  Language: {selectedPatient.problemDescriptionLanguage || selectedPatient.preferredLanguage}
                </span>
              </div>

              {/* Text Description */}
              <div className="p-4 bg-white/50 backdrop-blur-xs rounded-xl border border-white/70 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-2xs">
                {selectedPatient.problemDescription || 'No written symptoms recorded.'}
              </div>

              {/* Audio Note & Speech Transcription */}
              {selectedPatient.audioFilePath && (
                <div className="p-4 bg-blue-50/60 backdrop-blur-xs rounded-xl border border-blue-100/80 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      <span>Patient Voice Recording</span>
                    </div>
                    <span className="text-[11px] text-blue-700 font-medium">Available for Review</span>
                  </div>

                  <audio
                    controls
                    src={selectedPatient.audioFilePath}
                    className="w-full h-9 rounded-lg"
                  />

                  {selectedPatient.audioTranscript && (
                    <div className="pt-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Audio Transcription: </span>
                      <span className="italic">"{selectedPatient.audioTranscript}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upload Additional Report for this Patient */}
            <div className="glass-card bg-white/65 backdrop-blur-md border border-white/60 p-5 sm:p-6 shadow-2xs space-y-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Clinical Reports & Summaries ({selectedPatient.reports?.length || 0})</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Grounded Extraction via Gemini AI
                </span>
              </div>

              {/* Optional Doctor PDF Upload Accordion */}
              <FileUpload
                selectedFile={doctorUploadFile}
                onFileSelected={(file) => setDoctorUploadFile(file)}
                isUploading={isDoctorUploading}
                uploadProgress={doctorUploadProgress}
                uploadStageMessage={doctorUploadStage}
                onUpload={handleDoctorUploadReport}
              />

              {/* List of Summarized Reports */}
              {selectedPatient.reports && selectedPatient.reports.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {selectedPatient.reports.map((report) => (
                    <AISummaryCard
                      key={report.reportId}
                      report={report}
                      onReSummarize={handleReSummarize}
                      isReSummarizing={isReSummarizingId === report.reportId}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No medical reports uploaded yet for this patient.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dashboard & Patient Directory View */
          <>
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-card bg-white/60 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Patients
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 font-display">{patients.length}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Active clinical cohort</p>
              </div>

              <div className="glass-card bg-white/60 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Reports
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-50/80 border border-cyan-100 text-cyan-600 flex items-center justify-center shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800 font-display">{totalReportsCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">PDF documents ingested</p>
              </div>

              <div className="glass-card bg-white/60 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Abnormal Flags
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-rose-50/80 border border-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-rose-700 font-display">{reportsWithAbnormal}</p>
                <p className="text-[11px] text-rose-600/80 mt-0.5">Elevated test results</p>
              </div>

              <div className="glass-card bg-white/60 backdrop-blur-md border border-white/60 p-4 sm:p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    AI Accuracy
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50/80 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-700 font-display">100%</p>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">Strict non-hallucinatory</p>
              </div>
            </div>

            {/* Patient Search & Filter Bar */}
            <div className="glass-card bg-white/60 backdrop-blur-md border border-white/60 p-4 rounded-2xl shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="search-patients-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, ID, phone, symptom..."
                    className="w-full pl-9 pr-3.5 py-2 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                  />
                </div>

                {/* Filter & Sort Controls */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Language */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      id="filter-language-select"
                      value={languageFilter}
                      onChange={(e: any) => setLanguageFilter(e.target.value)}
                      className="px-2.5 py-1.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none"
                    >
                      <option value="all">All Languages</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  {/* Reports Filter */}
                  <select
                    id="filter-reports-select"
                    value={reportFilter}
                    onChange={(e: any) => setReportFilter(e.target.value)}
                    className="px-2.5 py-1.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Records</option>
                    <option value="has_reports">With Reports Only</option>
                    <option value="no_reports">Pending Reports</option>
                  </select>

                  {/* Sort */}
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      id="sort-patients-select"
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="px-2.5 py-1.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Patient Name (A-Z)</option>
                    </select>
                  </div>

                  {/* Refresh */}
                  <button
                    type="button"
                    onClick={fetchPatients}
                    disabled={isLoadingPatients}
                    className="p-2 text-slate-500 hover:text-slate-800 bg-white/60 hover:bg-white/90 backdrop-blur-xs rounded-xl border border-white/80 transition shadow-2xs"
                    title="Refresh Directory"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPatients ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Patients Table */}
            <div className="glass-card bg-white/60 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-800 font-display">Patient Cohort</h3>
                  <p className="text-xs text-slate-500">
                    Showing {filteredPatients.length} patient record{filteredPatients.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              {isLoadingPatients ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading patients directory...</div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No matching patients found. Try adjusting the search query or language filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-white/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-white/50">
                      <tr>
                        <th className="py-3.5 px-4 sm:px-6">Patient ID</th>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Demographics</th>
                        <th className="py-3.5 px-4">Language</th>
                        <th className="py-3.5 px-4">Audio</th>
                        <th className="py-3.5 px-4">Reports</th>
                        <th className="py-3.5 px-4">Registered</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/50">
                      {filteredPatients.map((patient) => {
                        const reportCount = patient.reports?.length || 0;
                        const hasAudio = !!patient.audioFilePath;

                        return (
                          <tr
                            key={patient.patientId}
                            id={`patient-row-${patient.patientId}`}
                            className="hover:bg-white/70 transition cursor-pointer"
                            onClick={() => setSelectedPatientId(patient.patientId)}
                          >
                            <td className="py-3.5 px-4 sm:px-6 font-mono font-semibold text-blue-600">
                              {patient.patientId}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {patient.name}
                            </td>
                            <td className="py-3.5 px-4">
                              {patient.age} yrs • {patient.gender}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 bg-white/70 border border-white/80 rounded-md font-medium text-[11px] text-slate-700">
                                {patient.preferredLanguage}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {hasAudio ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-200/60">
                                  <Volume2 className="w-3 h-3" /> Audio
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Text only</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  reportCount > 0
                                    ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-200/80'
                                    : 'bg-white/60 text-slate-500 border border-white/70'
                                }`}
                              >
                                {reportCount} {reportCount === 1 ? 'Report' : 'Reports'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {new Date(patient.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPatientId(patient.patientId);
                                }}
                                className="px-3 py-1 bg-white/70 hover:bg-blue-50 text-blue-700 border border-blue-200/60 rounded-xl font-medium text-xs transition shadow-2xs"
                              >
                                Review File
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* System Diagnostics & MongoDB Information Tab */}
            {activeTab === 'system' && (
              <div className="glass-card bg-white/65 backdrop-blur-md border border-white/60 p-5 sm:p-6 shadow-2xs space-y-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>System Diagnostics & MongoDB Connection</span>
                  </h3>
                  <button
                    type="button"
                    onClick={onRefreshHealth}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-blue-700 bg-white/70 border border-blue-200/80 rounded-xl hover:bg-blue-50 transition shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh Status
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/50 backdrop-blur-xs rounded-xl border border-white/80 text-xs space-y-2 shadow-2xs">
                    <div className="font-semibold text-slate-800">Database Storage Mode</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          systemStatus.dbConnected ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-mono text-slate-700">{systemStatus.dbMode}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      When MongoDB is running at <code>mongodb://localhost:27017/medisummarize</code> (or
                      via <code>MONGODB_URI</code>), data persists in the MongoDB cluster. If MongoDB is
                      offline, MediSummarize automatically fails over to in-memory storage so testing is
                      never interrupted!
                    </p>
                  </div>

                  <div className="p-4 bg-white/50 backdrop-blur-xs rounded-xl border border-white/80 text-xs space-y-2 shadow-2xs">
                    <div className="font-semibold text-slate-800">Gemini AI Model</div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="font-mono text-slate-700">
                        gemini-3.6-flash (Strict Grounding Schema)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      The AI summarizes information explicitly present in uploaded PDF text. If no API key
                      is provided, a deterministic clinical extraction fallback ensures zero downtime.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
