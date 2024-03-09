const multer = require("multer")
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if(file.fieldname === 'music') cb(null, `tmp/music/`)
        else if(file.fieldname === 'cover') cb(null, `tmp/images/`)
    },
    filename: function (req, file, cb) {
        try {
            const fileType = file.originalname.split(".").pop()
            const fixedTitle = req.body.title.replaceAll(' ', '-')
            const fileName = "KIKU_" + file.fieldname + `-${fixedTitle}-${Date.now()}.` + fileType
            console.log(fileName);
            if(file.fieldname === 'music') req.body.uri = fileName
            else if(file.fieldname === 'cover') req.body.cover = fileName
            cb(null, fileName)
        } catch (error) {
            cb("Multer Error") 
        }
    }
})
const upload = multer({ storage: storage })

module.exports = upload;

