require("dotenv").config()

const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on("error", (error) => console.error(error))
db.once('open', () => console.log('Connected to DB'))

app.use(express.json({limit: "10mb"}))
app.use(cors())

const musicRoute = require("./routes/musicRoute")
const filesRoute = require("./routes/filesRoute")

app.use("/", musicRoute)
app.use("/files", filesRoute)

app.listen(PORT, () => console.log(`Server start on port ${PORT}`))


