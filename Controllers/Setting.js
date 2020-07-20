const User = require('../models/user');

const { validationResult } = require('express-validator');

const bcrypt = require('bcryptjs');

const removeAccount = async (req, res, next) => {
    try {
        let removedUser = await User.findByIdAndRemove({ _id: req.user.id });
        console.log(`${removedUser} has been removed successfully`);
        req.flash("success", "Your Account has been removed successfully");
        res.redirect("/signup");
    } catch (err) {
        console.error(err.message);
    }
}

const editProfile = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('errors', errors.array());
            res.redirect('/settings');
        } else {
            const { fullname, email, bio, location, gender, phone, username } = req.body;
            const fetchedTags = await User.findById({ _id: req.user.id });
            console.log(fetchedTags.tags);
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
    }
}

const changePassword = async (req, res, next) => {
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
}

module.exports = {
    removeAccount,
    editProfile,
    changePassword
}
