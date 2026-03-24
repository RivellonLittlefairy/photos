import { Router } from "express";
import { photoController } from "../modules/photos/photo.controller.js";
import { uploadController } from "../modules/uploads/upload.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const apiRouter = Router();

apiRouter.get("/photos", asyncHandler(photoController.list));
apiRouter.get("/photos/:id", asyncHandler(photoController.detail));
apiRouter.post("/photos", asyncHandler(photoController.create));
apiRouter.delete("/photos/:id", asyncHandler(photoController.remove));
apiRouter.get("/timeline", asyncHandler(photoController.timeline));
apiRouter.post("/uploads", uploadController.parseFiles, asyncHandler(uploadController.upload));
apiRouter.delete("/uploads/:filename", asyncHandler(uploadController.remove));
