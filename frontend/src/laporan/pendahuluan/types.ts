export interface TabelSection {
  header: string[];
  rows: string[][];
}

export interface PendahuluanSection {
  bab?: string;
  judul: string;
  paragraf?: string[];
  daftar?: string[];
  tabel?: TabelSection;
  babBaru?: boolean;
  paragrafSetelah?: string[];
}