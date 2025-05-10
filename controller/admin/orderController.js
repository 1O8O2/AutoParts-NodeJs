const md5 = require('md5');

const Order = require("../../models/Order");
const OrderDetail = require("../../models/OrderDetail");
const Product = require("../../models/Product");
const Discount = require("../../models/Discount");
const Customer = require("../../models/Customer");
const Account = require("../../models/Account");
const sequelize = require("../../configs/database"); 
const { Op } = require('sequelize');

const generateId = require("../../helpers/generateId");
const generateToken = require("../../helpers/generateToken");

const systemConfig = require("../../configs/system");

const {mailSend} = require('../../helpers/mail');

// [GET] /AutoParts/admin/order/add
module.exports.add = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: {
                deleted: false
            }
        });
        const discounts = await Discount.findAll({
            where: {
                deleted: false
            }
        });

        const nextId = await generateId.generateNextOrderId();

        res.render('admin/pages/order/add', {
            pageTitle: "Thêm đơn hàng",
            products: products,
            discounts: discounts,
            nextId: nextId
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [POST] /AutoParts/admin/order/add
module.exports.addPost = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const findCusAcc = await Account.findByPk(req.body.userEmail, { transaction });
        if (!findCusAcc) {
            const accData = {
                email: req.body.userEmail,
                password: md5('1111'), 
                token: generateToken.generateRandomString(),
                permission: 'RG002',
                status: 'Active',
                deleted: false
            };
            await Account.create(accData, { transaction });

            const cusData = {
                email: req.body.userEmail,
                fullName: req.body.userName,
                phone: req.body.userPhone || '',
                address: req.body.shipAddress,
                status: 'Active'
            };
            await Customer.create(cusData, { transaction });
        }

        // Convert orderDetails to array
        const orderDetails = [];
        const orderDetailKeys = Object.keys(req.body).filter(key => key.startsWith('orderDetails['));
        const indices = [...new Set(orderDetailKeys.map(key => {
            const match = key.match(/orderDetails\[(\d+)\]/);
            return match ? match[1] : null;
        }).filter(index => index !== null))];

        indices.forEach(index => {
            const detail = {
                productId: req.body[`orderDetails[${index}].productId`],
                productName: req.body[`orderDetails[${index}].productName`],
                amount: parseInt(req.body[`orderDetails[${index}].amount`], 10),
                unitPrice: parseFloat(req.body[`orderDetails[${index}].unitPrice`])
            };
            orderDetails.push(detail);
        });
        
        // Create Order data
        const orderData = {
            orderId: req.body.orderId,
            discountId: (req.body.discountId === '' ? null : req.body.discountId),
            userEmail: req.body.userEmail,
            shipAddress: req.body.shipAddress,
            totalCost: parseFloat(req.body.totalCost),
            confirmedBy: res.locals.user.email,
            status: 'Processing',
            deleted: false
        };

        // Create Order record
        const order = await Order.create(orderData, { transaction });

        // Add orderId to orderDetails and create OrderDetail records
        const orderDetailData = orderDetails.map(detail => ({
            ...detail,
            orderId: order.orderId
        }));
        await OrderDetail.bulkCreate(orderDetailData, { transaction });

        // Commit transaction
        await transaction.commit();

        req.flash('success', 'Tạo đơn hàng thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/order/Processing`);
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        req.flash('error', 'Tạo đơn hàng thất bại!');
        res.redirect('back');
    }
};

// [GET] /AutoParts/admin/order/:status
module.exports.index = async (req, res) => {
    try {
        const status = req.params.status;

        switch(status) {
            case 'Pending':
                const listPending = await Order.findAll({
                    where: {
                        status: 'Pending',
                        deleted: false
                    },
                    include: [{ model: Customer }]
                });
                console.log(listPending);

                return res.render('admin/pages/order/orderConfirm/index', {
                    pageTitle: "Danh sách đơn hàng chờ xác nhận",
                    listPending: listPending
                });
            case 'Processing':
                const listProcessing = await Order.findAll({
                    where: {
                        status: 'Processing',
                        deleted: false
                    },
                    include: [{ model: Customer }]
                });
                return res.render('admin/pages/order/orderProcessing', {
                    pageTitle: "Danh sách đơn hàng đang xử lý",
                    listProcessing: listProcessing
                });
            case 'Delivery':
                const listDelivery = await Order.findAll({
                    where: {
                        status: 'Shipping',
                        deleted: false
                    },
                    include: [{ model: Customer }]
                });
                return res.render('admin/pages/order/orderDeli', {
                    pageTitle: "Danh sách đơn hàng đang giao hàng",
                    listDelivery: listDelivery
                });
            default:
                const listHistory = await Order.findAll({
                    where: {
                        status: { [Op.in]: ['Completed', 'Cancelled'] },
                        deleted: false
                    },
                    include: [{ model: Customer }]
                });
                return res.render('admin/pages/order/orderHistory', {
                    pageTitle: "Danh sách lịch sử đơn hàng",
                    listHistory: listHistory
                });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [GET] /AutoParts/admin/order/edit/:orderId
module.exports.edit = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findByPk(orderId, {
            include: [{ model: Customer }]
        });
        
        if (!order) {
            req.flash('error', "Đơn hàng không tồn tại!");
            return res.redirect('back');
        }

        const products = await Product.findAll({
            where: {
                deleted: false
            }
        });
        const discounts = await Discount.findAll({
            where: {
                deleted: false
            }
        });
        const orderDetails = await OrderDetail.findAll({
            where: {
                orderId: orderId
            }
        });
        
        res.render('admin/pages/order/orderConfirm/edit', {
            pageTitle: "Sửa đơn hàng",
            order: order,
            customer: order.Customer,
            products: products,
            discounts: discounts,
            orderDetails: orderDetails
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [PATCH] /AutoParts/admin/order/edit/:orderId
module.exports.editPatch = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const orderId = req.params.orderId; 

        const order = await Order.findByPk(orderId, { transaction });
        if (!order) {
            req.flash('error', "Đơn hàng không tồn tại!");
            return res.redirect('back');
        }

        const findCusAcc = await Account.findByPk(req.body.userEmail, { transaction });
        if (!findCusAcc) {
            const accData = {
                email: req.body.userEmail,
                password: md5('1111'),
                token: generateToken.generateRandomString(),
                permission: 'RG002',
                status: 'Active',
                deleted: false
            };
            await Account.create(accData, { transaction });

            const cusData = {
                email: req.body.userEmail,
                fullName: req.body.userName,
                phone: req.body.userPhone || '',
                address: req.body.shipAddress,
                status: 'Active'
            };
            await Customer.create(cusData, { transaction });
        } else {
            await Customer.update(
                {
                    fullName: req.body.userName,
                    address: req.body.shipAddress
                },
                {
                    where: { email: req.body.userEmail },
                    transaction
                }
            );
        }

        // Convert orderDetails to array
        const orderDetails = [];
        const orderDetailKeys = Object.keys(req.body).filter(key => key.startsWith('orderDetails['));
        const indices = [...new Set(orderDetailKeys.map(key => {
            const match = key.match(/orderDetails\[(\d+)\]/);
            return match ? match[1] : null;
        }).filter(index => index !== null))];

        indices.forEach(index => {
            const detail = {
                productId: req.body[`orderDetails[${index}].productId`],
                productName: req.body[`orderDetails[${index}].productName`],
                amount: parseInt(req.body[`orderDetails[${index}].amount`], 10),
                unitPrice: parseFloat(req.body[`orderDetails[${index}].unitPrice`])
            };
            orderDetails.push(detail);
        });

        // Update Order data
        const orderData = {
            discountId: (req.body.discountId === '' ? null : req.body.discountId),
            userEmail: req.body.userEmail,
            shipAddress: req.body.shipAddress,
            totalCost: parseFloat(req.body.totalCost),
            updatedBy: res.locals.user.email,
            deleted: false
        };

        await Order.update(orderData, {
            where: { orderId: orderId },
            transaction
        });

        // Delete old OrderDetails
        await OrderDetail.destroy({
            where: { orderId: orderId },
            transaction
        });

        // Create new OrderDetails
        const orderDetailData = orderDetails.map(detail => ({
            ...detail,
            orderId: orderId
        }));
        await OrderDetail.bulkCreate(orderDetailData, { transaction });

        // Commit transaction
        await transaction.commit();

        req.flash('success', 'Cập nhật đơn hàng thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/order/Pending`);
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        req.flash('error', 'Cập nhật đơn hàng thất bại!');
        res.redirect('back');
    }
};

// [GET] /AutoParts/admin/order/detail/:orderId
module.exports.detail = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findByPk(orderId, {
            include: [
                { model: Customer },
                { model: Discount }
            ]
        });
        
        if (!order) {
            req.flash('error', "Đơn hàng không tồn tại!");
            return res.redirect('back');
        }

        const orderDetails = await OrderDetail.findAll({
            where: { orderId: orderId },
            include: [{ model: Product }]
        });
        
        res.render('admin/pages/order/detail', {
            pageTitle: "Chi tiết đơn hàng",
            order: order,
            customer: order.Customer,
            discounts: order.Discount,
            orderDetails: orderDetails
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [PATCH] /AutoParts/admin/order/changeStatus
module.exports.changeStatus = async (req, res) => {
    try {
        const status = req.body.status;
        const orderId = req.body.orderId;
        const order = await Order.findByPk(orderId);
        const customerEmail = order.userEmail;	
        console.log(customerEmail);
        console.log(order);


        if (status === 'Pending') {
            await Order.update(
                { 
                    status: "Processing",
                    confirmedBy: res.locals.user.email
                },
                { 
                    where: { orderId: orderId }
                }
            );

            const from = 'no-reply@autopart.com'
            const to = customerEmail
            const subject = 'Đơn hàng đã được xác nhận';
            const html = `
                Chào bạn,<br><br>
                Đơn hàng của bạn tại AutoPart đã được xác nhận thành công! Dưới đây là thông tin chi tiết về đơn hàng:<br><br>
                <strong>Mã đơn hàng:</strong> ${order.orderId}<br>
                <strong>Tổng tiền:</strong> ${order.totalCost.toLocaleString('vi-VN')} ₫<br>
                <strong>Địa chỉ giao hàng:</strong> ${order.shipAddress}<br>
                <strong>Loại vận chuyển:</strong> ${order.shippingType}<br><br>
                Đơn hàng của bạn hiện đang được chuẩn bị và sẽ sớm được giao đến bạn. Bạn có thể theo dõi trạng thái đơn hàng trong phần "Tài khoản" trên website của chúng tôi.<br><br>
                Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.<br><br>
                Trân trọng,<br>
                Đội ngũ AutoPart
            `;
            console.log(to);
            await mailSend(from, to, subject, html);
            req.flash('success', "Xác nhận đơn hàng thành công!");
            return res.redirect(`${systemConfig.prefixAdmin}/order/Processing`);
        }
        else if (status === 'Processing') {
            await Order.update(
                { 
                    status: "Shipping",
                    updatedBy: res.locals.user.email 
                },
                { 
                    where: { orderId: orderId }
                }
            );
            
            const from = 'no-reply@autopart.com'
            const to = customerEmail
            const subject = 'Đơn hàng đang được giao';
            const html = `
                Chào bạn,<br><br>
                Đơn hàng của bạn tại AutoPart đang được giao đến bạn! Dưới đây là thông tin chi tiết về đơn hàng:<br><br>
                <strong>Mã đơn hàng:</strong> ${order.orderId}<br>
                <strong>Tổng tiền:</strong> ${order.totalCost.toLocaleString('vi-VN')} ₫<br>
                <strong>Địa chỉ giao hàng:</strong> ${order.shipAddress}<br>
                <strong>Loại vận chuyển:</strong> ${order.shippingType}<br><br>
                Đơn hàng của bạn đã được chuyển đến đơn vị vận chuyển và sẽ sớm đến tay bạn. Bạn có thể theo dõi trạng thái giao hàng trong phần "Tài khoản" trên website của chúng tôi hoặc liên hệ đơn vị vận chuyển để biết thêm chi tiết.<br><br>
                Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.<br><br>
                Trân trọng,<br>
                Đội ngũ AutoPart
            `;
            await mailSend(from, to, subject, html);

            req.flash('success', "Chuyển trạng thái giao hàng thành công!");
            return res.redirect(`${systemConfig.prefixAdmin}/order/Delivery`);
        }
        else if (status === 'Cancelled' || status === 'Shipping') {
            await Order.update(
                { 
                    status: (status === 'Cancelled' ? 'Cancelled' : 'Completed'),
                    updatedBy: res.locals.user.email
                },
                { 
                    where: { orderId: orderId }
                }
            );

            const from = 'no-reply@autopart.com'
            const to = customerEmail
            const subject = 'Đơn hàng đang được giao';
            let  html 
            if (status === 'Cancelled') {
                html = `
                    Chào bạn,<br><br>
                    Đơn hàng của bạn tại AutoPart đã bị hủy! Dưới đây là thông tin chi tiết về đơn hàng:<br><br>
                    <strong>Mã đơn hàng:</strong> ${order.orderId}<br>
                    <strong>Tổng tiền:</strong> ${order.totalCost.toLocaleString('vi-VN')} ₫<br>
                    <strong>Địa chỉ giao hàng:</strong> ${order.shipAddress}<br>
                    <strong>Loại vận chuyển:</strong> ${order.shippingType}<br><br>
                    Đơn hàng của bạn đã bị hủy vì lý do không xác định. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.<br><br>
                    Trân trọng,<br>
                    Đội ngũ AutoPart
                `;
            }
            else {
                html = `
                    Chào bạn,<br><br>
                    Đơn hàng của bạn tại AutoPart đã hoàn tất! Dưới đây là thông tin chi tiết về đơn hàng:<br><br>
                    <strong>Mã đơn hàng:</strong> ${order.orderId}<br>
                    <strong>Tổng tiền:</strong> ${order.totalCost.toLocaleString('vi-VN')} ₫<br>
                    <strong>Địa chỉ giao hàng:</strong> ${order.shipAddress}<br>
                    <strong>Loại vận chuyển:</strong> ${order.shippingType}<br><br>
                    Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm tại AutoPart!<br><br>
                    Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.<br><br>
                    Trân trọng,<br>
                    Đội ngũ AutoPart
                `;
            }

            await mailSend(from, to, subject, html);

            req.flash('success', "Thành công!");
            return res.redirect(`${systemConfig.prefixAdmin}/order/History`);
        }
    } catch (err) {
        console.error(err);
        req.flash('error', 'Thất bại!');
        res.redirect('back');
    }
};