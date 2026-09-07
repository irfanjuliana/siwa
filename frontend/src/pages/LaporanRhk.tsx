import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase, storageUrl } from "../lib/supabase";
import { Pengisian } from "../types";
import { Alert } from "../components/ui";
import { BUCKET, BULAN_NAMES } from "../constants";
import { collectPhotos } from "../laporan/foto";
import { downloadLaporanPdf, generateLaporanPdf } from "../laporan/pdf";
import type { jsPDF } from "jspdf";
import { getPendahuluan } from "../laporan/data";
import { formatBulanLaporan, formatTanggalPenutup } from "../utils/date";

interface RhkInfo {
  id: string;
  nomor: number;
  nama_rhk: string;
  keterangan: string;
}

export default function LaporanRhk() {
  const { nomor } = useParams();
  const { user } = useAuth();
  const [entries, setEntries] = useState<Pengisian[]>([]);
  const [rhkList, setRhkList] = useState<RhkInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<"pdf" | null>(null);
  const [preview, setPreview] = useState<{ url: string; doc: jsPDF } | null>(null);
  const [bulanDipilih, setBulanDipilih] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [rhkRes, entryRes] = await Promise.all([
          supabase.from("rhk").select("id, nomor, nama_rhk, keterangan").order("nomor"),
          supabase
            .from("pengisian_rhk")
            .select("*, users(nama)")
            .order("created_at", { ascending: false }),
        ]);
        if (rhkRes.error) throw rhkRes.error;
        if (entryRes.error) throw entryRes.error;

        setRhkList((rhkRes.data as RhkInfo[]) || []);
        let data = (entryRes.data as Pengisian[]) || [];
        if (user?.role !== "admin" && user) {
          data = data.filter((e) => e.user_id === user.id);
        }
        setEntries(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const nomorNum = nomor ? Number(nomor) : NaN;
  const target = useMemo(
    () => (nomor ? rhkList.find((r) => r.nomor === nomorNum) || null : null),
    [nomor, nomorNum, rhkList],
  );

  const filtered = useMemo(() => {
    if (!target) return entries;
    return entries.filter(
      (e) => e.pilih_rhk_id === target.id || e.pilih_rhk_text === target.nama_rhk,
    );
  }, [entries, target]);

  const bulanOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of filtered) {
      if (!e.tanggal_kegiatan) continue;
      const [y, m] = e.tanggal_kegiatan.split("-");
      if (!y || !m) continue;
      const key = `${y}-${m}`;
      const mm = Number(m) - 1;
      if (!map.has(key)) map.set(key, `${BULAN_NAMES[mm]} ${y}`);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const bulanFiltered = useMemo(
    () =>
      bulanDipilih
        ? filtered.filter((e) => e.tanggal_kegiatan?.startsWith(bulanDipilih))
        : filtered,
    [filtered, bulanDipilih],
  );

  const pageTitle = !nomor ? "LAPORAN SEMUA RHK" : `LAPORAN RHK ${nomorNum}`;
  const laporanTitle =
    !nomor || !target ? "JURNAL KEGIATAN HARIAN KERJA" : `LAPORAN ${target.keterangan.toUpperCase()}`;
  const subtitle = !nomor
    ? "Seluruh data pengisian RHK"
    : target
      ? `Data pengisian untuk ${target.nama_rhk}`
      : `Data pengisian untuk RHK nomor ${nomorNum}`;

  const tanggalKegiatan = useMemo(
    () => bulanFiltered.map((e) => e.tanggal_kegiatan),
    [bulanFiltered],
  );
  const bulanLaporan = formatBulanLaporan(tanggalKegiatan);
  const tglPenutup = formatTanggalPenutup(tanggalKegiatan);

  const namaPenandatangan = user?.nama || "Irfan Juliana Winandar, S.Kom";
  const nipPenandatangan = user?.nip || "199707212026221001";
  const fileName = [
    nomor ? `laporan-rhk-${nomorNum}` : "laporan-semua-rhk",
    bulanDipilih || "",
  ]
    .filter(Boolean)
    .join("-")
    .toLowerCase();

  const loadKopImage = async (): Promise<string> => {
    const res = await fetch("/kop.jpg");
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const downloadPdf = async () => {
    setDownloading("pdf");
    try {
      const [photos, kopImage] = await Promise.all([collectPhotos(bulanFiltered), loadKopImage()]);
      downloadLaporanPdf({
        entries: bulanFiltered,
        photos,
        kopImage,
        title: laporanTitle,
        fileName,
        pendahuluan: getPendahuluan(nomorNum),
        bulanLaporan,
        tglPenutup,
        namaPenandatangan,
        nipPenandatangan,
      });
    } finally {
      setDownloading(null);
    }
  };

  const previewPdf = async () => {
    setDownloading("pdf");
    try {
      const [photos, kopImage] = await Promise.all([collectPhotos(bulanFiltered), loadKopImage()]);
      const doc = generateLaporanPdf({
        entries: bulanFiltered,
        photos,
        kopImage,
        title: laporanTitle,
        fileName,
        pendahuluan: getPendahuluan(nomorNum),
        bulanLaporan,
        tglPenutup,
        namaPenandatangan,
        nipPenandatangan,
      });
      const url = URL.createObjectURL(doc.output("blob"));
      setPreview({ url, doc });
    } finally {
      setDownloading(null);
    }
  };

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {bulanOptions.length > 0 && (
            <select
              value={bulanDipilih}
              onChange={(e) => setBulanDipilih(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none"
            >
              <option value="">Semua Bulan</option>
              {bulanOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
          <div className="flex flex-wrap gap-2">
          <button
            onClick={previewPdf}
            disabled={downloading !== null || bulanFiltered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {downloading === "pdf" ? "Menyiapkan..." : "Preview PDF"}
          </button>
          <button
            onClick={downloadPdf}
            disabled={downloading !== null || bulanFiltered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading === "pdf" ? "Menyiapkan..." : "Download PDF"}
          </button>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-slate-800">
            {user?.role === "admin" ? "Data Pengisian RHK (Semua)" : "Data Pengisian RHK Saya"}
          </p>
          <span className="text-xs text-slate-400">{bulanFiltered.length} data ditampilkan</span>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Tanggal</th>
                <th className="px-5 py-3 font-medium">RHK</th>
                <th className="px-5 py-3 font-medium">Aktivitas / Kegiatan</th>
                <th className="px-5 py-3 font-medium">Hasil Tindak Lanjut</th>
                <th className="px-5 py-3 font-medium">FOTO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : bulanFiltered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                    Belum ada data pengisian RHK
                  </td>
                </tr>
              ) : (
                bulanFiltered.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-5 py-3">{r.tanggal_kegiatan}</td>
                    <td className="max-w-[120px] px-5 py-3">{r.pilih_rhk_text || "-"}</td>
                    <td className="max-w-[240px] px-5 py-3">{r.aktivitas_kegiatan || "-"}</td>
                    <td className="max-w-[200px] px-5 py-3">{r.hasil_tl || "-"}</td>
                    <td className="">
                      {r.url_foto ? (
                        <a href={storageUrl(BUCKET.FOTO_RHK, r.url_foto)} target="_blank" rel="noreferrer">
                          <img
                            src={storageUrl(BUCKET.FOTO_RHK, r.url_foto)}
                            alt="foto kegiatan"
                            className="h-40 w-60 object-center"
                          />
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {loading ? (
            <p className="px-5 py-6 text-center text-slate-400">Memuat data...</p>
          ) : bulanFiltered.length === 0 ? (
            <p className="px-5 py-6 text-center text-slate-400">Belum ada data pengisian RHK</p>
          ) : (
            bulanFiltered.map((r) => (
              <div key={r.id} className="p-4">
                {r.url_foto && (
                  <a href={storageUrl(BUCKET.FOTO_RHK, r.url_foto)} target="_blank" rel="noreferrer">
                    <img
                      src={storageUrl(BUCKET.FOTO_RHK, r.url_foto)}
                      alt="foto kegiatan"
                      className="mb-3 aspect-[4/3] w-full rounded-lg object-cover"
                    />
                  </a>
                )}
                <p className="text-xs font-medium text-slate-400">{r.tanggal_kegiatan}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{r.pilih_rhk_text || "-"}</p>
                <p className="mt-1 font-semibold text-slate-800">{r.aktivitas_kegiatan || "-"}</p>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-400">Hasil TL:</span> {r.hasil_tl || "-"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
              <h2 className="truncate font-semibold text-slate-800">Preview PDF - {pageTitle}</h2>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => preview.doc.save(`${fileName}.pdf`)}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Download PDF
                </button>
                <button
                  onClick={closePreview}
                  className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                >
                  Tutup
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe src={preview.url} title="Preview PDF" className="h-full w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}