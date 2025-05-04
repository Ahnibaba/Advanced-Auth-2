import userModel from "../models/userModel.js";


export const getUserData = async (req, res) => {
    try {
       const { _id: userId } = req.user

       const user = await userModel.findById(userId)

       if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
      }

      res.status(200).json({ 
        success: true, 
        userData: {
        name: user.name,
        isAccountVerified: user.isAccountVerified
      }})
    } catch (error) {
      console.log("Error in getUserData function", error.message);
      res.status(500).json({ error: error.message })  
    }
}