const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, 'Fullname is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        match: /^\w+([-+.]\w+)*@((yahoo|gmail)\.com)$/
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'User phone number is required'],
        unique: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim:  true
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        trim: true
    },
    username: {
        type: String,
        required: true,
        default: 'demo'
    },
    avatar: {
        type: String,
        required: true,
        default: 'avatar.jpg'
    },
    fromStatus: {
        type: String,
        required: true,
        default: 'reservation'
    },
    accountToken: {
        type: String,
        required: true
    },
    accountVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    accountActive: {
        type: Boolean,
        required: true,
        default: true
    },
    role: {
        type: String,
        required: true
    },
    mainRole: {
        type: String
    },
    bio: {
        type: String
    },  
    tags: {
        type: [String],
        required: [true, 'Tags are required'],
        default: ['English', 'Arabic', 'Maths'],
        validate: {
            validator: function (v) {
                return v.length > 0 &&  v.length <= 5 
            },
            message: 'You must provide tags in range [1 - 5]'
        }
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
})
userSchema.pre('save', function(next) {
    if (this.role == 'User') {
      this.bio = `Hello ${ this.fullname } User. We would like to be happy with this website. Be sure that your data is correct before booking Course`;
      this.mainRole = 'User';
    } else {
      this.bio = `Hello ${ this.fullname } Instructor. We would like to be happy with this website. Be sure that your data is correct as there are lots of students may book with you and you can deal with your special dashboard. Publish your first course now`;
      this.mainRole = 'Instructor';
    }
    next();
});
let User = mongoose.model('User', userSchema)
module.exports = User

