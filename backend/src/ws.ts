import { Server, Socket } from "socket.io"
import { Server as HttpServer} from "http";
import { fetchS3Folder, saveToS3 } from "./aws";
import path from "path";
import { TerminalManager } from "./pty";
import { fetchDir,fetchFile,saveFile } from "./fs";

const terminalManager = new TerminalManager();

export function initWS(server : HttpServer){
    const io = new Server(server,{
        cors : {
            origin: "*",
            methods: ["GET", "POST"],
        }
    });

    io.on("connection", async (socket: Socket) => {

        const replId = socket.handshake.query.replId as string;

        if(!replId){
            socket.disconnect();
            terminalManager.clear(socket.id);
            return;
        }

        //create a temp in current directory okay outside the src folder okay
        await fetchS3Folder(`code/${replId}`,path.join(__dirname,`../tmp/${replId}`));
        socket.emit("loaded",{
            rootContent: await fetchDir(path.join(__dirname,`../tmp/${replId}`)),
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

    //fetchContent
    socket.on("fetchContent", async ({ path: filePath }: { path: string }, callback) => {
        const fullPath = path.join(filePath);
        const data = await fetchFile(fullPath);
        callback(data);
    });


    //fetchDir
    socket.on("fetchDir",async (dirPath: string,callback) =>{
        console.log("Fetching directory:", dirPath);
        const content = await fetchDir(path.join(dirPath));
        callback(content);
    });

    //updateContent
    socket.on("updateContent", async ({ path: filePath, content }: { path: string, content: string }) => {
        const fullPath = path.join(filePath);
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
