// //we build input files and split it into the directories okay then what?

/**
 * @fileoverview Utility functions for building and managing a file tree structure.
 * This code takes a flat list of remote file/directory data and constructs a hierarchical
 * tree object, with specific logic to identify a hardcoded root directory.
 */

// Defines the types of nodes in our file tree.
export enum Type {
    FILE,
    DIRECTORY,
    DUMMY // Not used in the current implementation but defined.
}

// Common properties shared by all nodes in the file tree.
interface CommonProps {
    id: string;
    type: Type;
    name: string;
    content?: string; // Optional content for files.
    path: string;
    parentId: string | undefined;
    depth: number;
}

// Represents a file node in the tree.
export interface File extends CommonProps {
    type: Type.FILE;
}

// Represents a directory node in the tree, which can contain other files and directories.
export interface Directory extends CommonProps {
    type: Type.DIRECTORY;
    files: File[];
    dirs: Directory[];
}

// Represents a dummy node, not currently used.
export interface DummyProps extends CommonProps {
    type: Type.DUMMY;
}

// Represents the raw data structure for a file or directory received from a remote source.
export interface RemoteFile {
    type: "file" | "dir";
    name: string;
    path: string;
}


export function sortDir(a: Directory, b: Directory): number {
    return a.name.localeCompare(b.name);
}

export function sortFile(a: File, b: File): number {
    return a.name.localeCompare(b.name);
}


export function buildFileTree(data: RemoteFile[]): Directory {
    // This regex identifies the project's root directory path based on the hardcoded structure.
    // It matches paths like /home/perplexedfor/code/bpt/badcode/backend/tmp/{any_replId}
    const projectRootRegex = /^\/home\/perplexedfor\/code\/bpt\/badcode\/backend\/tmp\/[^/]+$/;

    // A cache to hold all created nodes (files and directories) for quick lookup by their path (ID).
    const cache = new Map<string, Directory | File>();

    // The top-level directory that will contain the entire file tree.
    const rootDir: Directory = {
        id: "root",
        name: "root",
        parentId: undefined,
        type: Type.DIRECTORY,
        path: "", // The virtual root has no real path.
        depth: 0,
        files: [],
        dirs: [],
    };

    // Step 1: Create nodes for all files and directories and place them in the cache.
    data.forEach((item) => {
        // Determine the parent's path by removing the last segment of the item's own path.
        const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));

        // Check if the calculated parent path matches the hardcoded project root pattern.
        const isRootChild = projectRootRegex.test(parentPath);
        const parentId = isRootChild ? "root" : parentPath;

        if (item.type === 'dir') {
            const dir: Directory = {
                id: item.path, // Use the full path as a unique ID.
                name: item.name,
                path: item.path,
                type: Type.DIRECTORY,
                parentId: parentId,
                depth: 0, // Depth is calculated in a later step.
                files: [],
                dirs: [],
            };
            cache.set(dir.id, dir);
        } else { // item.type === 'file'
            const file: File = {
                id: item.path, // Use the full path as a unique ID.
                name: item.name,
                path: item.path,
                type: Type.FILE,
                parentId: parentId,
                depth: 0, // Depth is calculated in a later step.
            };
            cache.set(file.id, file);
        }
    });

    
    // Step 2: Assemble the tree structure by linking nodes to their parents.
    cache.forEach((node) => {
        if (!node.parentId) {
            console.warn(`Node ${node.name} at ${node.path} is missing a parentId.`);
            return;
        }

        if (node.parentId === "root") {
            // This node is a direct child of our virtual root directory.
            if (node.type === Type.DIRECTORY) {
                rootDir.dirs.push(node as Directory);
            } else {
                rootDir.files.push(node as File);
            }
        } else {
            // This is a nested node; find its parent in the cache.
            const parentDir = cache.get(node.parentId) as Directory | undefined;

            if (parentDir && parentDir.type === Type.DIRECTORY) {
                // Add the current node to its parent's list of children.
                if (node.type === Type.DIRECTORY) {
                    parentDir.dirs.push(node as Directory);
                } else {
                    parentDir.files.push(node as File);
                }
            } else {
                // This can happen if a file's parent directory is not included in the input data.
                console.warn(`Parent directory not found for ${node.path}. Parent ID was: ${node.parentId}`);
            }
        }
    });

    cache.forEach((value, key) => {
        console.log(`Node in cache: ${value.name} at ${value.path}, type: ${Type[value.type]}, parentId: ${value.parentId}`);
    });
    
    // Step 3: Recursively sort all directories and calculate the depth of each node.
    sortAndSetDepth(rootDir, 0);

    return rootDir;
}

/**
 * A helper function to recursively traverse the tree, sort children alphabetically,
 * and set the correct depth for each node.
 * @param currentDir The directory to process.
 * @param currentDepth The depth of the current directory.
 */
function sortAndSetDepth(currentDir: Directory, currentDepth: number) {
    currentDir.depth = currentDepth;

    // Sort the files and directories within this directory.
    currentDir.files.sort(sortFile);
    currentDir.dirs.sort(sortDir);

    // Set depth for all child files.
    currentDir.files.forEach((file) => {
        file.depth = currentDepth + 1;
    });

    // Recurse into child directories to continue the process.
    currentDir.dirs.forEach((dir) => {
        sortAndSetDepth(dir, currentDepth + 1);
    });
}


