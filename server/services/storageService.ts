import { Patient, IPatient, IReport, IAISummary } from '../models/Patient';
import { isMongoConnected } from '../config/db';
import { DEMO_PATIENTS } from './seedData';

// In-memory store used when MongoDB is offline or in transient sandbox
let inMemoryPatients: Array<any> = JSON.parse(JSON.stringify(DEMO_PATIENTS));

/**
 * Seed initial fictional demo patients if storage is empty
 */
export async function initializeDatabaseSeed() {
  if (isMongoConnected()) {
    try {
      const count = await Patient.countDocuments();
      if (count === 0) {
        console.log('[Database] Seeding initial demo patients into MongoDB...');
        await Patient.insertMany(DEMO_PATIENTS as any);
        console.log('[Database] Successfully seeded demo patients into MongoDB.');
      }
    } catch (err: any) {
      console.warn('[Database] Seed insertion error:', err.message);
    }
  } else {
    // In-memory already initialized with DEMO_PATIENTS
    console.log('[Storage] In-memory storage initialized with demo patients.');
  }
}

export async function getAllPatients(options: {
  search?: string;
  language?: string;
  sort?: string;
} = {}): Promise<any[]> {
  const { search, language, sort } = options;

  if (isMongoConnected()) {
    try {
      const query: any = {};

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: searchRegex },
          { patientId: searchRegex },
          { phone: searchRegex },
          { problemDescription: searchRegex },
        ];
      }

      if (language && language !== 'all') {
        query.preferredLanguage = language;
      }

      let sortOption: any = { createdAt: -1 };
      if (sort === 'oldest') {
        sortOption = { createdAt: 1 };
      } else if (sort === 'name') {
        sortOption = { name: 1 };
      }

      const patients = await Patient.find(query).sort(sortOption).lean().exec();
      return patients;
    } catch (err: any) {
      console.warn('[Storage] Mongo query failed, falling back to in-memory store:', err.message);
    }
  }

  // In-memory filter and sort
  let list = [...inMemoryPatients];

  if (search && search.trim()) {
    const s = search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.patientId && p.patientId.toLowerCase().includes(s)) ||
        (p.phone && p.phone.includes(s)) ||
        (p.problemDescription && p.problemDescription.toLowerCase().includes(s))
    );
  }

  if (language && language !== 'all') {
    list = list.filter((p) => p.preferredLanguage === language);
  }

  if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'name') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sort === 'reports') {
    list.sort((a, b) => (b.reports?.length || 0) - (a.reports?.length || 0));
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list;
}

export async function getPatientById(patientId: string): Promise<any | null> {
  if (isMongoConnected()) {
    try {
      const patient = await Patient.findOne({
        $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : undefined }],
      } as any).lean().exec();
      if (patient) return patient;
    } catch (err: any) {
      console.warn('[Storage] Mongo find patient failed:', err.message);
    }
  }

  return inMemoryPatients.find((p) => p.patientId === patientId || p._id === patientId) || null;
}

export async function createPatient(data: Partial<IPatient>): Promise<any> {
  const patientId = data.patientId || `PAT-${Date.now().toString().slice(-5)}`;
  const newPatientData = {
    ...data,
    patientId,
    reports: data.reports || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isMongoConnected()) {
    try {
      const patient = new Patient(newPatientData);
      const saved = await patient.save();
      return saved.toObject();
    } catch (err: any) {
      console.warn('[Storage] Mongo save patient failed:', err.message);
    }
  }

  inMemoryPatients.unshift(newPatientData);
  return newPatientData;
}

export async function addReportToPatient(patientId: string, report: IReport): Promise<{ patient: any; report: IReport }> {
  if (isMongoConnected()) {
    try {
      const patient = await Patient.findOne({
        $or: [{ patientId }, { _id: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : undefined }],
      } as any);
      if (patient) {
        patient.reports.push(report);
        patient.updatedAt = new Date();
        await patient.save();
        return { patient: patient.toObject(), report };
      }
    } catch (err: any) {
      console.warn('[Storage] Mongo add report failed:', err.message);
    }
  }

  const index = inMemoryPatients.findIndex((p) => p.patientId === patientId || p._id === patientId);
  if (index !== -1) {
    if (!inMemoryPatients[index].reports) inMemoryPatients[index].reports = [];
    inMemoryPatients[index].reports.push(report);
    inMemoryPatients[index].updatedAt = new Date();
    return { patient: inMemoryPatients[index], report };
  }

  throw new Error(`Patient with ID ${patientId} not found.`);
}

export async function updateReportSummary(
  reportId: string,
  summary: IAISummary,
  status: 'completed' | 'failed' = 'completed',
  errorMessage: string = ''
): Promise<IReport | null> {
  if (isMongoConnected()) {
    try {
      const patient = await Patient.findOne({ 'reports.reportId': reportId } as any);
      if (patient) {
        const report = patient.reports.find((r: any) => r.reportId === reportId);
        if (report) {
          report.aiSummary = summary;
          report.status = status;
          if (errorMessage) report.errorMessage = errorMessage;
          patient.updatedAt = new Date();
          await patient.save();
          return report;
        }
      }
    } catch (err: any) {
      console.warn('[Storage] Mongo update report summary failed:', err.message);
    }
  }

  for (const patient of inMemoryPatients) {
    if (patient.reports) {
      const report = patient.reports.find((r: any) => r.reportId === reportId);
      if (report) {
        report.aiSummary = summary;
        report.status = status;
        if (errorMessage) report.errorMessage = errorMessage;
        patient.updatedAt = new Date();
        return report;
      }
    }
  }

  return null;
}

export async function getReportById(reportId: string): Promise<{ report: IReport; patient: any } | null> {
  if (isMongoConnected()) {
    try {
      const patient = await Patient.findOne({ 'reports.reportId': reportId } as any).lean().exec();
      if (patient) {
        const report = (patient as any).reports.find((r: any) => r.reportId === reportId);
        if (report) return { report, patient };
      }
    } catch (err: any) {
      console.warn('[Storage] Mongo get report by id failed:', err.message);
    }
  }

  for (const patient of inMemoryPatients) {
    if (patient.reports) {
      const report = patient.reports.find((r: any) => r.reportId === reportId);
      if (report) return { report, patient };
    }
  }

  return null;
}
