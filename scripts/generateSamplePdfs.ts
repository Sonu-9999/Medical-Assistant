import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

function createPdfFile(filePath: string, title: string, patientName: string, lines: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header
    doc.fontSize(18).fillColor('#0284c7').text('METROCARE DIAGNOSTIC & CLINICAL LAB', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text('ISO 9001:2015 Certified Laboratory | NABL Accredited', { align: 'center' });
    doc.moveDown(0.5);

    // Divider line
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.5);

    // Patient info block
    doc.fontSize(12).fillColor('#0f172a').text(`Document: ${title}`);
    doc.fontSize(10).fillColor('#334155').text(`Patient Name: ${patientName}`);
    doc.text(`Collection Date: 28-Aug-2026 | Report Date: 29-Aug-2026`);
    doc.text(`Consultant: Dr. Sunita Mehra, MD (Consultant Physician)`);
    doc.moveDown(0.5);

    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.8);

    // Body lines
    doc.fontSize(11).fillColor('#1e293b');
    for (const line of lines) {
      if (line.startsWith('---')) {
        doc.moveDown(0.3);
        doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.3);
      } else if (line.includes('[HIGH]') || line.includes('[ELEVATED]') || line.includes('[LOW]')) {
        doc.fillColor('#dc2626').text(line);
      } else if (line.startsWith('DOCTOR') || line.startsWith('REMARKS') || line.startsWith('RECOMMENDATION')) {
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#0369a1').text(line, { underline: true });
        doc.fontSize(10).fillColor('#334155');
      } else {
        doc.fillColor('#1e293b').text(line);
      }
    }

    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#94a3b8').text('This is a computer generated clinical report. Verified by Lab Director.', { align: 'center' });

    doc.end();

    writeStream.on('finish', () => resolve());
    writeStream.on('error', (err) => reject(err));
  });
}

async function main() {
  const publicReportsDir = path.join(process.cwd(), 'public', 'sample-reports');
  const uploadsReportsDir = path.join(process.cwd(), 'uploads', 'reports');

  [publicReportsDir, uploadsReportsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const report1Lines = [
    'COMPLETE BLOOD COUNT & METABOLIC INVESTIGATION',
    '------------------------------------------------------------',
    'Hemoglobin (Hb): 11.2 g/dL (Reference: 13.0 - 17.0 g/dL) [LOW]',
    'Total Leukocyte Count: 12,400 /cumm (Reference: 4,000 - 11,000 /cumm) [HIGH]',
    'Platelet Count: 280,000 /cumm (Reference: 150,000 - 450,000 /cumm) [Normal]',
    'Fasting Blood Glucose: 174 mg/dL (Reference: 70 - 100 mg/dL) [ELEVATED]',
    'HbA1c (Glycated Hb): 8.2 % (Reference: < 5.7 %) [HIGH]',
    'Serum Creatinine: 1.1 mg/dL (Reference: 0.6 - 1.2 mg/dL) [Normal]',
    'Blood Urea: 26 mg/dL (Reference: 15 - 40 mg/dL) [Normal]',
    '------------------------------------------------------------',
    'DOCTOR CLINICAL OBSERVATIONS:',
    'Mild normocytic anemia with moderate leukocytosis observed in peripheral smear.',
    'Current Medications listed: Glimepiride 1mg daily.',
    'Existing Diagnoses mentioned: Type 2 Diabetes Mellitus.',
    'Follow-up Advice: Repeat CBC in 2 weeks. Consult treating physician for glycemic regulation.',
  ];

  const report2Lines = [
    'THYROID STIMULATING HORMONE & LIPID PANEL',
    '------------------------------------------------------------',
    'TSH (Ultrasensitive): 8.92 uIU/mL (Reference: 0.40 - 4.50 uIU/mL) [HIGH]',
    'Free Triiodothyronine (FT3): 2.8 pg/mL (Reference: 2.0 - 4.4 pg/mL) [Normal]',
    'Free Thyroxine (FT4): 0.76 ng/dL (Reference: 0.80 - 1.80 ng/dL) [LOW]',
    'Total Cholesterol: 238 mg/dL (Reference: < 200 mg/dL) [HIGH]',
    'Triglycerides: 215 mg/dL (Reference: < 150 mg/dL) [HIGH]',
    'HDL Cholesterol: 37 mg/dL (Reference: > 40 mg/dL) [LOW]',
    'LDL Cholesterol: 158 mg/dL (Reference: < 100 mg/dL) [HIGH]',
    '------------------------------------------------------------',
    'REMARKS BY DR. P. NAIR:',
    'Laboratory findings suggestive of primary hypothyroid profile with concurrent dyslipidemia.',
    'Current medications mentioned: Levothyroxine 25 mcg.',
    'Recommendations: Clinical correlation with endocrinologist. Repeat lipid profile after 6 weeks.',
  ];

  await createPdfFile(
    path.join(publicReportsDir, 'CBC_Metabolic_Report_Sample.pdf'),
    'Complete Blood Count & Metabolic Profile',
    'Rajesh K. Patel (Age: 52, Male)',
    report1Lines
  );

  await createPdfFile(
    path.join(publicReportsDir, 'Thyroid_Lipid_Report_Sample.pdf'),
    'Thyroid Function & Lipid Profile',
    'Meena R. Iyer (Age: 39, Female)',
    report2Lines
  );

  await createPdfFile(
    path.join(uploadsReportsDir, 'sample_report_1.pdf'),
    'Complete Blood Count & Metabolic Profile',
    'Rahul Sharma (Age: 45, Male)',
    report1Lines
  );

  await createPdfFile(
    path.join(uploadsReportsDir, 'sample_report_2.pdf'),
    'Thyroid Function & Lipid Profile',
    'Priya Patel (Age: 34, Female)',
    report2Lines
  );

  console.log('[PDFKit] Generated realistic valid medical report PDFs!');
}

main().catch(console.error);
