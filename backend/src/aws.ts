import { S3Client, ListObjectsV2Command, GetObjectCommand, CopyObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

import env from "dotenv";
env.config();

const s3 = new S3Client({region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",       // Replace with your key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "" // Replace with your secret
}});


//fetch stored objects from s3
export const fetchS3Folder = async (key:string,localPath:string): Promise<void> => {
    const command = new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: key
    });

    try {
        const data = await s3.send(command);
        if (data.Contents) {
            await Promise.all(data.Contents.map(async (file) => {

                const fileKey = file.Key;

                if(fileKey){
                    const getObjectParams = {
                        Bucket: process.env.S3_BUCKET,
                        Key: fileKey
                    };

                    const data = await s3.send(new GetObjectCommand(getObjectParams));

                    if(data.Body){
                        const byteArray = await data.Body.transformToByteArray();
                        const filePath = `${localPath}${fileKey.replace(key, "")}`;

                        await writeFile(filePath,byteArray);

                        console.log(`Downloaded ${fileKey} to ${filePath}`);
                    }
                }
            }))
        }else{
            throw new Error("No data found");
        }
    } catch (error) {
        console.error("Error fetching folder:", error);
    }
}

//this will run before the another task okay then let's see what will happen 
//copy stored objects from one folder to another in s3
export const copyS3Folder = async (sourcePrefix:string,destinationPrefix:string,continuationToken?:string): Promise<void> => {
    const command = new ListObjectsV2Command({
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
                    const copyCommand = new CopyObjectCommand({
                        Bucket: process.env.S3_BUCKET,
                        CopySource: `${process.env.S3_BUCKET}/${item.Key}`,
                        Key: item.Key.replace(sourcePrefix, destinationPrefix)
                    });
                    await s3.send(copyCommand);
                }
            }
        }
        if (data.IsTruncated) {
            await copyS3Folder(sourcePrefix, destinationPrefix, data.NextContinuationToken);
        }
    } catch (error) {
        console.error("Error copying folder:", error);
    }
}

//after fetching writing it locally to s3 is the case okkay
async function createFolder(folderPath: string): Promise<void> {
    try {
        // The `recursive: true` option ensures that all parent directories are created
        // and it doesn't throw an error if the directory already exists.
        await fs.mkdir(folderPath, { recursive: true });
    } catch (error) {
        console.error("Error creating folder:", error);
        throw error;
    }
}

async function writeFile(filePath: string, fileData: Uint8Array): Promise<void> {
    try {
        // Check if the provided path is a directory path itself.
        if (filePath.endsWith(path.sep)) {
            await createFolder(filePath);
            return; // Exit after creating the directory.
        }

        // If it's a file path, create its parent directory.
        await createFolder(path.dirname(filePath));

        // Now, write the file.
        await fs.writeFile(filePath, fileData);

    } catch (error) {
        console.error("Error writing file:", error);
        throw error;
    }
}


export const saveToS3 = async (key: string,filePath:string,content:string):Promise<void> => {
    const params = {
        Bucket: process.env.S3_BUCKET ?? "",
        Key: `${key}${filePath}`,
        Body: content
    };

    try {
        await s3.send(new PutObjectCommand(params));
    } catch (error) {
        console.error("Error saving to S3:", error);
    }
}
