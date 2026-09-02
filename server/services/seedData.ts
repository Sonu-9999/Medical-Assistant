import { IPatient, IAISummary, IReport } from '../models/Patient';
import { MEDICAL_SAFETY_DISCLAIMER, GROUNDING_NOTICE } from './geminiService';

export const DEMO_PATIENTS: Array<Partial<IPatient>> = [
  {
    patientId: 'DEMO-001',
    name: 'Rahul Sharma',
    age: 45,
    gender: 'male',
    maskedAadhaar: 'XXXX-XXXX-4821',
    phone: '+91 98765 43210',
    preferredLanguage: 'Hindi',
    problemDescription: 'पिछले 2 हफ्तों से लगातार थकान, सिरदर्द और धुंधला दिखाई दे रहा है। काम करने में कमजोरी महसूस होती है।',
    problemDescriptionLanguage: 'Hindi',
    audioFilePath: '',
    audioTranscript: 'पिछले 2 हफ्तों से लगातार थकान, सिरदर्द और धुंधला दिखाई दे रहा है।',
    createdAt: new Date('2026-08-20T10:30:00Z'),
    updatedAt: new Date('2026-08-20T11:00:00Z'),
    reports: [
      {
        reportId: 'REP-101',
        originalFileName: 'Metabolic_Panel_RahulSharma.pdf',
        uploadedAt: new Date('2026-08-20T10:35:00Z'),
        fileSize: 245000,
        status: 'completed',
        fileUrl: '/uploads/sample_report_1.pdf',
        extractedText: `APEX DIAGNOSTICS & RESEARCH CENTRE
PATIENT REPORT
Patient Name: Rahul Sharma
Age: 45 Years | Gender: Male | Patient ID: DEMO-001
Date of Report: 18-Aug-2026
Referred By: Dr. S. K. Gupta, MD (Internal Medicine)

COMPREHENSIVE METABOLIC & GLUCOSE PROFILE
Test Name                     Observed Value      Reference Range     Status
Fasting Blood Sugar (FBS)     168 mg/dL           70 - 100 mg/dL      HIGH
Post-Prandial Glucose (PPBS)  242 mg/dL           < 140 mg/dL         HIGH
HbA1c (Glycated Hemoglobin)   8.4 %               < 5.7 %             ELEVATED
Serum Creatinine              0.9 mg/dL           0.7 - 1.3 mg/dL     Normal
Blood Urea Nitrogen (BUN)     14 mg/dL            7 - 20 mg/dL        Normal
Serum Uric Acid               5.2 mg/dL           3.5 - 7.2 mg/dL     Normal

DOCTOR'S REMARKS & OBSERVATIONS:
Patient evaluated for osmotic symptoms. Elevated glycated hemoglobin noted.
Current Medications listed: Metformin 500mg OD.
Plan / Follow-up: Clinical correlation recommended with primary physician in 2 weeks. Retest HbA1c after 90 days.`,
        aiSummary: {
          reportType: 'Comprehensive Metabolic & Glucose Profile',
          reportDate: '18-Aug-2026',
          keyFindings: [
            'Fasting Blood Sugar is 168 mg/dL (Reference: 70 - 100 mg/dL)',
            'Post-Prandial Glucose is 242 mg/dL (Reference: < 140 mg/dL)',
            'HbA1c Glycated Hemoglobin is 8.4% (Reference: < 5.7%)',
            'Renal markers (Creatinine 0.9 mg/dL, BUN 14 mg/dL, Uric Acid 5.2 mg/dL) are within standard ranges',
          ],
          abnormalResults: [
            'Fasting Blood Sugar: 168 mg/dL (Marked HIGH)',
            'Post-Prandial Glucose: 242 mg/dL (Marked HIGH)',
            'HbA1c: 8.4% (Marked ELEVATED)',
          ],
          normalResults: [
            'Serum Creatinine: 0.9 mg/dL (Reference: 0.7 - 1.3 mg/dL)',
            'Blood Urea Nitrogen: 14 mg/dL (Reference: 7 - 20 mg/dL)',
            'Serum Uric Acid: 5.2 mg/dL (Reference: 3.5 - 7.2 mg/dL)',
          ],
          doctorObservations: [
            'Patient evaluated for osmotic symptoms',
            'Elevated glycated hemoglobin explicitly recorded',
          ],
          diagnosesMentioned: [
            'Elevated glycated hemoglobin explicitly noted in remarks',
          ],
          medicationsMentioned: [
            'Metformin 500mg OD listed in report',
          ],
          followUpMentioned: [
            'Clinical correlation recommended with primary physician in 2 weeks',
            'Retest HbA1c after 90 days',
          ],
          importantNotes: [
            'Sample tested at Apex Diagnostics & Research Centre',
            'Values flagged abnormal strictly as printed in laboratory record',
          ],
          disclaimer: MEDICAL_SAFETY_DISCLAIMER,
          groundingNotice: GROUNDING_NOTICE,
        },
      },
    ],
  },
  {
    patientId: 'DEMO-002',
    name: 'Priya Patel',
    age: 34,
    gender: 'female',
    maskedAadhaar: 'XXXX-XXXX-9102',
    phone: '+91 91234 56789',
    preferredLanguage: 'English',
    problemDescription: 'Experiencing recurrent palpitations, shortness of breath after climbing stairs, and cold sensitivity for the past month.',
    problemDescriptionLanguage: 'English',
    audioFilePath: '',
    audioTranscript: 'Experiencing recurrent palpitations and shortness of breath after climbing stairs for the past month.',
    createdAt: new Date('2026-08-22T09:15:00Z'),
    updatedAt: new Date('2026-08-22T09:45:00Z'),
    reports: [
      {
        reportId: 'REP-102',
        originalFileName: 'Thyroid_and_CBC_PriyaPatel.pdf',
        uploadedAt: new Date('2026-08-22T09:20:00Z'),
        fileSize: 189000,
        status: 'completed',
        fileUrl: '/uploads/sample_report_2.pdf',
        extractedText: `HEALTHFIRST CLINICAL LABORATORIES
DEPARTMENT OF BIOCHEMISTRY & HEMATOLOGY
Patient: Priya Patel | Age: 34 | Female | ID: DEMO-002
Collection Date: 21-Aug-2026 | Report Date: 21-Aug-2026

COMPLETE BLOOD COUNT & THYROID FUNCTION TEST
Parameter                     Value               Reference Unit      Flag
Hemoglobin (Hb)               9.8                 12.0 - 15.5 g/dL    LOW
Total Leukocyte Count (TLC)   6,800               4,000 - 11,000 /uL  Normal
Platelet Count                240,000             150,000 - 450,000   Normal
TSH (Ultrasensitive)          7.85                0.35 - 4.94 uIU/mL  HIGH
Free T3                       2.4                 1.8 - 4.2 pg/mL     Normal
Free T4                       0.82                0.70 - 1.48 ng/dL   Normal

OBSERVATIONS:
Microcytic hypochromic picture suggested on peripheral smear review.
Serum ferritin test advised.
Current medication: Iron supplement tab 100mg daily.
Follow-up: Repeat TSH and CBC after 6 weeks as indicated by treating physician.`,
        aiSummary: {
          reportType: 'Complete Blood Count & Thyroid Function Test',
          reportDate: '21-Aug-2026',
          keyFindings: [
            'Hemoglobin is 9.8 g/dL (Reference: 12.0 - 15.5 g/dL)',
            'TSH is 7.85 uIU/mL (Reference: 0.35 - 4.94 uIU/mL)',
            'Free T3 (2.4 pg/mL) and Free T4 (0.82 ng/dL) are in normal reference ranges',
            'Platelet and Total Leukocyte counts are within normal reference ranges',
          ],
          abnormalResults: [
            'Hemoglobin (Hb): 9.8 g/dL (Marked LOW)',
            'TSH (Ultrasensitive): 7.85 uIU/mL (Marked HIGH)',
          ],
          normalResults: [
            'Total Leukocyte Count: 6,800 /uL (Reference: 4,000 - 11,000 /uL)',
            'Platelet Count: 240,000 (Reference: 150,000 - 450,000)',
            'Free T3: 2.4 pg/mL (Reference: 1.8 - 4.2 pg/mL)',
            'Free T4: 0.82 ng/dL (Reference: 0.70 - 1.48 ng/dL)',
          ],
          doctorObservations: [
            'Microcytic hypochromic picture suggested on peripheral smear review',
            'Serum ferritin test advised',
          ],
          diagnosesMentioned: [
            'Not explicitly diagnosed in report; smear features recorded',
          ],
          medicationsMentioned: [
            'Iron supplement tab 100mg daily',
          ],
          followUpMentioned: [
            'Repeat TSH and CBC after 6 weeks as indicated by treating physician',
          ],
          importantNotes: [
            'HealthFirst Clinical Laboratories report dated 21-Aug-2026',
          ],
          disclaimer: MEDICAL_SAFETY_DISCLAIMER,
          groundingNotice: GROUNDING_NOTICE,
        },
      },
    ],
  },
  {
    patientId: 'DEMO-003',
    name: 'Amit Verma',
    age: 58,
    gender: 'male',
    maskedAadhaar: 'XXXX-XXXX-6349',
    phone: '+91 97112 34567',
    preferredLanguage: 'English',
    problemDescription: 'Chest tightness upon brisk walking and mild swelling around ankles in the evening.',
    problemDescriptionLanguage: 'English',
    audioFilePath: '',
    audioTranscript: '',
    createdAt: new Date('2026-08-25T14:00:00Z'),
    updatedAt: new Date('2026-08-25T14:30:00Z'),
    reports: [
      {
        reportId: 'REP-103',
        originalFileName: 'Lipid_and_Cardiac_Markers_AmitVerma.pdf',
        uploadedAt: new Date('2026-08-25T14:10:00Z'),
        fileSize: 310000,
        status: 'completed',
        fileUrl: '/uploads/sample_report_3.pdf',
        extractedText: `CITY HEART INSTITUTE & VASCULAR LAB
CARDIOVASCULAR RISK EVALUATION
Patient: Amit Verma | Age: 58 | Male | Reg ID: DEMO-003
Date of Test: 24-Aug-2026

LIPID PROFILE (FASTING 12 HOURS)
Analyte                       Result              Target / Reference
Total Cholesterol             248 mg/dL           < 200 mg/dL (HIGH)
Triglycerides                 210 mg/dL           < 150 mg/dL (HIGH)
HDL Cholesterol               38 mg/dL            > 40 mg/dL (LOW)
LDL Cholesterol               168 mg/dL           < 100 mg/dL (HIGH)
VLDL                          42 mg/dL            < 30 mg/dL (HIGH)
Total / HDL Ratio             6.5                 < 4.5 (HIGH RISK RATIO)

RESTING ECG SUMMARY:
Normal sinus rhythm, rate 74 bpm. No acute ST-T wave changes seen.
Existing Diagnosis explicitly noted: Essential Hypertension, Dyslipidemia.
Medications listed on chart: Telmisartan 40mg, Atorvastatin 10mg.
Recommendations: Cardiology OPD review scheduled in 10 days. Maintain low-sodium dietary regimen.`,
        aiSummary: {
          reportType: 'Cardiovascular Risk Evaluation & Lipid Profile',
          reportDate: '24-Aug-2026',
          keyFindings: [
            'Total Cholesterol is 248 mg/dL (Target < 200 mg/dL)',
            'LDL Cholesterol is 168 mg/dL (Target < 100 mg/dL)',
            'Triglycerides are 210 mg/dL (Target < 150 mg/dL)',
            'HDL Cholesterol is 38 mg/dL (Target > 40 mg/dL)',
            'Resting ECG indicates normal sinus rhythm, rate 74 bpm, no acute ST-T changes',
          ],
          abnormalResults: [
            'Total Cholesterol: 248 mg/dL (HIGH)',
            'Triglycerides: 210 mg/dL (HIGH)',
            'HDL Cholesterol: 38 mg/dL (LOW)',
            'LDL Cholesterol: 168 mg/dL (HIGH)',
            'VLDL: 42 mg/dL (HIGH)',
            'Total / HDL Ratio: 6.5 (HIGH RISK RATIO)',
          ],
          normalResults: [
            'Resting ECG: Normal sinus rhythm at 74 bpm',
          ],
          doctorObservations: [
            'No acute ST-T wave changes seen on resting ECG',
            'Fasting 12 hours noted for sample specimen',
          ],
          diagnosesMentioned: [
            'Essential Hypertension',
            'Dyslipidemia',
          ],
          medicationsMentioned: [
            'Telmisartan 40mg',
            'Atorvastatin 10mg',
          ],
          followUpMentioned: [
            'Cardiology OPD review scheduled in 10 days',
            'Maintain low-sodium dietary regimen',
          ],
          importantNotes: [
            'City Heart Institute & Vascular Lab record',
            'Values reflect fasting 12-hour draw',
          ],
          disclaimer: MEDICAL_SAFETY_DISCLAIMER,
          groundingNotice: GROUNDING_NOTICE,
        },
      },
    ],
  },
];
