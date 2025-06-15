const Account = require("../../models/Account");

const systemConfig = require("../../configs/system");
const md5 = require('md5');


// [GET] /AutoParts/admin/auth/login
module.exports.login = async (req, res) => {
  try {
    res.render('admin/pages/account/login');
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [POST] /AutoParts/admin/auth/login
module.exports.loginPost = async (req, res) => {
  try {
    const account = await Account.findByPk(req.body.email);

    if(!account) {
      req.flash("error", res.locals.messages.ACCOUNT_NOT_FOUND);
      return res.redirect('back');
    }
    if(account.password !== md5(req.body.password)) {
      req.flash("error", res.locals.messages.PASSWORD_INCORRECT);
       return res.redirect('back');
    }
    if(account.permission =='RG002') {
      req.flash("error", res.locals.messages.LOGIN_ERROR);
      return res.redirect('back');
    }
    
    res.cookie("token", account.token);
    req.flash("success", res.locals.messages.LOGIN_SUCCESS)
    return res.redirect(`${systemConfig.prefixAdmin}/dashboard/profile`);

  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [GET] /AutoParts/admin/auth/logout
module.exports.logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`)
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [GET] /AutoParts/admin/auth/access-denied
module.exports.accessDenied = async (req, res) => {
  try {
    res.render('admin/pages/account/access-denied');
  } catch (err) {
    res.status(500).send('Server error');
  }
};

