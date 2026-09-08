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

export {createUser,createSubUser}