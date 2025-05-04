import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify"
import axios from "../lib/axios";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext()



export const AppContextProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userData, setUserData] = useState(null)


    const navigate = useNavigate()


    const getAuthState = async() => {
        try {
           const { data } = await axios.get("auth/check-auth")
           if(data?.success) {
               setIsLoggedIn(true)
               getUserData()
           }
        } catch (error) {
          console.log("Error in the getAuthState function", error);
          error.status === 401 ? navigate("/login")  :
          toast.error(error.message) 
        }
    }

    const getUserData = async () => {
        try {
            const  { data } = await axios.get("/user/data")
            console.log(data);
            
            data.success ? setUserData(data.userData) : toast.error(data.message)
        } catch (error) {
            console.log("Error in the getUserData function");
            
           toast.error(data.message) 
        }
    }


    useEffect(() => {
        getAuthState()
    }, [])
    

    const contextValues = {
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData,
        getUserData
    }
    return (
        <AppContext.Provider value={contextValues}>
            {children}
        </AppContext.Provider>
    )
}