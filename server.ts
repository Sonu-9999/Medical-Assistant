import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db';
import { initializeDatabaseSeed } from './server/services/storageService';
import apiRouter from './server/routes/api';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();

  // Ensure upload directories exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const reportsDir = path.join(uploadsDir, 'reports');
  const audioDir = path.join(uploadsDir, 'audio');
  [uploadsDir, reportsDir, audioDir].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // Security headers using Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for local development and Vite dynamic scripts
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static uploads serving for uploaded PDFs and audio recordings
  app.use('/uploads', express.static(uploadsDir));

  // Mount API Router under /api
  app.use('/api', apiRouter);

  // Initialize Database Connection and Seed Data
  try {
    await connectDB();
  } catch (err: any) {
    console.warn('[Server] Initial MongoDB connection error (handled gracefully):', err.message);
  }
  await initializeDatabaseSeed();

  // Integrate Vite for dev mode or serve static bundle in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`  MediSummarize Server active at http://${HOST}:${PORT}`);
    console.log(`  Patient Portal:  http://localhost:${PORT}/`);
    console.log(`  Doctor Portal:   http://localhost:${PORT}/#doctor`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Error]:', err);
});
