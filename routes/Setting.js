const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { ensureAuthenticated } = require('../config/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Book = require('../models/Book');
const { check, validationResult } = require('express-validator');
const Review = require('../models/Review');
router.get('/', ensureAuthenticated, (req, res, next) => {
    if (req.cookies.lang === "ar") {
        res.render('Arabic/Setting', { page: 'Settings' });
    } else {
        res.render('English/Setting', { page: 'Settings' });
    }
});
router.post('/removeAccount', ensureAuthenticated, async (req, res, next) => {
    try {

        var course, bookedCourse;

        if(req.user.role === "Instructor") { 
            course = await Course.findOne({ instructorID: req.user.id });
        }

        if(req.user.role === "User") {
            bookedCourse = await Book.findOne({ userID: req.user.id });
        }

        if(course || bookedCourse) {
            req.flash("error", "You cannot remove your account because you have course/courses");
            return res.redirect("/settings");
        }
        await Review.deleteMany({ userID: req.user.id });
        let removedUser = await User.findByIdAndRemove({ _id: req.user.id });
        console.log(`${removedUser} has been removed successfully`);
        req.flash("success", "Home Your Account has been removed successfully");
        res.redirect("/");
        
    } catch (err) {
        console.error(err.message);
        req.flash("error", "Home Something went wrong");
        res.redirect("/");
    }
});

router.post('/editProfile', ensureAuthenticated, [
    check('fullname').isLength({ min: 6 }).withMessage('Fullname should be more than 6 chars'),
    check("email").isEmail().withMessage("Email must be correct"),
    check("bio").isLength({ max: 255 }).withMessage("Bio should be less than 255 chars"),
    check('phone').isLength({ min: 11, max: 11 }).withMessage('Phonenumber must be 11 chars').isNumeric().withMessage("Phone must be number only"),
    check("username").not().isEmpty().withMessage("Facebook username cannot be empty"),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('errors', errors.array());
            res.redirect('/settings');
        } else {
            const { fullname, email, bio, location, gender, phone, username } = req.body;
            const fetchedTags = await User.findById({ _id: req.user.id });
            var initialTags = [];
            if (req.user.role === "User") initialTags = req.body.tags.split(",");
            else initialTags = fetchedTags.tags;

            let currentEmail = "";
            User.findById({ _id: req.user.id }, (err, user) => {
                if (err) console.log(err);
                else {
                    currentEmail = user.email;
                }
            });
            User.findOne({ _id: { $ne: req.user.id }, email: email }, (err, user) => {
                if (err) console.log(err.message);
                if (user) {
                    req.flash("error", "Email is already exist");
                    res.redirect("/settings");
                } else {
                    User.findByIdAndUpdate({ _id: req.user.id }, { fullname: fullname, email: email, bio: bio, location: location, gender: gender, phone: phone, username: username, tags: initialTags }, { new: true }, (err, user) => {
                        if (err) console.log(err.message);
                        else {
                            if (currentEmail !== user.email) {
                                User.findByIdAndUpdate({ _id: req.user.id }, { accountVerified: false }, { "new": true }, (err, user) => {
                                    if (err) console.log(err);
                                    else console.log(`accountVerified is set to ${user.accountVerified}`);
                                });
                            }
                            req.flash("success", "Data is updated successfully");
                            res.redirect("/settings");
                        }
                    })
                }
            })

        }
    } catch (err) {
        console.error(err.message);
        req.flash("error", err.message);
        res.redirect("/settings");
    }
});

router.post('/changePassword', [
    check('oldPassword').not().isEmpty().withMessage("Old password cannot be empty"),
    check('newPassword').not().isEmpty().withMessage("New password cannot be empty"),
    check("confirmPassword").not().isEmpty().withMessage("Confirm password cannot be empty"),
    check("newPassword").custom((value, { req, loc, path }) => {
        if (value !== req.body.confirmPassword) throw new Error("Two passwords are not matched");
        else return value;
    })], async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('errors', errors.array());
            res.redirect('/settings');
        } else {
            bcrypt.compare(req.body.oldPassword, req.user.password, async (err, result) => {
                if (err) console.log(err.message);
                else {
                    if (result) {
                        User.findByIdAndUpdate({ _id: req.user.id }, { password: await bcrypt.hash(req.body.newPassword, 10) }, { "new": true })
                            .then((user) => {
                                console.log(`${user.fullname} Password has been changes successfully`);
                                req.flash("success", "Password has been changed successfully");
                                res.redirect("/settings");
                            })
                            .catch((err) => console.log(err.message))
                    } else {
                        req.flash("error", "Old Password is wrong");
                        res.redirect("/settings");
                    }
                }
            });
        }
    });

router.post('/changeSpecialization', async (req, res, next) => {
    User.findByIdAndUpdate({ _id: req.user.id }, { specialized: req.body.field })
        .then((user) => {
            console.log(`${user.fullname} Password has been changes successfully`);
            req.flash("success", "Field has been updated successfully");
            res.redirect("/settings");
        })
        .catch((err) => {
            console.log(err.message);
            req.flash('error', 'Something went wrong');
            res.redirect('/settings');
        })
        .finally(() => "Code is written with Love");
});



module.exports = router;