const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/User');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { ensureAuthenticated } = require('../config/auth');
const multer = require('multer');
const moment = require("moment");
const nodemailer = require('nodemailer');
const Nexmo = require('nexmo');
const Review = require('../models/Review');
const nexmo = new Nexmo({
  apiKey: 'c9d855ca',
  apiSecret: '3H66PeBjWJ6aHcMG'
})

router.post('/chart', ensureAuthenticated, async (req ,res, next) => {
    if (req.user.role === "User") {
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'The user cannot make requesst to /chart router',
            msgUser: 'You are not allowed to make request to this router'
        });
    } else {
       const courses = await Course.find({ instructorID: req.user.id });
       return res.status(200).json({
        statusCode: 200,
        courses: courses,
        msgDev: 'Get All courses that are related to the instructor from Course Collection',
        msgUser: 'Courses are recieved successfully'
    })
    }
});

// Get Request to Dashboard
router.get('/', ensureAuthenticated, async (req, res, next) => {
    if (req.cookies.lang === "ar") {
        if (req.user.role === "User") {
            req.flash('error', 'You are not allowed to visit this page');
            res.redirect('/profile');
        }
        else {
            const courses = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users")
            res.render("Arabic/dashboard", { content: 'dashboard', errors: req.flash("errors"), courses: courses, moment: moment });
        }
    } else {
        if (req.user.role === "User") {
            req.flash('error', 'You are not allowed to visit this page');
            res.redirect('/profile');
        }
        else {  
            const courses = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users")
            const instructorIDS = await User.find({ role: 'Instructor', specialized: req.user.specialized, _id: { $ne: req.user._id } }).select('_id');
            res.render("English/Dashboard", { content: 'dashboard', errors: req.flash("errors"), courses: courses, moment: moment,  instructorIDS: instructorIDS });
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
            res.render("Arabic/dashboard", { errors: req.flash("errors"), courseDocs: courseDocs, moment: moment });
        }
    } else {
        if (req.user.role === "User") {
            req.flash('error', 'You are not allowed to visit this page');
            res.redirect('/profile');
        }
        else {
            const courses = await Course.find({ instructorID: req.user.id }).populate("instructorID").populate("users");
            const instructorIDS = await User.find({ role: 'Instructor', specialized: req.user.specialized, _id: { $ne: req.user._id } }).select('_id');
            const compCourses = await Course.find({ instructorID: { $in : instructorIDS } }).populate("instructorID")
            
            res.render("English/Dashboard", { content: content, errors: req.flash("errors"), courses: courses, moment: moment, compCourses: compCourses  });
        }
    }

})

