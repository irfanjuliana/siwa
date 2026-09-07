import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import rhkRoutes from './routes/rhk.js';
import pengisianRoutes from './routes/pengisian.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (_req, res) => {
  res.json({ name: 'SIWA API - Sistem Informasi Wali Asrama', status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rhk', rhkRoutes);
app.use('/api/pengisian', pengisianRoutes);

app.listen(PORT, () => {
  console.log(`SIWA backend running on http://localhost:${PORT}`);
});
