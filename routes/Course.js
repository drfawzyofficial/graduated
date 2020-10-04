const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Review = require('../models/Review');
const Book = require('../models/Book');
const moment = require("moment");
const request = require('request');
const { ensureAuthenticated } = require('../config/auth');
const { Mongoose } = require('mongoose');
const CLIENT = 'ARj2xdiO5T8mO_nQPPzQ5NOjxkbxPl8F8V8oHV_wsNVsUnV8leSbkOVD2UA6G73mMw68IuiM58oRoBlT';
const SECRET = 'ECaSRhh_I3zMWSLROpktYspF6npAnm6j8XZjrVWcihHn0AHFK0e_ARJhTpXzVmGS0aknwZcD-53zXJog';
const PAYPAL_API = 'https://api.sandbox.paypal.com';
router.get('/:courseID', ensureAuthenticated, async (req, res, next) => {
    try {
        if (!req.params.courseID.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash("error", "Something wrong happened");
            res.redirect(`/profile`);
        }
        const course = await Course.findById({ _id: req.params.courseID }).populate("instructorID");
        if (!course) {
            req.flash("error", "The Course you lookup for is not found");
            res.redirect("/profile");
        }
        if(course) {
            const reviews = await Review.find({ courseID: course._id }).populate('userID');
            res.render("English/Course", { page: 'Logout', course, moment, reviews });
        }
    } catch(err) {
        console.log(`Completed Error ${ err }`);
        console.log(`Error Message ${ err.message }`);
        req.flash('error', 'Something wrong happened');
        res.redirect('/profile');
    }

})
router.post('/feedback', async (req, res, next) => {
    const { courseID, comment, stars } = req.body;
    if(!courseID || !courseID.match(/^[0-9a-fA-F]{24}$/) || !comment || 
        comment.length > 255 || !stars || stars < 0 || stars > 5) {
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'Validation Error',
            msgUser: 'Sure that that the feedback is valid'
        });
    }
    
    const course = await Course.findById({ _id: courseID });
    if(!course) {
        return res.status(404).json({
            statusCode: 404,
            msgDev: 'The sent courseID is not found on our system',
            msgUser: 'The Course is not found'
        });
    }

    if(!course.users.includes(req.user.id)) {
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'The User is not included in the users array',
            msgUser: 'Not allowed to send feedback to course you are not a member of it'
        });
    }

    const review = await new Review({
        courseID: courseID,
        userID: req.user.id,
        comment: comment,
        stars: stars
    }).save()
    return res.status(200).json({
        statusCode: 200,
        review: review,
        msgDev: 'The Review has beed added to Review Collection',
        msgUser: 'You feedback is sent successfully for the course'
    });
});
router.post('/createPayment', async (req, res, next) => {
    const courseID = req.body.courseID;
    if(!courseID.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'Course ID is not matched the _id standard',
            msgUser: 'Something went wrong'
        });
    }
    const course = await Course.findOne({ _id: courseID });
    if (!course) {
        return res.status(404).json({
            statusCode: 404,
            msgDev: 'Course ID is not found on our system',
            msgUser: 'The Course is not found'
        });
    }
    if(course && (course.users.length === course.courselimited || moment(course.coursestart).valueOf() <= Date.now())  ) { 
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'The Course is found but it is completed',
            msgUser: 'The Course is completed'
        });
    }
    if(course && course.users.includes(req.user.id)) {
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'The User is found in the users list',
            msgUser: 'You are a member of this course'
        });
    }

    if(req.user.role === "Instructor") {
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'The role is Instructor',
            msgUser: 'The Instructor cannot buy any course on our System'
        });
    }

    request.post(PAYPAL_API + '/v1/payments/payment',
        {
            auth:
            {
                user: CLIENT,
                pass: SECRET
            },
            body:
            {
                intent: 'sale',
                payer:
                {
                    payment_method: 'paypal'
                },
                transactions: [
                    {
                        amount:
                        {
                            total: (course.courseprice).toString(),
                            currency: 'USD'
                        }
                    }],
                redirect_urls:
                {
                    return_url: '/course/returnOperation',
                    cancel_url: '/course/cancelOperation'
                }
            },
            json: true
        }, function (err, response) {
            if (err) {
                console.log(`Completed Error ${ err }`);
                console.log(`Error Message ${ err.message }`);
                return res.status(500).json({
                    statusCode: 500,
                    msgDev: 'Internal Server Error',
                    msgUser: 'Something wrong happened'
                });
            }
            return res.status(200).json({
                statusCode: 200,
                id: response.body.id,
                msgDev: 'Payment Setup is executed successfully',
                msgUser: 'Payment Setup is executed successfully'
            });
        });
});
router.post('/executePayment', async (req, res, next) => {
    const { courseID, paymentID } = req.body; 
    if(!courseID.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'Course ID is not matched the _id standard',
            msgUser: 'Something went wrong'
        });
    }
    const course = await Course.findOne({ _id: courseID });
    if (!course) {
        return res.status(404).json({
            statusCode: 404,
            msgDev: 'Course ID is not found on our system',
            msgUser: 'The Course is not found'
        });
    }
    if(course && (course.users.length === course.courselimited || moment(course.coursestart).valueOf() <= Date.now())  ) { 
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'The Course is found but it is completed',
            msgUser: 'The Course is completed'
        });
    }
    if(course && course.users.includes(req.user.id)) {
        return res.status(400).json({
            statusCode: 400,
            msgDev: 'The User is found in the users list',
            msgUser: 'You are a member of this course'
        });
    }
    request.post(PAYPAL_API + '/v1/payments/payment/' + paymentID +
        '/execute',
        {
            auth:
            {
                user: CLIENT,
                pass: SECRET
            },
            body:
            {
                payer_id: req.user.id,
                transactions: [
                    {
                        amount:
                        {
                            total: (course.courseprice).toString(),
                            currency: 'USD'
                        }
                    }]
            },
            json: true
        },
        async function (err, response) {
            if (err) {
                console.log(`Completed Error ${ err }`);
                console.log(`Error Message ${ err.message }`);
                return res.status(500).json({
                    statusCode: 500,
                    msgDev: 'Internal Server Error',
                    msgUser: 'Something wrong happened'
                });
            }
            await Course.findByIdAndUpdate({ _id: courseID }, { $push: { users: req.user.id } });
            await new Book({ userID: req.user.id, courseID: courseID }).save();
            return res.status(200).json({
                statusCode: 200,
                msgDev: 'The transaction is completed successfully',
                msgUser: 'The Course is purchased successfully'
            });
           
        });
});

router.get('/:courseID', ensureAuthenticated, (req, res, next) => {
        if (req.params.courseID.match(/^[0-9a-fA-F]{24}$/)) {
            Course.findById({ _id: req.params.courseID }).populate("instructorID").exec((err, course) => {
                if (err) throw new Error(err.message);
                if (!course) {
                    req.flash("error", "Something wrong happened");
                    res.redirect("/profile");
                } else {
                    res.render("English/Course", { page: 'Logout', course, moment });
                }
            });
        } else {
            req.flash("error", "Something wrong happened");
            res.redirect(`/profile`);
        }

})
module.exports = router;
