# google drive download automation (NodeJS)

## Setup

```shell
pnpm install
pnpm start

# (or)

npm install
npm start
```

Create a new project in [google cloud console](https://console.cloud.google.com/), enable the [google drive api](https://console.cloud.google.com/flows/enableapi?apiid=drive.googleapis.com) for your google cloud project.
Now create a service account under [credentials](https://console.cloud.google.com/apis/credentials) section. For this service account, create and download a new json key, name it `credentials.json` and put it in the root directory.

Sample `src/index.ts`, download individual file.

```typescript
import {
    downloadFile,
    getDriveService,
    getFileFromId,
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
}

main().catch((err) => console.error(err));

```

`src/index.ts`, download all files in folder.

```typescript
import {
    downloadFiles,
    getDriveService,
    listDirectory,
} from "./googleApi";
import logger from "./logger";

async function main() {
    logger.heading("[GDown]");

    const driveService = getDriveService();

    // folder
    // https://drive.google.com/drive/u/0/folders/1SVHxav6Y5LoYbdgfx2MSsdYlT74RTjej
    const folderId = "1SVHxav6Y5LoYbdgfx2MSsdYlT74RTje";
    const filesList = await listDirectory(folderId, driveService);
    if (filesList) {
        logger.print("filesList:", filesList);
        await downloadFiles(filesList);
    }
}

main().catch((err) => console.error(err));

```

## Todo

- [x] connect to google drive api
- [x] auth using service account
- [ ] auth using oauth
- [x] get file list from folder drive id
- [x] download a file
- [ ] download all files in a folder
- [ ] download a folder recursively
- [ ] create a cli application
- [ ] run on separate threads
