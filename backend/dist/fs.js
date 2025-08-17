"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFile = exports.fetchFile = exports.fetchDir = void 0;
const promises_1 = __importDefault(require("fs/promises"));
var FileType;
(function (FileType) {
    FileType["FILE"] = "file";
    FileType["DIR"] = "dir";
})(FileType || (FileType = {}));
const fetchDir = async (dir) => {
    try {
        const data = await promises_1.default.readdir(dir, { withFileTypes: true });
        const files = data.map(entry => {
            return {
                type: entry.isDirectory() ? FileType.DIR : FileType.FILE,
                name: entry.name,
                path: `${dir}/${entry.name}`
            };
        });
        return files;
    }
    catch (err) {
        console.error("Error fetching directory:", err);
        throw err;
    }
};
exports.fetchDir = fetchDir;
const fetchFile = async (filePath) => {
    try {
        const content = await promises_1.default.readFile(filePath, "utf-8");
        return content;
    }
    catch (err) {
        console.error("Error fetching file:", err);
        throw err;
    }
};
exports.fetchFile = fetchFile;
const saveFile = async (file, content) => {
    try {
        await promises_1.default.writeFile(file, content, "utf-8");
    }
    catch (err) {
        console.error("Error saving file:", err);
        throw err;
    }
};
exports.saveFile = saveFile;
//# sourceMappingURL=fs.js.map