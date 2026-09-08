import {prisma} from "../../config/db.js"
import bcrypt from "bcryptjs"
import {tokenGenerator} from "../../utils/tokenGenerator.js"
import {accessTokenRegenerator} from "../../utils/accessTokenRegenerator.js"
import jwt from "jsonwebtoken"


const userLogin= async (req,res)=>{
    try {
        const {email,password}=req.body
        
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            })
        }
        
        
        const user = await prisma.user.findUnique({
            where:{email: email}
        })

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        const comparePassword = await bcrypt.compare(password, user.passwordHash)
        if (!comparePassword) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        await tokenGenerator(user.id,user.role,res)

        return res.status(200).json({
            message: "Login successful",
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

const userLogout = async (req,res)=>{
    try {
        
        const userId = req.user.id
        const token = req.cookies.refresh_token

        if (!token) {
            return res.status(400).json({
            message: "Refresh token not found"
        });
        }

        //check if token exists in the database
        const checkTokenTable = await prisma.refreshToken.findMany({
            where: { userId: userId }
        })

        if (!checkTokenTable || checkTokenTable.length === 0) {
            return res.status(400).json({
                message: "No token found for the user"
            })
        }
        
        for(const record of checkTokenTable){
            const isMatch = await bcrypt.compare(token, record.tokenHash)
            if(isMatch){
                await prisma.refreshToken.delete({
                    where: { id: record.id }
                })
                break
            }
        }

        res.clearCookie("refresh_token")
        res.clearCookie("access_token")

        return res.status(200).json({
            message: "Logout successful"
        })


    } catch (error) {
        console.log("Error in userLogout:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

const refreshAccessToken = async (req,res)=>{
    try{
        const refreshToken=req.cookies.refresh_token 

        if(!refreshToken){
            return res.status(400).json({
                message: "Refresh token not Provided"
            })
        }

        const decode = jwt.verify(refreshToken,process.env.JWT_SECRET)
        const userId=decode.UserId
        const role=decode.role

        const isTokenInDb = await prisma.refreshToken.findMany({
            where : { userId: userId 
            }
        })

        if(isTokenInDb.length ===0){
            return res.status(400).json({
                message: "Refresh token not found in database"
            })
        }

        for(const record of isTokenInDb){
            const isMatch= await bcrypt.compare(refreshToken, record.tokenHash)
            if(isMatch){
                const isTokenExpired = record.expiresAt < new Date()
                if(isTokenExpired){
                    return res.status(400).json({
                        message: "Refresh token has expired"
                    })
                }

                
                res.clearCookie("access_token")
                const newAccessToken = await accessTokenRegenerator(userId,role,res)
                if(!newAccessToken){
                    return res.status(500).json({
                        message: "Failed to generate new access token"
                    })
                }
                return res.status(200).json({
                    message : "New access token generated successfully",
                    accessToken: newAccessToken.accessToken
                })
            }
        }

    return res.status(400).json({
    message: "Invalid refresh token"
    })

    }catch (error) {
        console.log("Error in refreshAccessToken:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}


export {userLogin,userLogout,refreshAccessToken}