import { PendahuluanSection } from "./types";
import { PENDAHULUAN } from "./default";
import { PENDAHULUAN_RHK1 } from "./rhk1";
import { PENDAHULUAN_RHK2 } from "./rhk2";
import { PENDAHULUAN_RHK3 } from "./rhk3";
import { PENDAHULUAN_RHK4 } from "./rhk4";
import { PENDAHULUAN_RHK5 } from "./rhk5";
import { PENDAHULUAN_RHK6 } from "./rhk6";

export function getPendahuluan(nomor?: number): PendahuluanSection[] {
  if (nomor === 1) return PENDAHULUAN_RHK1;
  if (nomor === 2) return PENDAHULUAN_RHK2;
  if (nomor === 3) return PENDAHULUAN_RHK3;
  if (nomor === 4) return PENDAHULUAN_RHK4;
  if (nomor === 5) return PENDAHULUAN_RHK5;
  if (nomor === 6) return PENDAHULUAN_RHK6;
  return PENDAHULUAN;
}