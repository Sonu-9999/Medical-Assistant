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
  uploadedAt: string | Date;
  extractedText: string;
  aiSummary: IAISummary | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  errorMessage?: string;
}

export interface IPatient {
  _id?: string;
  patientId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  maskedAadhaar: string;
  phone: string;
  preferredLanguage: 'Hindi' | 'English';
  problemDescription: string;
  problemDescriptionLanguage: 'Hindi' | 'English';
  audioFilePath?: string;
  audioTranscript?: string;
  reports: IReport[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IDoctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  hospital?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
