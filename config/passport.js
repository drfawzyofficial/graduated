const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const randomstring = require("randomstring");
const nodemailer = require('nodemailer');

// Signup Strategy for user
passport.use('local.signup', new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    try {
        if (req.body.password != req.body.confirmPassword) {
            return done(null, false, req.flash('error', 'Signup Two Passwords are not matched'))
        } 
        let user = await User.findOne({ email: username });
        if (user) {
            return done(null, false, req.flash('error', 'Signup Email is already exist'))
        }
        if (!user) {
            let account = await new User({
                fullname: req.body.fullname,
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 10),
                phone: req.body.phone,
                location: req.body.location,
                gender: req.body.gender,
                role: req.body.role,
                accountToken: randomstring.generate({ length: 64 })
            }).save();
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'AbdulrahmanFawzy999@gmail.com',
                    pass: 'sxgqljelmksfsuuo'
                }   
            });
            let mailOptions = {
                from: 'Ostazy',
                to: `${account.email}`,
                subject: 'Email Verification',
                html: `
                <h3> How are you ${ account.fullname }? We hope that you are good </h3>
                <p>
                <span> To verify your email follow this link:  </span>
                <a href="http://localhost:3000/profile/verifyEmail/${ account._id }" target="_blank"> Verify now </a>
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
            return done(null, account);

        }
    } catch(err) {
        return done(null, false, req.flash('error', `Signup ${err.message}`))
    }

}));
// login strategy fot user
passport.use('local.login', new localStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {

    try {

        let user = await User.findOne({ email: username });
        if (!user) {
            return done(null, false, req.flash('error', 'Login User is not found'))
        }
        if (user) {
    
                bcrypt.compare(password, user.password, (err, res) => {
                    if (err) {
                        return done(null, false, req.flash('error', `Login ${err.message}`));
                    }
                    else {
                        if (res) {
                            User.findByIdAndUpdate({ _id: user._id }, { accountActive: true }, { "new": true })
                                .then((Doc) => {
                                    console.log(`accountActive is set to ${Doc.accountActive}`)
                                    return done(null, user);
                                })
                                .catch((err) => {

                                    return done(null, false, req.flash('error', `Login ${err.message}`));
                                })
                                .finally(() => console.log("Code is written with Love"))
                        } else {
                            return done(null, false, req.flash('error', 'Login Password is wrong'));
                        }
                    }
                });
        }
    } catch(err) {
        console.log(err)
        return done(null, false, req.flash('error', `Login ${err.message}`));
    }
}));

// Login with facebook
passport.use(new FacebookStrategy({
    clientID: '209137143868957',
    clientSecret: '76f561850e3c1a8ff1e476a6b9f8e492',
    callbackURL: "/user/auth/facebook",
    profileFields: ['displayName', 'email'],
    passReqToCallback: true
},
    function (req, accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            User.findOne({ email: profile._json.email }, async (err, user) => {
                if (err) {
                    console.log(err.message); 
                    return done(null, false, req.flash('error', 'Login Something wrong happened')) 
                }
                if (user) {
                    if ((user.fromStatus) === 'reservation') {
                        return done(null, false, req.flash('error', 'Login This account can login with website'));
                    } else {
                        user.accountActive = true; user.save();
                        return done(null, user);
                    }
                }

                else {
                    let newUser = new User();
                    let token = randomstring.generate({ length: 64 });
                    newUser.fullname = profile.displayName;
                    newUser.phone = 'xxx-Change your phone'
                    newUser.email = profile._json.email;
                    newUser.location = "Cairo";
                    newUser.gender = "Unknown";
                    newUser.password = await bcrypt.hash(profile._json.email, 10),
                    newUser.fromStatus = 'facebook';
                    newUser.accountToken = token;
                    newUser.role = "User";
                    newUser.accountActive = true;
                    newUser.save((err, user) => {
                        if (err) throw err;
                        else {
                            let transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: 'AbdulrahmanFawzy999@gmail.com',
                                    pass: 'sxgqljelmksfsuuo'
                                }
                            });
                            let mailOptions = {
                                from: 'Teacherou',
                                to: `${newUser.email}`,
                                subject: 'Email Verification',
                                html: `
                                 <h3> How are you ${newUser.fullname}? We hope that you are good </h3>
                                    <p>
                                    <span> To verify your email follow this link:  </span>
                                    <a href="https://onlinecoursebooking.herokuapp.com//user/verify/${newUser.id}/${newUser.email}/${newUser.accountToken}" target="_blank"> Verify now </a>
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
                            return done(null, user);
                        }
                    })
                }
            });
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        if (err) done(err);
        done(null, user);
    })
});