import { S3Client, ListObjectsV2Command, GetObjectCommand, CopyObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import env from "dotenv";
env.config();

const s3 = new S3Client({region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",       // Replace with your key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "" // Replace with your secret
}});

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