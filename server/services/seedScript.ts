import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { Patient } from '../models/Patient';
import { DEMO_PATIENTS } from './seedData';

dotenv.config();

async function runSeed() {
  console.log('[Seed] Connecting to MongoDB...');
  const connected = await connectDB();

  if (!connected) {
    console.error('[Seed] Cannot seed directly into MongoDB because MongoDB is not running.');
    console.log('[Seed] Note: MediSummarize runs with embedded in-memory fallback automatically on server start!');
    process.exit(0);
  }

  try {
    console.log('[Seed] Clearing existing demo patients...');
    await Patient.deleteMany({ patientId: { $in: DEMO_PATIENTS.map((p) => p.patientId) } } as any);

    console.log('[Seed] Inserting fresh demo patients with reports and AI summaries...');
    await Patient.insertMany(DEMO_PATIENTS as any);

    console.log('[Seed] Successfully seeded demo patients into MongoDB!');
  } catch (err: any) {
    console.error('[Seed Error]:', err.message);
  } finally {
    process.exit(0);
  }
}

runSeed();
