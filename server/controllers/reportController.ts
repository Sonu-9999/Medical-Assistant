import { Request, Response } from 'express';
import fs from 'fs';
import { extractTextFromPDF } from '../services/pdfService';
import { summarizeMedicalReport } from '../services/geminiService';
import {
  getPatientById,
  addReportToPatient,
  getReportById,
  updateReportSummary,
} from '../services/storageService';
import { IReport } from '../models/Patient';

export async function uploadReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No PDF file was uploaded. Please select a valid PDF document.',
      });
      return;
    }

    // Verify patient exists
    const patient = await getPatientById(id);
    if (!patient) {
      // Clean up uploaded file
      try {
        fs.unlinkSync(file.path);
      } catch (_) {}
      res.status(404).json({
        success: false,
        message: `Patient with ID ${id} not found.`,
      });
      return;
    }

    // Read PDF file buffer
    const fileBuffer = fs.readFileSync(file.path);

    // Step 1: Extract text on the backend
    let extraction;
    try {
      extraction = await extractTextFromPDF(fileBuffer);
    } catch (extractErr: any) {
      res.status(422).json({
        success: false,
        message: `PDF text extraction error: ${extractErr.message}`,
      });
      return;
    }

    const reportId = `REP-${Date.now().toString().slice(-6)}`;
    const fileUrl = `/uploads/reports/${file.filename}`;

    // Step 2: Create initial report record
    const newReport: IReport = {
      reportId,
      originalFileName: file.originalname,
      uploadedAt: new Date(),
      extractedText: extraction.text,
      aiSummary: null,
      status: 'processing',
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
    };

    // Save report in patient document
    await addReportToPatient(id, newReport);

    // Step 3: Run Gemini AI Summarization (grounded, strictly safe)
    try {
      const summary = await summarizeMedicalReport(extraction.text);
      const updatedReport = await updateReportSummary(reportId, summary, 'completed');

      res.status(201).json({
        success: true,
        message: 'Report uploaded and summarized successfully.',
        report: updatedReport || newReport,
        isScanned: extraction.isScannedOrEmpty,
      });
    } catch (aiErr: any) {
      console.error('[Report Controller] AI Summarization error:', aiErr.message);
      await updateReportSummary(
        reportId,
        {
          reportType: 'Document (Extraction Only)',
          reportDate: 'Not mentioned in the report.',
          keyFindings: ['Document text extracted. AI summarization temporarily unavailable.'],
          abnormalResults: [],
          normalResults: [],
          doctorObservations: [],
          diagnosesMentioned: [],
          medicationsMentioned: [],
          followUpMentioned: [],
          importantNotes: ['Please review the extracted text directly.'],
        },
        'completed',
        aiErr.message
      );

      res.status(201).json({
        success: true,
        message: 'Report uploaded. Summary generated from extracted text.',
        report: newReport,
      });
    }
  } catch (error: any) {
    console.error('[Report Controller] Error in uploadReport:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process medical report. Please check file format and try again.',
    });
  }
}

export async function getReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await getReportById(id);

    if (!result) {
      res.status(404).json({
        success: false,
        message: `Report with ID ${id} was not found.`,
      });
      return;
    }

    res.json({
      success: true,
      report: result.report,
      patient: {
        patientId: result.patient.patientId,
        name: result.patient.name,
        age: result.patient.age,
        gender: result.patient.gender,
      },
    });
  } catch (error: any) {
    console.error('[Report Controller] Error getting report:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report information.',
    });
  }
}

export async function getPatientReports(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const patient = await getPatientById(id);

    if (!patient) {
      res.status(404).json({
        success: false,
        message: `Patient with ID ${id} not found.`,
      });
      return;
    }

    res.json({
      success: true,
      reports: patient.reports || [],
    });
  } catch (error: any) {
    console.error('[Report Controller] Error getting patient reports:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient reports.',
    });
  }
}

export async function summarizeReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await getReportById(id);

    if (!result) {
      res.status(404).json({
        success: false,
        message: `Report with ID ${id} not found.`,
      });
      return;
    }

    const { report } = result;
    const summary = await summarizeMedicalReport(report.extractedText);
    const updated = await updateReportSummary(id, summary, 'completed');

    res.json({
      success: true,
      message: 'Report re-summarized successfully with Gemini AI.',
      report: updated,
    });
  } catch (error: any) {
    console.error('[Report Controller] Error summarizing report:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to summarize report with AI.',
    });
  }
}
