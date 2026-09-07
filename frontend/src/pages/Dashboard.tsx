import { useAuth } from '../context/AuthContext';
import { supabase, storageUrl } from '../lib/supabase';
import { useEffect, useMemo, useState } from 'react';
import { Pengisian } from '../types';
import { BUCKET } from '../constants';
import { Link } from 'react-router-dom';

type SortKey = keyof Pick<Pengisian, 'tanggal_kegiatan' | 'pilih_rhk_text' | 'aktivitas_kegiatan'>;
type SortOrder = 'asc' | 'desc';

export default function Dashboard() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState<Pengisian[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    let active = true;
    (async () => {
      const query = supabase
        .from('pengisian_rhk')
        .select('*', { count: 'exact', head: false })
        .order('created_at', { ascending: false })
        .limit(5);
      const { data, count: total } = await query;
      if (!active) return;
      setCount(total ?? 0);
      setRecent((data as Pengisian[]) || []);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const filteredRecent = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? recent.filter((r) =>
          [r.tanggal_kegiatan, r.waktu_kegiatan, r.pilih_rhk_text, r.aktivitas_kegiatan]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(query)),
        )
      : recent;

    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? '');
      const bv = String(b[sortKey] ?? '');
      const cmp = av.localeCompare(bv);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [recent, search, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortOrder === 'desc') {
        setSortKey(null);
        setSortOrder('asc');
      } else {
        setSortOrder('desc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Selamat datang, <span className="font-semibold text-slate-700">{user?.nama}</span>
          </p>
        </div>
        <Link
          to="/pengisian-rhk"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          + Isi RHK
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Pengisian RHK</p>
          <p className="mt-1 text-3xl font-extrabold text-brand-700">{count}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Jabatan</p>
          <p className="mt-1 text-xl font-bold capitalize text-slate-700">{user?.jabatan || '-'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Role</p>
          <p className="mt-1 text-xl font-bold capitalize text-slate-700">{user?.role || '-'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Kegiatan Terbaru</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kegiatan..."
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">
                  <button
                    onClick={() => toggleSort('tanggal_kegiatan')}
                    className="inline-flex items-center gap-1 hover:text-slate-700"
                  >
                    Tanggal
                    {sortKey === 'tanggal_kegiatan' && (
                      <span>{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
                    )}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">Waktu</th>
                <th className="px-5 py-3 font-medium">
                  <button
                    onClick={() => toggleSort('pilih_rhk_text')}
                    className="inline-flex items-center gap-1 hover:text-slate-700"
                  >
                    RHK
                    {sortKey === 'pilih_rhk_text' && (
                      <span>{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
                    )}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button
                    onClick={() => toggleSort('aktivitas_kegiatan')}
                    className="inline-flex items-center gap-1 hover:text-slate-700"
                  >
                    Aktivitas/Kegiatan
                    {sortKey === 'aktivitas_kegiatan' && (
                      <span>{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
                    )}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                    {recent.length === 0
                      ? 'Belum ada data pengisian RHK'
                      : 'Data tidak ditemukan'}
                  </td>
                </tr>
              )}
              {filteredRecent.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3">{r.tanggal_kegiatan}</td>
                  <td className="px-5 py-3">{r.waktu_kegiatan}</td>
                  <td className="px-5 py-3">{r.pilih_rhk_text || '-'}</td>
                  <td className="px-5 py-3">{r.aktivitas_kegiatan || '-'}</td>
                  <td className="px-5 py-3">
                    {r.url_foto ? (
                      <img
                        src={storageUrl(BUCKET.FOTO_RHK, r.url_foto)}
                        alt="foto"
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredRecent.length === 0 && (
            <p className="px-5 py-6 text-center text-slate-400">
              {recent.length === 0
                ? 'Belum ada data pengisian RHK'
                : 'Data tidak ditemukan'}
            </p>
          )}
          {filteredRecent.map((r) => (
            <div key={r.id} className="flex items-start gap-3 px-4 py-3">
              {r.url_foto ? (
                <img
                  src={storageUrl(BUCKET.FOTO_RHK, r.url_foto)}
                  alt="foto"
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                  -
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{r.aktivitas_kegiatan || '-'}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{r.pilih_rhk_text || '-'}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {r.tanggal_kegiatan} · {r.waktu_kegiatan}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
