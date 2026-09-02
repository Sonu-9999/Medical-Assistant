import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Stethoscope,
  Pill,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  FileCode,
} from 'lucide-react';
import { IAISummary, IReport } from '../types';

interface AISummaryCardProps {
  report: IReport;
  onReSummarize?: (reportId: string) => void;
  isReSummarizing?: boolean;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  report,
  onReSummarize,
  isReSummarizing = false,
}) => {
  const [showExtractedText, setShowExtractedText] = useState(false);
  const summary: IAISummary | null = report.aiSummary;

  const disclaimerText =
    summary?.disclaimer ||
    'AI-generated summary for information management only. This summary is not a medical diagnosis or medical advice. Please consult a qualified healthcare professional for medical interpretation.';

  const groundingNotice =
    summary?.groundingNotice || 'Summary generated from extracted document text.';

  return (
    <div
      id={`report-card-${report.reportId}`}
      className="glass-card bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl overflow-hidden transition-all"
    >
      {/* Card Header */}
      <div className="p-5 sm:p-6 border-b border-white/60 bg-white/40 backdrop-blur-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50/80 text-blue-600 flex items-center justify-center shrink-0 border border-white/80 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base text-slate-800 font-display">
                  {summary?.reportType || report.originalFileName}
                </h3>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50/80 text-blue-700 border border-blue-200/80 rounded-full">
                  {report.reportId}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full ${
                    report.status === 'completed'
                      ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/80'
                      : report.status === 'processing'
                      ? 'bg-amber-50/80 text-amber-700 border border-amber-200/80'
                      : 'bg-rose-50/80 text-rose-700 border border-rose-200/80'
                  }`}
                >
                  {report.status === 'completed'
                    ? 'AI Summarized'
                    : report.status === 'processing'
                    ? 'Processing...'
                    : 'Failed'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Report Date: {summary?.reportDate || 'Not specified'}</span>
                </span>
                <span>•</span>
                <span>Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}</span>
                {report.fileSize && <span>• {(report.fileSize / 1024).toFixed(0)} KB</span>}
              </div>
            </div>
          </div>

          {/* Quick Action Links */}
          <div className="flex items-center gap-2">
            {report.fileUrl && (
              <a
                href={report.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white/60 hover:bg-white/90 border border-white/80 rounded-xl shadow-2xs transition backdrop-blur-xs"
                title="View original uploaded PDF"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>View Original Report</span>
              </a>
            )}

            {onReSummarize && (
              <button
                type="button"
                onClick={() => onReSummarize(report.reportId)}
                disabled={isReSummarizing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white/60 hover:bg-blue-50/80 border border-blue-200/70 rounded-xl transition shadow-2xs backdrop-blur-xs disabled:opacity-50"
                title="Re-run Gemini AI analysis on extracted text"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isReSummarizing ? 'animate-spin' : ''}`} />
                <span>{isReSummarizing ? 'Analyzing...' : 'Re-summarize'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Safety Notice & Grounding Banner */}
      <div className="px-5 py-3 bg-amber-50/80 backdrop-blur-xs border-b border-amber-200/60 flex items-start gap-2.5 text-amber-950 text-xs leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-amber-900">{disclaimerText}</p>
          <p className="text-[11px] text-amber-700/90 mt-0.5">{groundingNotice}</p>
        </div>
      </div>

      {/* Structured Content Sections */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Key Findings */}
        {summary?.keyFindings && summary.keyFindings.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Key Findings (From Report Text)</span>
            </h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {summary.keyFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/60 backdrop-blur-xs border border-white/80 rounded-xl text-xs text-slate-800 leading-relaxed shadow-2xs"
                >
                  {finding}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Grid: Abnormal vs Normal */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Abnormal Results */}
          <div className="p-4 rounded-xl bg-rose-50/50 backdrop-blur-xs border border-rose-200/80 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Abnormal / Elevated Values ({summary?.abnormalResults?.length || 0})</span>
            </h4>
            {summary?.abnormalResults && summary.abnormalResults.length > 0 ? (
              <ul className="space-y-2">
                {summary.abnormalResults.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 bg-white/80 backdrop-blur-xs border border-rose-200 rounded-lg text-xs font-medium text-rose-950 flex items-start gap-2 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic p-2">
                No explicitly abnormal values identified in report.
              </p>
            )}
          </div>

          {/* Normal Results */}
          <div className="p-4 rounded-xl bg-emerald-50/50 backdrop-blur-xs border border-emerald-200/80 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Normal Values ({summary?.normalResults?.length || 0})</span>
            </h4>
            {summary?.normalResults && summary.normalResults.length > 0 ? (
              <ul className="space-y-2">
                {summary.normalResults.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 bg-white/80 backdrop-blur-xs border border-emerald-200 rounded-lg text-xs text-slate-800 flex items-start gap-2 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic p-2">
                None explicitly listed as normal in this section.
              </p>
            )}
          </div>
        </div>

        {/* Doctor Observations & Diagnoses */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Doctor Observations */}
          <div className="p-4 rounded-xl bg-white/60 backdrop-blur-xs border border-white/80 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Doctor's Observations</span>
            </h4>
            {summary?.doctorObservations && summary.doctorObservations.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-700">
                {summary.doctorObservations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">Not mentioned in the report.</p>
            )}
          </div>

          {/* Diagnoses Mentioned */}
          <div className="p-4 rounded-xl bg-white/60 backdrop-blur-xs border border-white/80 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Existing Diagnoses Mentioned</span>
            </h4>
            {summary?.diagnosesMentioned && summary.diagnosesMentioned.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-700">
                {summary.diagnosesMentioned.map((diag, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>{diag}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">Not mentioned in the report.</p>
            )}
          </div>
        </div>

        {/* Medications & Follow-up */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Medications Listed */}
          <div className="p-4 rounded-xl bg-white/60 backdrop-blur-xs border border-white/80 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-blue-600" />
              <span>Medications Mentioned</span>
            </h4>
            {summary?.medicationsMentioned && summary.medicationsMentioned.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-700">
                {summary.medicationsMentioned.map((med, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>{med}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">Not mentioned in the report.</p>
            )}
          </div>

          {/* Follow-up instructions */}
          <div className="p-4 rounded-xl bg-white/60 backdrop-blur-xs border border-white/80 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Follow-up Mentioned</span>
            </h4>
            {summary?.followUpMentioned && summary.followUpMentioned.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-700">
                {summary.followUpMentioned.map((fu, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-slate-400">•</span>
                    <span>{fu}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">Not mentioned in the report.</p>
            )}
          </div>
        </div>

        {/* Important Notes */}
        {summary?.importantNotes && summary.importantNotes.length > 0 && (
          <div className="p-3.5 rounded-xl bg-blue-50/60 backdrop-blur-xs border border-blue-100/80 text-xs text-blue-950 shadow-2xs">
            <span className="font-semibold text-blue-900 block mb-1">Important Notes & Specimen Details:</span>
            <ul className="space-y-1">
              {summary.importantNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Collapsible View Extracted Text Button */}
        <div className="pt-2 border-t border-white/60">
          <button
            type="button"
            onClick={() => setShowExtractedText(!showExtractedText)}
            className="flex items-center justify-between w-full p-3 bg-white/60 hover:bg-white/90 backdrop-blur-xs text-slate-700 text-xs font-semibold rounded-xl transition border border-white/80 shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-slate-500" />
              <span>View Extracted Text from PDF</span>
              <span className="text-[11px] text-slate-500 font-normal">
                ({report.extractedText ? report.extractedText.length : 0} characters parsed)
              </span>
            </span>
            {showExtractedText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showExtractedText && (
            <div className="mt-3 p-4 bg-slate-900/90 backdrop-blur-sm text-slate-200 font-mono text-xs rounded-xl overflow-x-auto max-h-80 whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-700/60">
              {report.extractedText || 'No text extracted from this document.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
