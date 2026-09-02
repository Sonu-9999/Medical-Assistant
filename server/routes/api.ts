import { Router } from 'express';
import { createPatient, getPatients, getPatient } from '../controllers/patientController';
import {
  uploadReport,
  getReport,
  getPatientReports,
  summarizeReport,
} from '../controllers/reportController';
import { doctorLogin, doctorMe } from '../controllers/authController';
import { uploadPdf, uploadAudio } from '../middleware/upload';
import { isMongoConnected } from '../config/db';

const router = Router();

// System Health & Diagnostics
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'MediSummarize',
    database: {
      connected: isMongoConnected(),
      mode: isMongoConnected() ? 'MongoDB (Active)' : 'In-Memory Failover Storage (Ready)',
    },
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
router.post('/auth/login', doctorLogin);
router.get('/auth/me', doctorMe);

// Patient Routes
router.post('/patients', uploadAudio.single('audio'), createPatient);
router.get('/patients', getPatients);
router.get('/patients/:id', getPatient);

// Report Routes
router.post('/patients/:id/reports', uploadPdf.single('report'), uploadReport);
router.get('/reports/:id', getReport);
router.get('/patients/:id/reports', getPatientReports);
router.post('/reports/:id/summarize', summarizeReport);

export default router;
