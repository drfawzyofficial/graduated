const express = require('express');
const router = express.Router();
const { forwardAuthenticated } = require('../config/auth');
router.get('/', forwardAuthenticated, (req, res, next) => {
    if(req.cookies.lang === "ar") {
        res.render('Arabic/About', { page: 'About' }); 
    } else {
        res.render('English/About', { page: 'About' });
    }
});
module.exports = router;