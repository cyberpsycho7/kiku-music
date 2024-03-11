const schema = {
    title: {
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
        type: Object,
        required: false,
        default: {
            day: null,
            month: null,
            year: null,
        }
    },
    tracks: {
        type: Array,
        required: false,
        default: []
    }
}

module.exports = schema