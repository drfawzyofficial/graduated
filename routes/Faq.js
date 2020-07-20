const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    if(req.cookies.lang === "ar") {
        res.render('arabic/Faq', { page: 'Faq' });
    } else  res.render('english/Faq', { page: 'Faq' });
})

module.exports = router;