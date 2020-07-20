const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const { removeAccount, editProfile, changePassword } = require('../Controllers/Setting');
const { check  } = require('express-validator');
router.get('/', ensureAuthenticated, (req, res, next) => {
    if (req.cookies.lang === "ar") {
        res.render('Arabic/Setting', { page: 'Settings', errors: req.flash('errors') });
    } else {
        res.render('English/Setting', { page: 'Settings', errors: req.flash('errors') });
    }
});
router.post('/removeAccount', ensureAuthenticated, removeAccount);
router.post('/editProfile', ensureAuthenticated, [
    check('fullname').isLength({ min: 6 }).withMessage('Fullname should be more than 6 chars'),
    check("email").isEmail().withMessage("Email must be correct"),
    check("bio").isLength({ max: 255 }).withMessage("Bio should be less than 255 chars"),
    check('phone').isLength({ min: 11, max: 11 }).withMessage('Phonenumber must be 11 chars').isNumeric().withMessage("Phone must be number only"),
    check("username").not().isEmpty().withMessage("Facebook username cannot be empty"),
], editProfile);
router.post('/changePassword', [
    check('oldPassword').not().isEmpty().withMessage("Old password cannot be empty"),
    check('newPassword').not().isEmpty().withMessage("New password cannot be empty"),
    check("confirmPassword").not().isEmpty().withMessage("Confirm password cannot be empty"),
    check("newPassword").custom((value, { req, loc, path }) => {
        if (value !== req.body.confirmPassword) throw new Error("Two passwords are not matched");
        else return value;
    })], changePassword);
module.exports = router;