import jwt from "jsonwebtoken"
import { prisma } from "../config/db.js"

export const authMiddleware = async (req,res,next)=>{
    try {
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
            token=req.headers.authorization.split(" ")[1]

        }else if(req.cookies?.access_token){
            token=req.cookies.access_token
        }

        if(!token){
            return res.status(400).json({
                message : "No token provided"
            })
        }

        //get info from the token
        const decode=jwt.verify(token,process.env.JWT_SECRET)

        const user = await prisma.user.findUnique({
            where : {id: decode.UserId}
        })
        if(!user){
            return res.status(400).json({
                message : "User not Found !!"
            })
        }
        if(user.isActive === false){
            return res.status(400).json({
                message : "User has been Suspended Or Disabled "
            })
        }
        
        req.user=user
        next()

    } catch (error) {
        if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid or expired access token"
            });
        }

        res.status(500).json({
            message : "Internal Server Error"
        })
        console.log("Error",error)
    }
}