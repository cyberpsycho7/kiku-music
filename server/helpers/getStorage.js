const multer = require("multer")
const Music = require("../models/musicModel")
const Playlist = require("../models/playlistModel")
const Album = require("../models/albumModel")
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if(file.fieldname === 'music') cb(null, `tmp/music/`)
        else if(file.fieldname === 'cover') cb(null, `tmp/images/`)
    },
    filename: async function (req, file, cb) {
        try {
            const fileType = file.originalname.split(".").pop()
            let fixedTitle;
            
            if(!req.body.title) {
                let modelObj;
                const path = req.url.split("/")[1]
                console.log(path);
                if(path === "music") modelObj = await Music.findById(req.params.id)
                else if(path === "playlists") modelObj = await Playlist.findById(req.params.id)
                else if(path === "albums") modelObj = await Album.findById(req.params.id)
                fixedTitle = modelObj.title.replaceAll(' ', '-')
            } else fixedTitle = req.body.title.replaceAll(' ', '-')

            const fileName = "KIKU_" + file.fieldname + `-${fixedTitle}-${Date.now()}.` + fileType
            console.log(fileName);
            if(file.fieldname === 'music') req.body.uri = fileName
            else if(file.fieldname === 'cover') req.body.cover = fileName
            cb(null, fileName)
        } catch (error) {
            console.log(error);
            cb("Multer Error") 
        }
    }
})
const upload = multer({ storage: storage })

module.exports = upload;

