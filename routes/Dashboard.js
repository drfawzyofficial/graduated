const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/User');
const Course = require('../models/Course');
const { ensureAuthenticated } = require('../config/auth');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const moment = require("moment");
const UsersService = require('../UsersService')
const userService = new UsersService()


// Get Request to Dashboard
router.get('/', ensureAuthenticated, async (req, res, next) => {
    
    if(req.cookies.lang === "ar") {
        if (req.isAuthenticated() && req.user.role === "User") res.redirect("Arabic/profile");
        else {
            let courseDocs = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users");
            res.render("Arabic/Dashboard", { errors: req.flash("errors"), courseDocs: courseDocs, moment: moment });
        }
    } else {
        if (req.user.role === "User") {
            req.flash('error', 'You are not allowed to visit this page');
            res.redirect('/profile');
        }
    else {
        let courseDocs = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users");
        res.render("English/Dashboard", { errors: req.flash("errors"), courseDocs: courseDocs, moment: moment });
    }
    }
    
})
router.post('/addCourse', [
    check('coursename').not().isEmpty().withMessage("Course Name cannot be empty"),
    // check('coursebio').not().isEmpty().withMessage("Course Bio cannot be empty"),
    check("courseprice").not().isEmpty().isNumeric().withMessage("Course Price should be with value its value is number"),
    check('courselimited').not().isEmpty().isNumeric().withMessage("Course Limited should be with value its value is number"),
    check("coursestart").not().isEmpty().withMessage("Course Start cannot be empty"),
    check("courseend").not().isEmpty().withMessage("Course End cannot be empty"),
    check("centerplace").not().isEmpty().withMessage("Center Place cannot be empty"),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('errors', errors.array());
        res.redirect('/dashboard');
    } else {
        new Course({
            instructorID: req.user.id,
            coursename: req.body.coursename,
            coursebio: req.body.quillContent,
            courseprice: req.body.courseprice,
            courselimited: req.body.courselimited,
            coursestart: req.body.coursestart,
            courseend: req.body.courseend,
            centerlocation: req.body.centerlocation,
            centerplace: req.body.centerplace
        }).save(async (err, course) => {
            if (err) console.log(err.message);
            else {
                console.log(`${course.coursename} has been added successfully`);
                const users = await  User.find({ role: 'User' });
                users.forEach((user) => {
                    if((user.tags).includes(course.coursename)) {
                       new Notification({
                        courseID: course._id,
                        userID: user._id
                       }).save()
                        var users = userService.getUsersById(user._id)
                        for(var i = 0; i < users.length; i++) {
                            req.app.get("io").to(users[i].socketID).emit('courseData', {coursename: course.coursename, courseID: course._id})
                        }
                    }
                  })
                req.flash("success", "Course has been added successfully");
                res.redirect("/dashboard");
            }
        })
    }
});
router.post("/acceptUser", (req, res, next) => {
    Course.update({ instructorID: req.user.id, _id: req.body.courseID, 'users.userID': req.body.userID }, { '$set': { 'users.$.acceptanceStatus': true } }, function (err) {
        if (err) console.log(err.message);
        else {
            req.flash("success", " The User has been member of the group");
            res.redirect("/dashboard");
        }
    })
})
router.post("/removeCourse", (req, res, next) => {
    Course.findByIdAndRemove({ _id: req.body.courseID }, (err) => {
        if (err) console.log(err.message);
        else {
            console.log("Course has been removed successfully");
            req.flash("success", "Your course has been removed successfully");
            res.redirect("/dashboard");
        }
    })
});
router.post("/emptyUsers", (req, res, next) => {
    Course.findByIdAndUpdate({ _id: req.body.courseID }, { users: [] }, { "new": true }, (err, course) => {
        if (err) console.log(err.message);
        else {
            console.log(`${course} has been updated`);
            req.flash("success", "Users are empty now");
            res.redirect("/dashboard");
        }
    })
});
// Here is for uploading photo for the center
const storagePhotoForCenter = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'assets/centerphotos')
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + `${path.extname(file.originalname)}`);
    }
})

const uploadPhotoForCenter = multer({
    storage: storagePhotoForCenter,
    limits: { fileSize: 1024 * 1024 },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext === '.png' || ext === '.jpg' || ext === '.gif' || ext === '.jpeg') callback(null, true)
        else return callback(new Error('Only images with png, jpg, gif or jpeg are allowed'))
    }
}).single('centerphoto');
router.post("/uploadCenterPhoto/:id", (req, res, next) => {
    uploadPhotoForCenter(req, res, (err) => {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/profile');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/dashboard');
            } else {
                Course.updateOne({ _id: req.params.id }, { centerphoto: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The photo is updatted successfully');
                        res.redirect('/dashboard');
                    }
                })
            }
        }
    })
});
// Here is for uploading video for the course
const storageVideoForCourse = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'assets/coursevideos')
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + `${path.extname(file.originalname)}`);
    }
})

const uploadVideoForCourse = multer({
    storage: storageVideoForCourse,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext === '.mp4' || ext === '.mpg' || ext === '.gif' || ext === '.webm') callback(null, true)
        else return callback(new Error('Only videos with mp4, mpg, gif or webm are allowed'))
    }
}).single('coursevideo');
router.post("/uploadCourseVideo/:id", (req, res, next) => {
    uploadVideoForCourse(req, res, (err) => {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/profile');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/dashboard');
            } else {
                Course.updateOne({ _id: req.params.id }, { coursevideo: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The video is updatted successfully');
                        res.redirect('/dashboard');
                    }
                })
            }
        }
    })
});

module.exports = router;
