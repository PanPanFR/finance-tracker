import { createWorker } from "tesseract.js";

type ScanOptions = {
  language?: string; // e.g., "eng+ind"
  enhance?: boolean; // apply image preprocessing
};

async function preprocessImage(file: File): Promise<Blob> {
  // Simple on-client enhancement: upscale, grayscale, increase contrast, threshold
  const imgBitmap = await createImageBitmap(file);
  const scale = imgBitmap.width < 1200 ? 2 : 1; // upscale small receipts
  const canvas = document.createElement("canvas");
  canvas.width = imgBitmap.width * scale;
  canvas.height = imgBitmap.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  // Grayscale + contrast + simple threshold
  const contrast = 1.2; // 20% contrast boost
  const threshold = 180; // binarize threshold
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // luminosity
    let v = 0.299 * r + 0.587 * g + 0.114 * b;
    // contrast around 128
    v = (v - 128) * contrast + 128;
    // clamp
    v = Math.max(0, Math.min(255, v));
    // threshold
    const t = v > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = t;
    // keep alpha
  }
  ctx.putImageData(imageData, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 1));
  if (!blob) return file;
  return blob;
}

export async function scanReceipt(file: File, options: ScanOptions = {}): Promise<string> {
  const lang = options.language || "eng+ind";
  // Track the worker handle so partially-initialized workers still get terminated
  // if setParameters/recognize throw (prevents WASM worker leaks on error paths).
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    // Use Tesseract v6 API: pass language directly; do not pass functions via options
    worker = await createWorker(lang);

    // Guide OCR towards receipt text (PSM 6 = SINGLE_BLOCK)
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-/:,.@()%+ ",
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: "6",
    } as Record<string, string>);

    const image = options.enhance ? await preprocessImage(file) : file;

    let result = await worker.recognize(image, { rotateAuto: true } as Record<string, boolean>);

    // If confidence is low, try a different PSM (3 = AUTO) for multi-column receipts
    if ((result?.data?.confidence || 0) < 65) {
      await worker.setParameters({ tessedit_pageseg_mode: "3" } as Record<string, string>);
      result = await worker.recognize(image, { rotateAuto: true } as Record<string, boolean>);
    }

    return result?.data?.text || "";
  } finally {
    if (worker) await worker.terminate().catch(() => {});
  }
}
 