import {prisma} from "../../config/db.js"
import bcrypt from "bcryptjs"

//create user (Owner) and Organization
const createUser = async (req,res)=>{
    try {
        //validate the data
        const {name,email,password,organizationName}=req.body
        const role="OWNER"

        
        if(!name || !email || !password || !organizationName){
            return res.status(400).json({
                message : "All fields are Mandatory"
            })
        }

        const sanitizedPassword = password.trim();
        const sanitizedEmail = email.replace(/\s/g, "").toLowerCase();

        //check if user Exists 
        const userExits = await prisma.user.findUnique({
            where : {
                email: sanitizedEmail
            }
        })

        if (userExits) {
            return res.status(400).json({
                message : "User Already Exists"
            })
        }

        //hash the password
        const hashedPassword= await bcrypt.hash(sanitizedPassword,10)
        const createdUser = await prisma.user.create({
            data :{
                name: name,
                email: sanitizedEmail,
                passwordHash: hashedPassword,
                role: role
            }
        })

        if(!createdUser){
            return res.status(400).json({
                message : "User Not Created"
            })
        }

        const CreateOrganization = await prisma.organization.create({
            data :{
                name: organizationName,
                createdById:createdUser.id
            }
        })

        if(!CreateOrganization){
            return res.status(400).json({
                message : "Organization Not Created"
            })
        }

        const updatedUser = await prisma.user.update({
            where : {id: createdUser.id},
            data : {organizationId: CreateOrganization.id}
        })


        return res.status(201).json({
            message : "User Created Successfully",
            data : {
                name : updatedUser.name,
                email : updatedUser.email,
                role : updatedUser.role,
                userId : updatedUser.id,
                Organization_name: organizationName,
                Organization_id: CreateOrganization.id
            }
        })

    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
            message : "Internal Server Error"
        })
    }
}

const createSubUser = async (req,res)=>{
    try{
        const organizationId = req.user.organizationId
        const {name,email,password,role}=req.body
        const createdBy = req.user.id

        if(!name || !email || !password || !role){
            return res.status(400).json({
                message : "All fields are Mandatory"
            })
        }
        const sanitizedRole = role.trim().toUpperCase();
        if (!["MANAGER", "STAFF"].includes(sanitizedRole)) {
            return res.status(400).json({
                message: "Invalid role. Allowed roles are MANAGER and STAFF."
            });
        }

        if(req.user.role ==="MANAGER" && sanitizedRole !=="STAFF" ){
            return res.status(403).json({
                message : "Managers can only create STAFF users"
            })
        }
        const sanitizedPassword = password.trim();
        const sanitizedEmail = email.replace(/\s/g, "").toLowerCase();

        const userExits = await prisma.user.findUnique({
            where : {email: sanitizedEmail}
        })

        if (userExits) {
            return res.status(400).json({
                message : "User Already Exists"
            })
        }

    const hashedPassword= await bcrypt.hash(sanitizedPassword,10)
    const createdSubUser = await prisma.user.create({
        data :{
            name: name,
            email: sanitizedEmail,
            passwordHash: hashedPassword,
            role: sanitizedRole,
            organizationId:organizationId,
            createdById: createdBy
        }
    })

    if (!createdSubUser) {
        return res.status(400).json({
            message: "Sub-user not created"
        })}


    return res.status(201).json({
        message : "Sub-user Created Successfully",
        data : {
            name : createdSubUser.name,
            userId : createdSubUser.id,
            email : createdSubUser.email,
            role : createdSubUser.role
        }
    })

    }catch (error) {
        console.error("Error creating sub-user:", error);
        return res.status(500).json({
            message : "Internal Server Error"
        })
    }
}

