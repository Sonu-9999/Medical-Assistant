import { IPatient, IReport, IDoctor } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data as T;
}

export const api = {
  // Check system diagnostics
  async getHealth(): Promise<{
    status: string;
    database: { connected: boolean; mode: string };
    geminiConfigured: boolean;
  }> {
    const res = await fetch(`${API_BASE}/api/health`);
    return handleResponse(res);
  },

  // Doctor authentication
  async loginDoctor(email: string, password: string): Promise<{ success: boolean; doctor: IDoctor; token: string }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  // Patients
  async getPatients(params: { search?: string; language?: string; sort?: string } = {}): Promise<{
    success: boolean;
    count: number;
    patients: IPatient[];
  }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.language && params.language !== 'all') query.append('language', params.language);
    if (params.sort) query.append('sort', params.sort);

    const res = await fetch(`${API_BASE}/api/patients?${query.toString()}`);
    return handleResponse(res);
  },

  async getPatient(id: string): Promise<{ success: boolean; patient: IPatient }> {
    const res = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(id)}`);
    return handleResponse(res);
  },

  async registerPatient(formData: FormData): Promise<{ success: boolean; message: string; patient: IPatient }> {
    const res = await fetch(`${API_BASE}/api/patients`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  // Reports
  async uploadReport(
    patientId: string,
    file: File
  ): Promise<{ success: boolean; message: string; report: IReport; isScanned?: boolean }> {
    const formData = new FormData();
    formData.append('report', file);

    const res = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(patientId)}/reports`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async getReport(reportId: string): Promise<{ success: boolean; report: IReport; patient: Partial<IPatient> }> {
    const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(reportId)}`);
    return handleResponse(res);
  },

  async getPatientReports(patientId: string): Promise<{ success: boolean; reports: IReport[] }> {
    const res = await fetch(`${API_BASE}/api/patients/${encodeURIComponent(patientId)}/reports`);
    return handleResponse(res);
  },

  async summarizeReport(reportId: string): Promise<{ success: boolean; message: string; report: IReport }> {
    const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(reportId)}/summarize`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
};
