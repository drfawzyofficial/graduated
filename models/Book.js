const mongoose = require('mongoose');
let bookedSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    }
});
let Book = mongoose.model('Book', bookedSchema);
module.exports = Book;