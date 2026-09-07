export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const BULAN_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const BUCKET = {
  FOTO_RHK: "foto_rhk",
  FOTO_PROFILE: "foto_profile",
} as const;