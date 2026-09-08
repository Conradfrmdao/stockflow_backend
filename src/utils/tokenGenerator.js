import jwt from 'jsonwebtoken'
import { prisma } from '../config/db.js'
import bcrypt from 'bcryptjs'


export const tokenGenerator = async (UserId,role,res)=>{
        const payload ={UserId,role} 
        const refreshToken = jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn : process.env.JWT_EXPIRES_IN
        })

        const accessToken = jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn : "15m"
        })

        res.cookie("access_token",accessToken,{
        httpOnly:true,
        secure : process.env.NODE_ENV ==="production",
        sameSite:"strict",
        maxAge: 1000*60*15
        })

        res.cookie("refresh_token",refreshToken,{
        httpOnly:true,
        secure : process.env.NODE_ENV ==="production",
        sameSite:"strict",
        maxAge: 1000*60*60*24*7 
        })

        const salt= await bcrypt.genSalt(10)
        const hashedToken = await bcrypt.hash(refreshToken,salt)
        const expiresAt= new Date()
        expiresAt.setDate(expiresAt.getDate()+7)

            await prisma.refreshToken.create({
                data: {
                userId: UserId,
                tokenHash: hashedToken,
                expiresAt: expiresAt,
                }
            })
        

        return { accessToken, refreshToken }

}

