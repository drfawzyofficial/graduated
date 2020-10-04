const mongoose = require('mongoose');
let transactionSchema = new mongoose.Schema({
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    }
});
let Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;