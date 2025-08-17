declare enum FileType {
    FILE = "file",
    DIR = "dir"
}
interface File {
    type: FileType;
    name: string;
    path: string;
}
export declare const fetchDir: (dir: string) => Promise<File[]>;
export declare const fetchFile: (filePath: string) => Promise<string>;
export declare const saveFile: (file: string, content: string) => Promise<void>;
export {};
//# sourceMappingURL=fs.d.ts.map