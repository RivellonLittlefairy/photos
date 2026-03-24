import exifr from "exifr";
import { resolveLocalUploadPath } from "./upload.storage.js";

interface ExifResult {
  DateTimeOriginal?: Date | string;
  CreateDate?: Date | string;
  ModifyDate?: Date | string;
  DateTimeDigitized?: Date | string;
}

function toValidDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export async function extractCapturedAtFromUploadUrl(url: string): Promise<string | null> {
  const localPath = resolveLocalUploadPath(url);
  if (!localPath) {
    return null;
  }

  try {
    const parsed = (await exifr.parse(localPath, {
      tiff: true,
      exif: true,
      gps: false,
      xmp: false,
      icc: false
    })) as ExifResult | null;

    if (!parsed) {
      return null;
    }

    const candidate =
      toValidDate(parsed.DateTimeOriginal) ??
      toValidDate(parsed.CreateDate) ??
      toValidDate(parsed.DateTimeDigitized) ??
      toValidDate(parsed.ModifyDate);

    return candidate ? candidate.toISOString() : null;
  } catch {
    return null;
  }
}
