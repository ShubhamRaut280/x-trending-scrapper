const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema({
    uniqueId: {
        type: String,
        required: true,
        unique: true
    },
    trend1: String,
    trend2: String,
    trend3: String,
    trend4: String,
    trend5: String,
    endTime: {
        type: Date,
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    }
});

const Trend =  mongoose.model('Trend', trendSchema);
module.exports = {Trend};