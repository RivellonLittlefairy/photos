import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { resolveLocalUploadPath } from "./upload.storage.js";
function sha256File(path) {
    return new Promise((resolve, reject) => {
        const hash = createHash("sha256");
        const stream = createReadStream(path);
        stream.on("error", reject);
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
    });
}
export async function calculateUploadContentHash(url) {
    const localPath = resolveLocalUploadPath(url);
    if (!localPath) {
        return null;
    }
    try {
        return await sha256File(localPath);
    }
    catch {
        return null;
    }
}
