const mongoose = require('mongoose');
let courseSchema = new mongoose.Schema({
    instructorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    users: [{ 
        type : mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    coursename: {
        type: String,
        required: true
    },
    coursebio: {
        type: String,
        required: true
    },
    courseprice: {
        type: Number,
        required: true
    },
    courselimited: {
        type: Number,
        required: true
    },
    coursestart: {
        type: Date,
        required: true,
    },
    courseend: {
        type: Date,
        required: true
    },
    coursevideo: {
        type: String,
        default: 'coursevideo.mp4'
    },
    centerlocation: {
        type: String,
        required: true
    },
    centerplace: {
        type: String,
        required: true
    },
    centerphoto: {
        type: String,
        default: 'coursephoto.jpg'
    },
    paymentStatus: {
        type: String,
        required: true,
        default: 'start'
    }
});
let Course = mongoose.model('Course', courseSchema);
module.exports = Course;