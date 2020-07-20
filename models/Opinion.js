const mongoose = require('mongoose')
const opinionSchema = new mongoose.Schema({
    opinionContent: {
        type: String,
        required: true
    }
}, { timestamps: true });

let Opinion = mongoose.model('Opinion', opinionSchema);
module.exports = Opinion;