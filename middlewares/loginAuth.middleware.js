const Account = require('../models/Account');

module.exports.loginAuth = (req, res, next)=>{
    const acc = req.session.user;
    if(acc)
    {
        return res.redirect('/AutoParts/account/profile');
    }
    else
    {
        next();
    }
}