import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js"


export const userAuth = async(req, res, next) => {
   const { accessToken } = req.cookies
  

   if(!accessToken) {
    return res.status(401).json({ success: false, message: "Unauthorized - no accessToken" })
   }
   try {
    const tokenDecode = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

    const user = await userModel.findById(tokenDecode.userId)

    if(!tokenDecode || !user) {
        return res.status(403).json({ success: false, message: "Forbidden - Invalid token" })
    }

    req.user = user

    next()

   } catch (error) {
    console.log("Error in userAuth middleware function", error.message);
    res.status(500).json({ success: false, message: error.message })
   }

}