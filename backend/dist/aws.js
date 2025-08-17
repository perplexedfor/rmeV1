"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToS3 = exports.copyS3Folder = exports.fetchS3Folder = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const s3 = new client_s3_1.S3Client({ region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "" // Replace with your secret
    } });
//fetch stored objects from s3
const fetchS3Folder = async (key, localPath) => {
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: key
    });
    try {
        const data = await s3.send(command);
        if (data.Contents) {
            await Promise.all(data.Contents.map(async (file) => {
                const fileKey = file.Key;
                if (fileKey) {
                    const getObjectParams = {
                        Bucket: process.env.S3_BUCKET,
                        Key: fileKey
                    };
                    const data = await s3.send(new client_s3_1.GetObjectCommand(getObjectParams));
                    if (data.Body) {
                        const byteArray = await data.Body.transformToByteArray();
                        const filePath = `${localPath}${fileKey.replace(key, "")}`;
                        await writeFile(filePath, byteArray);
                        console.log(`Downloaded ${fileKey} to ${filePath}`);
                    }
                }
            }));
        }
        else {
            throw new Error("No data found");
        }
    }
    catch (error) {
        console.error("Error fetching folder:", error);
    }
};
exports.fetchS3Folder = fetchS3Folder;
//this will run before the another task okay then let's see what will happen 
//copy stored objects from one folder to another in s3
const copyS3Folder = async (sourcePrefix, destinationPrefix, continuationToken) => {
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: sourcePrefix,
        ContinuationToken: continuationToken
    });
    try {
        const data = await s3.send(command);
        if (data.Contents) {
            for (const item of data.Contents) {
                if (item.Key) {
                    //we would copy object one by one okay and the things would end okay then we are done
                    const copyCommand = new client_s3_1.CopyObjectCommand({
                        Bucket: process.env.S3_BUCKET,
                        CopySource: `${process.env.S3_BUCKET}/${item.Key}`,
                        Key: item.Key.replace(sourcePrefix, destinationPrefix)
                    });
                    await s3.send(copyCommand);
                }
            }
        }
        if (data.IsTruncated) {
            await (0, exports.copyS3Folder)(sourcePrefix, destinationPrefix, data.NextContinuationToken);
        }
    }
    catch (error) {
        console.error("Error copying folder:", error);
    }
};
exports.copyS3Folder = copyS3Folder;
//after fetching writing it locally to s3 is the case okkay
async function createFolder(folderPath) {
    try {
        // The `recursive: true` option ensures that all parent directories are created
        // and it doesn't throw an error if the directory already exists.
        await promises_1.default.mkdir(folderPath, { recursive: true });
    }
    catch (error) {
        console.error("Error creating folder:", error);
        throw error;
    }
}
async function writeFile(filePath, fileData) {
    try {
        // Check if the provided path is a directory path itself.
        if (filePath.endsWith(path_1.default.sep)) {
            await createFolder(filePath);
            return; // Exit after creating the directory.
        }
        // If it's a file path, create its parent directory.
        await createFolder(path_1.default.dirname(filePath));
        // Now, write the file.
        await promises_1.default.writeFile(filePath, fileData);
    }
    catch (error) {
        console.error("Error writing file:", error);
        throw error;
    }
}
const saveToS3 = async (key, filePath, content) => {
    const params = {
        Bucket: process.env.S3_BUCKET ?? "",
        Key: `${key}${filePath}`,
        Body: content
    };
    try {
        await s3.send(new client_s3_1.PutObjectCommand(params));
    }
    catch (error) {
        console.error("Error saving to S3:", error);
    }
};
exports.saveToS3 = saveToS3;
//# sourceMappingURL=aws.js.map