const Blog = require('../../models/Blog');
const Employee = require('../../models/Employee');

// [GET] /blog/
module.exports.showBlogs = async (req, res) => {
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

// [GET] /blog/detail/:id
module.exports.showBlogDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await Blog.findByPk(id);
    const employee = await Employee.findByPk(blog.createdBy);
    
    res.render('client/pages/blog/detail', {
      blog: blog, 
      author: employee.fullName
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// // GET /blog/detail - Show single blog detail
// router.get('/blog/detail', async (req, res) => {
//     try {
//         const id = req.query.id; 
//         const blog = await blogService.getById(id);
        
//         if (!blog) {
//             return res.status(404).send('Blog not found');
//         }

//         const employee = await employeeService.getByPhone(blog.createdBy);
//         const author = employee.fullName;

//         res.render('blogdetail', { 
//             blog: blog, 
//             author: author 
//         }); 

//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error retrieving blog details');
//     }
// });

