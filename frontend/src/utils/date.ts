import { BULAN_NAMES } from "../constants";

interface DateParts {
  y: number;
  m: number;
  d: number;
}

const todayParts = (): DateParts => {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
};

const lastEntryDate = (dates: string[]): DateParts | null => {
  const latest = dates.filter(Boolean).sort().pop();
  if (!latest) return null;
  const [y, m, d] = latest.split("-").map(Number);
  return { y, m: m - 1, d };
};

export const formatBulanLaporan = (dates: string[]): string => {
  const t = lastEntryDate(dates) ?? todayParts();
  return `BULAN ${BULAN_NAMES[t.m].toUpperCase()} ${t.y}`;
};

export const formatTanggalPenutup = (dates: string[]): string => {
  const t = lastEntryDate(dates) ?? todayParts();
  return `${t.d} ${BULAN_NAMES[t.m]} ${t.y}`;
};