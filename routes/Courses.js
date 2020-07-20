const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const moment = require('moment');
const { ensureAuthenticated } = require('../config/auth');

router.get('/', ensureAuthenticated, async (req, res, next) => {
    const courses = await Course.find({ }).populate("instructorID");
    if(req.cookies.lang === "ar") {
        res.render('Arabic/Courses', { page: 'Courses', courses: courses, moment: moment })
    } else {
        res.render('English/Courses',{ page: 'Courses', courses: courses, moment: moment })
    }
});

module.exports = router;