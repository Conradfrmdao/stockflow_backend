import jwt from 'jsonwebtoken'

export const accessTokenRegenerator = async (UserId,role,res)=>{
    try {
        const payload ={UserId,role} 

        const accessToken = jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn : "15m"
        })

        res.cookie("access_token",accessToken,{
        httpOnly:true,
        secure : process.env.NODE_ENV ==="production",
        sameSite:"strict",
        maxAge: 1000*60*15
        })
        
        return {accessToken}

    } catch (error) {
        console.log("Error",error)
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