// --- Search Function ---
export function findFileByName(rootDir: Directory, filename: string): File | undefined {
    // Using a stack for an iterative DFS approach to avoid deep recursion issues.
    const stack: Directory[] = [rootDir];

    while (stack.length > 0) {
        const currentDir = stack.pop();
        if (!currentDir) continue;

        // Check files in the current directory.
        for (const file of currentDir.files) {
            if (file.name === filename) {
                return file; // File found.
            }
        }

        // Add subdirectories to the stack to search them next.
        // Pushing in reverse order to maintain a more natural search order (optional).
        for (let i = currentDir.dirs.length - 1; i >= 0; i--) {
            stack.push(currentDir.dirs[i]);
        }
    }

    return undefined; // File not found in the entire tree.
}

// export enum Type {
//     FILE,
//     DIRECTORY,
//     DUMMY
// }

// interface CommonProps {
//     id: string;
//     type:Type;
//     name:string;
//     content?:string;
//     path:string;
//     parentId: string | undefined;
//     depth: number;
// }

// export interface File extends CommonProps {
//     type: Type.FILE;
// }

// export interface Directory extends CommonProps {
//     type: Type.DIRECTORY;
//     files: File[];
//     dirs: Directory[];
// }

// export interface DummyProps extends CommonProps {
//     type: Type.DUMMY;
// }
// //it is the data that is fetched from the remote server okay
// export interface RemoteFile {
//     type: "file" | "dir"; //we caan't store enums here that's why we only use this for sorting
//     name: string;
//     path: string;
// }

// //there are nodes that are required in a build tree and we should not use them
// //building a tree lookup by id and all 
// //a custom sort function in javascript okay

// export function sortDir(l : Directory,r : Directory){
//     return l.name.localeCompare(r.name); // sort the directories by name
// }

// export function sortFile(l : File, r : File){
//     return l.name.localeCompare(r.name); // sort the files by name
// }

// export function buildFileTree(data: RemoteFile[]) : Directory {
//     const dirs = data.filter(x => x.type === 'dir');
//     const files = data.filter(x => x.type === 'file');
//     //caching each directory and file okay
//     const cache = new Map<string, Directory | File>();

//     console.log("Building file tree with directories:", dirs);


//     let rootDir: Directory = {
//         id: "root",
//         name: "root",
//         parentId: undefined,
//         type: Type.DIRECTORY,
//         path: "",
//         depth: 0,
//         files: [],
//         dirs: [],
//     };

//     dirs.forEach((item) => {
//         let dir: Directory = {
//             id: item.path,
//             name: item.name,
//             path: item.path,
//             type: Type.DIRECTORY,
//             parentId: item.path.split('/').length === 2 ? "0" : item.path.split('/').slice(0, -1).join('/'),
//             depth: 0,
//             files: [],
//             dirs: [],
//         };
//         cache.set(dir.id, dir);
//     });

//     console.log("Building file tree with files:", files);

//     files.forEach((item) => {
//         let file: File = {
//             id: item.path,
//             name: item.name,
//             path: item.path,
//             type: Type.FILE,
//             parentId: item.path.split('/').length === 2 ? "0" : item.path.split('/').slice(0, -1).join('/'),
//             depth: 0,
//         };
//         cache.set(file.id, file);
//     });

//     for (const [key, value] of cache) {
//         console.log("File in cache:", value);
//     }
    
//     //set files for each of the parent recursively that's what we are doing here okay then what will happen
//     cache.forEach((value,key) => {
//         if(value.parentId === "0"){
//             if(value.type === Type.DIRECTORY) rootDir.dirs.push(value as Directory);
//             else rootDir.files.push(value as File);
//         }else{
//             const parentDir = cache.get(value.parentId as string) as Directory;
//             if(value.type === Type.DIRECTORY) {
//                 parentDir.dirs.push(value as Directory);
//             } else {
//                 parentDir.files.push(value as File);
//             }
//         }
//     });

//     getDepth(rootDir,0);

//     return rootDir;
// }

// //whare are we doing of dpeth i don't know but we are using it in some way okay
// function getDepth(rootDir: Directory,curDepth: number){
//     rootDir.files.forEach((file) =>{
//         file.depth = curDepth + 1;
//     });

//     rootDir.dirs.forEach((dir) => {
//         dir.depth = curDepth + 1;
//         getDepth(dir, curDepth + 1);
//     });
// }


// export function findFileByName(rootDir : Directory, filename: string):File | undefined {
//     let targetFile: File | undefined = undefined;

//     function findFile(rootDir: Directory, filename: string){
//         rootDir.files.forEach((file) =>{
//             if(file.name === filename){
//                 targetFile = file;
//                 return; // we have found the file the lower things will not continue ofc
//             }
//         });
//         rootDir.dirs.forEach((dir) => {
//             findFile(dir, filename);
//         });
//     }

//     findFile(rootDir, filename);
//     return targetFile;
// }