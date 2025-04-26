import express from "express";
import cors from "cors"
import { configDotenv } from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./db/connectDB.js";
import authRoutes from "./routes/authRoutes.js"

import crypto from "crypto"

console.log(crypto.randomBytes(64).toString("hex"))

configDotenv()


const app = express()
const PORT = process.env.PORT || 4000
connectDB()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials: true
}))

// API ENDPOINTS
app.get("/", (req, res) => {
    res.send("API working")
})
app.use("/api/auth", authRoutes)



app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
    
})

