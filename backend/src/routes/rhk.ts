import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/rhk - list RHK 1..6 (with activity & result options)
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const { data: rhk, error } = await supabase
    .from('rhk')
    .select('id, nomor, nama_rhk, keterangan, rhk_aktivitas(id, nama), rhk_hasil(id, nama)')
    .order('nomor', { ascending: true });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ rhk: rhk || [] });
});

// POST /api/rhk - create RHK master (admin)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { nomor, nama_rhk } = req.body || {};
  if (!nomor || !nama_rhk) {
    res.status(400).json({ error: 'nomor dan nama_rhk wajib diisi' });
    return;
  }
  const { data, error } = await supabase
    .from('rhk')
    .insert({ nomor: Number(nomor), nama_rhk: String(nama_rhk).trim() })
    .select('*')
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ rhk: data });
});

// POST /api/rhk/:id/aktivitas - add activity option for a RHK
router.post('/:id/aktivitas', requireAuth, async (req: Request, res: Response) => {
  const { nama } = req.body || {};
  if (!nama) {
    res.status(400).json({ error: 'nama wajib diisi' });
    return;
  }
  const { data, error } = await supabase
    .from('rhk_aktivitas')
    .insert({ rhk_id: req.params.id, nama: String(nama).trim() })
    .select('*')
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ aktivitas: data });
});

// POST /api/rhk/:id/hasil - add result option for a RHK
router.post('/:id/hasil', requireAuth, async (req: Request, res: Response) => {
  const { nama } = req.body || {};
  if (!nama) {
    res.status(400).json({ error: 'nama wajib diisi' });
    return;
  }
  const { data, error } = await supabase
    .from('rhk_hasil')
    .insert({ rhk_id: req.params.id, nama: String(nama).trim() })
    .select('*')
    .single();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ hasil: data });
});

export default router;
