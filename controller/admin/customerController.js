const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const systemConfig = require('../../configs/system');
const { Op, HSTORE } = require('sequelize');

// [GET] /admin/customer
module.exports.index = async (req, res) => {
    try {
        const customers = await Customer.findAll();
        
        res.render('admin/pages/customer/index', {
            pageTitle: "Quản lý khách hàng",
            customers,
            prefixAdmin: systemConfig.prefixAdmin
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Có lỗi xảy ra khi tải danh sách khách hàng');
        res.redirect(req.get('Referrer') || '/');
    }
};

// [GET] /admin/customer/detail/:cusEmail
module.exports.detail = async (req, res) => {
    try {
        const cusEmail = req.query.cusEmail;
        const customer = await Customer.findOne({ 
            where: { email: cusEmail }
        });

        if (!customer) {
            return res.status(404).json({ 
                success: false, 
                error: 'Không tìm thấy khách hàng' 
            });
        }

        res.render('admin/pages/customer/detailModal', {
            customer,
            layout: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            error: 'Có lỗi xảy ra khi tải thông tin khách hàng' 
        });
    }
}; 

// [GET] /admin/customer/historyOrder/:cusEmail
module.exports.historyOrder = async (req, res) => {
    try {
        const cusEmail = req.query.cusEmail;
        console.log(cusEmail)

        const historyOrder = await Order.findAll({
            where: {
                status: { [Op.in]: ['Completed', 'Cancelled'] },
                userEmail: cusEmail,
                deleted: false
            },
        });

        res.render("admin/pages/customer/historyOrder", {
            success: true,
            historyOrder: historyOrder
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            error: 'Có lỗi xảy ra khi tải thông tin khách hàng' 
        });
    }
}