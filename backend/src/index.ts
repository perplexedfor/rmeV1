import dotenv from "dotenv"
dotenv.config()
import express from "express";
import { createServer } from "http";
import { initWS } from "./ws";
import { initHttp } from "./http";
import cors from "cors";

const app = express();
app.use(cors());
//app.listen explicitly starts the server and listens to the changes but we are needed to share the server instance so we do this 
const httpServer = createServer(app);

initWS(httpServer);
initHttp(app);

const port = process.env.PORT || 3001;
httpServer.listen(port, () => {
  console.log(`listening on *:${port}`);
});