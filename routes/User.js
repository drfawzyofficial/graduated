const express = require('express');
const router = express.Router();
const passport = require('passport');
const { forwardAuthenticated } = require('../config/auth');
const { check, validationResult } = require('express-validator');
const async = require('async');
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
router.post('/signup', [
    check('fullname').isLength({ min: 6 }).withMessage('Fullname should be more than 6 chars'),
    check("email").isEmail().withMessage("Email must be correct"),
    check('password').isLength({ min: 6 }).withMessage('Password shoud be more than 6 chars'),
    check('phone').isLength({ min: 11, max: 11 }).withMessage('Phonenumber must be 11 chars').isNumeric().withMessage("Phone must be number only")
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {    
        req.flash('errors', errors.array());
        res.redirect('/');
    } else {
        passport.authenticate('local.signup', {
            successRedirect: '/profile',
            failureRedirect: '/',
            failureFlash: true
        })(req, res);
    }
});
router.post('/login', (req, res, next) => {
    if(!req.body.email || !req.body.password) {
        req.flash('error', 'Login All fields must be required');
        res.redirect('/');
    } else {
      passport.authenticate('local.login', {
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true
      })(req, res);
    }
  });
  router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));
  router.get('/auth/facebook',
    passport.authenticate('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }));
    router.post('/forgotPassword', (req, res, next) => {

      async.waterfall([
    
        function (done) {
          crypto.randomBytes(20, (err, buf) => {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
    
        function (token, done) {
          User.findOne({ email: req.body.emailForgot }, function (err, user) {
            if(err) {
              req.flash('error', `Home ${ err.message }`);
              res.redirect('/');
            }
            if (!user) {
              req.flash('error', 'Forgot No account with that email address exists');
              res.redirect('/');
            } else {
              user.resetPasswordToken = token;
              user.resetPasswordExpires = Date.now() + 3600000;
              user.save(function (err) {
                done(err, token, user);
              });
            }
          });
        },
    
        function (token, user, done) {
          let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'AbdulrahmanFawzy999@gmail.com',
              pass: 'sxgqljelmksfsuuo'
            }
          });
          let mailOptions = {
            to: user.email,
            from: 'AbdulrahmanFawzy999@gmail.com',
            subject: 'Reset your password',
            html: `
                  <p> You are receiving this because you (or someone else) has requested the reset of the password for your account. 
                  </p>
                  <p>
                  Please click on the following link to complete the process
                  </p>
                  <a href= "http://localhost:3000/user/reset/${ user._id }/${ token }">Follow</a>
                  <p>If you did not request this, please ignore this email and your password will remain unchanged. </p>`
          };
          transporter.sendMail(mailOptions, function (err) {
            if(err) {
              req.flash('error', `Home ${ err.message }`);
              res.redirect('/');
            }
            req.flash('success', 'Home An e-mail has been sent to ' + user.email + ' with further instructions.');
            done(err, 'done');
          });
        }
      ], function (err) {
        if (err) return next(err);
        res.redirect('/');
      });
    });
router.get('/reset/:id/:token', (req, res, next) => {
    User.findOne({ _id: req.params.id, resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
      if (err) {
        req.flash("error", `Home ${ err.message }`);
        res.redirect("/");
      }
      if (user) {
        req.flash("success", `resetPassword ${ req.params.id } ${ req.params.token } `);
        res.redirect("/");
      }
      else {
        req.flash("error", "Home Something wrong happened");
        res.redirect("/");
      }
    });
  });
  
router.post('/updatePassword', (req, res, next) => {
  User.findOne({ _id: req.body.userID, resetPasswordToken: req.body.resetPasswordToken, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (err) {
      console.log(err.message);
      req.flash("error", `Home ${ err.message }`);
      res.redirect("/");
    }
    if (!user) {
      req.flash("error", `Home Something went wrong`);
      res.redirect("/");
    }
    else {
      if (req.body.password.trim().length === 0 || req.body.confirmPassword.trim().length === 0) {
        req.flash("error", "resetPassword fill out all fields");
        req.flash("success", `resetPassword ${ req.body.userID } ${ req.body.resetPasswordToken } `);
        res.redirect("/");
      }
      else if (req.body.password != req.body.confirmPassword) {
        req.flash('error', 'resetPassword Two passwords are not matched');
        req.flash("success", `resetPassword ${ req.body.userID } ${ req.body.resetPasswordToken } `);
        res.redirect("/");
      } else {
        bcrypt.genSalt(10, (err, salt) => {
          if (err) {
            console.log(err.message);
            req.flash("error", `Home ${ err.message }`);
            res.redirect("/");
          }
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) {
              console.log(err.message);
              req.flash("error", `Home ${ err.message }`);
              res.redirect("/");
            }
            user.password = hash;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save()
              .then((Doc) => {
                req.flash('success', `Home Welcome ${ Doc.fullname} Your password has been changed`);
                res.redirect('/');
              })
              .catch((err) => {
                console.log(err.message);
                req.flash("error", `Home ${ err.message }`);
                res.redirect("/");
              })
          });
        });
      }
    }
  });
});
module.exports = router;