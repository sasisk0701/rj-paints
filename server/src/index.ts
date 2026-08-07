import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rj_paints_super_secret_jwt_key_2026';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Auth Login API Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const validEmail = email.trim().toLowerCase() === 'rjpaintsandhardwares@gmail.com' || email.trim().toLowerCase() === 'admin@rjpaints.com';
  const validPassword = password === 'Admin@123' || password === 'admin123';

  if (!validEmail || !validPassword) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const token = jwt.sign(
    { email: 'rjpaintsandhardwares@gmail.com', role: 'admin', name: 'S. Madasamy' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    token,
    user: {
      id: 'admin-01',
      email: 'rjpaintsandhardwares@gmail.com',
      role: 'admin',
      name: 'S. Madasamy (Proprietor)'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', business: 'RJ Paints & Styleo Interiors Backend Server Active' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
