import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error']
})

const connectDb = async ()=>{
    try {
        await prisma.$connect()
        console.log("Database Connected Via Prisma")
    } catch (error) {
        console.log("Database Failed to connect",error)
        process.exit(1)
    }
}

const disconnectDb = async ()=>{
    await prisma.$disconnect()
    console.log("Database Disconnected")
}

export{
    prisma,
    connectDb,
    disconnectDb
}

