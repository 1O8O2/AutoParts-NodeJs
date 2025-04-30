const Account = require("../../models/Account");
// const RoleGroup = require("../../models/");

// [GET] /AutoParts/admin/account
module.exports.index = async (req, res) => {
    try {
        const accounts = await Account.findAll({
            where: {
                deleted: false
            }
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
        const accounts = await Account.findAll({
            where: { deleted: false },
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