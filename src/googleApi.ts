import { drive_v3, google } from "googleapis";

import chalk from "chalk";
import fs from "fs";
import { JSDOM } from "jsdom";
import type { Response } from "node-fetch";
import fetch from "node-fetch";
import path from "path";
import process from "process";
import ProgressBar from "progress";
import logger from "./logger";

/**
 * DFile or DriveFile
 *
 * It can be a file or a directory
 */
type DFile = {
    driveId: string;
    name: string;
    url?: string | null;
    mimeType: string;
    // size: number;
    isFolder: boolean;
    files?: DFile[];
};

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

export function getDriveService() {
    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: SCOPES,
    });

    return google.drive({ version: "v3", auth });
}

export async function listDirectory(
    folderId: string,
    driveService: drive_v3.Drive,
    filesOnly = true,
    includeSubdirectories = false,
    config: { pageSize?: number } = {}
) {
    const res = await driveService.files.list({
        pageSize: config.pageSize,
        fields: "nextPageToken, files(id, name, mimeType, webContentLink)",
        q: `"${folderId}" in parents`,
    });

    const files = res.data.files;

    if (!files) {
        logger.error("Request failed");
        return;
    }

    if (files.length === 0) {
        logger.error("Directory is Empty.");
        return [];
    }

    const fileList: DFile[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // console.log(
        //     `${index + 1} ${isFolder ? "📂" : "📝"}) ${file.name} ${file.id}`
        // );
        if (file.id && file.name && file.mimeType) {
            const isFolder =
                file.mimeType === "application/vnd.google-apps.folder";

            if (filesOnly && isFolder) {
                continue;
            }

            const subDirectoryFiles =
                isFolder && includeSubdirectories
                    ? await listDirectory(file.id, driveService, true)
                    : undefined;
            fileList.push({
                driveId: file.id,
                name: file.name,
                url: file.webContentLink,
                mimeType: file.mimeType,
                isFolder,
                files: subDirectoryFiles,
            });
        }
    }

    return fileList;
}

export async function getFileFromId(
    fileId: string,
    driveService: drive_v3.Drive
): Promise<DFile | undefined> {
    const file = await driveService.files.get({
        fileId: fileId,
        // alt: "media",
        fields: "id, name, mimeType, webContentLink",
    });

    const fileMetadata = file.data;

    if (
        fileMetadata.id &&
        fileMetadata.name &&
        fileMetadata.mimeType &&
        fileMetadata.webContentLink
    ) {
        return {
            driveId: fileMetadata.id,
            name: fileMetadata.name,
            url: fileMetadata.webContentLink,
            mimeType: fileMetadata.mimeType,
            isFolder: false,
        };
    }
}

export async function downloadFiles(files: DFile[], recursive = false) {
    if (recursive) {
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.isFolder) {
            continue;
        }

        await downloadFile(file);
        // break;
    }
}

export async function downloadFile(file: DFile) {
    console.log(`🔵 [Downloading] ${file.name}`);
    if (!file.url) {
        logger.error("File url undefined.");
        return;
    }

    // check the file type,
    // if html then the below code
    // or direct download

    const res = await fetch(file.url);
    // console.log(res.type);
    // console.log(res.headers.get("Content-Type"));
    // console.log(res.size);

    let downloadResponse: Response;
    if (res.headers.get("Content-Type")?.includes("text/html")) {
        const blob = await res.blob();
        // console.log("blob type: ", blob.type);

        const fileArrayBuffer = await blob.arrayBuffer();
        const dom = new JSDOM(Buffer.from(fileArrayBuffer));

        const form = dom.window.document.getElementById(
            "download-form"
        ) as HTMLFormElement | null;

        if (!form) {
            logger.error("There was no form element with download link.");
            return;
        }

        const url = form.action;
        logger.print(`download url: ${url}`);
        downloadResponse = await fetch(url, { method: "POST" });
    } else {
        logger.print(`download url: ${file.url}`);
        downloadResponse = res;
    }

    // console.log(downloadResponse.headers.get("Content-Type"));
    // return;

    // OLD METHOD (w/o download progress)
    // const downloadBlob = await downloadRes.blob();
    // logger.print(`blobType: ${downloadBlob.type}`);

    // if (!fs.existsSync(path.join(process.cwd(), "downloads"))) {
    //     fs.mkdirSync(path.join(process.cwd(), "downloads"), {
    //         recursive: true,
    //     });
    // }

    // const downloadFileArrayBuffer = await downloadBlob.arrayBuffer();
    // fs.createWriteStream(
    //     path.join(process.cwd(), `downloads/${file.name}`)
    // ).write(Buffer.from(downloadFileArrayBuffer));

    // NEW METHOD (w/ download progress)
    const contentLengthHeader = downloadResponse.headers.get("Content-Length");
    if (!contentLengthHeader) {
        return;
    }
    const contentLength = parseInt(contentLengthHeader, 10);
    logger.print(
        `Content Length: ${contentLength} (${(
            contentLength /
            (1024 * 1024)
        ).toFixed(2)} MB)`
    );
    const stream = downloadResponse.body;

    // progress bar initialization
    const bar = new ProgressBar("[:bar] | :percent", {
        total: contentLength,
        width: 50,
        complete: chalk.bgWhite(" "),
        incomplete: " ",
        callback: function () {
            // show terminal cursor
            process.stdout.write("\x1B[?25h");
        },
    });
    // hide terminal cursor
    process.stdout.write("\x1B[?251");

    // update the progress bar
    stream?.on("data", (chunk: Buffer) => {
        bar.tick(chunk.length);
    });

    // create download folder if not exists
    if (!fs.existsSync(path.join(process.cwd(), "downloads"))) {
        fs.mkdirSync(path.join(process.cwd(), "downloads"), {
            recursive: true,
        });
    }

    // create a file stream to the downloading file in filesystem
    const fileStream = fs.createWriteStream(
        path.join(process.cwd(), `downloads/${file.name}`)
    );

    // attach the file stream
    stream?.pipe(fileStream);

    try {
        await new Promise((resolve, reject) => {
            fileStream.on("finish", resolve);
            fileStream.on("error", reject);
        });

        logger.success(`[Downloaded] ${file.name}`);
    } catch (error: unknown) {
        logger.error(`[Download failed] ${file.name}`);
        logger.error((error as Error).message);
    }
}
