import { Express } from "express";
import { copyS3Folder } from "./aws";
import express from "express";

export const initHttp = (app:Express) => {

    app.use(express.json());

    app.post("/project", async (req, res) => {
        const { replId, language } : {replId: string,language: string} = req.body;
        try {
            await copyS3Folder(`base/${language}`,`code/${replId}`);
            res.status(200).send("Project Created");
        } catch (error) {
            console.error("Error copying folder:", error);
            res.status(500).send("Error copying folder");
        }
    });
}