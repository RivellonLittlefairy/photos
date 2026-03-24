import "dotenv/config";
import { copyFile, mkdir, readdir, unlink } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import type { PhotoPrivacy } from "@timeline/shared";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { photoService } from "../modules/photos/photo.service.js";
import { buildUploadFilename, toUploadUrl, UPLOADS_DIR } from "../modules/uploads/upload.storage.js";

interface ImportOptions {
  directory: string;
  recursive: boolean;
  stage?: string;
  tags: string[];
  privacy: PhotoPrivacy;
  dryRun: boolean;
  useFilenameTitle: boolean;
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".tif", ".tiff"]);

function printHelp(): void {
  console.log(`
批量导入图片到时光档案

用法:
  npm run import:photos -w @timeline/server -- --dir /absolute/path/to/images

参数:
  --dir, -d <path>        要导入的目录（也支持直接传一个位置参数）
  --no-recursive          仅扫描当前目录（默认递归子目录）
  --stage <name>          导入后统一写入所属阶段/相册
  --tags <a,b,c>          导入后统一附加标签（逗号分隔）
  --privacy <private|family>  访问权限，默认 private
  --use-filename-title    使用文件名作为标题（默认标题留空）
  --dry-run               只扫描并预览，不写文件不入库
  --help, -h              显示帮助
`);
}

function parseTags(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeTitleFromFilename(filepath: string): string | undefined {
  const title = basename(filepath, extname(filepath)).trim();
  return title || undefined;
}

function parseArgs(argv: string[]): ImportOptions | null {
  let directory = "";
  let recursive = true;
  let stage: string | undefined;
  let tags: string[] = [];
  let privacy: PhotoPrivacy = "private";
  let dryRun = false;
  let useFilenameTitle = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      return null;
    }

    if (arg === "--dir" || arg === "-d") {
      directory = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--no-recursive") {
      recursive = false;
      continue;
    }

    if (arg === "--stage") {
      stage = argv[index + 1]?.trim() || undefined;
      index += 1;
      continue;
    }

    if (arg === "--tags") {
      tags = parseTags(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--privacy") {
      const value = argv[index + 1];
      if (value === "private" || value === "family") {
        privacy = value;
      } else {
        throw new Error("--privacy 只支持 private 或 family");
      }
      index += 1;
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--use-filename-title") {
      useFilenameTitle = true;
      continue;
    }

    if (!arg.startsWith("-") && !directory) {
      directory = arg;
      continue;
    }

    throw new Error(`未知参数: ${arg}`);
  }

  if (!directory) {
    throw new Error("请通过 --dir 指定要导入的目录");
  }

  return {
    directory: resolve(directory),
    recursive,
    stage,
    tags,
    privacy,
    dryRun,
    useFilenameTitle
  };
}

async function collectImageFiles(directory: string, recursive: boolean): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const filepath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...(await collectImageFiles(filepath, recursive)));
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(extension)) {
      files.push(filepath);
    }
  }

  return files;
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    return;
  }

  const sourceFiles = await collectImageFiles(options.directory, options.recursive);
  if (!sourceFiles.length) {
    console.log(`未找到可导入图片: ${options.directory}`);
    return;
  }

  console.log(`扫描到 ${sourceFiles.length} 张图片，目录: ${options.directory}`);

  if (options.dryRun) {
    for (const file of sourceFiles.slice(0, 20)) {
      console.log(`[dry-run] ${file}`);
    }
    if (sourceFiles.length > 20) {
      console.log(`[dry-run] ... 其余 ${sourceFiles.length - 20} 张省略`);
    }
    return;
  }

  await mkdir(UPLOADS_DIR, { recursive: true });
  await connectDatabase();

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const sourcePath of sourceFiles) {
      const uploadFilename = buildUploadFilename(basename(sourcePath));
      const targetPath = resolve(UPLOADS_DIR, uploadFilename);

      try {
        await copyFile(sourcePath, targetPath);
        const title = options.useFilenameTitle ? normalizeTitleFromFilename(sourcePath) : undefined;

        const created = await photoService.create({
          title,
          url: toUploadUrl(uploadFilename),
          stage: options.stage,
          tags: options.tags.length ? options.tags : undefined,
          privacy: options.privacy
        });

        imported += 1;
        console.log(`[${imported}/${sourceFiles.length}] imported: ${sourcePath} -> ${created.capturedAt}`);
      } catch (error) {
        await unlink(targetPath).catch(() => {
          // best effort cleanup
        });
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("重复图片")) {
          skipped += 1;
          console.log(`[skipped] ${sourcePath}: ${message}`);
        } else {
          failed += 1;
          console.error(`[failed] ${sourcePath}: ${message}`);
        }
      }
    }
  } finally {
    await disconnectDatabase();
  }

  console.log(`导入完成: 成功 ${imported}，跳过 ${skipped}，失败 ${failed}，总计 ${sourceFiles.length}`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`批量导入失败: ${message}`);
  process.exitCode = 1;
});
