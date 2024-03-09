const express = require(`express`)
const router = express.Router()
const fs = require('fs')
const upload = require("../helpers/getStorage")

router.post("/upload", upload.any(), async(req, res) => {
    res.send({message: "Success!!"})
})

router.get("/images/:uri", (req, res) => {
    const rootDir = require('path').resolve('./');
    const img = rootDir + `/images/${req.params.uri}`

    fs.readFile(img, (err, content) => {
        if(err) {
            res.status(404).json({message: "Image not found"})
        } else {
            res.send(content)
        }
    })
})
router.get("/music/:uri", async(req, res) => {
    const rootDir = require('path').resolve('./');
    const music = rootDir + `/music/${req.params.uri}`

    fs.readFile(music, (err, content) => {
        if(err) {
            res.status(404).json({message: "Music not found"})
        } else {
            res.send(content)
        }
    })
})

module.exports = router

