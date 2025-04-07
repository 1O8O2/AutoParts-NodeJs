const Customer = require('../../models/Customer');
const systemConfig = require('../../configs/system');

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

module.exports.detail = async (req, res) => {
    try {
        const cusPhone = req.query.cusPhone;
        const customer = await Customer.findOne({ 
            where: { phone: cusPhone }
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