const mongoose = require("mongoose")
const Album = require("../models/albumModel")
const Music = require("../models/musicModel")

const getAlbum = async(albumId) => {
    const album = await Album.findById(albumId);
    if(!album) return 404

    const tracks = await Music.find({albumId: albumId});
    album.tracks = tracks;

    return album;
}

module.exports = getAlbum;