const updateUser = async (req,res)=>{
    try{
        const {email,name,role}= req.body
        const targetUserId= req.params.id 
        const userId = req.user.id 


        if(targetUserId === userId && "role" in req.body){
            return res.status(400).json({
                message : "You Are not allowed to Change your Role"
            })
        }
        
        const dataToUpdate={}
        if(name){
            dataToUpdate.name=name
        }
        if(email){
            const sanitizedEmail= email.replace(/\s/g, "").toLowerCase();
            dataToUpdate.email=sanitizedEmail
        }
        if(role){
            const sanitizedRole = role.trim().toUpperCase();
            if(!["MANAGER", "STAFF"].includes(sanitizedRole)){
                return res.status(400).json({
                    message : "Invalid role. Allowed roles are MANAGER and STAFF."
                })
            }
            if(req.user.role === "MANAGER" && sanitizedRole !== "STAFF"){
                return res.status(400).json({
                    message : "Managers can only assign STAFF"
                })
            }

            dataToUpdate.role = sanitizedRole
        }

        if(Object.keys(dataToUpdate).length === 0){
            return res.status(400).json({
                message : "No Data to Update"
            })
        }

        const updatedUser = await prisma.user.update({
            where : {
                id: targetUserId,
                organizationId : req.user.organizationId
            },
            data : dataToUpdate
        })

        return res.status(200).json({
            message : "Update Successful",
            data: {
                name : updatedUser.name,
                email : updatedUser.email,
                role : updatedUser.role
            }
        })
    }catch (error) {
        if (error.code === "P2025") {
        return res.status(404).json({ message: "User not found" })
    }
    console.error("Error updating user:", error)
    return res.status(500).json({ message: "Internal Server Error" })
    }
}

const disableUser = async (req,res)=>{
    try {
        const currentUserRole = req.user.role
        const targetUserId = req.params.id
        const currentUserId = req.user.id
        const orgId= req.user.organizationId

        if(!targetUserId){
            return res.status(400).json({
                message  : "No id provided"
            })
        }

        if(targetUserId === currentUserId){
            return res.status(403).json({
                message  : "You are not allowed to Disable Your Own Account"
            })
        }

        const userToDisable = await prisma.user.findUnique({
            where : {
                id : targetUserId,
                organizationId:orgId
            }
        })

        if(!userToDisable){
            return res.status(404).json({
                message  : "User Not found"
            })
        }

        if(userToDisable.isActive === false){
            return res.status(400).json({
                message  : "User already Disabled"
            })
        }

        if(currentUserRole === userToDisable.role){
            return res.status(403).json({
                message  : "Not Authorized"
            })
        }

        if(currentUserRole === "MANAGER" && userToDisable.role === "OWNER"){
            return res.status(403).json({
                message  : "Cannot disable Owner"
            })
        }

        const disabledUser =await prisma.user.update({
            where : {
                id : targetUserId,
                organizationId:orgId
            },
            data : {
                isActive : false
            }
        })

        return res.status(200).json({
            message :"Successfully disabled user",
            data :{
                name : disabledUser.name,
                id:disabledUser.id
            }
        })

    } catch (error) {
        console.error("Error disabling user:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

const enableUser = async (req,res)=>{
    try {
        const currentUserRole = req.user.role
        const targetUserId = req.params.id
        const orgId= req.user.organizationId

        if(!targetUserId){
            return res.status(400).json({
                message  : "No id provided"
            })
        }


        const userToEnable = await prisma.user.findUnique({
            where : {
                id : targetUserId,
                organizationId:orgId
            }
        })

        if(!userToEnable){
            return res.status(404).json({
                message  : "User Not found"
            })
        }

        if(userToEnable.isActive === true){
            return res.status(400).json({
                message  : "User already Active"
            })
        }

        if(currentUserRole === userToEnable.role){
            return res.status(403).json({
                message  : "Not Authorized"
            })
        }

        if(currentUserRole === "MANAGER" && userToEnable.role !== "STAFF"){
            return res.status(403).json({
                message  : "Manager can only Edit Staff"
            })
        }

        const enabledUser =await prisma.user.update({
            where : {
                id : targetUserId,
                organizationId:orgId
            },
            data : {
                isActive : true
            }
        })

        return res.status(200).json({
            message :"Successfully Enabled user",
            data :{
                name : enabledUser.name,
                id: enabledUser.id
            }
        })

    } catch (error) {
        console.error("Error enabling user:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

export {createUser,createSubUser,updateUser,disableUser,enableUser}