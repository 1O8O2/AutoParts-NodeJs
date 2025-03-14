const Account = require('../models/Account');

module.exports.loginAuth = (req, res, next) => {
    const acc = req.session.user;
    //if not logged in, redirect to login page
    if (!acc) {
        return res.redirect('/AutoParts/account/login');
    }
    next();
};