router.post('/publish', async (req, res, next) => {
    try {
        const { coursename, coursecontent, courseprice, limitedUsers, coursestart, courseend, centerlocation, centerplace } = req.body;
        if (!coursename || !coursecontent || !courseprice || !limitedUsers || !coursestart || !courseend || !centerlocation || !centerplace || courseprice == 0 || limitedUsers < 5 || !(moment(coursestart).valueOf() >= Date.now() + 86400000) ||  !(moment(courseend).valueOf() >= moment(coursestart).valueOf() + 86400000)) {
            return res.status(400).json({
                statusCode: 400,
                msgDev: 'Make Sure that the sent data is valid',
                msgUser: 'Make Sure that the sent data is valid'
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
        let users = await User.find({ role: 'User' });
        users.forEach(async (user) => {
            if((user.tags).includes(addedCourse.coursename)) {
                var users = await req.app.get("userService").getUsersById(user._id);
                for(var i = 0; i < users.length; i++) {
                    req.app.get("io").to(users[i].socketID).emit("courseData", {coursename: addedCourse.coursename, courseID: addedCourse._id});
                }
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'AbdulrahmanFawzy999@gmail.com',
                        pass: 'sxgqljelmksfsuuo'
                    }   
                });
                let mailOptions = {
                    from: 'Ostazy',
                    to: `${ user.email }`,
                    subject: `${ addedCourse.coursename } has been created successfully`,
                    html: `
                    <h3> How are you ${ user.fullname }? We hope that you are good </h3>
                    <p>
                    <span> To visit ${ addedCourse.coursename } follow the link:  </span>
                    <a href="http://localhost:3000/course/${ addedCourse._id }" target="_blank"> Course Link </a>
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

                nexmo.message.sendSms(`Ostazy App`, `2${user.phone}`, `${ addedCourse.coursename } has been created successfully. Course Link: http://localhost:3000/course/${ addedCourse._id }`, (err, responseData) => {
                    if (err) {
                        console.log(err);
                    } else {
                        if(responseData.messages[0]['status'] === "0") {
                            console.log("Message sent successfully.");
                        } else {
                            console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
                        }
                    }
                })

                await new Notification({
                courseID: addedCourse._id,
                userID: user._id
               }).save();
            }
          });

        res.status(200).json({
            statusCode: 200,
            course: addedCourse,
            msgDev: 'Document has been added to mongoDB',
            msgUser: 'Course has been created successfully'
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

router.post('/control/removeCourse', async (req, res, next) => {
    try {
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
        
        if(course.users.length > 0) {
            return res.status(400).json({
                statusCode: 400,
                msgDev: 'Cannot remove the course due to enrolled users',
                msgUser: 'Cannot remove the course due to enrolled users'
            });
        } else {
            const removedCourse = await Course.findByIdAndRemove({ _id: course._id });
            await Review.deleteMany({ courseID: course._id });
            await Notification.deleteMany({ courseID: course._id });
            return res.status(200).json({
                statusCode: 200,
                removedCourse: removedCourse,
                msgDev: 'Course has been removed from mongoDB Course Collection',
                msgUser: 'Course has been deleted successfully'
            });
        }

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

router.post('/balance/makeRequest', async (req, res, next) => {
    try {
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
                msgUser: 'Course is not found'
            });
        }
        if(course.instructorID != req.user.id) {
            return res.status(400).json({
                statusCode: 400,
                msgDev: 'Try to make request for another course that is not related to you',
                msgUser: 'Try to make request for another course that is not related to you'
            });
        }
        
        if(course.users.length === 0 || course.users.length > 0 && moment(course.courseend).valueOf() > Date.now() || course.paymentStatus != "start") {
            return res.status(400).json({
                statusCode: 400,
                msgDev: 'If number of users is equal to 0, number of users > 0 and the end appointment does not come or Course Payment Status is pending or completed, you will not be able to make request for money',
                msgUser: 'Cannot make request for money'
            });
        }

        const transaction = await new Transaction({ courseID: course._id }).save();
        await Course.findByIdAndUpdate({ _id: course._id }, { paymentStatus: 'pending' }, { new: 'true' });
        return res.status(200).json({
            statusCode: 200,
            transaction: transaction,
            msgDev: 'The transaction has been added to mongoDB',
            msgUser: 'You request for money is sent and now is pending'
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
            res.redirect('/dashboard/control');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/dashboard/control');
            } else {
                Course.updateOne({ _id: req.body.courseID }, { centerphoto: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The photo is updated successfully');
                        res.redirect('/dashboard/control');
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
            res.redirect('/dashboard/control');
        } else {
            if (req.file === undefined) {
                req.flash('error', 'No file is selected');
                res.redirect('/dashboard/control');
            } else {
                Course.updateOne({ _id: req.body.courseID }, { coursevideo: req.file.filename }, (err) => {
                    if (err) throw new Error('Error');
                    else {
                        req.flash('success', 'The video is updated successfully');
                        res.redirect('/dashboard/control');
                    }
                })
            }
        }
    })
});

router.post('/control/editCourse', async (req, res, next) => {
    try {
        
        const { courseID, coursename, coursecontent, courseprice, limitedUsers, coursestart, courseend, centerlocation, centerplace } = req.body;
        if (!coursename || !coursecontent || !courseprice || !limitedUsers || !coursestart || !courseend || !centerlocation || !centerplace || courseprice == 0 || limitedUsers < 5 || !(moment(coursestart).valueOf() >= Date.now() + 86400000) ||  !(moment(courseend).valueOf() >= moment(coursestart).valueOf() + 86400000)) {
            req.flash('error', 'Make Sure that the sent data is valid');
            return res.redirect('/dashboard/control');
        }

        if (!courseID.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash('error', 'Something went wrong');
            return res.redirect('/dashboard/control');
        }

        const course = await Course.findOne({ _id: courseID });
        if(!course) {
            req.flash('error', 'Course is not found');
           return res.redirect('/dashboard/control');
        }
        
        if(course.instructorID != req.user.id) {
            req.flash('error', 'Course is not related to you');
            return res.redirect('/dashboard/control');
        }
        

        if(course.users.length > 0) {
            req.flash('error', 'Cannot edit course due to enrolled users');
            return res.redirect('/dashboard/control');
        } else {
            Course.findByIdAndUpdate({ _id: courseID }, { coursename: coursename, coursebio: coursecontent, courseprice: courseprice, courselimited: limitedUsers, coursestart: coursestart,  courseend: courseend, centerlocation: centerlocation, centerplace: centerplace  }, (err) => {
                if (err) throw new Error('Error');
                else {
                    req.flash('success', 'Course has been updated successfully');
                    return res.redirect('/dashboard/control');
                }
            })
        }
      
    } catch (err) {
        console.log(`Compelted Error `, err);
        console.log(`Error Message is ${err.message}`);
        req.flash('error', err.message);
        res.redirect('/dashboard/control');
    }
});

module.exports = router;
