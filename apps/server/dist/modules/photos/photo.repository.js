import { isValidObjectId } from "mongoose";
import { PhotoModel } from "./photo.model.js";
const seedPhotos = [
    {
        title: "毕业旅行",
        description: "和朋友在青海湖骑行",
        url: "https://images.unsplash.com/photo-1682687220499-d9c06b872eee?auto=format&fit=crop&w=1200&q=80",
        capturedAt: "2021-07-17T08:00:00.000Z",
        stage: "大学",
        tags: ["旅行", "朋友"],
        privacy: "private"
    },
    {
        title: "第一份工作",
        description: "入职当天在工位拍下的照片",
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
        capturedAt: "2022-11-03T01:30:00.000Z",
        stage: "职场初期",
        tags: ["工作", "里程碑"],
        privacy: "private"
    },
    {
        title: "周末露营",
        description: "第一次自己搭帐篷",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
        capturedAt: "2024-05-01T14:30:00.000Z",
        stage: "生活",
        tags: ["户外", "露营"],
        privacy: "private"
    }
];
function toIso(value) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
function toPhoto(doc) {
    return {
        id: typeof doc._id === "string" ? doc._id : doc._id.toString(),
        title: doc.title ?? "",
        description: doc.description,
        url: doc.url,
        capturedAt: toIso(doc.capturedAt),
        stage: doc.stage,
        tags: doc.tags ?? [],
        privacy: doc.privacy ?? "private",
        createdAt: toIso(doc.createdAt),
        updatedAt: toIso(doc.updatedAt)
    };
}
export const photoRepository = {
    async seedIfEmpty() {
        const count = await PhotoModel.countDocuments();
        if (count > 0) {
            return;
        }
        await PhotoModel.insertMany(seedPhotos.map((item) => ({
            ...item,
            capturedAt: new Date(item.capturedAt ?? new Date().toISOString())
        })));
    },
    async list() {
        const docs = await PhotoModel.find().sort({ capturedAt: -1 }).lean();
        return docs.map(toPhoto);
    },
    async getById(id) {
        if (!isValidObjectId(id)) {
            return null;
        }
        const doc = await PhotoModel.findById(id).lean();
        return doc ? toPhoto(doc) : null;
    },
    async findByContentHash(contentHash) {
        const doc = await PhotoModel.findOne({ contentHash }).lean();
        return doc ? toPhoto(doc) : null;
    },
    async findByUrl(url) {
        const doc = await PhotoModel.findOne({ url }).lean();
        return doc ? toPhoto(doc) : null;
    },
    async create(input) {
        const capturedAt = input.capturedAt ?? new Date().toISOString();
        const normalizedTitle = input.title?.trim() ?? "";
        const created = await PhotoModel.create({
            title: normalizedTitle,
            description: input.description,
            url: input.url,
            contentHash: input.contentHash,
            capturedAt: new Date(capturedAt),
            stage: input.stage,
            tags: input.tags ?? [],
            privacy: input.privacy ?? "private"
        });
        const plain = created.toObject();
        return toPhoto(plain);
    },
    async remove(id) {
        if (!isValidObjectId(id)) {
            return false;
        }
        const deleted = await PhotoModel.findByIdAndDelete(id).select({ _id: 1 }).lean();
        return Boolean(deleted);
    }
};
