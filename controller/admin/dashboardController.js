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