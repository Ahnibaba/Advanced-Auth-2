import express from "express"
import { register, login, logout } from "../controllers/authController.js"
//import { protectRoute } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
// router.post("/refresh-token", refreshToken)
// router.get("/profile", protectRoute, getProfile)

export default router