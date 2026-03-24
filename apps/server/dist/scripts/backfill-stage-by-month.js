import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { PhotoModel } from "../modules/photos/photo.model.js";
import { formatStageByCapturedAt } from "../modules/photos/photo.service.js";
function needsBackfill(stage) {
    return !stage || !stage.trim();
}
async function run() {
    await connectDatabase();
    try {
        const rawDocs = await PhotoModel.find({}).select({ _id: 1, capturedAt: 1, stage: 1 }).lean();
        const docs = [];
        for (const doc of rawDocs) {
            const capturedAt = doc.capturedAt instanceof Date ? doc.capturedAt : new Date(String(doc.capturedAt ?? ""));
            if (Number.isNaN(capturedAt.getTime())) {
                continue;
            }
            docs.push({
                _id: String(doc._id),
                capturedAt,
                stage: typeof doc.stage === "string" ? doc.stage : null
            });
        }
        if (!docs.length) {
            console.log("没有照片数据，跳过回填。");
            return;
        }
        const ops = docs
            .filter((doc) => needsBackfill(doc.stage))
            .map((doc) => {
            const capturedAtIso = new Date(doc.capturedAt).toISOString();
            const stage = formatStageByCapturedAt(capturedAtIso);
            return {
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { stage } }
                }
            };
        });
        if (!ops.length) {
            console.log(`共 ${docs.length} 张照片，均已有分组，无需回填。`);
            return;
        }
        const result = await PhotoModel.bulkWrite(ops, { ordered: false });
        console.log(`分组回填完成：总照片 ${docs.length}，补齐 ${ops.length}，实际修改 ${result.modifiedCount}`);
    }
    finally {
        await disconnectDatabase();
    }
}
run().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`分组回填失败: ${message}`);
    process.exitCode = 1;
});
