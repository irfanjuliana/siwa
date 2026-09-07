import { Pengisian } from "../types";
import { BUCKET } from "../constants";
import { storageUrl } from "../lib/supabase";

export const toDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const collectPhotos = async (
  entries: Pengisian[],
): Promise<(string | null)[]> => {
  const result: (string | null)[] = [];
  for (const r of entries) {
    result.push(
      r.url_foto ? await toDataUrl(storageUrl(BUCKET.FOTO_RHK, r.url_foto)) : null,
    );
  }
  return result;
};