const express = require('express');
const router = express.Router();
const Course = require('../models/Course')
const Chat = require('../models/Chat');
const moment = require("moment");
const { ensureAuthenticated } = require('../config/auth');
router.get('/:courseID', ensureAuthenticated, async (req, res, next) => {
    try {
        if (!req.params.courseID.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash("error", "Something wrong happened");
            res.redirect(`/profile`);
        }
        const course = await Course.findById({ _id: req.params.courseID }).populate("instructorID").populate("users");

        if (!course) {
            req.flash("error", "The Course you visit is not found");
            res.redirect("/profile");
        }
       
        if (req.user.id == course.instructorID._id) {
            return res.render("English/Chat", { course, moment });
        }

        for (var i = 0; i < course.users.length; i++) {
            if (req.user.id == course.users[i]._id) {
                return res.render("English/Chat", { course, moment });
               
            }
        }
        if (i == course.users.length) {
            req.flash("error", "You are not a member of this course");
            return res.redirect("/profile");
        }

    } catch (err) {
        console.log(`Compelted Error ${err}`);
        console.log(`Message Error ${err.message}`)
        req.flash("error", "Something wrong happened");
        res.redirect(`/profile`);
    }
});

router.post('/fetchMessages', ensureAuthenticated, async (req, res, next) => {
    try {
        let chatMessages = await Chat.find({ roomID: req.body.roomID }).populate("userID");
        res.status(200).json(chatMessages);
    } catch(err) {
        res.status(500).json({
            statusCode: 500,
            msgDev: `Interal Server Error ${ err.message }`,
            msgUser: 'Something went wrong'
        })
    }
    
});


module.exports = router;
