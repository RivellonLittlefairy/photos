import mongoose from "mongoose";
import { env } from "./env.js";
export async function connectDatabase() {
    await mongoose.connect(env.mongoUri, {
        dbName: env.mongoDbName
    });
    console.log(`MongoDB connected: ${env.mongoDbName}`);
}
export async function disconnectDatabase() {
    await mongoose.disconnect();
}
