
export const roleAuthorizationMiddleware = (allowedRoles) => {
    return (req,res,next)=>{
        if (allowedRoles.includes(req.user.role)){
            return next()
        
        }

        return res.status(403).json({
            message : "You are not authorized to access this resource"
        })
    }
}
