const Blog = require("../../models/Blog");
const BlogGroup = require("../../models/BlogGroup");

const generateId = require("../../helpers/generateId");

const systemConfig = require("../../configs/system");


// [GET] /AutoParts/admin/blog
module.exports.index = async (req, res) => {
    try {
        const blogs = await Blog.findAll({
            where: {
                deleted: false,
            },
            include: [{
                model: BlogGroup,
                attributes: ['groupName'], 
                where: { deleted: false } 
            }]
        });
        
        res.render('admin/pages/blog/index', {
            pageTitle: "Danh sách bài viết",
            blogs: blogs
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [GET] /AutoParts/admin/blog/add
module.exports.add = async (req, res) => {
    try {
        const nextId = await generateId.generateNextBlogId();
        const blogGroups = await BlogGroup.findAll({
            where: {
                status: 'Active',
                deleted: false
            }
        });

        res.render('admin/pages/blog/add', {
            pageTitle: "Thêm bài viết",
            nextId: nextId,
            blogGroups: blogGroups
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [POST] /AutoParts/admin/blog/add
module.exports.addPost = async (req, res) => {
    try {
        if (!req.body.blogId || !req.body.title || !req.body.description || !req.body.blogGroupId || !req.body.content) {
            req.flash("error", "Thiếu thông tin bắt buộc!");
            return res.redirect('back');
        }

        if (!req.body.status) {
            req.body.status = 'Inactive';
        }

        const blogData = {
            ...req.body,
            createdBy: res.locals.user.email
        };
        
        const isSuccess = await Blog.create(blogData);
        
        if (isSuccess) {
            req.flash("success", "Thêm bài viết thành công!");
            res.redirect(`${systemConfig.prefixAdmin}/blog`);
        } else {
            req.flash("error", "Thêm bài viết thất bại!");
            res.redirect('back');
        }
    } catch (err) {
        req.flash("error", "Thêm bài viết thất bại!");
        res.redirect('back');
    }
};

// [GET] /AutoParts/admin/blog/edit/:blogId
module.exports.edit = async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.blogId);
        const blogGroups = await BlogGroup.findAll({
            where: {
                status: 'Active',
                deleted: false
            }
        });

        res.render('admin/pages/blog/edit', {
            pageTitle: "Sửa bài viết",
            blog: blog,
            blogGroups: blogGroups
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [PATCH] /AutoParts/admin/blog/edit/:blogId
module.exports.editPatch = async (req, res) => {
    try {
        if (!req.body.blogId || !req.body.title || !req.body.description || !req.body.blogGroupId || !req.body.content) {
            req.flash("error", "Thiếu thông tin bắt buộc!");
            return res.redirect('back');
        }
        
        if (!req.body.status) {
            req.body.status = 'Inactive';
        }

        const blogData = {
            ...req.body,
            updatedBy: res.locals.user.email
        };
        
        const isSuccess = await Blog.update(
            blogData,
            { 
                where: { 
                    blogId: req.body.blogId
                } 
            }
        );
        
        if (isSuccess) {
            req.flash("success", "Thay đổi thông tin bài viết thành công!");
            res.redirect(`${systemConfig.prefixAdmin}/blog`);
        } else {
            req.flash("error", "Thay đổi thông bài viết thất bại!");
            res.redirect('back');
        }
    } catch (err) {
        req.flash("error", "Thay đổi thông bài viết thất bại!");
        res.redirect('back');
    }
};

// [DELETE] /AutoParts/admin/blog/delete/:blogId
module.exports.deleteItem = async (req, res) => {
    try {
        const blogId = req.params.blogId;

        const isSuccess = await Blog.update(
            { deleted: true },
            { 
                where: { 
                    blogId: blogId
                } 
            }
        );
        
        if (isSuccess) {
            req.flash("success", "Xóa bài viết thành công!");
            res.redirect(`${systemConfig.prefixAdmin}/blog`);
        } else {
            req.flash("error", "Xóa bài viết thất bại!");
            res.redirect('back');
        }
    } catch (err) {
        res.redirect('back');
    }
};

// [PATCH] /AutoParts/admin/blog/change-status/:newStatus/:blogId
module.exports.changeStatus = async (req, res) => {
    try {
        const blogId = req.params.blogId;
        const newStatus = req.params.newStatus;
        
        const isSuccess = await Blog.update(
            { status: newStatus },
            { 
                where: { 
                    blogId: blogId
                } 
            }
        );
        
        if (isSuccess) {
            res.json({ success: true });
        } else {
            res.redirect('back');
        }
    } catch (err) {
        res.redirect('back');
    }
};

// [GET] /AutoParts/admin/blog/detail/:blogId
module.exports.detail = async (req, res) => {
    try {
        const blog = await Blog.findOne({
            where: {
                blogId: req.params.blogId,
                deleted: false
            },
            include: [{
                model: BlogGroup,
                attributes: ['groupName'], 
                where: { deleted: false } 
            }]
        });

        res.render('admin/pages/blog/detail', {
            pageTitle: "Chi tiết bài viết",
            blog: blog
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};