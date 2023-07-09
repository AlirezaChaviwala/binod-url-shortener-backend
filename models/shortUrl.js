const mongoose = require('mongoose');
// const castAggregation = require('mongoose-cast-aggregation');

// mongoose.plugin(castAggregation); 

const binodLinkSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    longUrl: {
        type: String,
        required: true
    },
    shortUrl: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    }
});

const BIN = mongoose.model('ShortUrls', binodLinkSchema,'ShortUrls');

module.exports = { BIN};