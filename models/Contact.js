
const mongoose = require('mongoose');
let contactSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    problem: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true
    } 
});
let Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;