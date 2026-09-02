import { Request, Response } from 'express';

const DOCTOR_EMAIL = process.env.DOCTOR_EMAIL || 'doctor@example.com';
const DOCTOR_PASSWORD = process.env.DOCTOR_PASSWORD || 'change_this_password';

export function doctorLogin(req: Request, res: Response): void {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }

  // Prototype authentication check
  if (email.trim().toLowerCase() === DOCTOR_EMAIL.toLowerCase() && password === DOCTOR_PASSWORD) {
    res.json({
      success: true,
      message: 'Authentication successful.',
      doctor: {
        id: 'DOC-01',
        name: 'Dr. Alok Verma, MD',
        email: DOCTOR_EMAIL,
        specialty: 'Internal Medicine',
        hospital: 'MediSummarize Healthcare',
      },
      token: `demo-token-${Date.now()}`,
    });
    return;
  }

  res.status(401).json({
    success: false,
    message: 'Invalid doctor credentials. Please check your email or password.',
  });
}

export function doctorMe(req: Request, res: Response): void {
  res.json({
    authenticated: true,
    doctor: {
      id: 'DOC-01',
      name: 'Dr. Alok Verma, MD',
      email: DOCTOR_EMAIL,
      specialty: 'Internal Medicine',
    },
  });
}
