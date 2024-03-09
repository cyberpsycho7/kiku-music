const express = require(`express`)
const router = express.Router()
const multer = require("multer")
const Music = require("../models/musicModel")
const Album = require("../models/albumModel")
const Playlist = require("../models/playlistModel")
const upload = require("../helpers/getStorage")
const fs = require("fs-extra")
var mp3Duration = require('mp3-duration');
const getAlbum = require("../helpers/getAlbum")

const removeTmpFiles = async(cover=null, music=null) => {
    try {
        if(cover) await fs.remove(`./tmp/images/${cover}`)
        if(music) await fs.remove(`./tmp/music/${music}`)
    } catch (error) {
        console.log(error);
    }
}

router.post("/music", upload.any(), async(req, res) => {
    try {
        if(req.body.multerError) return res.status(500).json({message: "Multer Error"})
        let {title, uri, cover, releaseDate, duration, authors, isExplicit, lyrics, albumId} = req.body

        await mp3Duration(`./tmp/music/${req.body.uri}`, function (err, calculatedDuration) {
            duration = calculatedDuration;
        });

        const addedAlready = await Music.findOne({title: title})
        if(addedAlready) {
            removeTmpFiles(req.body.cover, req.body.uri)
            return res.status(400).json({message: "Track is already added."})
        }
        
        const isAlbumExists = await Album.findById(albumId)
        if(!isAlbumExists) {
            removeTmpFiles(req.body.cover, req.body.uri)
            return res.status(404).json({message: "Album with id " + albumId + " not found"})
        }

        const newMusic = new Music({
            title,
            uri,
            cover,
            releaseDate,
            duration,
            authors,
            isExplicit,
            lyrics,
            albumId,
        })
        newMusic.save()

        await fs.move(`./tmp/images/${req.body.cover}`, `./images/${req.body.cover}`)
        await fs.move(`./tmp/music/${req.body.uri}`, `./music/${req.body.uri}`)
        res.json(newMusic)
    } catch (error) {
        removeTmpFiles(req.body.cover, req.body.uri)
        console.log(error);
        res.status(500).json({message: error})
    }
})

router.get("/music/:id", async(req, res) => {
    try {
        const id = req.params.id;

        const music = await Music.findById(id)
        if(!music) return res.status(404).json({message: "Music with id " + id + " not found"})
    
        const album = await getAlbum(music.albumId)

        music.albumInfo = album;
    
        res.json(music)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})

router.post("/playlists", upload.any(), async(req, res) => {
    try {
        if(req.body.multerError) return res.status(500).json({message: "Multer Error"})
        const {title, cover, authors, releaseDate, tracks} = req.body;

        const fixedTracks = tracks.split(`,`)

        const newPlaylist = new Playlist({
            title,
            cover,
            releaseDate,
            authors,
            tracks: fixedTracks
        })
        newPlaylist.save()

        await fs.move(`./tmp/images/${req.body.cover}`, `./images/${req.body.cover}`)
        res.json(newPlaylist)
    } catch (error) {
        removeTmpFiles(req.body.cover)
        res.status(500).json({message: error.message})
    }
})

router.get("/playlists/:id", async(req, res) => {
    try {
        const id = req.params.id;

        const playlist = await Playlist.findById(id)
        if(playlist === 404) return res.status(404).json({message: `Playlist with id ${id} not found`})

        let newPlaylistTracks = [];
        for (let el of playlist.tracks) {
            const music = await Music.findById(el)
            const album = await Album.findById(music.albumId)
            music.albumInfo = album;
            newPlaylistTracks.push(music)
        }
        playlist.tracks = newPlaylistTracks
    
        res.json(playlist)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})

router.post("/albums", upload.any(), async(req, res) => {
    try {
        if(req.body.multerError) return res.status(500).json({message: "Multer Error"})
        const {title, cover, authors, releaseDate, tracks} = req.body;

        const addedAlready = await Album.findOne({title: title})
        if(addedAlready) {
            removeTmpFiles(req.body.cover)
            return res.status(400).json({message: "Album is already added."})
        }

        const fixedTracks = tracks.split(`,`)

        const newAlbum = new Album({
            title,
            cover,
            releaseDate,
            authors,
            tracks: fixedTracks
        })
        newAlbum.save()

        await fs.move(`./tmp/images/${req.body.cover}`, `./images/${req.body.cover}`)
        res.json(newAlbum)
    } catch (error) {
        removeTmpFiles(req.body.cover)
        res.status(500).json({message: error.message})
    }
})

router.get("/albums/:id", async(req, res) => {
    try {
        const id = req.params.id;

        const album = await Album.findById(id)
        if(album === 404) return res.status(404).json({message: `Album with id ${id} not found`})

        let newAlbumTracks = []
        for(let el of album.tracks) {
            const music = await Music.findById(el)
            newAlbumTracks.push(music)
        }
        album.tracks = newAlbumTracks;
    
        res.json(album)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})


module.exports = router
