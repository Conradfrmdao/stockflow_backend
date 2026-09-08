import express from 'express'
import dotenv from 'dotenv'
dotenv.config()
import cookieParser from "cookie-parser";
import { disconnectDb,connectDb } from './config/db.js'
import authRouter from './routes/authRoutes.js'
import userRouter from './routes/userRoutes.js'
connectDb()

const app =express()
const PORT=process.env.PORT || 5001
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended : true}))

app.use("/stockflow/api/auth", authRouter)
app.use("/stockflow/api/users", userRouter)



const server = app.listen(PORT,()=>{
    console.log(`APP IS RUNNING ON PORT ${PORT} !!`)
})

// Handle unhandled promise rejections 
process.on('unhandledRejection', (err)=>{
    console.error('Unhandled Rejection:', err)
    server.close( async()=>{
    await disconnectDb()
    process.exit(1)
    })
})
// Handle uncaught exceptions
process.on('uncaughtException', (err)=>{
    console.error('Uncaught Exception:', err)
    disconnectDb()
    process.exit(1)
})

//graceful shutdown on SIGTERM signal
process.on('SIGTERM', async ()=>{
    console.log('SIGTERM signal received. Closing server gracefully...')
    await disconnectDb()
    process.exit(0)
})