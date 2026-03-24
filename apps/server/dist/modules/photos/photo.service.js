import { unlink } from "node:fs/promises";
import { photoRepository } from "./photo.repository.js";
import { extractCapturedAtFromUploadUrl } from "../uploads/upload.exif.js";
import { calculateUploadContentHash } from "../uploads/upload.hash.js";
import { resolveLocalUploadPath } from "../uploads/upload.storage.js";
import { HttpError } from "../../utils/httpError.js";
export function formatStageByCapturedAt(capturedAt) {
    const date = new Date(capturedAt);
    if (Number.isNaN(date.getTime())) {
        return "未知月份";
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${year}.${month}`;
}
function startOfBucket(date, granularity) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    if (granularity === "year") {
        start.setUTCMonth(0, 1);
    }
    if (granularity === "month") {
        start.setUTCDate(1);
    }
    if (granularity === "week") {
        const weekday = (start.getUTCDay() + 6) % 7;
        start.setUTCDate(start.getUTCDate() - weekday);
    }
    return start;
}
function endOfBucket(start, granularity) {
    const end = new Date(start);
    if (granularity === "year") {
        end.setUTCFullYear(end.getUTCFullYear() + 1);
    }
    if (granularity === "month") {
        end.setUTCMonth(end.getUTCMonth() + 1);
    }
    if (granularity === "week") {
        end.setUTCDate(end.getUTCDate() + 7);
    }
    end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
    return end;
}
function formatLabel(start, granularity) {
    const yyyy = start.getUTCFullYear();
    const mm = String(start.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(start.getUTCDate()).padStart(2, "0");
    if (granularity === "year") {
        return `${yyyy}`;
    }
    if (granularity === "month") {
        return `${yyyy}-${mm}`;
    }
    return `${yyyy}-${mm}-${dd} 周`;
}
function filterPhotos(photos, query) {
    return photos.filter((photo) => {
        if (query.stage && photo.stage !== query.stage) {
            return false;
        }
        if (query.tag && !photo.tags.includes(query.tag)) {
            return false;
        }
        if (query.from && new Date(photo.capturedAt) < new Date(query.from)) {
            return false;
        }
        if (query.to && new Date(photo.capturedAt) > new Date(query.to)) {
            return false;
        }
        if (query.keyword) {
            const haystack = `${photo.title} ${photo.description ?? ""} ${photo.tags.join(" ")}`.toLowerCase();
            if (!haystack.includes(query.keyword.toLowerCase())) {
                return false;
            }
        }
        return true;
    });
}
export const photoService = {
    async list(query) {
        const photos = await photoRepository.list();
        return filterPhotos(photos, query);
    },
    getById(id) {
        return photoRepository.getById(id);
    },
    async create(input) {
        const capturedAt = input.capturedAt ??
            (await extractCapturedAtFromUploadUrl(input.url)) ??
            new Date().toISOString();
        const stage = input.stage?.trim() ? input.stage.trim() : formatStageByCapturedAt(capturedAt);
        const contentHash = await calculateUploadContentHash(input.url);
        if (contentHash) {
            const existed = await photoRepository.findByContentHash(contentHash);
            if (existed) {
                throw new HttpError(409, "重复图片：该照片已存在");
            }
        }
        else {
            const existed = await photoRepository.findByUrl(input.url);
            if (existed) {
                throw new HttpError(409, "重复图片：该照片已存在");
            }
        }
        try {
            return await photoRepository.create({
                ...input,
                capturedAt,
                stage,
                contentHash: contentHash ?? undefined
            });
        }
        catch (error) {
            const code = error.code;
            if (code === 11000) {
                throw new HttpError(409, "重复图片：该照片已存在");
            }
            throw error;
        }
    },
    async remove(id) {
        const existing = await photoRepository.getById(id);
        if (!existing) {
            return false;
        }
        const removed = await photoRepository.remove(id);
        if (!removed) {
            return false;
        }
        const localPath = resolveLocalUploadPath(existing.url);
        if (localPath) {
            try {
                await unlink(localPath);
            }
            catch (error) {
                const code = error.code;
                if (code !== "ENOENT") {
                    console.error(`Failed to delete upload file: ${localPath}`, error);
                }
            }
        }
        return true;
    },
    async timeline(query) {
        const granularity = query.granularity ?? "month";
        const photos = await photoRepository.list();
        const buckets = new Map();
        for (const photo of photos) {
            const start = startOfBucket(new Date(photo.capturedAt), granularity);
            const end = endOfBucket(start, granularity);
            const key = start.toISOString();
            const existing = buckets.get(key);
            if (existing) {
                existing.photos.push(photo);
                existing.count += 1;
            }
            else {
                buckets.set(key, {
                    key,
                    label: formatLabel(start, granularity),
                    startAt: start.toISOString(),
                    endAt: end.toISOString(),
                    count: 1,
                    photos: [photo]
                });
            }
        }
        return Array.from(buckets.values()).sort((a, b) => {
            return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
        });
    }
};
