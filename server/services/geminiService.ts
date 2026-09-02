import { GoogleGenAI, Type } from '@google/genai';
import { IAISummary } from '../models/Patient';

export const MEDICAL_SAFETY_DISCLAIMER =
  'AI-generated summary for information management only. This summary is not a medical diagnosis or medical advice. Please consult a qualified healthcare professional for medical interpretation.';

export const GROUNDING_NOTICE = 'Summary generated from extracted document text.';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Summarize medical report text strictly following safety guidelines.
 * Grounded ONLY in provided text; no diagnosis, no treatment, no prescription.
 */
export async function summarizeMedicalReport(extractedText: string): Promise<IAISummary> {
  const trimmed = (extractedText || '').trim();

  // If text is unreadable or empty
  if (trimmed.length < 25) {
    return {
      reportType: 'Unknown / Scanned Document',
      reportDate: 'Not mentioned in the report.',
      keyFindings: ['Unable to reliably extract all information from this document.'],
      abnormalResults: [],
      normalResults: [],
      doctorObservations: [],
      diagnosesMentioned: [],
      medicationsMentioned: [],
      followUpMentioned: [],
      importantNotes: [
        'This document appears to contain scanned images or text that could not be extracted.',
      ],
      disclaimer: MEDICAL_SAFETY_DISCLAIMER,
      groundingNotice: GROUNDING_NOTICE,
    };
  }

  const ai = getGeminiClient();

  // If API key is missing or unset, create a safe deterministic extraction summary
  if (!ai) {
    console.warn('[Gemini Service] GEMINI_API_KEY not found in environment. Generating deterministic fallback extraction.');
    return generateLocalFallbackSummary(trimmed);
  }

  const prompt = `You are a medical document summarization assistant.

Your ONLY task is to summarize information explicitly present in the provided medical report.

Do not diagnose the patient.
Do not provide treatment recommendations.
Do not recommend medicines.
Do not provide medical advice.
Do not infer diseases that are not explicitly mentioned.
Do not speculate about missing information.

Extract and organize important information such as:
* Patient details if present
* Type of report
* Date of report
* Important test results
* Abnormal values
* Normal values when relevant
* Measurements
* Doctor's observations
* Existing diagnoses explicitly mentioned in the document
* Medications explicitly listed in the report
* Important findings
* Follow-up information explicitly mentioned in the report

If a value is outside the normal/reference range, mention that the report marks it as abnormal, but do not explain what treatment should be taken.

If information is missing, say 'Not mentioned in the report.'

Return a concise and easy-to-read summary.

Do not add information that does not exist in the source document.

MEDICAL REPORT TEXT:
"""
${trimmed}
"""`;

  try {
    const generateSummaryWithModel = async (modelName: string) => {
      const aiPromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reportType: { type: Type.STRING, description: 'Type of report (e.g. Complete Blood Count, Lipid Profile, Chest X-Ray)' },
              reportDate: { type: Type.STRING, description: 'Date of report as printed in document' },
              keyFindings: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Key factual findings explicitly stated' },
              abnormalResults: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Tests explicitly marked high, low, or abnormal' },
              normalResults: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Tests explicitly marked normal within reference ranges' },
              doctorObservations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Observations recorded by the physician' },
              diagnosesMentioned: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Existing diagnoses explicitly printed' },
              medicationsMentioned: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Current medications explicitly listed' },
              followUpMentioned: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Follow-up timeline explicitly instructed in document' },
              importantNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Crucial cautions or sample details stated in report' },
            },
            required: [
              'reportType',
              'reportDate',
              'keyFindings',
              'abnormalResults',
              'normalResults',
              'doctorObservations',
              'diagnosesMentioned',
              'medicationsMentioned',
              'followUpMentioned',
              'importantNotes',
            ],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini API call (${modelName}) timed out after 12 seconds`)), 12000)
      );

      return Promise.race([aiPromise, timeoutPromise]);
    };

    // Prioritize high-availability, low-latency models with seamless failover
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
    let response: any = null;
    let lastError: Error | null = null;

    for (const modelName of candidateModels) {
      try {
        response = await generateSummaryWithModel(modelName);
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        console.warn(`[Gemini Service] Model ${modelName} failed (${err.message}). Trying next candidate...`);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All Gemini candidate models failed.');
    }

    const rawJson = response.text || '{}';
    const parsed = JSON.parse(rawJson);

    return {
      reportType: parsed.reportType || 'Medical Laboratory / Clinical Report',
      reportDate: parsed.reportDate || 'Not mentioned in the report.',
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      abnormalResults: Array.isArray(parsed.abnormalResults) ? parsed.abnormalResults : [],
      normalResults: Array.isArray(parsed.normalResults) ? parsed.normalResults : [],
      doctorObservations: Array.isArray(parsed.doctorObservations) ? parsed.doctorObservations : [],
      diagnosesMentioned: Array.isArray(parsed.diagnosesMentioned) ? parsed.diagnosesMentioned : [],
      medicationsMentioned: Array.isArray(parsed.medicationsMentioned) ? parsed.medicationsMentioned : [],
      followUpMentioned: Array.isArray(parsed.followUpMentioned) ? parsed.followUpMentioned : [],
      importantNotes: Array.isArray(parsed.importantNotes) ? parsed.importantNotes : [],
      disclaimer: MEDICAL_SAFETY_DISCLAIMER,
      groundingNotice: GROUNDING_NOTICE,
    };
  } catch (error: any) {
    console.error('[Gemini Service] Error during AI summarization:', error.message);
    // Graceful fallback from extracted text without fabrication
    return generateLocalFallbackSummary(trimmed);
  }
}

/**
 * Deterministic text extractor used if Gemini API key is missing or offline,
 * ensuring no hallucinations and 100% testable local flow.
 */
function generateLocalFallbackSummary(text: string): IAISummary {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  
  const abnormalResults: string[] = [];
  const normalResults: string[] = [];
  const keyFindings: string[] = [];
  const medications: string[] = [];
  const diagnoses: string[] = [];
  let reportType = 'Medical Document';
  let reportDate = 'Not mentioned in the report.';

  // Scan lines for common laboratory cues
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('date:') || lower.includes('dated:') || lower.includes('collection date')) {
      reportDate = line.replace(/date[:\s]+/i, '').trim() || reportDate;
    }
    if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('lipid') || lower.includes('panel') || lower.includes('radiology') || lower.includes('ultrasound')) {
      reportType = line.slice(0, 60);
    }
    if (lower.includes('high') || lower.includes('elevated') || lower.includes('abnormal') || lower.includes('low') || lower.includes('critical')) {
      abnormalResults.push(line);
    } else if (lower.includes('normal') || lower.includes('within limits') || lower.includes('negative')) {
      normalResults.push(line);
    }
    if (lower.includes('tab') || lower.includes('mg') || lower.includes('capsule') || lower.includes('syrup')) {
      medications.push(line);
    }
    if (lower.includes('diagnosis') || lower.includes('impression') || lower.includes('assessment:')) {
      diagnoses.push(line);
    }
  }

  // Key findings from first few descriptive lines
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    if (!lines[i].toLowerCase().includes('page') && lines[i].length > 10) {
      keyFindings.push(lines[i]);
    }
  }

  return {
    reportType,
    reportDate,
    keyFindings: keyFindings.length ? keyFindings : ['Report extracted successfully from document text.'],
    abnormalResults: abnormalResults.slice(0, 6),
    normalResults: normalResults.slice(0, 6),
    doctorObservations: lines.filter((l) => l.toLowerCase().includes('dr.') || l.toLowerCase().includes('remark')).slice(0, 4),
    diagnosesMentioned: diagnoses.slice(0, 4),
    medicationsMentioned: medications.slice(0, 4),
    followUpMentioned: lines.filter((l) => l.toLowerCase().includes('follow') || l.toLowerCase().includes('review')).slice(0, 3),
    importantNotes: ['Summary generated directly from extracted document text.'],
    disclaimer: MEDICAL_SAFETY_DISCLAIMER,
    groundingNotice: GROUNDING_NOTICE,
  };
}
