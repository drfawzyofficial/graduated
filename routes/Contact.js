const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const User = require('../models/User');
const validator = require('validator');

// Post Request to /contact
router.post('/', async(req, res, next) => {
    try {
        const { email, problem, message } = req.body;

        if (!validator.isEmail(email)) {
            res.status(400).json({ statusCode: 400, msg: "Email must be valid" })
        }

        if (!validator.isLength(message, { min: 40, max: 255 })) {
             res.status(400).json({ statusCode: 400, msg: "Message must be in range[40-255]" })
        }

        let user = await User.findOne({ email: email });
        if (!user) return res.status(404).json({ statusCode: 404, msg: "The email is not already exist" })

        let contact = await Contact.findOne({ email: email });
        if (contact) return res.status(400).json({ statusCode: 400, msg: "You can send again after reviewing" })

        await new Contact({
            email: email,
            fullname: user.fullname,
            gender: user.gender,
            location: user.location,
            problem: problem,
            message: message
        }).save();
        
        res.status(200).json({ statusCode: 200, msg: "Problem has been sent successfully" })
    } catch(err) {
        res.status(500).json({ statusCode: 500, msg: err.messag })
    }
});


module.exports = router;