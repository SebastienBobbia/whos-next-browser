/**
 * Chargement des Icônes image et de leur couleur dominante (IC-15, IC-16).
 *
 * Chaque image n'est lue et décodée qu'une seule fois : le résultat est mis en
 * cache et réutilisé par toutes les vues (PF-11, PF-12).
 */
import { dominantColorOf, SAMPLE_SIZE, TILE_DEFAULT } from "./color";
import { loadImage } from "./storage";

export { TILE_DEFAULT };

export type LoadedIcon = {
  /** data URL prête pour un <img> */
  url: string;
  /** couleur dominante assombrie, ou TILE_DEFAULT */
  color: string;
};

const cache = new Map<string, Promise<LoadedIcon | null>>();

/** Charge une Icône image enregistrée, ou null si elle est absente ou illisible (IC-13). */
export function loadIcon(id: string): Promise<LoadedIcon | null> {
  const hit = cache.get(id);
  if (hit) return hit;

  const task = (async (): Promise<LoadedIcon | null> => {
    try {
      const url = await loadImage(id);
      if (!url) return null;
      const image = await decode(url);
      return { url, color: dominantColor(image) };
    } catch {
      return null;
    }
  })();

  cache.set(id, task);
  return task;
}

/** Oublie une Icône du cache, après un remplacement ou une suppression. */
export function forgetIcon(id: string): void {
  cache.delete(id);
}

function decode(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image illisible"));
    image.src = url;
  });
}

/** Réduit l'image à 64x64 et calcule sa couleur dominante (IC-15). */
function dominantColor(image: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return TILE_DEFAULT;
  try {
    ctx.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return dominantColorOf(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data);
  } catch {
    return TILE_DEFAULT;
  }
}
