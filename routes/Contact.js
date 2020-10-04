const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const validator = require('validator');

// Post Request to /contact
router.post('/', async(req, res, next) => {
    try {
        const { email, problem, message } = req.body;

        if (!validator.isEmail(email)) {
            res.status(400).json({ statusCode: 400, msg: "Email must be valid" })
        }
        
        await new Contact({
            email: email,
            problem: problem,
            message: message
        }).save();
        
        res.status(200).json({ statusCode: 200, msg: "Problem has been sent successfully" })
    } catch(err) {
        res.status(500).json({ statusCode: 500, msg: err.message })
    }
});


module.exports = router;