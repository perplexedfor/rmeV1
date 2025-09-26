import fs from "fs/promises";

enum FileType {
    FILE = "file",
    DIR = "dir"
}

interface File {
    type: FileType;
    name: string;
    path: string;
}

//resolve and reject is same as okay and error i infer okay now let's see what will happen
//there is some change in the project structure okkay
export const fetchDir = async (dir : string, baseDir: string) : Promise<File[]> =>{
    try {
        const data = await fs.readdir(dir,{ withFileTypes :true });

        const files = data.map(entry => {
            return {
                type: entry.isDirectory() ? FileType.DIR : FileType.FILE,
                name: entry.name,
                path:`${baseDir}/${entry.name}`
            };
        });

        return files;
    }catch(err){
        console.error("Error fetching directory:", err);
        throw err;
    }
}

export const fetchFileContent = async (filePath: string): Promise<string> => {
    try {
        const content = await fs.readFile(filePath, "utf-8");
        return content;
    } catch (err) {
        console.error("Error fetching file:", err);
        throw err;
    }
};

export const saveFile = async (file:string,content:string): Promise<void> => {
    try {
        await fs.writeFile(file, content, "utf-8");
    } catch (err) {
        console.error("Error saving file:", err);
        throw err;
    }
};