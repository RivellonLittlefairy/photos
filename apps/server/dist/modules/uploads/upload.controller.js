import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import multer from "multer";
import { buildUploadFilename, replaceFilenameExtension, resolveLocalUploadPath, TMP_UPLOADS_DIR, toUploadUrl, UPLOADS_DIR } from "./upload.storage.js";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 20;
const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heif", "mif1", "msf1"]);
const ACCEPTED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/heif",
    "image/webp"
]);
async function readFileHeader(path, size = 64) {
    const handler = await fs.open(path, "r");
    try {
        const buffer = Buffer.alloc(size);
        const { bytesRead } = await handler.read(buffer, 0, size, 0);
        return buffer.subarray(0, bytesRead);
    }
    finally {
        await handler.close();
    }
}
function detectImageType(header) {
    if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
        return { mimeType: "image/jpeg", ext: ".jpg" };
    }
    if (header.length >= 8 &&
        header[0] === 0x89 &&
        header[1] === 0x50 &&
        header[2] === 0x4e &&
        header[3] === 0x47 &&
        header[4] === 0x0d &&
        header[5] === 0x0a &&
        header[6] === 0x1a &&
        header[7] === 0x0a) {
        return { mimeType: "image/png", ext: ".png" };
    }
    if (header.length >= 12 &&
        header.subarray(0, 4).toString("ascii") === "RIFF" &&
        header.subarray(8, 12).toString("ascii") === "WEBP") {
        return { mimeType: "image/webp", ext: ".webp" };
    }
    if (header.length >= 16 && header.subarray(4, 8).toString("ascii") === "ftyp") {
        const brand = header.subarray(8, 12).toString("ascii");
        if (HEIF_BRANDS.has(brand)) {
            if (brand.startsWith("heic") || brand.startsWith("heix") || brand.startsWith("hevc") || brand.startsWith("hevx")) {
                return { mimeType: "image/heic", ext: ".heic" };
            }
            return { mimeType: "image/heif", ext: ".heif" };
        }
    }
    return null;
}
async function removeFiles(paths) {
    await Promise.all(paths.map(async (path) => {
        try {
            await fs.unlink(path);
        }
        catch (error) {
            const code = error.code;
            if (code !== "ENOENT") {
                console.error(`Failed to remove file: ${path}`, error);
            }
        }
    }));
}
const upload = multer({
    storage: multer.diskStorage({
        destination: async (_req, _file, callback) => {
            try {
                await fs.mkdir(TMP_UPLOADS_DIR, { recursive: true });
                callback(null, TMP_UPLOADS_DIR);
            }
            catch (error) {
                callback(error, TMP_UPLOADS_DIR);
            }
        },
        filename: (_req, file, callback) => {
            callback(null, buildUploadFilename(file.originalname));
        }
    }),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            callback(new Error("仅支持图片文件"));
            return;
        }
        callback(null, true);
    }
});
const uploadMiddleware = upload.array("files", MAX_FILES);
function mapUploadError(error) {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return "单张图片不能超过 20MB";
        }
        if (error.code === "LIMIT_FILE_COUNT") {
            return "单次最多上传 20 张图片";
        }
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "图片上传失败";
}
export const uploadController = {
    parseFiles(req, res, next) {
        uploadMiddleware(req, res, (error) => {
            if (error) {
                res.status(400).json({
                    success: false,
                    message: mapUploadError(error)
                });
                return;
            }
            next();
        });
    },
    async upload(req, res) {
        const files = req.files ?? [];
        if (!files.length) {
            res.status(400).json({
                success: false,
                message: "请至少选择一张图片"
            });
            return;
        }
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        const tempPaths = files.map((file) => file.path);
        const validatedFiles = [];
        for (const file of files) {
            const header = await readFileHeader(file.path);
            const detected = detectImageType(header);
            if (!detected) {
                await removeFiles(tempPaths);
                res.status(400).json({
                    success: false,
                    message: `文件 ${file.originalname} 不是受支持的图片格式`
                });
                return;
            }
            if (!ACCEPTED_MIME_TYPES.has(detected.mimeType)) {
                await removeFiles(tempPaths);
                res.status(400).json({
                    success: false,
                    message: `文件 ${file.originalname} 格式不受支持`
                });
                return;
            }
            validatedFiles.push({ file, detected });
        }
        const movedPaths = [];
        try {
            const data = await Promise.all(validatedFiles.map(async ({ file, detected }) => {
                const nextFilename = replaceFilenameExtension(file.filename, detected.ext);
                const nextPath = resolve(UPLOADS_DIR, nextFilename);
                await fs.rename(file.path, nextPath);
                movedPaths.push(nextPath);
                return {
                    originalName: file.originalname,
                    filename: nextFilename,
                    mimeType: detected.mimeType,
                    size: file.size,
                    url: toUploadUrl(nextFilename)
                };
            }));
            res.status(201).json({
                success: true,
                data
            });
        }
        catch (error) {
            await removeFiles(tempPaths);
            await removeFiles(movedPaths);
            throw error;
        }
    },
    async remove(req, res) {
        const filename = req.params.filename;
        const localPath = resolveLocalUploadPath(toUploadUrl(filename));
        if (!localPath) {
            res.status(400).json({
                success: false,
                message: "Invalid filename"
            });
            return;
        }
        try {
            await fs.unlink(localPath);
            res.status(204).send();
        }
        catch (error) {
            const code = error.code;
            if (code === "ENOENT") {
                res.status(204).send();
                return;
            }
            throw error;
        }
    }
};
