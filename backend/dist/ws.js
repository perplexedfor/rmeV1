"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWS = void 0;
const socket_io_1 = require("socket.io");
const aws_1 = require("./aws");
const path_1 = __importDefault(require("path"));
const pty_1 = require("./pty");
const fs_1 = require("./fs");
const terminalManager = new pty_1.TerminalManager();
function initWS(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        }
    });
    io.on("connection", async (socket) => {
        const replId = socket.handshake.query.replId;
        if (!replId) {
            socket.disconnect();
            terminalManager.clear(socket.id);
            return;
        }
        //create a temp in current directory okay outside the src folder okay
        await (0, aws_1.fetchS3Folder)(`code/${replId}`, path_1.default.join(__dirname, `../tmp/${replId}`));
        socket.emit("loaded", {
            rootContent: await (0, fs_1.fetchDir)(path_1.default.join(__dirname, `../tmp/${replId}`)),
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
        initHandlers(socket, replId);
    });
}
exports.initWS = initWS;
function initHandlers(socket, replId) {
    //disconnect
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
    //fetchContent
    socket.on("fetchContent", async ({ path: filePath }, callback) => {
        const fullPath = path_1.default.join(filePath);
        const data = await (0, fs_1.fetchFile)(fullPath);
        callback(data);
    });
    //fetchDir
    socket.on("fetchDir", async (dirPath, callback) => {
        console.log("Fetching directory:", dirPath);
        const content = await (0, fs_1.fetchDir)(path_1.default.join(dirPath));
        callback(content);
    });
    //updateContent
    socket.on("updateContent", async ({ path: filePath, content }) => {
        const fullPath = path_1.default.join(filePath);
        await (0, fs_1.saveFile)(fullPath, content);
        await (0, aws_1.saveToS3)(`code/${replId}`, filePath, content);
    });
    //requestTerminal we are creating a terminal and giving it a callback in case our output occurs
    socket.on("requestTerminal", async () => {
        terminalManager.createPty(socket.id, replId, (data, id) => {
            socket.emit('terminal', {
                data: Buffer.from(data, "utf-8")
            });
        });
    });
    //terminalData
    socket.on("terminalData", async ({ data }) => {
        terminalManager.write(socket.id, data);
    });
}
//# sourceMappingURL=ws.js.map