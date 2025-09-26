import { Server, Socket } from "socket.io"
import { Server as HttpServer} from "http";
import { fetchS3Folder, saveToS3 } from "./aws";
import path from "path";
import { TerminalManager } from "./pty";
import { fetchDir,fetchFileContent,saveFile } from "./fs";

const terminalManager = new TerminalManager();

export function initWs(server : HttpServer){
    const io = new Server(server,{
        cors : {
            origin: "*",
            methods: ["GET", "POST"],
        }
    });

    io.on("connection", async (socket: Socket) => {
        //there should be auth checks here to prevent the access
        const host = socket.handshake.headers.host;

        const replId = host?.split('.')[0];

        if(!replId){
            socket.disconnect();
            terminalManager.clear(socket.id);
            return;
        }

        socket.emit("loaded",{
            //this will have some change that we'd have to see
            rootContent: await fetchDir("/workspace",""),
        })

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });

        initHandlers(socket,replId);
    });
}

function initHandlers(socket: Socket, replId: string) {
    
    //disconnect
    socket.on("disconnect",() =>{
        console.log("Client disconnected");
    });

    //fetchDir
    socket.on("fetchDir",async (dir: string,callback) =>{
        console.log("Fetching directory:", dir);
        const dirPath = `/workspace/${dir}`;
        const content = await fetchDir(dirPath, dir);
        callback(content);
    });

    //fetchContent
    socket.on("fetchContent", async ({ path: filePath }: { path: string }, callback) => {
        const fullPath = `/workspace/${filePath}`;
        //will take fetch file content instead okay
        const data = await fetchFileContent(fullPath);
        callback(data);
    });

    //updateContent
    socket.on("updateContent", async ({ path: filePath, content }: { path: string, content: string }) => {
        const fullPath = `/workspace/${filePath}`;
        await saveFile(fullPath, content);
        await saveToS3(`code/${replId}`, filePath, content);
    });

    //requestTerminal we are creating a terminal and giving it a callback in case our output occurs
    socket.on("requestTerminal", async () => {
        terminalManager.createPty(socket.id, replId, (data, id) => {
            socket.emit('terminal', {
                data: Buffer.from(data,"utf-8")
            });
        });
    });


    //terminalData
    socket.on("terminalData", async ({ data }: { data: string, terminalId: number }) => {
        terminalManager.write(socket.id, data);
    });

}