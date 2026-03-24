import { z } from "zod";
import { photoService } from "./photo.service.js";
function isValidPhotoUrl(url) {
    if (/^\/uploads\/[a-zA-Z0-9._-]+$/.test(url)) {
        return true;
    }
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    }
    catch {
        return false;
    }
}
const photoQuerySchema = z.object({
    stage: z.string().min(1).optional(),
    tag: z.string().min(1).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    keyword: z.string().min(1).optional()
});
const createPhotoSchema = z.object({
    title: z.string().trim().max(60).optional(),
    description: z.string().optional(),
    url: z.string().min(1).refine(isValidPhotoUrl, { message: "Invalid photo url" }),
    capturedAt: z.string().datetime().optional(),
    stage: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
    privacy: z.enum(["private", "family"]).optional()
});
const timelineQuerySchema = z.object({
    granularity: z.enum(["year", "month", "week"]).optional()
});
export const photoController = {
    async list(req, res) {
        const query = photoQuerySchema.parse(req.query);
        const data = await photoService.list(query);
        res.json({ success: true, data });
    },
    async detail(req, res) {
        const id = req.params.id;
        const data = await photoService.getById(id);
        if (!data) {
            res.status(404).json({ success: false, message: "Photo not found" });
            return;
        }
        res.json({ success: true, data });
    },
    async create(req, res) {
        const payload = createPhotoSchema.parse(req.body);
        const data = await photoService.create(payload);
        res.status(201).json({ success: true, data });
    },
    async remove(req, res) {
        const id = req.params.id;
        const removed = await photoService.remove(id);
        if (!removed) {
            res.status(404).json({ success: false, message: "Photo not found" });
            return;
        }
        res.status(204).send();
    },
    async timeline(req, res) {
        const query = timelineQuerySchema.parse(req.query);
        const data = await photoService.timeline(query);
        res.json({ success: true, data });
    }
};
