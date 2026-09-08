import express from "express"
import {userLogin,userLogout,refreshAccessToken} from "../controllers/auth/authControllers.js"
import {authMiddleware} from "../middleware/authmiddleware.js"
const authRouter = express.Router()

authRouter.post("/Login",userLogin)
authRouter.post("/Logout",authMiddleware,userLogout)
authRouter.post('/access-token-regenerate',refreshAccessToken)

export default authRouter
