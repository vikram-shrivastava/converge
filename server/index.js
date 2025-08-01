import ConnectDB from "./db/index.js";
import { PORT } from "./constant.js";
import express from "express";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({
    path:'./.env'
})
ConnectDB()
.then(()=>{
    app.on('error',(err)=>{
        console.error("Server Error:", err);
        throw err;
    })
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((err) => {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
});