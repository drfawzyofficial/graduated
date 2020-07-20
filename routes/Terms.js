const express = require('express');
const router = express.Router();
const { forwardAuthenticated } = require('../config/auth');
// Get Request to /terms
router.get('/', forwardAuthenticated, (req, res, next) => {
    if(req.cookies.lang === "ar") {
        res.render('Arabic/Terms', { page: 'Terms' }); 
    } else {
        res.render('English/Terms', { page: 'Terms' });
    }
});
module.exports = router;