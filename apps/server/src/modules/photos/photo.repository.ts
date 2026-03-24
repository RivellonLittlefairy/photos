import type { CreatePhotoInput, Photo } from "@timeline/shared";
import { isValidObjectId } from "mongoose";
import { PhotoModel } from "./photo.model.js";

interface CreatePhotoRecordInput extends CreatePhotoInput {
  contentHash?: string;
}

type PhotoLean = {
  _id: { toString(): string } | string;
  title?: string;
  description?: string;
  url: string;
  contentHash?: string;
  capturedAt: Date | string;
  stage?: string;
  tags: string[];
  privacy?: "private" | "family";
  createdAt: Date | string;
  updatedAt: Date | string;
};

const seedPhotos: CreatePhotoInput[] = [
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

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toPhoto(doc: PhotoLean): Photo {
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
  async seedIfEmpty(): Promise<void> {
    const count = await PhotoModel.countDocuments();
    if (count > 0) {
      return;
    }

    await PhotoModel.insertMany(
      seedPhotos.map((item) => ({
        ...item,
        capturedAt: new Date(item.capturedAt ?? new Date().toISOString())
      }))
    );
  },

  async list(): Promise<Photo[]> {
    const docs = await PhotoModel.find().sort({ capturedAt: -1 }).lean<PhotoLean[]>();
    return docs.map(toPhoto);
  },

  async getById(id: string): Promise<Photo | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    const doc = await PhotoModel.findById(id).lean<PhotoLean | null>();
    return doc ? toPhoto(doc) : null;
  },

  async findByContentHash(contentHash: string): Promise<Photo | null> {
    const doc = await PhotoModel.findOne({ contentHash }).lean<PhotoLean | null>();
    return doc ? toPhoto(doc) : null;
  },

  async findByUrl(url: string): Promise<Photo | null> {
    const doc = await PhotoModel.findOne({ url }).lean<PhotoLean | null>();
    return doc ? toPhoto(doc) : null;
  },

  async create(input: CreatePhotoRecordInput): Promise<Photo> {
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

    const plain = created.toObject() as PhotoLean;
    return toPhoto(plain);
  },

  async remove(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }

    const deleted = await PhotoModel.findByIdAndDelete(id).select({ _id: 1 }).lean();
    return Boolean(deleted);
  }
};
