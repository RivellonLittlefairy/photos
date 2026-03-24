import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { photoRepository } from "./modules/photos/photo.repository.js";
async function bootstrap() {
    await connectDatabase();
    if (env.seedOnStart) {
        await photoRepository.seedIfEmpty();
    }
    const app = createApp();
    app.listen(env.port, () => {
        console.log(`API server ready on http://localhost:${env.port}`);
    });
}
void bootstrap().catch(async (error) => {
    console.error("Failed to start server:", error);
    await disconnectDatabase();
    process.exit(1);
});
