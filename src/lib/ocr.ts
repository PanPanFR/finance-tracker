import { createWorker } from "tesseract.js";

export async function scanReceipt(file: File): Promise<string> {
  const worker = await createWorker("eng+ind");
  const result = await worker.recognize(file);
  await worker.terminate();
  return result.data.text;
}
 