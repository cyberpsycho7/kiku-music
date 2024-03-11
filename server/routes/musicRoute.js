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
// const moveTmpFiles = async(cover=null, music=null) => {
//     try {
//         if(cover) await fs.move(`./tmp/images/${cover}`, `./images/${cover}`)
//         if(music) await fs.move(`./tmp/images/${music}`, `./images/${music}`)
//     } catch (error) {
//         console.log(error);
//     }
// }


router.post("/music", upload.any(), async(req, res) => {
    try {
        if(req.body.multerError) return res.status(500).json({message: "Multer Error"})
        let {title, uri, releaseDate, duration, authors, isExplicit, lyrics, albumId} = req.body
        let cover;

        let fixedAuthors;
        if(authors) fixedAuthors = authors.split(`,`)

        await mp3Duration(`./tmp/music/${uri}`, function (err, calculatedDuration) {
            duration = calculatedDuration;
        });

        const addedAlready = await Music.findOne({title: title})
        if(addedAlready) {
            removeTmpFiles(null, uri)
            return res.status(400).json({message: "Track is already added."})
        }
        
        const album = await Album.findById(albumId)
        if(!album) {
            removeTmpFiles(null, uri)
            return res.status(404).json({message: "Album with id " + albumId + " not found"})
        } else cover = album.cover
        
        const newMusic = new Music({
            title,
            uri,
            cover,
            releaseDate,
            duration,
            authors: fixedAuthors,
            isExplicit,
            lyrics,
            albumId,
        })
        newMusic.save()

        const updatedTracks = [...album.tracks, `${newMusic._id}`]
        await Album.findByIdAndUpdate(albumId, {tracks: updatedTracks})

        await fs.move(`./tmp/music/${uri}`, `./music/${uri}`)
        res.json(newMusic)
    } catch (error) {
        removeTmpFiles(null, req.body.uri)
        console.log(error);
        res.status(500).json({message: error})
    }
})
router.patch("/music/:id", upload.any(), async(req, res) => {
    try {
        const {title, releaseDate, authors, uri, albumId, isExplicit} = req.body;
        let update = {};

        const music = await Music.findById(req.params.id)
        if(!music) {
            removeTmpFiles(null, uri)
            return res.status(404).json({message: `Music with id ${req.params.id} not found`})
        }

        if(title) {
            if(title.length > 50) {
                removeTmpFiles(null, uri)
                return res.status(400).json({message: "Title must be < 50 letters"})
            }
            update.title = title;
        }
        if(uri) {
            update.uri = uri;
        }
        if(isExplicit) {
            update.isExplicit = isExplicit;
        }
        if(albumId) {
            const album = await Album.findById(albumId)
            if(!album) {
                removeTmpFiles(null, uri)
                return res.status(404).json({message: `Album with id ${albumId} not found`})
            }
            update.albumId = albumId;
        }
        if(releaseDate) {
            update.releaseDate = releaseDate;
        }
        if(authors) {
            let fixedAuthors = authors.split(`,`)    
            update.authors = fixedAuthors;
        }

        const updatedMusic = await Music.findByIdAndUpdate(req.params.id, update, {new: true})

        await fs.move(`./tmp/music/${uri}`, `./music/${uri}`)
        res.json(updatedMusic)
    } catch (error) {
        removeTmpFiles(null, req.body.uri)
        res.status(500).json({message: error.message})
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

        if(title.length > 50) {
            removeTmpFiles(cover, null)
            return res.status(400).json({message: "Title must be < 50 letters"})
        }

        let fixedAuthors;
        if(authors) fixedAuthors = authors.split(`,`)
        let fixedTracks;
        if(tracks) fixedTracks = tracks.split(`,`)

        const newPlaylist = new Playlist({
            title,
            cover,
            releaseDate,
            authors: fixedAuthors,
            tracks: fixedTracks
        })
        newPlaylist.save()

        await fs.move(`./tmp/images/${cover}`, `./images/${cover}`)
        res.json(newPlaylist)
    } catch (error) {
        removeTmpFiles(req.body.cover, null)
        res.status(500).json({message: error.message})
    }
})
router.post("/playlists/:id", async(req, res) => {
    try {
        const {tracks} = req.body;

        let fixedTracks;
        if(tracks) fixedTracks = tracks.split(`,`)

        const playlist = await Playlist.findById(req.params.id)
        if(!playlist) return res.status(404).json({message: `Playlist with id ${req.params.id} not found`})

        const updatedTracks = [...playlist.tracks, ...fixedTracks]

        const updatedPlaylist = await Playlist.findByIdAndUpdate(req.params.id, {
            tracks: updatedTracks,
        }, {new: true})

        res.json(updatedPlaylist)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})
router.patch("/playlists/:id", upload.any(), async(req, res) => {
    try {
        const {title, cover, releaseDate, authors} = req.body;
        let update = {};

        const playlist = await Playlist.findById(req.params.id)
        if(!playlist) {
            removeTmpFiles(cover, null)
            return res.status(404).json({message: `Playlist with id ${req.params.id} not found`})
        }

        if(title) {
            if(title.length > 50) {
                removeTmpFiles(cover, null)
                return res.status(400).json({message: "Title must be < 50 letters"})
            }
            update.title = title;
        }
        if(cover) {
            update.cover = cover;
        }
        if(releaseDate) {
            update.releaseDate = releaseDate;
        }
        if(authors) {
            let fixedAuthors = authors.split(`,`)    
            update.authors = fixedAuthors;
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(req.params.id, update, {new: true})

        await fs.move(`./tmp/images/${cover}`, `./images/${cover}`)
        res.json(updatedPlaylist)
    } catch (error) {
        removeTmpFiles(req.body.cover, null)
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

        if(title.length > 50) {
            removeTmpFiles(cover, null)
            return res.status(400).json({message: "Title must be < 50 letters"})
        }
        
        const addedAlready = await Album.findOne({title: title})
        if(addedAlready) {
            removeTmpFiles(cover, null)
            return res.status(400).json({message: "Album is already added."})
        }

        let fixedAuthors;
        if(authors) fixedAuthors = authors.split(`,`)
        let fixedTracks;
        if(tracks) fixedTracks = tracks.split(`,`)

        const newAlbum = new Album({
            title,
            cover,
            releaseDate,
            authors: fixedAuthors,
            tracks: fixedTracks
        })
        newAlbum.save()

        await fs.move(`./tmp/images/${cover}`, `./images/${cover}`)
        res.json(newAlbum)
    } catch (error) {
        removeTmpFiles(req.body.cover, null)
        res.status(500).json({message: error.message})
    }
})
router.post("/albums/:id", async(req, res) => {
    try {
        const {tracks} = req.body;

        let fixedTracks;
        if(tracks) fixedTracks = tracks.split(`,`)

        const album = await Album.findById(req.params.id)
        if(!album) return res.status(404).json({message: `Album with id ${req.params.id} not found`})

        const updatedTracks = [...album.tracks, ...fixedTracks]

        const updatedAlbum = await album.findByIdAndUpdate(req.params.id, {
            tracks: updatedTracks,
        }, {new: true})

        res.json(updatedAlbum)
    } catch (error) {
        res.status(500).json({message: error.message})
    }
})
router.patch("/albums/:id", upload.any(), async(req, res) => {
    try {
        const {title, cover, releaseDate, authors} = req.body;
        let update = {};

        const album = await Album.findById(req.params.id)
        if(!album) {
            removeTmpFiles(cover, null)
            return res.status(404).json({message: `Album with id ${req.params.id} not found`})
        }

        if(title) {
            if(title.length > 50) {
                removeTmpFiles(cover, null)
                return res.status(400).json({message: "Title must be < 50 letters"})
            }
            update.title = title;
        }
        if(cover) {
            update.cover = cover;
        }
        if(releaseDate) {
            update.releaseDate = releaseDate;
        }
        if(authors) {
            let fixedAuthors = authors.split(`,`)    
            update.authors = fixedAuthors;
        }

        const updatedAlbum = await Album.findByIdAndUpdate(req.params.id, update, {new: true})

        await fs.move(`./tmp/images/${cover}`, `./images/${cover}`)
        res.json(updatedAlbum)
    } catch (error) {
        removeTmpFiles(req.body.cover, null)
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
