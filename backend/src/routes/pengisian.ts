import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/pengisian - list entries (admin sees all, user sees own)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === 'admin';
  let query = supabase
    .from('pengisian_rhk')
    .select('*, users(id, nip, nama)')
    .order('tanggal_kegiatan', { ascending: false })
    .order('waktu_kegiatan', { ascending: false });

  if (!isAdmin) {
    query = query.eq('user_id', req.user!.id);
  }

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ entries: data || [] });
});

// GET /api/pengisian/:id - single entry
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user!.role === 'admin';

  let query = supabase
    .from('pengisian_rhk')
    .select('*, users(id, nip, nama)')
    .eq('id', id);

  if (!isAdmin) {
    query = query.eq('user_id', req.user!.id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Data tidak ditemukan' });
    return;
  }
  res.json({ entry: data });
});

// POST /api/pengisian - create entry
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const {
    tanggal_kegiatan,
    waktu_kegiatan,
    pilih_rhk_id,
    pilih_rhk_text,
    aktivitas_id,
    aktivitas_kegiatan,
    hasil_tl,
    url_foto,
  } = req.body || {};

  if (!tanggal_kegiatan || !waktu_kegiatan || !pilih_rhk_id) {
    res.status(400).json({ error: 'tanggal, waktu, dan RHK wajib diisi' });
    return;
  }

  const { data, error } = await supabase
    .from('pengisian_rhk')
    .insert({
      user_id: req.user!.id,
      tanggal_kegiatan,
      waktu_kegiatan,
      pilih_rhk_id,
      pilih_rhk_text,
      aktivitas_id: aktivitas_id || null,
      aktivitas_kegiatan: aktivitas_kegiatan || null,
      hasil_tl: hasil_tl || null,
      url_foto: url_foto || null,
    })
    .select('*')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json({ entry: data });
});

// PUT /api/pengisian/:id - update entry
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user!.role === 'admin';
  const {
    tanggal_kegiatan,
    waktu_kegiatan,
    pilih_rhk_id,
    pilih_rhk_text,
    aktivitas_id,
    aktivitas_kegiatan,
    hasil_tl,
    url_foto,
  } = req.body || {};

  let query = supabase.from('pengisian_rhk').update({
    tanggal_kegiatan: tanggal_kegiatan ?? undefined,
    waktu_kegiatan: waktu_kegiatan ?? undefined,
    pilih_rhk_id: pilih_rhk_id ?? undefined,
    pilih_rhk_text: pilih_rhk_text ?? undefined,
    aktivitas_id: aktivitas_id ?? undefined,
    aktivitas_kegiatan: aktivitas_kegiatan ?? undefined,
    hasil_tl: hasil_tl ?? undefined,
    url_foto: url_foto ?? undefined,
  }).eq('id', id).select('*');

  if (!isAdmin) {
    query = query.eq('user_id', req.user!.id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Data tidak ditemukan atau bukan milik Anda' });
    return;
  }
  res.json({ entry: data });
});

// DELETE /api/pengisian/:id - delete entry
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user!.role === 'admin';

  let query = supabase.from('pengisian_rhk').delete().eq('id', id).select('id');
  if (!isAdmin) {
    query = query.eq('user_id', req.user!.id);
  }

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data || data.length === 0) {
    res.status(404).json({ error: 'Data tidak ditemukan atau bukan milik Anda' });
    return;
  }
  res.json({ success: true });
});

export default router;
