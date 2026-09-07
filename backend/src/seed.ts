import bcrypt from 'bcryptjs';
import { supabase } from './lib/supabase.js';

const nip = '198001012000031001';
const password = 'admin123';
const nama = 'Admin SIWA';
const jabatan = 'wali asrama';
const role = 'admin';

const hash = await bcrypt.hash(password, 10);

const { data, error } = await supabase
  .from('users')
  .upsert(
    { nip, password: hash, nama, jabatan, role, foto_url: null },
    { onConflict: 'nip' }
  )
  .select('id, nip, nama, jabatan, role')
  .single();

if (error) {
  console.error('Seed error:', error.message);
  process.exit(1);
}
console.log('Admin seeded:', JSON.stringify(data));
