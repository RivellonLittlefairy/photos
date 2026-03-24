import type {
  ApiResponse,
  CreatePhotoInput,
  Photo,
  PhotoListQuery,
  TimelineGranularity,
  TimelineGroup
} from "@timeline/shared";
import { API_BASE, request } from "./client";

function toSearchParams(query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }
  const raw = params.toString();
  return raw ? `?${raw}` : "";
}

export function fetchPhotos(query: PhotoListQuery = {}): Promise<Photo[]> {
  return request<Photo[]>(
    `/photos${toSearchParams({
      stage: query.stage,
      tag: query.tag,
      from: query.from,
      to: query.to,
      keyword: query.keyword
    })}`
  );
}

export function createPhoto(payload: CreatePhotoInput): Promise<Photo> {
  return request<Photo>("/photos", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchPhotoById(id: string): Promise<Photo> {
  return request<Photo>(`/photos/${id}`);
}

export function deletePhoto(id: string): Promise<void> {
  return request<void>(`/photos/${id}`, {
    method: "DELETE"
  });
}

export function fetchTimeline(granularity: TimelineGranularity): Promise<TimelineGroup[]> {
  return request<TimelineGroup[]>(`/timeline${toSearchParams({ granularity })}`);
}

export interface UploadedPhotoFile {
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export async function uploadPhotoFiles(files: File[]): Promise<UploadedPhotoFile[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    let message = `Upload failed: ${response.status}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // no-op
    }

    throw new Error(message);
  }

  const json = (await response.json()) as ApiResponse<UploadedPhotoFile[]>;
  return json.data;
}

export function removeUploadedFile(filename: string): Promise<void> {
  return request<void>(`/uploads/${encodeURIComponent(filename)}`, {
    method: "DELETE"
  });
}
