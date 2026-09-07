import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Rhk } from '../types';
import { Alert, Button, TextField } from '../components/ui';

interface NewOption {
  rhkId: string;
  type: 'aktivitas' | 'hasil';
}

interface EditRhk {
  id: string;
  nomor: string;
  nama: string;
  keterangan: string;
}

interface EditChip {
  id: string;
  type: 'aktivitas' | 'hasil';
  nama: string;
}

interface DeleteTarget {
  id: string;
  type: 'rhk' | 'aktivitas' | 'hasil';
  rhkId?: string;
  label: string;
}

export default function DataRhk() {
  const [rhkList, setRhkList] = useState<Rhk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [newRhkNomor, setNewRhkNomor] = useState('');
  const [newRhkNama, setNewRhkNama] = useState('');
  const [newRhkKeterangan, setNewRhkKeterangan] = useState('');
  const [addingRhk, setAddingRhk] = useState(false);

  const [editingRhk, setEditingRhk] = useState<EditRhk | null>(null);
  const [savingRhk, setSavingRhk] = useState(false);

  const [newOption, setNewOption] = useState<NewOption | null>(null);
  const [optionValue, setOptionValue] = useState('');
  const [savingOption, setSavingOption] = useState(false);

  const [editingChip, setEditingChip] = useState<EditChip | null>(null);
  const [chipValue, setChipValue] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rhk')
        .select('id, nomor, nama_rhk, keterangan, rhk_aktivitas(id, nama), rhk_hasil(id, nama)')
        .order('nomor', { ascending: true });
      if (error) throw error;
      setRhkList((data as Rhk[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const showError = (m: string) => {
    setError(m);
    setMessage('');
  };
  const showOk = (m: string) => {
    setMessage(m);
    setError('');
  };

  const addRhk = async (e: FormEvent) => {
    e.preventDefault();
    showOk('');
    setAddingRhk(true);
    try {
      const { error } = await supabase.from('rhk').insert({
        nomor: Number(newRhkNomor),
        nama_rhk: newRhkNama.trim(),
        keterangan: newRhkKeterangan.trim() || null,
      });
      if (error) {
        if (error.code === '23505') showError('Nama RHK sudah ada');
        else showError(error.message);
        return;
      }
      setNewRhkNomor('');
      setNewRhkNama('');
      setNewRhkKeterangan('');
      showOk('RHK berhasil ditambahkan');
      await load();
    } finally {
      setAddingRhk(false);
    }
  };

  const startEditRhk = (rhk: Rhk) => {
    setEditingRhk({ id: rhk.id, nomor: String(rhk.nomor), nama: rhk.nama_rhk, keterangan: rhk.keterangan || '' });
    setNewRhkNomor('');
    setNewRhkNama('');
    showOk('');
  };

  const saveEditRhk = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingRhk) return;
    setSavingRhk(true);
    try {
      const { error } = await supabase
        .from('rhk')
        .update({
          nomor: Number(editingRhk.nomor),
          nama_rhk: editingRhk.nama.trim(),
          keterangan: editingRhk.keterangan.trim() || null,
        })
        .eq('id', editingRhk.id);
      if (error) {
        showError(error.message);
        return;
      }
      setEditingRhk(null);
      showOk('RHK berhasil diperbarui');
      await load();
    } finally {
      setSavingRhk(false);
    }
  };

  const openOption = (rhkId: string, type: 'aktivitas' | 'hasil') => {
    setNewOption({ rhkId, type });
    setOptionValue('');
    setEditingChip(null);
  };

  const saveOption = async (e: FormEvent) => {
    e.preventDefault();
    if (!newOption) return;
    setSavingOption(true);
    const table = newOption.type === 'aktivitas' ? 'rhk_aktivitas' : 'rhk_hasil';
    try {
      const { error } = await supabase.from(table).insert({ rhk_id: newOption.rhkId, nama: optionValue.trim() });
      if (error) {
        showError(error.message);
        return;
      }
      setNewOption(null);
      showOk(newOption.type === 'aktivitas' ? 'Aktivitas/Kegiatan ditambahkan' : 'Hasil tindak lanjut ditambahkan');
      await load();
    } finally {
      setSavingOption(false);
    }
  };

  const startEditChip = (chip: { id: string; type: 'aktivitas' | 'hasil'; nama: string }) => {
    setEditingChip(chip);
    setChipValue(chip.nama);
    setNewOption(null);
    showOk('');
  };

  const saveChip = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingChip) return;
    const table = editingChip.type === 'aktivitas' ? 'rhk_aktivitas' : 'rhk_hasil';
    try {
      const { error } = await supabase.from(table).update({ nama: chipValue.trim() }).eq('id', editingChip.id);
      if (error) {
        showError(error.message);
        return;
      }
      setEditingChip(null);
      showOk(editingChip.type === 'aktivitas' ? 'Aktivitas/Kegiatan diperbarui' : 'Hasil tindak lanjut diperbarui');
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal memperbarui data');
    }
  };

  const requestDelete = (t: DeleteTarget) => {
    setDeleteTarget(t);
    showOk('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'rhk') {
        const { error } = await supabase.from('rhk').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        showOk('RHK berhasil dihapus');
      } else {
        const table = deleteTarget.type === 'aktivitas' ? 'rhk_aktivitas' : 'rhk_hasil';
        const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
        if (error) throw error;
        showOk(deleteTarget.type === 'aktivitas' ? 'Aktivitas/kegiatan berhasil dihapus' : 'Hasil tindak lanjut berhasil dihapus');
      }
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Gagal menghapus data');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">DATA RHK</h1>
        <p className="text-sm text-slate-500">
          Kelola data master RHK, aktivitas/kegiatan, dan hasil tindak lanjut untuk dropdown di menu Pengisian RHK
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-800">{editingRhk ? 'Edit RHK' : 'Tambah RHK Baru'}</h2>
        {editingRhk ? (
          <form onSubmit={saveEditRhk}>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-32">
                <TextField label="Nomor" type="number" value={editingRhk.nomor} onChange={(e) => setEditingRhk({ ...editingRhk, nomor: e.target.value })} required />
              </div>
              <div className="min-w-[200px] flex-1">
                <TextField label="Nama RHK" value={editingRhk.nama} onChange={(e) => setEditingRhk({ ...editingRhk, nama: e.target.value })} required />
              </div>
              <Button type="submit" loading={savingRhk} variant="success">Simpan</Button>
              <Button type="button" variant="ghost" onClick={() => setEditingRhk(null)}>Batal</Button>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Keterangan</span>
              <textarea
                rows={2}
                placeholder="Deskripsi / keterangan RHK"
                value={editingRhk.keterangan}
                onChange={(e) => setEditingRhk({ ...editingRhk, keterangan: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </form>
        ) : (
          <form onSubmit={addRhk}>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-32">
                <TextField label="Nomor" type="number" value={newRhkNomor} onChange={(e) => setNewRhkNomor(e.target.value)} required />
              </div>
              <div className="min-w-[200px] flex-1">
                <TextField label="Nama RHK" placeholder="Contoh: RHK 7" value={newRhkNama} onChange={(e) => setNewRhkNama(e.target.value)} required />
              </div>
              <Button type="submit" loading={addingRhk}>Tambah</Button>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Keterangan</span>
              <textarea
                rows={2}
                placeholder="Deskripsi / keterangan RHK"
                value={newRhkKeterangan}
                onChange={(e) => setNewRhkKeterangan(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {!loading &&
          rhkList.map((rhk) => (
            <div key={rhk.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-brand-700">{rhk.nama_rhk}</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openOption(rhk.id, 'aktivitas')} className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300">
                    + Aktivitas
                  </button>
                  <button onClick={() => openOption(rhk.id, 'hasil')} className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300">
                    + Hasil TL
                  </button>
                  <button onClick={() => startEditRhk(rhk)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">
                    Edit
                  </button>
                  <button onClick={() => requestDelete({ id: rhk.id, type: 'rhk', label: rhk.nama_rhk })} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                    Hapus
                  </button>
                </div>
              </div>

              {rhk.keterangan && (
                <p className="-mt-2 mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">
                  {rhk.keterangan}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-500">Aktivitas / Kegiatan</p>
                  <div className="flex flex-wrap gap-2">
                    {rhk.rhk_aktivitas.length === 0 && (
                      <span className="text-xs text-slate-400">Belum ada data</span>
                    )}
                    {rhk.rhk_aktivitas.map((a) =>
                      editingChip && editingChip.id === a.id && editingChip.type === 'aktivitas' ? (
                        <form key={a.id} onSubmit={saveChip} className="flex w-full max-w-xs items-center gap-2">
                          <input
                            autoFocus
                            value={chipValue}
                            onChange={(e) => setChipValue(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
                          />
                          <button type="submit" className="rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">OK</button>
                          <button type="button" onClick={() => setEditingChip(null)} className="rounded-lg bg-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600">✕</button>
                        </form>
                      ) : (
                        <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                          {a.nama}
                          <button onClick={() => startEditChip({ id: a.id, type: 'aktivitas', nama: a.nama })} className="text-brand-400 hover:text-brand-600" aria-label="Edit">✎</button>
                          <button onClick={() => requestDelete({ id: a.id, type: 'aktivitas', rhkId: rhk.id, label: a.nama })} className="text-brand-300 hover:text-red-500" aria-label="Hapus">✕</button>
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-500">Hasil Tindak Lanjut</p>
                  <div className="flex flex-wrap gap-2">
                    {rhk.rhk_hasil.length === 0 && (
                      <span className="text-xs text-slate-400">Belum ada data</span>
                    )}
                    {rhk.rhk_hasil.map((h) =>
                      editingChip && editingChip.id === h.id && editingChip.type === 'hasil' ? (
                        <form key={h.id} onSubmit={saveChip} className="flex w-full max-w-xs items-center gap-2">
                          <input
                            autoFocus
                            value={chipValue}
                            onChange={(e) => setChipValue(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
                          />
                          <button type="submit" className="rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">OK</button>
                          <button type="button" onClick={() => setEditingChip(null)} className="rounded-lg bg-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600">✕</button>
                        </form>
                      ) : (
                        <span key={h.id} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          {h.nama}
                          <button onClick={() => startEditChip({ id: h.id, type: 'hasil', nama: h.nama })} className="text-emerald-400 hover:text-emerald-600" aria-label="Edit">✎</button>
                          <button onClick={() => requestDelete({ id: h.id, type: 'hasil', rhkId: rhk.id, label: h.nama })} className="text-emerald-300 hover:text-red-500" aria-label="Hapus">✕</button>
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {newOption && newOption.rhkId === rhk.id && (
                <form onSubmit={saveOption} className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                  <div className="min-w-[240px] flex-1">
                    <TextField
                      label={newOption.type === 'aktivitas' ? 'Nama Aktivitas / Kegiatan' : 'Nama Hasil Tindak Lanjut'}
                      placeholder="Ketik teks pilihan"
                      value={optionValue}
                      onChange={(e) => setOptionValue(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <Button type="submit" loading={savingOption} variant="success">Simpan</Button>
                  <Button type="button" variant="ghost" onClick={() => setNewOption(null)}>Batal</Button>
                </form>
              )}
            </div>
          ))}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Konfirmasi Hapus</h3>
            <p className="mt-2 text-sm text-slate-600">
              Yakin ingin menghapus{' '}
              <span className="font-semibold text-slate-800">
                {deleteTarget.type === 'rhk' ? 'RHK' : deleteTarget.type === 'aktivitas' ? 'aktivitas/kegiatan' : 'hasil tindak lanjut'} "{deleteTarget.label}"
              </span>
              ?{deleteTarget.type === 'rhk' && ' Semua aktivitas dan hasil yang terkait pada RHK ini juga akan ikut terhapus.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button type="button" variant="danger" loading={deleting} onClick={confirmDelete}>Hapus</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
