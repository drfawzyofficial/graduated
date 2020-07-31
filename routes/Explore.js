const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { ensureAuthenticated } = require('../config/auth');
const moment = require("moment");

router.get('/', ensureAuthenticated, async (req, res, next) => {
    if (req.user.role === "Instructor") {
        req.flash('error', 'You are not allowed to visit this page');
        res.redirect('/profile');
    } else {
        const relatedCourses = await Course.find({ coursename: { $in: req.user.tags } });
        const pageCount = Math.ceil(relatedCourses.length / 9)
        if(req.cookies.lang === "ar") {
            res.render('Arabic/Explore',{ page: 'Explore', errors: req.flash('errors'), moment: moment, relatedCourses: relatedCourses, pageCount: pageCount });
        } else {
            res.render('English/Explore',{ page: 'Explore', errors: req.flash('errors'), moment: moment, relatedCourses: relatedCourses , pageCount: pageCount });
        }
    }
    
});


router.get('/process', async(req, res, next) => {
    const courses = await Course.find({ coursename: { $in: req.user.tags } }).limit(9).skip((Number(req.query.pageNo) - 1) * 9).lean().exec()
    res.status(200).json(courses);
})

module.exports = router;