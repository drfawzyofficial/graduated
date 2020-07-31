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
        const courses = await Course.find();
        const pageCount = Math.ceil(courses.length / 9)
        if (req.cookies.lang === "ar") {
            res.render('Arabic/Courses', { page: 'Courses', errors: req.flash('errors'), moment: moment, pageCount: pageCount, coursename: undefined, courseprice: undefined, centerlocation: undefined });
        } else {
            res.render('English/Courses', { page: 'Courses', errors: req.flash('errors'), moment: moment, pageCount: pageCount, coursename: 'undefined', courseprice: 'undefined', centerlocation: 'undefined' });
        }
    }

});

router.get('/process', async (req, res, next) => {
    const { pageNo, coursename, courseprice, centerlocation } = req.query;
    console.log(coursename);
    var conditions;
    if (coursename === 'undefined' || courseprice === 'undefined' || centerlocation === 'undefined')
        conditions = {};
    else conditions = { coursename: coursename, courseprice: Number(courseprice), centerlocation: centerlocation }
    const courses = await Course.find(conditions).limit(9).skip((Number(pageNo) - 1) * 9).lean().exec();
    res.json(courses);
})

router.get('/filter', async (req, res, next) => {
    console.log(req.body);
    const { coursename, courseprice, centerlocation } = req.query;
    const conditions = { coursename: coursename, courseprice: Number(courseprice), centerlocation: centerlocation }
    const courses = await Course.find(conditions);
    const pageCount = Math.ceil(courses.length / 9)
    res.render('English/Courses', { page: 'Courses', errors: req.flash('errors'), moment: moment, pageCount: pageCount, coursename: 'Linux', courseprice: 50, centerlocation: 'Ismailia' })
    res.json(courses.slice(0, 9));
});



module.exports = router;