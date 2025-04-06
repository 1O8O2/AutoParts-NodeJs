const Discount = require("../../models/Discount");

const generateId = require("../../helpers/generateId");

const systemConfig = require("../../configs/system");


// [GET] /AutoParts/admin/discount
module.exports.index = async (req, res) => {
    try {
        const discounts = await Discount.findAll({
            where: {
                deleted: false
            }
        });
        
        res.render('admin/pages/discount/index', {
            pageTitle: "Danh sách khuyến mãi",
            discounts: discounts
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [GET] /AutoParts/admin/discount/add
module.exports.add = async (req, res) => {
    try {
        const nextId = await generateId.generateNextDiscountId();

        res.render('admin/pages/discount/add', {
            pageTitle: "Thêm khuyến mãi",
            nextId: nextId
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [POST] /AutoParts/admin/discount/add
module.exports.addPost = async (req, res) => {
    try {
        if (!req.body.discountDesc || !req.body.discountAmount || !req.body.minimumAmount || 
            !req.body.usageLimit || !req.body.applyStartDate || !req.body.applyEndDate) {
            req.flash("error", "Thiếu thông tin bắt buộc!");
            return res.redirect('back');
        }

        if (!req.body.status) {
            req.body.status = 'Inactive';
        }

        const discountData = {
            ...req.body,
            // createdBy: res.locals.user.dataValues.phone
        };
        
        const isSuccess = await Discount.create(discountData);
        
        if (isSuccess) {
            req.flash("success", "Thêm khuyến mãi thành công!");
            res.redirect(`${systemConfig.prefixAdmin}/discount`);
        } else {
            req.flash("error", "Thêm khuyến mãi thất bại!");
            res.redirect('back');
        }
    } catch (err) {
        res.redirect('back');
    }
};

// [GET] /AutoParts/admin/discount/edit/:discountId
module.exports.edit = async (req, res) => {
    try {
        const discount = await Discount.findByPk(req.params.discountId);

        res.render('admin/pages/discount/edit', {
            pageTitle: "Sửa khuyến mãi",
            discount: discount
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [PATCH] /AutoParts/admin/discount/edit/:discountId
module.exports.editPatch = async (req, res) => {
    try {
        if (!req.body.discountDesc || !req.body.discountAmount || !req.body.minimumAmount || 
            !req.body.usageLimit || !req.body.applyStartDate || !req.body.applyEndDate) {
            req.flash("error", "Thiếu thông tin bắt buộc!");
            return res.redirect('back');
        }
        
        if (!req.body.status) {
            req.body.status = 'Inactive';
        }

        const discountData = {
            ...req.body,
            // updatedBy: res.locals.user.dataValues.phone
        };
        
        const isSuccess = await Discount.update(
            discountData,
            { 
                where: { 
                    discountId: req.body.discountId
                } 
            }
        );
        
        if (isSuccess) {
            req.flash("success", "Thay đổi thông tin khuyến mãi thành công!");
            res.redirect(`${systemConfig.prefixAdmin}/discount`);
        } else {
            req.flash("error", "Thay đổi thông khuyến mãi thất bại!");
            res.redirect('back');
        }
    } catch (err) {
        req.flash("error", err);
        res.redirect('back');
    }
};

// [DELETE] /AutoParts/admin/discount/delete/:discountId
module.exports.deleteItem = async (req, res) => {
    try {
        const discountId = req.params.discountId;

        const isSuccess = await Discount.update(
            { deleted: true },
            { 
                where: { 
                    discountId: discountId
                } 
            }
        );
        
        if (isSuccess) {
            req.flash("success", "Xóa khuyến mãi thành công!");
            res.redirect(`${systemConfig.prefixAdmin}/discount`);
        } else {
            req.flash("error", "Xóa khuyến mãi thất bại!");
            res.redirect('back');
        }
    } catch (err) {
        res.redirect('back');
    }
};

// [PATCH] /AutoParts/admin/change-status/:newStatus/:discountId
module.exports.changeStatus = async (req, res) => {
    try {
        const discountId = req.params.discountId;
        const newStatus = req.params.newStatus;
        
        const isSuccess = await Discount.update(
            { status: newStatus },
            { 
                where: { 
                    discountId: discountId
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

// [GET] /AutoParts/admin/discount/detail/:discountId
module.exports.detail = async (req, res) => {
    try {
        const discount = await Discount.findOne({
            where: {
                discountId: req.params.discountId,
                deleted: false
            }
        });

        res.render('admin/pages/discount/detail', {
            discount: discount
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};