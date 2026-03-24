import cors from "cors";
import express from "express";
import morgan from "morgan";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { UPLOADS_DIR, UPLOADS_PUBLIC_PATH } from "./modules/uploads/upload.storage.js";
import { apiRouter } from "./routes/index.js";
import { HttpError } from "./utils/httpError.js";
export function createApp() {
    const app = express();
    app.use(cors({
        origin: env.corsOrigin
    }));
    app.use(express.json());
    app.use(morgan("dev"));
    app.use(UPLOADS_PUBLIC_PATH, express.static(UPLOADS_DIR));
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.use("/api", apiRouter);
    app.use((error, _req, res, _next) => {
        if (error instanceof ZodError) {
            res.status(400).json({
                success: false,
                message: "Invalid request payload",
                details: error.issues
            });
            return;
        }
        if (error instanceof HttpError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
            return;
        }
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    });
    return app;
}
