const mongoose = require('mongoose')

const musicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: false,
        default: 0
    },
    uri: {
        type: String,
        required: true
    },
    cover: {
        type: String,
        required: false,
        default: "default-cover.jpg"
    },
    authors: {
        type: Array,
        required: false,
        default: ["unknown"]
    },
    releaseDate: {
        type: String,
        required: false,
        default: null
    },
    isExplicit: {
        type: Boolean,
        required: false,
        default: false
    },
    lyrics: {
        type: String,
        required: false,
        default: ""
    },
    albumId: {
        type: String,
        required: true
    },
    albumInfo: {
        type: Object,
        required: false,
        default: {}
    }
})

module.exports = mongoose.model('Music', musicSchema)