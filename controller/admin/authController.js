const Account = require("../../models/Account");

const systemConfig = require("../../configs/system");

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
    const account = await Account.findByPk(req.body.phone);
    
    if (account != null && account.password == req.body.password && account.status != 'Deleted') {
      res.cookie("token", account.token);
      return res.redirect(`${systemConfig.prefixAdmin}/dashboard/profile`);
    }

    return res.redirect('back', {
      msg: "error"
    });

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

