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
        const findCusAcc = await Account.findByPk(req.body.userPhone, { transaction });
        if (!findCusAcc) {
            const accData = {
                phone: req.body.userPhone,
                password: md5('1111'), 
                token: generateToken.generateRandomString(),
                permission: 'RG002',
                status: 'Active',
                deleted: false
            };
            await Account.create(accData, { transaction });

            const cusData = {
                fullName: req.body.userName,
                phone: req.body.userPhone,
                address: req.body.shipAddress,
                status: 'Active'
            };
            await Customer.create(cusData, { transaction });
        }

        // Chuyển đổi orderDetails thành mảng
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
        
        // Tạo dữ liệu Order
        const orderData = {
            orderId: req.body.orderId,
            discountId: (req.body.discountId == '' ? null : req.body.discountId),
            userPhone: req.body.userPhone,
            shipAddress: req.body.shipAddress,
            totalCost: parseFloat(req.body.totalCost),
            confirmedBy: res.locals.user.phone,
            status: 'Processing',
            deleted: false
        };

        // Tạo bản ghi Order
        const order = await Order.create(orderData, { transaction });

        // Thêm orderId vào orderDetails và tạo các bản ghi OrderDetail
        const orderDetailData = orderDetails.map(detail => ({
            ...detail,
            orderId: order.orderId
        }));
        await OrderDetail.bulkCreate(orderDetailData, { transaction });

        // Commit transaction
        await transaction.commit();

        req.flash('success', 'Tạo đơn hàng thành công!');
        res.redirect("admin/pages/order/orderProcessing");
    } catch (err) {
        await transaction.rollback();
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
                    }
                });

                return res.render('admin/pages/order/orderConfirm/index', {
                    pageTitle: "Danh sách đơn hàng chờ xác nhận",
                    listPending: listPending
                });
            case 'Processing':
                const listProcessing = await Order.findAll({
                    where: {
                        status: 'Processing',
                        deleted: false
                    }
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
                    }
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
                    }
                });
                return res.render('admin/pages/order/orderHistory', {
                    pageTitle: "Danh sách lịch sử đơn hàng",
                    listHistory: listHistory
                });
        }
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [GET] /AutoParts/admin/order/edit/:orderId
module.exports.edit = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findByPk(orderId);
        const customer = await Customer.findByPk(order.userPhone);
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
            customer: customer,
            products: products,
            discounts: discounts,
            orderDetails: orderDetails
        })

    } catch (err) {
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

        const findCusAcc = await Account.findByPk(req.body.userPhone, { transaction });
        if (!findCusAcc) {
            const accData = {
                phone: req.body.userPhone,
                password: md5('1111'),
                token: generateToken.generateRandomString(),
                permission: 'RG002',
                status: 'Active',
                deleted: false
            };
            await Account.create(accData, { transaction });

            const cusData = {
                fullName: req.body.userName,
                phone: req.body.userPhone,
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
                    where: { phone: req.body.userPhone },
                    transaction
                }
            );
        }

        // Chuyển đổi orderDetails thành mảng
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

        // Cập nhật dữ liệu Order
        const orderData = {
            discountId: (req.body.discountId == '' ? null : req.body.discountId),
            userPhone: req.body.userPhone,
            shipAddress: req.body.shipAddress,
            totalCost: parseFloat(req.body.totalCost),
            deleted: false
        };

        await Order.update(orderData, {
            where: { orderId: orderId },
            transaction
        });

        // Xóa các OrderDetail cũ
        await OrderDetail.destroy({
            where: { orderId: orderId },
            transaction
        });

        // Tạo lại các OrderDetail mới
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
        req.flash('error', 'Cập nhật đơn hàng thất bại!');
        res.redirect('back');
    }
};

// [GET] /AutoParts/admin/order/detail/:orderId
module.exports.detail = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findByPk(orderId);
        const customer = await Customer.findByPk(order.userPhone);
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
        
        res.render('admin/pages/order/detail', {
            pageTitle: "Chi tiết đơn hàng",
            order: order,
            customer: customer,
            discounts: discounts,
            orderDetails: orderDetails
        })

    } catch (err) {
        res.status(500).send('Server error');
    }
};

// [PATCH] /AutoParts/admin/order/changeStatus
module.exports.changeStatus = async (req, res) => {
    try {
        const status = req.body.status;
        const orderId = req.body.orderId;			

        if (status == 'Pending') {
            await Order.update(
                { status: "Processing" },
                { 
                    where: { orderId: orderId }
                }
            );

            req.flash('success', "Xác nhận đơn hàng thành công!");
            return res.redirect(`${systemConfig.prefixAdmin}/order/Processing`)
        }
        else if (status == 'Processing') {
            await Order.update(
                { status: "Shipping" },
                { 
                    where: { orderId: orderId }
                }
            );

            req.flash('success', "Chuyển trạng thái giao hàng thành công!");
            return res.redirect(`${systemConfig.prefixAdmin}/order/Delivery`)
        }
        else if (status == 'Cancelled' || status == 'Shipping') {
            await Order.update(
                { status: (status == 'Cancelled' ? 'Cancelled' : 'Completed') },
                { 
                    where: { orderId: orderId }
                }
            );

            req.flash('success', "Thành công!");
            return res.redirect(`${systemConfig.prefixAdmin}/order/History`)
        }
    } catch (err) {
        req.flash('error', 'Thất bại!');
        res.redirect('back');
    }
};