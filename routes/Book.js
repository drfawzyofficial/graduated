const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { ensureAuthenticated } = require('../config/auth');
const moment = require("moment");

router.get('/', ensureAuthenticated, async (req, res, next) => {
    if (req.user.role === "Instructor") {
        req.flash('error', 'You are not allowed to visit this page');
        res.redirect('/profile');
    } else {
        const bookedCourses = await Book.find({ userID: req.user.id }).populate('courseID');
        if(req.cookies.lang === "ar") {
            res.render('Arabic/Book', { page: 'Book', moment: moment, bookedCourses: bookedCourses  });
        } else {
            res.render('English/Book', { page: 'Book', moment: moment, bookedCourses: bookedCourses  });
        }
    }
    
});


module.exports = router;