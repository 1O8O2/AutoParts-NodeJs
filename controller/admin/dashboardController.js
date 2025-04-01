const Account = require("../../models/Account");


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