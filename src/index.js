// require('dotenv').config({path:'/.env'})
import dotenv from 'dotenv'
import express from 'express'
import connectDB from './db/index.js'
import { app } from './app.js'

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.port || 8000,()=>{
        console.log(`Server is running on port ${process.env.port}`)
    })
})
.catch((err)=>{
    console.log("Mongodb connection failed !!!", err)
})

