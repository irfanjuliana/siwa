export interface User {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  role: string;
  foto_url: string | null;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
