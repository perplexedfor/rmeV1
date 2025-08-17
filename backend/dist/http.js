"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initHttp = void 0;
const aws_1 = require("./aws");
const express_1 = __importDefault(require("express"));
const initHttp = (app) => {
    app.use(express_1.default.json());
    app.post("/project", async (req, res) => {
        const { replId, language } = req.body;
        try {
            await (0, aws_1.copyS3Folder)(`base/${language}`, `code/${replId}`);
            res.status(200).send("Project Created");
        }
        catch (error) {
            console.error("Error copying folder:", error);
            res.status(500).send("Error copying folder");
        }
    });
};
exports.initHttp = initHttp;
//# sourceMappingURL=http.js.map