/**
 * Préparation d'une image choisie comme Icône, avant son enregistrement.
 *
 * Aucune vérification de format (IC-13) : un fichier illisible est enregistré
 * tel quel, et le Membre s'affichera sans image. Une grande image est réduite
 * pour ne pas alourdir le stockage ni le Fichier d'Équipe (IC-17).
 */

/** Plus grand côté conservé : une Tuile seule dans un panneau haut, sur un écran à 150 %. */
const MAX_SIDE = 512;

/** Lit le fichier choisi et le rend sous forme de data URL prête à enregistrer. */
export async function prepareImage(file: Blob): Promise<string> {
  if (file.type === "image/svg+xml") return prepareSvg(file);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return readAsDataUrl(file);
  }
  try {
    const scale = MAX_SIDE / Math.max(bitmap.width, bitmap.height);
    if (scale >= 1) return readAsDataUrl(file);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return readAsDataUrl(file);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // WebP garde la transparence et pèse bien moins qu'un PNG pour une photo.
    return canvas.toDataURL("image/webp", 0.9);
  } finally {
    bitmap.close();
  }
}

/**
 * Un SVG reste vectoriel, donc net à toute taille. Firefox refuse de dessiner
 * dans un canvas un SVG sans largeur ni hauteur, ce qui empêcherait le calcul
 * de la couleur dominante (IC-14) : on les déduit du viewBox quand elles manquent.
 */
async function prepareSvg(file: Blob): Promise<string> {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const root = doc.documentElement;
  if (root.nodeName !== "svg") return readAsDataUrl(file);

  const box = (root.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  if (box.length === 4 && box[2]! > 0 && box[3]! > 0) {
    if (!root.hasAttribute("width")) root.setAttribute("width", String(box[2]));
    if (!root.hasAttribute("height")) root.setAttribute("height", String(box[3]));
  }
  const svg = new XMLSerializer().serializeToString(doc);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("lecture impossible"));
    reader.readAsDataURL(file);
  });
}
