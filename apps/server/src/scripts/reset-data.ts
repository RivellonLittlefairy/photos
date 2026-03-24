import "dotenv/config";
import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { PhotoModel } from "../modules/photos/photo.model.js";
import { TMP_UPLOADS_DIR, UPLOADS_DIR } from "../modules/uploads/upload.storage.js";

async function clearDirectory(dir: string): Promise<number> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  let count = 0;

  for (const entry of entries) {
    const filepath = resolve(dir, entry.name);
    await rm(filepath, { recursive: true, force: true });
    count += 1;
  }

  return count;
}

async function run(): Promise<void> {
  await connectDatabase();

  try {
    const result = await PhotoModel.deleteMany({});
    const uploadsCleared = await clearDirectory(UPLOADS_DIR);
    const tmpCleared = await clearDirectory(TMP_UPLOADS_DIR);

    console.log(`已删除数据库照片记录: ${result.deletedCount ?? 0}`);
    console.log(`已清理 uploads 目录文件/子目录: ${uploadsCleared}`);
    console.log(`已清理 tmp-uploads 目录文件/子目录: ${tmpCleared}`);
  } finally {
    await disconnectDatabase();
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`重置数据失败: ${message}`);
  process.exitCode = 1;
});
