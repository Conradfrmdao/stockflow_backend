import express from "express"
import { createUser,createSubUser,updateUser, disableUser } from "../controllers/user/userController.js"
import { authMiddleware } from "../middleware/authmiddleware.js"
import { roleAuthorizationMiddleware } from "../middleware/roleAuthorizationMiddleware.js"

const userRouter = express.Router()

userRouter.post("/register",createUser)
userRouter.post("/create-sub-user",authMiddleware,
    roleAuthorizationMiddleware(["OWNER","MANAGER"]),createSubUser)
userRouter.patch("/update-user/:id",authMiddleware,
    roleAuthorizationMiddleware(["OWNER","MANAGER"]),updateUser)
userRouter.patch("/disable-user/:id",authMiddleware,
    roleAuthorizationMiddleware(["OWNER","MANAGER"]),disableUser)

export default userRouter