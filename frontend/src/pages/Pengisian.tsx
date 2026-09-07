import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, storageUrl } from '../lib/supabase';
import { Rhk, Pengisian as PengisianType } from '../types';
import { BUCKET } from '../constants';
import { Alert, Button, SelectField, TextField } from '../components/ui';
import PhotoUpload from '../components/PhotoUpload';

export default function Pengisian() {
  const { user } = useAuth();
  const [rhkList, setRhkList] = useState<Rhk[]>([]);
  const [entries, setEntries] = useState<PengisianType[]>([]);
  const [showForm, setShowForm] = useState(true);

  const [tanggal, setTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [pilihRhkId, setPilihRhkId] = useState('');
  const [aktivitasId, setAktivitasId] = useState('');
  const [aktivitasManual, setAktivitasManual] = useState('');
  const [hasilManual, setHasilManual] = useState('');
  const [fotoPath, setFotoPath] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterRhk, setFilterRhk] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<'tanggal' | 'waktu' | 'rhk' | 'aktivitas'>('tanggal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const selectedRhk = useMemo(() => rhkList.find((r) => r.id === pilihRhkId), [rhkList, pilihRhkId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('rhk').select('id, nomor, nama_rhk, keterangan, rhk_aktivitas(id, nama), rhk_hasil(id, nama)').order('nomor');
      setRhkList((data as Rhk[]) || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let query = supabase
        .from('pengisian_rhk')
        .select('*, users(nama)')
        .order('created_at', { ascending: false });
      if (user?.role !== 'admin') {
        query = query.eq('user_id', user!.id);
      }
      const { data } = await query;
      setEntries((data as PengisianType[]) || []);
    })();
  }, [user]);

  const activeAktivitas = selectedRhk?.rhk_aktivitas || [];
  const activeHasil = selectedRhk?.rhk_hasil || [];

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = entries.filter((r) => {
      if (filterRhk && r.pilih_rhk_id !== filterRhk) return false;
      if (dateFrom && r.tanggal_kegiatan < dateFrom) return false;
      if (dateTo && r.tanggal_kegiatan > dateTo) return false;
      if (!q) return true;
      const haystack = [
        r.tanggal_kegiatan,
        r.waktu_kegiatan,
        r.pilih_rhk_text,
        r.aktivitas_kegiatan,
        r.hasil_tl,
        r.users?.nama,
        r.users?.nip,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      let va: string;
      let vb: string;
      switch (sortKey) {
        case 'tanggal':
          va = a.tanggal_kegiatan;
          vb = b.tanggal_kegiatan;
          break;
        case 'waktu':
          va = a.waktu_kegiatan;
          vb = b.waktu_kegiatan;
          break;
        case 'rhk':
          va = a.pilih_rhk_text || '';
          vb = b.pilih_rhk_text || '';
          break;
        case 'aktivitas':
          va = a.aktivitas_kegiatan || '';
          vb = b.aktivitas_kegiatan || '';
          break;
        default:
          va = '';
          vb = '';
      }
      return va.localeCompare(vb) * dir;
    });
    return list;
  }, [entries, search, filterRhk, dateFrom, dateTo, sortKey, sortDir]);

  const resetFilters = () => {
    setSearch('');
    setFilterRhk('');
    setDateFrom('');
    setDateTo('');
    setSortKey('tanggal');
    setSortDir('desc');
  };

  const toggleSort = (key: 'tanggal' | 'waktu' | 'rhk' | 'aktivitas') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortableTh = ({ label, k }: { label: string; k: 'tanggal' | 'waktu' | 'rhk' | 'aktivitas' }) => (
    <th className="cursor-pointer select-none px-5 py-3 font-medium hover:text-brand-600" onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-[10px] text-slate-400">
          {sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </span>
    </th>
  );

  const resetForm = () => {
    setTanggal('');
    setWaktu('');
    setPilihRhkId('');
    setAktivitasId('');
    setAktivitasManual('');
    setHasilManual('');
    setFotoPath(null);
    setEditingId(null);
  };

  const startEdit = (r: PengisianType) => {
    setShowForm(true);
    setEditingId(r.id);
    setTanggal(r.tanggal_kegiatan);
    setWaktu(r.waktu_kegiatan.slice(0, 5));
    setPilihRhkId(r.pilih_rhk_id || '');
    setAktivitasId(r.aktivitas_id || '');
    setAktivitasManual(r.aktivitas_kegiatan || '');
    setHasilManual(r.hasil_tl || '');
    setFotoPath(r.url_foto || null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (r: PengisianType) => {
    if (!window.confirm('Yakin ingin menghapus data pengisian RHK ini?')) return;
    setDeletingId(r.id);
    setMessage(null);
    try {
      const { error } = await supabase.from('pengisian_rhk').delete().eq('id', r.id);
      if (error) throw error;
      if (r.url_foto) {
        await supabase.storage.from(BUCKET.FOTO_RHK).remove([r.url_foto]).catch(() => {});
      }
      setMessage({ type: 'success', text: 'Data berhasil dihapus' });
      await refreshEntries();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menghapus data' });
    } finally {
      setDeletingId(null);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const aktivitasValue = aktivitasId ? activeAktivitas.find((a) => a.id === aktivitasId)?.nama || aktivitasManual : aktivitasManual.trim();
    const hasilValue = hasilManual.trim();

    const payload = {
      tanggal_kegiatan: tanggal,
      waktu_kegiatan: waktu,
      pilih_rhk_id: pilihRhkId,
      pilih_rhk_text: selectedRhk?.nama_rhk || null,
      aktivitas_id: aktivitasId || null,
      aktivitas_kegiatan: aktivitasValue || null,
      hasil_tl: hasilValue || null,
      url_foto: fotoPath,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('pengisian_rhk').update(payload).eq('id', editingId);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Data RHK berhasil diperbarui' });
      } else {
        const { error } = await supabase.from('pengisian_rhk').insert({ ...payload, user_id: user.id });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Data RHK berhasil disimpan' });
      }
      resetForm();
      await refreshEntries();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menyimpan data' });
    } finally {
      setSaving(false);
    }
  };

  const refreshEntries = async () => {
    let query = supabase.from('pengisian_rhk').select('*, users(nama)').order('created_at', { ascending: false });
    if (user?.role !== 'admin') {
      query = query.eq('user_id', user!.id);
    }
    const { data } = await query;
    setEntries((data as PengisianType[]) || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Pengisian RHK</h1>
          <p className="text-sm text-slate-500">Isi data kegiatan harian wali asrama</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
        >
          {showForm ? 'Tutup Form' : 'Tambah RHK'}
        </button>
      </div>

      {message && (
        <Alert type={message.type}>{message.text}</Alert>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
            <TextField label="Waktu Dimulai Kegiatan" type="time" value={waktu} onChange={(e) => setWaktu(e.target.value)} required />

            <div>
              <SelectField label="Pilih RHK" value={pilihRhkId} onChange={(e) => { setPilihRhkId(e.target.value); setAktivitasId(''); setAktivitasManual(''); setHasilManual(''); }} required>
                <option value="">-- Pilih RHK --</option>
                {rhkList.map((r) => (
                  <option key={r.id} value={r.id}>{r.nama_rhk}</option>
                ))}
              </SelectField>
              {selectedRhk?.keterangan && (
                <span className="mt-1 block rounded-md bg-brand-50 px-3 py-1.5 text-xs leading-relaxed text-brand-700">
                  {selectedRhk.keterangan}
                </span>
              )}
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Aktivitas/Kegiatan</span>
              <input
                list="datalist-aktivitas"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="Pilih atau ketik manual"
                value={aktivitasId ? activeAktivitas.find((a) => a.id === aktivitasId)?.nama || aktivitasManual : aktivitasManual}
                onChange={(e) => { setAktivitasManual(e.target.value); setAktivitasId(''); }}
                required
              />
              <datalist id="datalist-aktivitas">
                {activeAktivitas.map((a) => (
                  <option key={a.id} value={a.nama} />
                ))}
              </datalist>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Hasil Tindak Lanjut</span>
              <input
                list="datalist-hasil"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="Pilih atau ketik manual"
                value={hasilManual}
                onChange={(e) => setHasilManual(e.target.value)}
                required
              />
              <datalist id="datalist-hasil">
                {activeHasil.map((h) => (
                  <option key={h.id} value={h.nama} />
                ))}
              </datalist>
            </label>

            <div className="sm:col-span-2 lg:col-span-1">
              <PhotoUpload bucket={BUCKET.FOTO_RHK} folder="foto_rhk" value={fotoPath} onChange={setFotoPath} label="Upload Bukti (Foto Kegiatan)" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            {editingId && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Sedang mengedit data
              </span>
            )}
            <div className="ml-auto flex gap-2">
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>Batal</Button>
              )}
              <Button type="submit" loading={saving}>{editingId ? 'Simpan Perubahan' : 'Simpan Data'}</Button>
            </div>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-800">
            {user?.role === 'admin' ? 'Data Pengisian RHK (Semua)' : 'Data Pengisian RHK Saya'}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-40 rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-52"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Filter RHK</span>
              <select
                value={filterRhk}
                onChange={(e) => setFilterRhk(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Semua RHK</option>
                {rhkList.map((r) => (
                  <option key={r.id} value={r.id}>{r.nama_rhk}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Dari Tanggal</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Sampai Tanggal</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </label>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Reset Filter
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-2 text-xs text-slate-400">
          <span>{filteredEntries.length} data ditampilkan</span>
          <span>Klik judul kolom untuk mengurutkan</span>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <SortableTh label="Tanggal" k="tanggal" />
                <SortableTh label="Waktu" k="waktu" />
                <SortableTh label="RHK" k="rhk" />
                <SortableTh label="Aktivitas/Kegiatan" k="aktivitas" />
                <th className="px-5 py-3 font-medium">Hasil TL</th>
                <th className="px-5 py-3 font-medium">Bukti</th>
                <th className="px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-400">Tidak ada data yang cocok dengan filter</td>
                </tr>
              )}
              {filteredEntries.map((r) => (
                <tr key={r.id} className={editingId === r.id ? 'bg-amber-50/60' : ''}>
                  <td className="px-5 py-3">{r.tanggal_kegiatan}</td>
                  <td className="px-5 py-3">{r.waktu_kegiatan}</td>
                  <td className="px-5 py-3">{r.pilih_rhk_text || '-'}</td>
                  <td className="px-5 py-3">{r.aktivitas_kegiatan || '-'}</td>
                  <td className="px-5 py-3">{r.hasil_tl || '-'}</td>
                  <td className="px-5 py-3">
                    {r.url_foto ? (
                      <img src={storageUrl(BUCKET.FOTO_RHK, r.url_foto)} alt="bukti" className="h-10 w-10 rounded object-cover" />
                    ) : '-'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(r)}
                        disabled={deletingId === r.id}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deletingId === r.id}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === r.id ? 'Hapus...' : 'Hapus'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {filteredEntries.length === 0 && (
            <p className="px-5 py-6 text-center text-slate-400">Tidak ada data yang cocok dengan filter</p>
          )}
          {filteredEntries.map((r) => (
            <div key={r.id} className={`p-4 ${editingId === r.id ? 'bg-amber-50/60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{r.aktivitas_kegiatan || '-'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.pilih_rhk_text || '-'}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {r.tanggal_kegiatan} · {r.waktu_kegiatan}
                  </p>
                </div>
                {r.url_foto && (
                  <img src={storageUrl(BUCKET.FOTO_RHK, r.url_foto)} alt="bukti" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium text-slate-400">Hasil TL:</span> {r.hasil_tl || '-'}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => startEdit(r)}
                  disabled={deletingId === r.id}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(r)}
                  disabled={deletingId === r.id}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === r.id ? 'Hapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
