import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js"
import { generateTokens, storeRefreshToken } from "../utils/generateTokens.js"
import { setCookies } from "../utils/setCookies.js"
import transporter from "../config/nodemailer.js"
import { redis } from "../utils/redis.js"
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from "../config/emailTemplates.js"



const register = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" })
  }
  try {
    const existingUser = await userModel.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = new userModel({
      name,
      email,
      password: hashedPassword
    })
    await user.save()

    const { accessToken, refreshToken } = generateTokens(user._id)
    await storeRefreshToken(user.email, refreshToken)

    setCookies(res, accessToken, refreshToken)


    // Sending welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to Ahnibaba Group",
      text: `Welcome to Ahnibaba Group. Your account has been created with the email id: ${email}`
    }

    await transporter.sendMail(mailOptions)

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: { ...user.toJSON(), password: null }
    })

  } catch (error) {
    console.log("Error in register function", error.message);
    res.status(500).json({ success: false, message: error.message })
  }
}

const sendVerifyOtp = async(req, res) => {
  try {
    const { _id } = req.user

    console.log(_id);
    

    const user = await userModel.findById(_id)

    if(user.isAccountVerified) {
      return res.json({ success: false, message: "Account is already verified" })
    }

    const otp = String(Math.floor(Math.random() * 900000))
    console.log(otp);

    user.verifyOtp = otp
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000

    await user.save()

    // Sending verification email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account verification OTP",
      //text: `Your OTP is ${otp}. Verify your account using this OTP`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    }

    await transporter.sendMail(mailOptions)

    res.status(200).json({ success: true, message: "Verification OTP sent on Email" })
    
  } catch (error) {
    console.log("Error in sendVerifyOtp function", error.message);
    res.status(500).json({ success: false, message: error.message })
  }
}

const verifyEmail = async (req, res) => {
  const { _id: userId } = req.user
  const { otp } = req.body

  try {
    if(!userId || !otp) {
      return res.status(400).json({ success: false, message: "Missing Details" })
    }

    const user = await userModel.findById(userId)
    if(!user) {
      return res.status(400).json({ success: false, message: "User not found" })
    }

    if(user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" })
    }

    if(user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP Expired" })
    }

    user.isAccountVerified = true
    user.verifyOtp = null
    user.verifyOtpExpireAt = 0

    await user.save()
    res.status(200).json({ success: true, message: "Email verified successfully" })
  } catch (error) {
    console.log("Error in verifyEmail function", error.message);
    res.status(500).json({ success: false, message: error.message })
  }
}

const login = async (req, res) => {
  const { email, password } = req.body
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" })
    }

    const user = await userModel.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid email" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" })
    }

    const { accessToken, refreshToken } = generateTokens(user._id)
    await storeRefreshToken(user.email, refreshToken)

    setCookies(res, accessToken, refreshToken)


    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: { ...user.toJSON(), password: null }
    })

  } catch (error) {
    console.log("Error in login function", error.message);
    res.status(500).json({ success: false, message: error.message })
  }
}

const logout = async (req, res) => {
  try {
   const refreshToken = req.cookies.refreshToken
   if(refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    await redis.del(`Advanced-Auth-2-refresh_token:${decoded.userId}`)
   }

   res.clearCookie("accessToken")
   res.clearCookie("refreshToken")

   res.status(200).json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.log("Error in logout function", error.message);
    res.status(500).json({ error: error.message })
  }
}


const checkAuth = (req, res) => {
  try {
    const user = req.user
    return res.status(200).json({ success: true, user: { ...user.toJSON(), password: null }})
  } catch (error) {
    console.log("Error in checkAuth function", error.message);
    res.status(500).json({ error: error.message })
  }
}

// Send Password Reset OTP
const sendResetOtp = async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" })
  }

  try {
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const otp = String(Math.floor(Math.random() * 900000))
    console.log(otp);

    user.resetOtp = otp
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000

    await user.save()

    // Sending password reset otp
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP for resetting your password is ${otp}. Use this OTP to proceed with resetting your password.`,
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    }

    await transporter.sendMail(mailOption)

    res.status(200).json({ success: true, message: "OTP sent to your email" })
  } catch (error) {
    console.log("Error in sendResetOtp function", error.message);
    res.status(500).json({ error: error.message })
  }
}

// Reset User Password
const resetPassword = async(req,  res) => {
  const { email, otp, newPassword } = req.body
  

  if(!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: "All fields are required" })
  }
  try {
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" })
    }
    if (user.resetOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP Expired" })
    }

    const salt = await bcrypt.genSalt(10)

    const hashedPassword = await bcrypt.hash(newPassword, salt)

    user.password = hashedPassword
    user.resetOtp = ""
    user.resetOtpExpiredAt = 0

    await user.save()

    res.status(200).json({ success: true, message: "Password has been reset successfully" })
  } catch (error) {
    console.log("Error in resetPassword function", error.message);
    res.status(500).json({ error: error.message })
  }
}


export { register, login, logout, sendVerifyOtp, verifyEmail, checkAuth, sendResetOtp, resetPassword }