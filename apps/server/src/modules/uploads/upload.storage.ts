import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

export const UPLOADS_PUBLIC_PATH = "/uploads";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = resolve(__dirname, "../../../uploads");
export const TMP_UPLOADS_DIR = resolve(__dirname, "../../../tmp-uploads");

function safeExtname(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  if (!ext || ext.length > 8) {
    return ".jpg";
  }
  return ext;
}

export function buildUploadFilename(originalName: string): string {
  return `${Date.now()}-${randomUUID()}${safeExtname(originalName)}`;
}

export function replaceFilenameExtension(filename: string, nextExt: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) {
    return `${filename}${nextExt}`;
  }
  return `${filename.slice(0, dotIndex)}${nextExt}`;
}

export function toUploadUrl(filename: string): string {
  return `${UPLOADS_PUBLIC_PATH}/${filename}`;
}

export function resolveLocalUploadPath(url: string): string | null {
  if (!url.startsWith(`${UPLOADS_PUBLIC_PATH}/`)) {
    return null;
  }

  const filename = url.slice(UPLOADS_PUBLIC_PATH.length + 1);
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return null;
  }

  return resolve(UPLOADS_DIR, filename);
}
