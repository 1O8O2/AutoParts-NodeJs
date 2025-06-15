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

// [PATCH] /AutoParts/admin/account/change-status/:newStatus/:accEmail
module.exports.changeStatus = async (req, res) => {
    try {
        const accEmail = req.params.accEmail;
        const newStatus = req.params.newStatus;
        
        const isSuccess = await Account.update(
            { status: newStatus },
            { 
                where: { 
                    email: accEmail
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
        const accEmail = req.params.accEmail;
        const account = await Account.findOne({
            where: { 
                deleted: false,
                email: accEmail 
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

// [PATCH] /AutoParts/admin/account/edit/:accEmail
module.exports.editPatch = async (req, res) => {
    console.log('accEmail', req.params.accEmail);
    console.log('req.body', req.body);
    try {
        const accEmail = req.params.accEmail;
        
        const isSuccess = await Account.update(
            req.body,
            { 
                where: { 
                    email: accEmail
                } 
            }
        );
        
        if (isSuccess) {
            req.flash("success", "Thay đổi thông tin tài khoản thành công!");
            return res.redirect(`${systemConfig.prefixAdmin}/account`);
        } else {
            req.flash("error", "Thay đổi thông tin tài khoản thất bại!");
            return res.redirect('back');
        }
    } catch (err) {
            console.log("OK3")
        res.redirect('back');
    }
};


