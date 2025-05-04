import express from "express"
import { register, login, logout, sendVerifyOtp, verifyEmail, checkAuth, sendResetOtp, resetPassword } from "../controllers/authController.js"
import { userAuth } from "../middleware/userAuth.js"
//import { protectRoute } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
router.post("/send-verify-otp", userAuth, sendVerifyOtp)
router.post("/verify-account", userAuth, verifyEmail)
router.post("/send-reset-otp", sendResetOtp)
router.post("/reset-password", resetPassword)
router.get("/check-auth", userAuth, checkAuth)


export default router