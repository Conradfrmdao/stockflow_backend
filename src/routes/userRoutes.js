import express from "express"
import { createUser,createSubUser } from "../controllers/user/userController.js"
import { authMiddleware } from "../middleware/authmiddleware.js"
import { roleAuthorizationMiddleware } from "../middleware/roleAuthorizationMiddleware.js"

const userRouter = express.Router()

userRouter.post("/register",createUser)
userRouter.post("/create-sub-user",authMiddleware,
    roleAuthorizationMiddleware(["OWNER","MANAGER"]),createSubUser)



export default userRouter