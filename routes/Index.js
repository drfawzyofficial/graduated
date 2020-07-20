const express = require('express');
const router = express.Router();
const { forwardAuthenticated } = require('../config/auth');

router.get('/', forwardAuthenticated, async (req, res, next) => {
    if(req.cookies.lang === "ar") {
        res.render('Arabic/Index', { page: 'Ostazy' }); 
    } else {
        res.render('English/Index', { page: 'Ostazy' });
    }
});

router.post('/', (req, res, next) => {
    res.cookie('lang', 'en');
    res.redirect('/');
})

router.post('/ar', (req, res, next) => {
    res.cookie('lang', 'ar');
    res.redirect('/');
})

module.exports = router;
