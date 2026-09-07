export interface User {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  role: string;
  foto_url: string | null;
  created_at: string;
}

export interface Rhk {
  id: string;
  nomor: number;
  nama_rhk: string;
  keterangan?: string | null;
  rhk_aktivitas: { id: string; nama: string }[];
  rhk_hasil: { id: string; nama: string }[];
}

export interface Pengisian {
  id: string;
  user_id: string;
  tanggal_kegiatan: string;
  waktu_kegiatan: string;
  pilih_rhk_id: string | null;
  pilih_rhk_text: string | null;
  aktivitas_id: string | null;
  aktivitas_kegiatan: string | null;
  hasil_tl: string | null;
  url_foto: string | null;
  created_at: string;
  users?: { id: string; nip: string; nama: string } | null;
}
