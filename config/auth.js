module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) return next();
        else {
            req.flash('error', 'Please log in to view that resource');
            res.redirect('/');
        }
    },
    forwardAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) res.redirect('/profile');
        else return next();
    }
};