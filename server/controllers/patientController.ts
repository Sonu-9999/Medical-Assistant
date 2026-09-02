import { Request, Response } from 'express';
import {
  getAllPatients as fetchPatients,
  getPatientById as fetchPatientById,
  createPatient as savePatient,
} from '../services/storageService';

/**
 * Mask Aadhaar number for privacy prototype protection
 * Strictly never stores raw Aadhaar. Returns XXXX-XXXX-1234 format.
 */
function maskAadhaarInput(rawInput: string): string {
  if (!rawInput) return 'XXXX-XXXX-0000';
  const digitsOnly = rawInput.replace(/\D/g, '');
  if (digitsOnly.length >= 4) {
    const last4 = digitsOnly.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }
  return 'XXXX-XXXX-1234';
}

export async function createPatient(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      age,
      gender,
      aadhaar,
      phone,
      preferredLanguage,
      problemDescription,
      problemDescriptionLanguage,
      audioTranscript,
    } = req.body;

    // Field validation
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Full name is required.' });
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) < 0 || Number(age) > 130) {
      res.status(400).json({ success: false, message: 'Please enter a valid age.' });
      return;
    }
    if (!gender || !['male', 'female', 'other'].includes(gender.toLowerCase())) {
      res.status(400).json({ success: false, message: 'Please select a valid gender.' });
      return;
    }
    if (!phone || !phone.trim()) {
      res.status(400).json({ success: false, message: 'Phone number is required.' });
      return;
    }
    if (!problemDescription || !problemDescription.trim()) {
      res.status(400).json({ success: false, message: 'Problem description is required.' });
      return;
    }

    const maskedAadhaar = maskAadhaarInput(aadhaar || '');
    const audioFilePath = req.file ? `/uploads/audio/${req.file.filename}` : '';

    const newPatient = await savePatient({
      name: name.trim(),
      age: Number(age),
      gender: gender.toLowerCase(),
      maskedAadhaar,
      phone: phone.trim(),
      preferredLanguage: preferredLanguage === 'Hindi' ? 'Hindi' : 'English',
      problemDescription: problemDescription.trim(),
      problemDescriptionLanguage:
        problemDescriptionLanguage === 'Hindi' ? 'Hindi' : 'English',
      audioFilePath,
      audioTranscript: (audioTranscript || '').trim(),
      reports: [],
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      patient: newPatient,
    });
  } catch (error: any) {
    console.error('[Patient Controller] Error creating patient:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to register patient. Please verify the information and retry.',
    });
  }
}

export async function getPatients(req: Request, res: Response): Promise<void> {
  try {
    const { search, language, sort } = req.query;

    const patients = await fetchPatients({
      search: typeof search === 'string' ? search : undefined,
      language: typeof language === 'string' ? language : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
    });

    res.json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error: any) {
    console.error('[Patient Controller] Error fetching patients:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient records.',
    });
  }
}

export async function getPatient(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const patient = await fetchPatientById(id);

    if (!patient) {
      res.status(404).json({
        success: false,
        message: `Patient with ID ${id} was not found.`,
      });
      return;
    }

    res.json({
      success: true,
      patient,
    });
  } catch (error: any) {
    console.error('[Patient Controller] Error fetching patient details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient details.',
    });
  }
}
