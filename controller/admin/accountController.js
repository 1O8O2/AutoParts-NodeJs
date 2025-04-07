const Account = require("../../models/Account");
const { RoleGroup } = require("../../models/RoleGroup");

// [GET] /AutoParts/admin/account
module.exports.index = async (req, res) => {
    try {
        const accounts = await Account.findAll({
            where: {
                deleted: false
            },
            include: [{
                model: RoleGroup,
                attributes: ['roleGroupName'] 
            }]
        });
        
        res.render('admin/pages/account/index', {
            accounts: accounts,
            pageTitle: "Danh sách tài khoản"
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [PATCH] /AutoParts/admin/account/change-status/:newStatus/:accPhone
module.exports.changeStatus = async (req, res) => {
    try {
        const accPhone = req.params.accPhone;
        const newStatus = req.params.newStatus;
        
        const isSuccess = await Account.update(
            { status: newStatus },
            { 
                where: { 
                    phone: accPhone
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

// [GET] /AutoParts/admin/account/edit
module.exports.edit = async (req, res) => {
    try {
        const accPhone = req.params.accPhone;
        const account = await Account.findOne({
            where: { 
                deleted: false,
                phone: accPhone 
            },
            include: [{
                model: RoleGroup,
                attributes: ['roleGroupName'] 
            }]
        });

        const roleGroups = await RoleGroup.findAll({
            where: { deleted: false }
        });
        
        res.render('admin/pages/account/edit', {
            account: account,
            roleGroups: roleGroups
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [PATCH] /AutoParts/admin/account/edit/:accPhone
module.exports.editPatch = async (req, res) => {
    try {
        const accPhone = req.params.accPhone;
        
        const isSuccess = await Account.update(
            req.body,
            { 
                where: { 
                    phone: accPhone
                } 
            }
        );
        
        if (isSuccess) {
            console.log("OK1")
            req.flash("success", "Thay đổi thông tin tài khoản thành công!");
            return res.redirect(`${systemConfig.prefixAdmin}/account`);
        } else {
            console.log("OK2")
            req.flash("error", "Thay đổi thông tin tài khoản thất bại!");
            return res.redirect('back');
        }
    } catch (err) {
            console.log("OK3")
        res.redirect('back');
    }
};


