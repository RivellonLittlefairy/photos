import exifr from "exifr";
import { resolveLocalUploadPath } from "./upload.storage.js";
function toValidDate(value) {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
}
export async function extractCapturedAtFromUploadUrl(url) {
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
        }));
        if (!parsed) {
            return null;
        }
        const candidate = toValidDate(parsed.DateTimeOriginal) ??
            toValidDate(parsed.CreateDate) ??
            toValidDate(parsed.DateTimeDigitized) ??
            toValidDate(parsed.ModifyDate);
        return candidate ? candidate.toISOString() : null;
    }
    catch {
        return null;
    }
}
