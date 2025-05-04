import { useNavigate } from "react-router-dom"
import { assets } from "../assets/assets"
import { useContext } from "react"
import { AppContext } from "../context/AppContext"
import { toast } from "react-toastify"
import axios from "../lib/axios"

const Navbar = () => {
    const navigate = useNavigate()

    const { userData, setUserData, setIsLoggedIn } = useContext(AppContext)

    const sendVerificationOtp = async() => {
      try {
        const { data } = await axios.post("/auth/send-verify-otp")
        if(data?.success) {
          navigate("/email-verify")
          toast.success(data?.message)
        }
      } catch (error) {
        toast.error(error.message)
      }
    }
    const logout = async () => {
      try {
        const { data } = await axios.post("/auth/logout")
        console.log(data);
        
        data.success && setIsLoggedIn(false)
        data.success && setUserData(false)
        navigate("/")

      } catch (error) {
        console.log("Error in logout function", error);
        toast.error(error.message)
        
      }
    }
  return (
    <div className="w-full flex justify-between items-center p-4 sm:p-6
     sm:px-24 absolute top-0">
        <img src={assets.logo} alt="logo image" className="w-28 sm:w-32" />
       
      {userData ? (
        <div className="size-8 flex justify-center items-center rounded-full bg-black text-white relative group
        ">
           {userData.name[0].toUpperCase()}
           <div className="absolute hidden group-hover:block top-0 right-0
            z-10 text-black rounded pt-10"
            >
              <ul className="list-none m-0 p-2 bg-gray-100 text-sm">
                {!userData?.isAccountVerified && (
                  <li onClick={sendVerificationOtp} className="py-1 px-2 hover:bg-gray-200 cursor-pointer">Verify email</li>
                )}
                <li onClick={logout} className="py-1 px-2 hover:bg-gray-200 cursor-pointer pr-10">Logout</li>
              </ul>
           </div>
        </div>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 border border-gray-500
         rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all"
        >
          Login
          <img src={assets.arrow_icon} alt="" />
        </button>
      )}
        
    </div>
  )
}

export default Navbar