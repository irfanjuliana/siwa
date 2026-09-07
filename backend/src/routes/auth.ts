import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase.js';
import { signToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import type { User } from '../types.js';

const router = Router();

function toSafeUser(row: any): User {
  return {
    id: row.id,
    nip: row.nip,
    nama: row.nama,
    jabatan: row.jabatan,
    role: row.role,
    foto_url: row.foto_url,
    created_at: row.created_at,
  };
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { nip, password } = req.body || {};
  if (!nip || !password) {
    res.status(400).json({ error: 'NIP dan password wajib diisi' });
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('nip', String(nip).trim())
    .maybeSingle();

  if (error || !data) {
    res.status(401).json({ error: 'NIP atau password salah' });
    return;
  }

  const valid = await bcrypt.compare(password, data.password);
  if (!valid) {
    res.status(401).json({ error: 'NIP atau password salah' });
    return;
  }

  const user = toSafeUser(data);
  const token = signToken({
    id: user.id,
    nip: user.nip,
    nama: user.nama,
    role: user.role,
  });

  res.json({ token, user });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user!.id)
    .maybeSingle();
  if (error || !data) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }
  res.json({ user: toSafeUser(data) });
});

// GET /api/users  (admin)
router.get('/users', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nip, nama, jabatan, role, foto_url, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ users: data });
});

// POST /api/users  (admin) - create user
router.post('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { nip, password, nama, jabatan, role, foto_url } = req.body || {};
  if (!nip || !password || !nama || !jabatan || !role) {
    res.status(400).json({ error: 'nip, password, nama, jabatan, role wajib diisi' });
    return;
  }

  const hash = await bcrypt.hash(String(password), 10);

  const { data, error } = await supabase
    .from('users')
    .insert({
      nip: String(nip).trim(),
      password: hash,
      nama: String(nama).trim(),
      jabatan: String(jabatan).trim(),
      role: String(role).trim(),
      foto_url: foto_url || null,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'NIP sudah terdaftar' });
    } else {
      res.status(500).json({ error: error.message });
    }
    return;
  }
  res.status(201).json({ user: toSafeUser(data) });
});

// PUT /api/users/:id (admin) - update user
router.put('/users/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nip, nama, jabatan, role, foto_url, password } = req.body || {};

  const patch: Record<string, any> = {};
  if (nip) patch.nip = String(nip).trim();
  if (nama) patch.nama = String(nama).trim();
  if (jabatan) patch.jabatan = String(jabatan).trim();
  if (role) patch.role = String(role).trim();
  if (foto_url !== undefined) patch.foto_url = foto_url;
  if (password) patch.password = await bcrypt.hash(String(password), 10);

  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', id)
    .select('id, nip, nama, jabatan, role, foto_url, created_at')
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }
  res.json({ user: data });
});

// DELETE /api/users/:id (admin)
router.delete('/users/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  if (req.user!.id === req.params.id) {
    res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri' });
    return;
  }
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true });
});

export default router;
