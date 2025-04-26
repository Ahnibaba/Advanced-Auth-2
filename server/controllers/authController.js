import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js"
import { generateTokens, storeRefreshToken } from "../utils/generateTokens.js"
import { setCookies } from "../utils/setCookies.js"
import transporter from "../config/nodemailer.js"



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


export { register, login, logout }