import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { PhotoModel } from "../modules/photos/photo.model.js";
import { calculateUploadContentHash } from "../modules/uploads/upload.hash.js";
async function run() {
    await connectDatabase();
    try {
        const rawDocs = await PhotoModel.find({})
            .select({ _id: 1, url: 1, contentHash: 1 })
            .lean();
        const docs = rawDocs.map((doc) => ({
            _id: String(doc._id),
            url: String(doc.url ?? ""),
            contentHash: typeof doc.contentHash === "string" ? doc.contentHash : undefined
        }));
        const hashOwner = new Map();
        for (const doc of docs) {
            if (doc.contentHash) {
                hashOwner.set(doc.contentHash, doc._id);
            }
        }
        let missing = 0;
        let patched = 0;
        let duplicates = 0;
        const ops = [];
        for (const doc of docs) {
            if (doc.contentHash) {
                continue;
            }
            missing += 1;
            const hash = await calculateUploadContentHash(doc.url);
            if (!hash) {
                continue;
            }
            const owner = hashOwner.get(hash);
            if (owner && owner !== doc._id) {
                duplicates += 1;
                continue;
            }
            hashOwner.set(hash, doc._id);
            ops.push({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { contentHash: hash } }
                }
            });
        }
        if (ops.length) {
            const result = await PhotoModel.bulkWrite(ops, { ordered: false });
            patched = result.modifiedCount;
        }
        console.log(`Hash 回填完成：总数 ${docs.length}，待补 ${missing}，已补 ${patched}，疑似重复 ${duplicates}`);
    }
    finally {
        await disconnectDatabase();
    }
}
run().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Hash 回填失败: ${message}`);
    process.exitCode = 1;
});
