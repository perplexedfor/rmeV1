export declare const fetchS3Folder: (key: string, localPath: string) => Promise<void>;
export declare const copyS3Folder: (sourcePrefix: string, destinationPrefix: string, continuationToken?: string) => Promise<void>;
export declare const saveToS3: (key: string, filePath: string, content: string) => Promise<void>;
//# sourceMappingURL=aws.d.ts.map