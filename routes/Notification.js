const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { ensureAuthenticated } = require('../config/auth');
const moment = require("moment");

router.get('/', ensureAuthenticated, async (req, res, next) => {
    if (req.user.role === "Instructor") {
        req.flash('error', 'You are not allowed to visit this page');
        res.redirect('/profile');
    } else {
        const notifications = await Notification.find({ userID: req.user.id }).populate('courseID');
        res.render('English/Notification', { page: 'Notification', moment: moment, notifications: notifications  });
    }
    
});


module.exports = router;