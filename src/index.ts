import {
    downloadFile,
    downloadFiles,
    getDriveService,
    getFileFromId,
    listDirectory,
} from "./googleApi";
import logger from "./logger";

async function main() {
    logger.heading("[GDown]");
    const driveService = getDriveService();

    // file
    // https://drive.google.com/file/d/1NuuL9qNo5BJYnfNqN_lxBOUN0P-AociQ/view?usp=sharing
    const fileId = "1NuuL9qNo5BJYnfNqN_lxBOUN0P-AociQ";
    const file = await getFileFromId(fileId, driveService);
    if (file) {
        logger.print("file:", file);
        await downloadFile(file);
    }

    // folder
    // https://drive.google.com/drive/u/0/folders/1SVHxav6Y5LoYbdgfx2MSsdYlT74RTjej
    const folderId = "1SVHxav6Y5LoYbdgfx2MSsdYlT74RTjej";
    const filesList = await listDirectory(folderId, driveService);
    if (filesList) {
        logger.print("filesList:", filesList);
        await downloadFiles(filesList);
    }

    // const folderId = "1uLVsVHNfpc0mvGUO8Jigxm6hF_yz58KQ";
    // const folderId = "1P62OSd2XH1WZW4DVpaqxXg3rDFjnduRl";

    // Danmachi Season 1
    // const folderId = "1v-i58e5d-YA2TO1kTzv-lQqWQVj9Hl8f";
    // const fileList = await listDirectory(folderId, driveService, false, false);

    // if (fileList) {
    //     logger.print(fileList);
    //     // downloadFiles(fileList);
    // }

    // const file = await getFileFromId(
    //     // "1LpXWh8B0-4dsvZM65MUMj63AImnCLnp6", // index.html
    //     // "1izHpqVPgCeSdplBPzyJZv0yZWCgzEQWB", // 65 MB
    //     "1Irkhu3vwpw44D87BmJaJsRbWAa2BxtJZ", // 236 MB
    //     driveService
    // );

    // if (file) {
    //     // logger.print(file);
    //     // await downloadFile(file);
    // }
}

main().catch((err) => console.error(err));
