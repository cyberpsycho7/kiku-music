const mongoose = require('mongoose')
const schema = require("../helpers/albumSchema")

const playlistSchema = new mongoose.Schema(schema)

module.exports = mongoose.model('Playlist', playlistSchema)