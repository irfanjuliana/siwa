-- Add keterangan column to rhk and populate descriptions
alter table public.rhk
  add column if not exists keterangan text;

update public.rhk set keterangan = 'Rencana kegiatan pembinaan penghuni asrama dan tata tertib asrama yang sesuai dengan ketentuan'
  where nama_rhk = 'RHK 1';
update public.rhk set keterangan = 'Pemeliharaan fasilitas asrama yang sesuai dengan ketentuan'
  where nama_rhk = 'RHK 2';
update public.rhk set keterangan = 'Laporan pembinaan penghuni asrama berupa kegiatan keagamaan dan keterampilan hidup'
  where nama_rhk = 'RHK 3';
update public.rhk set keterangan = 'Laporan penerapan disiplin dan pelaksanaan tata tertib asrama yang sesuai ketentuan'
  where nama_rhk = 'RHK 4';
update public.rhk set keterangan = 'Pelaksanaan tugas dan kewajiban wali asrama kepada Kepala Sekolah secara lengkap dan tepat'
  where nama_rhk = 'RHK 5';
update public.rhk set keterangan = 'Koordinasi dengan koordinator asrama (peserta didik yang diberi tanggung jawab secara berkala)'
  where nama_rhk = 'RHK 6';
