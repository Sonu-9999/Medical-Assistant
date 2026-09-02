import mongoose, { Schema, Document } from 'mongoose';

export interface IAISummary {
  reportType: string;
  reportDate: string;
  keyFindings: string[];
  abnormalResults: string[];
  normalResults: string[];
  doctorObservations: string[];
  diagnosesMentioned: string[];
  medicationsMentioned: string[];
  followUpMentioned: string[];
  importantNotes: string[];
  disclaimer?: string;
  groundingNotice?: string;
}

export interface IReport {
  reportId: string;
  originalFileName: string;
  uploadedAt: Date;
  extractedText: string;
  aiSummary: IAISummary | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  errorMessage?: string;
}

export interface IPatient extends Document {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  maskedAadhaar: string;
  phone: string;
  preferredLanguage: string;
  problemDescription: string;
  problemDescriptionLanguage: string;
  audioFilePath?: string;
  audioTranscript?: string;
  reports: IReport[];
  createdAt: Date;
  updatedAt: Date;
}

const AISummarySchema = new Schema<IAISummary>(
  {
    reportType: { type: String, default: 'Medical Report' },
    reportDate: { type: String, default: 'Not mentioned in the report.' },
    keyFindings: { type: [String], default: [] },
    abnormalResults: { type: [String], default: [] },
    normalResults: { type: [String], default: [] },
    doctorObservations: { type: [String], default: [] },
    diagnosesMentioned: { type: [String], default: [] },
    medicationsMentioned: { type: [String], default: [] },
    followUpMentioned: { type: [String], default: [] },
    importantNotes: { type: [String], default: [] },
    disclaimer: {
      type: String,
      default:
        'AI-generated summary for information management only. This summary is not a medical diagnosis or medical advice. Please consult a qualified healthcare professional for medical interpretation.',
    },
    groundingNotice: {
      type: String,
      default: 'Summary generated from extracted document text.',
    },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    reportId: { type: String, required: true },
    originalFileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    extractedText: { type: String, default: '' },
    aiSummary: { type: AISummarySchema, default: null },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    fileUrl: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: 'application/pdf' },
    errorMessage: { type: String, default: '' },
  },
  { _id: false }
);

const PatientSchema = new Schema<IPatient>(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
    maskedAadhaar: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    preferredLanguage: {
      type: String,
      required: true,
      enum: ['Hindi', 'English'],
      default: 'English',
    },
    problemDescription: { type: String, required: true, trim: true },
    problemDescriptionLanguage: {
      type: String,
      required: true,
      enum: ['Hindi', 'English'],
      default: 'English',
    },
    audioFilePath: { type: String, default: '' },
    audioTranscript: { type: String, default: '' },
    reports: { type: [ReportSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Fallback safety if model already registered in mongoose
export const Patient =
  mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default Patient;
