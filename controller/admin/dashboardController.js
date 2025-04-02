const Account = require("../../models/Account");
const Employee = require("../../models/Employee");


// [GET] /AutoParts/admin/statistic
module.exports.statistic = async (req, res) => {
  try {
    const blogs = await Blog.findAll(
      {
        where: {
          status: 'Active', 
          deleted: false
        }
      }
    );
    
    res.render('client/pages/blog/index', {
      blogs: blogs
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [GET] /AutoParts/admin/dashboard/profile
module.exports.profile = async (req, res) => {
  try {
    res.render('admin/pages/account/profile', {
      pageTitle: "Trang chi tiết tài khoản"
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [POST] /AutoParts/admin/dashboard/profile/edit/:userPhone
module.exports.editProfile = async (req, res) => {
  try {
    const userPhone = req.params.userPhone;

    await Employee.update(
      req.body,
      { 
        where: { 
            phone: userPhone
        } 
      }
    );

    req.flash('success', "Thay đổi thông tin thành công!");
    res.redirect("back");
  } catch (err) {
    req.flash('error', "Thay đổi thông tin thất bại!");
    res.status(500).send('Server error');
  }
};