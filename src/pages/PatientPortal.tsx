import React, { useState } from 'react';
import {
  User,
  Phone,
  ShieldCheck,
  Calendar,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { IPatient, IReport } from '../types';
import { api } from '../services/api';
import { AudioRecorder } from '../components/AudioRecorder';
import { FileUpload } from '../components/FileUpload';
import { AISummaryCard } from '../components/AISummaryCard';

interface PatientPortalProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
  onNavigateToDoctorPortal: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  onShowToast,
  onNavigateToDoctorPortal,
}) => {
  // Current Active Patient
  const [activePatient, setActivePatient] = useState<IPatient | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'Hindi' | 'English'>('English');
  const [problemDescription, setProblemDescription] = useState('');
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioTranscript, setAudioTranscript] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report Upload State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [aadhaarDigits, setAadhaarDigits] = useState('');

  // Format Aadhaar masking helper
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
  setAadhaarInput(digits);
};

  // Register Patient Form Handler
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onShowToast('error', 'Name Required', 'Please enter the patient full name.');
      return;
    }
    if (!age || Number(age) <= 0 || Number(age) > 125) {
      onShowToast('error', 'Valid Age Required', 'Please enter a valid age between 1 and 125.');
      return;
    }
    if (!phone.trim()) {
      onShowToast('error', 'Phone Required', 'Please enter a valid contact number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (aadhaarInput.length !== 12) {
          onShowToast(
            'error',
            'Invalid Aadhaar',
            'Please enter a valid 12-digit Aadhaar number.'
          );
          return;
        }
      formData.append('name', name.trim());
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('aadhaar', aadhaarInput.trim() || 'XXXX-XXXX-0000');
      formData.append('phone', phone.trim());
      formData.append('preferredLanguage', preferredLanguage);
      formData.append('problemDescription', problemDescription.trim());
      formData.append('problemDescriptionLanguage', preferredLanguage);

      if (recordedAudioBlob) {
        formData.append('audio', recordedAudioBlob, `voice_problem_${Date.now()}.webm`);
      }
      if (audioTranscript) {
        formData.append('audioTranscript', audioTranscript);
      }

      const res = await api.registerPatient(formData);
      setActivePatient(res.patient);
      onShowToast('success', 'Patient Registration Complete', `Patient ID: ${res.patient.patientId}`);
    } catch (err: any) {
      console.error('[Patient Registration Failed]:', err);
      onShowToast('error', 'Registration Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload Medical Report for Active Patient
  const handleUploadReport = async () => {
    if (!selectedPdfFile || !activePatient) return;

    setIsUploadingReport(true);
    setUploadProgress(20);
    setUploadStage('Uploading PDF document...');

    try {
      setUploadProgress(45);
      setUploadStage('Extracting text from PDF pages...');

      setTimeout(() => {
        setUploadProgress(75);
        setUploadStage('Analyzing clinical markers with Gemini AI...');
      }, 600);

      const res = await api.uploadReport(activePatient.patientId, selectedPdfFile);

      setUploadProgress(100);
      setUploadStage('Summary generated!');

      // Update active patient state with new report
      setActivePatient({
        ...activePatient,
        reports: [res.report, ...(activePatient.reports || [])],
      });

      setSelectedPdfFile(null);
      onShowToast('success', 'Report Summarized', 'Your medical report was successfully analyzed.');
    } catch (err: any) {
      console.error('[Report Upload Error]:', err);
      onShowToast('error', 'Report Processing Error', err.message);
    } finally {
      setIsUploadingReport(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  const handleStartNewPatient = () => {
    setActivePatient(null);
    setName('');
    setAge('');
    setGender('male');
    setAadhaarInput('');
    setPhone('');
    setProblemDescription('');
    setRecordedAudioBlob(null);
    setAudioTranscript('');
    setSelectedPdfFile(null);
  };

  return (
    <div id="patient-portal-page" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Intro Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="px-3.5 py-1 bg-white/60 backdrop-blur-xs text-blue-700 text-xs font-semibold rounded-full border border-white/80 shadow-2xs inline-block">
          Patient Intake & Medical Records
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 font-display">
          Welcome to <span className="text-blue-600">MediSummarize</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Submit your health symptoms in English or Hindi by voice or typing, upload your medical reports,
          and receive clear, grounded AI summaries for clinical review.
        </p>
      </div>

      {/* If No Patient is Registered in this session, show Registration Form */}
      {!activePatient ? (
        <form
          id="patient-registration-form"
          onSubmit={handleRegisterPatient}
          className="glass-card bg-white/65 backdrop-blur-md border border-white/60 p-6 sm:p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-8 rounded-3xl"
        >
          {/* Section 1: Basic Demographics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/60">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200/80 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Basic Patient Details</h3>
                <p className="text-xs text-slate-500">Provide basic demographic and contact information.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    id="patient-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full pl-9 pr-3.5 py-2.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min="1"
                    max="125"
                    id="patient-age-input"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full pl-9 pr-3.5 py-2.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  id="patient-gender-select"
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                >
                  <option value="male">Male (पुरुष)</option>
                  <option value="female">Female (महिला)</option>
                  <option value="other">Other (अन्य)</option>
                </select>
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Language <span className="text-rose-500">*</span>
                </label>
                <select
                  id="patient-language-select"
                  value={preferredLanguage}
                  onChange={(e: any) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                </select>
              </div>

              {/* Masked Aadhaar / ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Aadhaar / Patient ID (Masked)
                  </label>
                  <span className="text-[11px] text-slate-400">Strictly Masked</span>
                </div>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="patient-aadhaar-input"
                    value={aadhaarInput}
                    onChange={handleAadhaarChange}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={12}
                    placeholder="Enter 12-digit Aadhaar"
                    aria-label="Aadhaar number"
                    className="w-full pl-9 pr-3.5 py-2.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  For privacy, plaintext Aadhaar is never recorded. Only masked tokens (e.g. XXXX-XXXX-4589) are saved.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    id="patient-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3.5 py-2.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Health Problem Description (Voice & Text) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/60">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200/80 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">
                  Describe Your Health Problem ({preferredLanguage === 'Hindi' ? 'अपनी समस्या बताएं' : 'Symptoms'})
                </h3>
                <p className="text-xs text-slate-500">
                  You can type or speak in Hindi or English. Voice recordings are transcribed and uploaded.
                </p>
              </div>
            </div>

            {/* Voice Recording Widget */}
            <AudioRecorder
              language={preferredLanguage}
              onAudioRecorded={(blob) => setRecordedAudioBlob(blob)}
              onTranscriptionUpdate={(text) => {
                setAudioTranscript(text);
                setProblemDescription(text);
              }}
              initialTranscript={audioTranscript}
            />

            {/* Textarea for written problem description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Problem Description (Text Review)
                </label>
                <span className="text-[11px] text-slate-400">
                  {problemDescription.length} characters
                </span>
              </div>
              <textarea
                id="problem-description-textarea"
                rows={4}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder={
                  preferredLanguage === 'Hindi'
                    ? 'यहाँ अपनी बीमारी या परेशानी के बारे में लिखें (जैसे: मुझे 3 दिन से बुखार और सिरदर्द है)...'
                    : 'Describe your symptoms, how long you have had them, and any previous treatments...'
                }
                className="w-full p-3.5 glass-input bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed shadow-2xs"
              />
            </div>
          </div>

          {/* Submit Registration Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/60">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Patient data is securely stored and compliant with clinical safeguards.</span>
            </div>

            <button
              type="submit"
              id="submit-patient-registration-btn"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-200/80 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Patient...' : 'Submit & Proceed to Reports'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Section 3: Registered Patient Dashboard & Report Upload */
        <div className="space-y-6">
          {/* Active Patient Bar */}
          <div className="glass-card bg-white/65 backdrop-blur-md border border-white/60 p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4 rounded-2xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200">
                {activePatient.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800 font-display">
                    {activePatient.name}
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-blue-50/80 text-blue-700 border border-blue-200/80 rounded-full">
                    {activePatient.patientId}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50/80 text-emerald-700 border border-emerald-200/80 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Registered
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activePatient.age} yrs • {activePatient.gender} • Language: {activePatient.preferredLanguage} •
                  Phone: {activePatient.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="new-registration-btn"
                onClick={handleStartNewPatient}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white/90 backdrop-blur-xs border border-white/80 rounded-xl transition shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Register Another Patient</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToDoctorPortal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-white/70 hover:bg-blue-50 backdrop-blur-xs border border-blue-200/70 rounded-xl transition shadow-2xs"
              >
                <span>Doctor Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Recorded Complaint Review */}
          <div className="glass-card bg-white/65 backdrop-blur-md border border-white/60 p-5 shadow-2xs space-y-2 rounded-2xl">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">
              Submitted Complaint
            </h3>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {activePatient.problemDescription || 'No text complaint provided.'}
            </p>
            {activePatient.audioFilePath && (
              <div className="pt-2 p-3 bg-blue-50/60 backdrop-blur-xs rounded-xl border border-blue-100/80">
                <audio controls src={activePatient.audioFilePath} className="w-full h-8" />
              </div>
            )}
          </div>

          {/* Report Uploader Card */}
          <div className="glass-card bg-white/65 backdrop-blur-md border border-white/60 p-6 sm:p-8 shadow-2xs space-y-6 rounded-3xl">
            <FileUpload
              selectedFile={selectedPdfFile}
              onFileSelected={(file) => setSelectedPdfFile(file)}
              isUploading={isUploadingReport}
              uploadProgress={uploadProgress}
              uploadStageMessage={uploadStage}
              onUpload={handleUploadReport}
            />
          </div>

          {/* AI Generated Summaries */}
          {activePatient.reports && activePatient.reports.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Your Extracted Medical Summaries ({activePatient.reports.length})</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Grounded strictly from document text
                </span>
              </div>

              <div className="space-y-6">
                {activePatient.reports.map((report) => (
                  <AISummaryCard key={report.reportId} report={report} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
