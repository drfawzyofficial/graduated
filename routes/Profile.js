const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/User');
const Course = require('../models/Course');
// const Review = require('../models/Review');
const { check, validationResult } = require('express-validator');
const { ensureAuthenticated } = require('../config/auth');
const multer = require('multer');
const moment = require("moment");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

router.get('/search', function (req, res) {
    Course.find({ coursename: { $regex: '.*' + req.query.key + '.*' } }).limit(5).exec((err, courses) => {
        if (err) console.log(err);
        else res.send(courses);
    })
});
router.get('/', ensureAuthenticated, async (req, res, next) => {
    const users = await User.aggregate([ { $match: { _id: {$ne: mongoose.Types.ObjectId(req.user.id)}, role: "User" } }, { $sample: { size:  20 } } ]);
    const instructors = await User.aggregate([ { $match: { _id: {$ne: mongoose.Types.ObjectId(req.user.id) }, role: "Instructor" } }, { $sample: { size:  20 } } ])
    const courses = await Course.aggregate([  { $sample: { size:  20 } } ]);
    // const courses = await Course.find({ }).populate("instructorID");
    // let arrOfCourses = [];
    // for (let i = 0; i < courses.length; i = i + 2) {
    //     arrOfCourses.push(courses.slice(i, i + 2));
    // }
    if(req.cookies.lang === "ar") {
        res.render('Arabic/Profile',{ page: 'Profile', errors: req.flash('errors'), moment: moment, users: users, instructors: instructors, courses: courses });
    } else {
        res.render('English/Profile',{ page: 'Profile', errors: req.flash('errors'), moment: moment, users: users, instructors: instructors, courses: courses });
    }
});
router.get('/reviews/:instructorID', async (req, res, next) => {
    if (req.params.instructorID.match(/^[0-9a-fA-F]{24}$/)) {
        const instructor =  await User.findById({ _id: req.params.instructorID });
        const reviewsCount = await Review.find({ instructorID: req.params.instructorID }).count({ });
        const courses = await Course.find({ instructorID: req.params.instructorID });
        const pageCount = Math.ceil(reviewsCount / 5)
        if(req.query.pageNo === undefined || req.query.pageNo <= 0 || req.query.pageNo > pageCount) req.query.pageNo = 1;
        res.render('review', {instructor: instructor, courses: courses, pageCount: pageCount, pageNo: req.query.pageNo, errors: req.flash('errors') })
    } else {
        req.flash("error", "Something wrong happened");
        res.redirect("/user/profile");
    }
})
router.post("/profile/changeRoleToUser", (req, res, next) => {
    if(req.user.role === "Instructor") {
        User.findByIdAndUpdate({ _id: req.user.id }, { role: "User" }, { new: true }, (err, resDB) => {
            if(err) console.log(err.message);
            else {
                console.log(`${resDB} has been updated successfully`);
                req.flash("success", "Your role has been changed to User successfully");
                res.redirect("/user/profile");
            }
        })
    } else {
        req.flash("error", "This is a service for only Instructors");
        res.redirect("/user/profile");
    }
});
router.post("/profile/changeRoleToInstructor", (req, res, next) => {
    if(req.user.role === "Instructor") {
        User.findByIdAndUpdate({ _id: req.user.id }, { role: "Instructor" }, { new: true }, (err, resDB) => {
            if(err) console.log(err.message);
            else {
                console.log(`${resDB} has been updated successfully`);
                req.flash("success", "Your role has been changed to Instructor successfully");
                res.redirect("/user/profile");
            }
        })
    } else {
        req.flash("error", "This is a service for only Instructors");
        res.redirect("/user/profile");
    }
});
router.post('/profile/reviews/:instructorID', [
    check('feedback').not().isEmpty().withMessage("Comment cannot be empty").isLength({ max: 255 }).withMessage("Maximum chars are 255"),
    check('rating').isIn(["1", "2", "3", "4", "5"]).withMessage("Rating must be between 1 and 5")
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        res.redirect(`/user/profile/reviews/${req.params.instructorID}`);
    } else {
        new Review({
            instructorID: req.params.instructorID,
            userID: req.user.id,
            comment: req.body.feedback,
            stars: Number(req.body.rating)
        }).save((err, result) => {
            if(err) throw new Error(err.message);
            else {
                console.log(`${result} is saved to mongoDB`);
                req.flash("success", "Your feedback has been arrived to the instructor");
                res.redirect(`/user/profile/reviews/${req.params.instructorID}`);
            }
        })
    }
});

router.post("/profile", (req, res, next) => {
    let myQuery = {};
    if (req.body.coursename === "all") myQuery = { coursename: { $ne: req.body.coursename }, courseprice: Number(req.body.courseprice) }
    else myQuery = { coursename: req.body.coursename + " Course", courseprice: Number(req.body.courseprice) }
    Course.find(myQuery, (err, courseDocs) => {
        if (err) console.log(err.message);
        else {
            console.log(courseDocs.length);
            let arrOfCourses = [];
            for (let i = 0; i < courseDocs.length; i = i + 2) {
                arrOfCourses.push(courseDocs.slice(i, i + 2));
            }
            res.render('profile', { errors: req.flash('errors'), courseDocs: arrOfCourses, moment: moment });
        }
    });
});




router.post('/emailVerification', (req, res, next) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'AbdulrahmanFawzy999@gmail.com',
            pass: 'sxgqljelmksfsuuo'
        }
    });
    let mailOptions = {
        from: 'Ostazy',
        to: `${ req.user.email }`,
        subject: 'Email Verification',
        html: `
         <h3> How are you ${ req.user.fullname }? We hope that you are good </h3>
            <p>
            <span> To verify your email follow this link:  </span>
            <a href="http://localhost:3000/profile/verifyEmail/${ req.user.id }" target="_blank"> Verify now </a>
           </p>
        `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    req.flash('success', 'A Message has been sent to your email');
    res.redirect('/profile');
    next();
});
router.get('/verifyEmail/:id', (req, res, next) => {
    if (req.isAuthenticated() === false) {
        req.flash("error", "Home Login first to verify your email");
        res.redirect('/');
    } else {
        if(req.user.id === req.params.id) {
            User.findByIdAndUpdate({ _id: req.user.id }, { accountVerified: true }, (err, Doc) => {
                if (err) console.log(err.message);
                else {
                    req.flash('success', `Your Email ${Doc.email} has been verified successfully`);
                    res.redirect('/profile');
                }
            });
        } else {
             req.flash('error', `Something wrong happened`);
             res.redirect('/profile');
        }
    }
});


const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'assets/uploads')
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + `${path.extname(file.originalname)}`);
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext === '.png' || ext === '.jpg' || ext === '.gif' || ext === '.jpeg') callback(null, true)
        else return callback(new Error('Only images with png, jpg, gif or jpeg are allowed'))
    }
}).single('avatar');

router.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/profile');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/profile');
            } else {
                User.updateOne({ _id: req.user.id }, { avatar: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The photo is updatted successfully');
                        res.redirect('/profile');
                    }
                })
            }
        }
    })
});

router.get('/logout', (req, res, next) => {
    User.findByIdAndUpdate({ _id: req.user.id }, { accountActive: false })
        .then((Doc) => console.log('Updated'))
        .catch((err) => console.log(err.message))
    req.logOut();
    req.flash('success', 'Home You are log out now');
    res.redirect('/');
});

module.exports = router;