const mongoose = require('mongoose');
let chatSchema = new mongoose.Schema({
    roomID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});
let Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;