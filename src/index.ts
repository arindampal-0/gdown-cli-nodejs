import {
    getDriveService,
} from "./googleApi";
async function main() {
    logger.heading("[GDown]");
    const driveService = getDriveService();
}

if (require.main === module) {
    main().catch((err) => console.error(err));
}
