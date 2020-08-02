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

    if (req.cookies.lang === "ar") {
        if (req.isAuthenticated() && req.user.role === "User") res.redirect("Arabic/profile");
        else {
            let courseDocs = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users");
            res.render("Arabic/Seso", { errors: req.flash("errors"), courseDocs: courseDocs, moment: moment });
        }
    } else {
        if (req.user.role === "User") {
            req.flash('error', 'You are not allowed to visit this page');
            res.redirect('/profile');
        }
        else {
            const courses = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users");
            res.render("English/Seso", { content: 'dashboard', errors: req.flash("errors"), courses: courses, moment: moment });
        }
    }

})

// Get Request to Content
router.get('/:content', ensureAuthenticated, async (req, res, next) => {
    const content = req.params.content;
    if (req.cookies.lang === "ar") {
        if (req.isAuthenticated() && req.user.role === "User") res.redirect("Arabic/profile");
        else {
            let courseDocs = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users");
            res.render("Arabic/Seso", { errors: req.flash("errors"), courseDocs: courseDocs, moment: moment });
        }
    } else {
        if (req.user.role === "User") {
            req.flash('error', 'You are not allowed to visit this page');
            res.redirect('/profile');
        }
        else {
            const courses = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users");
            res.render("English/Seso", { content: content, errors: req.flash("errors"), courses: courses, moment: moment });
        }
    }

})

router.post('/publish', async (req, res, next) => {
    try {
        console.log(req.body);
        const { coursename, coursecontent, courseprice, limitedUsers, coursestart, courseend, centerlocation, centerplace } = req.body;
        if (!coursename || !coursecontent || !courseprice || !limitedUsers || !coursestart || !courseend || !centerlocation || !centerplace) {
            return res.status(400).json({
                statusCode: 400,
                msgDev: 'Input Validation Error',
                msgUser: 'All Inputs must be filled'
            });

        }
        let addedCourse = await new Course({
            instructorID: req.user.id,
            coursename: coursename,
            coursebio: coursecontent,
            courseprice: courseprice,
            courselimited: limitedUsers,
            coursestart: coursestart,
            courseend: courseend,
            centerlocation: centerlocation,
            centerplace: centerplace
        }).save();

        res.status(200).json({
            statusCode: 200,
            course: addedCourse,
            msgDev: 'Document has been added to mongoDB',
            msgUser: 'Course has been created successfully'
        });
        // const users = await User.find({ role: 'User' });
        // users.forEach((user) => {
        //     if ((user.tags).includes(course.coursename)) {
        //         new Notification({
        //             courseID: course._id,
        //             userID: user._id
        //         }).save()
        //         var users = userService.getUsersById(user._id)
        //         for (var i = 0; i < users.length; i++) {
        //             req.app.get("io").to(users[i].socketID).emit('courseData', { coursename: course.coursename, courseID: course._id })
        //         }
        //     }
        // })
    } catch (err) {
        console.log(`Compelted Error `, err);
        console.log(`Error Message is ${err.message}`);
        res.status(500).json({
            statusCode: 500,
            msgDev: 'Internal Server Error',
            msgUser: 'Something went wrong'
        });
    }
});

router.post('/control/removeCourse', async (req, res, next) => {
    try {
        console.log(req.body);
        const courseID = req.body.courseID;
        if (!courseID.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                statusCode: 400,
                msgDev: 'courseID is wrong as it does not match the _id standard',
                msgUser: 'Something went wrong'
            });
        }
        const course = await Course.findOne({ _id: courseID });
        if(!course) {
            return res.status(404).json({
                statusCode: 404,
                msgDev: 'Course is not found mongoDB Collection',
                msgUser: 'Something went wrong'
            });
        }
        if(course.instructorID != req.user.id) {
            return res.status(400).json({
                statusCode: 400,
                msgDev: 'Try to delete another course',
                msgUser: 'Course is not related to you'
            });
        }
        
        if(course.users.length > 0 && moment(course.courseend).valueOf() > Date.now()) {
            return res.status(400).json({
                statusCode: 400,
                msgDev: 'Number of enrolled users is greater than 0',
                msgUser: 'Cannot delete course due to enrolled users'
            });
        }

        const removedCourse = await Course.findByIdAndRemove({ _id: course._id });
        return res.status(200).json({
            statusCode: 200,
            removedCourse: removedCourse,
            msgDev: 'Course has been removed from mongoDB Course Collection',
            msgUser: 'Course has been deleted successfully'
        });
       

    } catch (err) {
        console.log(`Compelted Error `, err);
        console.log(`Error Message is ${err.message}`);
        res.status(500).json({
            statusCode: 500,
            msgDev: 'Internal Server Error',
            msgUser: 'Something went wrong'
        });
    }
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
router.post("/control/uploadCenterPhoto", (req, res, next) => {
    uploadPhotoForCenter(req, res, (err) => {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/seso/control');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/seso/control');
            } else {
                Course.updateOne({ _id: req.body.courseID }, { centerphoto: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The photo is updated successfully');
                        res.redirect('/seso/control');
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
router.post("/control/uploadCourseVideo", (req, res, next) => {
    uploadVideoForCourse(req, res, (err) => {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/seso/control');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/seso/control');
            } else {
                Course.updateOne({ _id: req.params.id }, { coursevideo: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The video is updated successfully');
                        res.redirect('/seso/control');
                    }
                })
            }
        }
    })
});

router.post('/control/editCourse', async (req, res, next) => {
    try {
        
        const { courseID, coursename, coursecontent, courseprice, limitedUsers, coursestart, courseend, centerlocation, centerplace } = req.body;
        if (!courseID || !coursename || !coursecontent || !courseprice || !limitedUsers || !coursestart || !courseend || !centerlocation || !centerplace) {
            req.flash('error', 'All Inputs must be filled');
            res.redirect('/seso/control');

        }

        if (!courseID.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash('error', 'Something went wrong');
            res.redirect('/seso/control');
        }

        const course = await Course.findOne({ _id: courseID });
        if(!course) {
            req.flash('error', 'Course is not found');
            res.redirect('/seso/control');
        }
        
        if(course.instructorID != req.user.id) {
            req.flash('error', 'Course is not related to you');
            res.redirect('/seso/control');
        }
        

        if(course.users.length > 0 && moment(course.courseend).valueOf() > Date.now()) {
            req.flash('error', 'Cannot edit course due to enrolled users');
            res.redirect('/seso/control');
        }

        Course.findByIdAndUpdate({ _id: courseID }, { coursename: coursename, coursebio: coursecontent, courseprice: courseprice, courselimited: limitedUsers, coursestart: coursestart,  courseend: courseend, centerlocation: centerlocation, centerplace: centerplace  }, (err) => {
            if (err) throw new Error('Error');
            else {
                req.flash('success', 'Course has been updated successfully');
                res.redirect('/seso/control');
            }
        })
      
    } catch (err) {
        console.log(`Compelted Error `, err);
        console.log(`Error Message is ${err.message}`);
        req.flash('error', err.message);
        res.redirect('/seso/control');
    }
});

module.exports = router;
