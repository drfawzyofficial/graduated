const express = require('express');
const request = require('request');
const router = express.Router();
const Course = require('../models/Course');
const moment = require("moment");
const { ensureAuthenticated } = require('../config/auth');
var CLIENT = 'ASNQ9WHkA8uucr9QhYOEkLjVG5fZfgHj2AEQmZFsXBHBhKhq7wuLlLHJOck-6vXE572nhTunI8xstGvr';
var SECRET = 'EPLAVsoF2Zqafp7IRO14yEwFNneBN-7ffNiL5GDXXQ-M11nYQ7Cw-IuC5zjSbSwLgs6-9ltXYo7pwPxs';
var PAYPAL_API = 'https://api.sandbox.paypal.com';
router.post('/:courseID/createPayment', async (req, res, next) => {
    const course = await Course.findOne({ _id: req.body.courseID });
    if(!course) {
        req.flash('error', 'Something wrong happened');
        res.redirect('/courses');
    } else {
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
                    return_url: '/returnOperation',
                    cancel_url: '/cancelOperation'
                }
            },
            json: true
        }, function (err, response) {
            if (err) {
                console.error(err);
                return res.sendStatus(500);
            }
            res.json(
                {
                    id: response.body.id
                });
        });
    }
});
router.post('/:courseID/executePayment', async (req, res, next) => {
    const { paymentID, payerID, courseID } = req.body;
    const course = await Course.findOne({ _id: courseID });
    if(!course) {
        req.flash('error', 'Something wrong happened');
        res.redirect('/courses');
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
                payer_id: payerID,
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
                console.error(err);
                return res.sendStatus(500);
            }
            await Course.findByIdAndUpdate({ _id: courseID }, { $push: { users: payerID } });
            res.json(
                {
                    status: 'success',
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
