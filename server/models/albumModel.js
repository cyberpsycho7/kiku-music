const mongoose = require('mongoose')
const schema = require("../helpers/albumSchema")

const albumSchema = new mongoose.Schema(schema)

module.exports = mongoose.model('Album', albumSchema)