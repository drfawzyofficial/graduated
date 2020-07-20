const express = require('express');
const router = express.Router();
const { forwardAuthenticated } = require('../config/auth');

// Get Request to /privacy
router.get('/', forwardAuthenticated, (req, res, next) => {
    if(req.cookies.lang === "ar") {
        res.render('Arabic/Privacy', { page: 'Privacy' }); 
    } else {
        res.render('English/Privacy', { page: 'Privacy' });
    }
});

module.exports = router;