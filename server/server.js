import express from "express";
import cors from "cors"
import { configDotenv } from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./db/connectDB.js";
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"

// import crypto from "crypto"

// console.log(crypto.randomBytes(64).toString("hex"))

configDotenv()


const app = express()
const PORT = process.env.PORT || 4000
connectDB()

const allowedOrigins = ["http://localhost:5173"]

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

// API ENDPOINTS
app.get("/", (req, res) => {
    res.send("API working")
})
app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)



app.listen(PORT, () => {
    console.log(`Server started on port: ${PORT}`);
    
})

