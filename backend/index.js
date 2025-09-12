import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connect from "./connection.js";
import router from "./router.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;  

app.use(cors({}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connect();  

app.use('/',router)

app.listen(PORT)