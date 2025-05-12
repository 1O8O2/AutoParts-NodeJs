const Product = require("../../models/Product");
const Order = require('../../models/Order');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');

// [GET] /admin/product-report
module.exports.index = async (req, res) => {
    try {
        const fromDate = req.query.fromDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const toDate = req.query.toDate || new Date().toISOString().split('T')[0];

        // Get all products
        const products = await Product.findAll({
            where: { deleted: false }
        });

        // Get orders within date range
        const orders = await Order.findAll({
            where: {
                status: 'Completed',
                orderDate: {
                    [Op.between]: [new Date(fromDate), new Date(toDate + 'T23:59:59')]
                }
            }
        });

        // Calculate product statistics
        const productStats = products.map(product => {
            const soldQuantity = orders.reduce((total, order) => {
                const orderItem = order.details.find(item => item.productId === product.productId);
                return total + (orderItem ? orderItem.amount : 0);
            }, 0);

            const totalRevenue = soldQuantity * product.salePrice;

            return {
                productId: product.productId,
                name: product.productName,
                salePrice: product.salePrice,
                stock: product.stock,
                soldQuantity: soldQuantity,
                totalRevenue: totalRevenue
            };
        });

        res.render('admin/pages/product-report', {
            pageTitle: 'Báo cáo sản phẩm',
            products: productStats,
            fromDate: fromDate,
            toDate: toDate
        });
    } catch (error) {
        console.error('Error in product report:', error);
        res.status(500).send('Internal Server Error');
    }
};

// [GET] /admin/product-report/export
module.exports.exportReport = async (req, res) => {
    try {
        const fromDate = req.query.fromDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const toDate = req.query.toDate || new Date().toISOString().split('T')[0];

        // Get all products
        const products = await Product.findAll({
            where: { deleted: false }
        });

        // Get orders within date range
        const orders = await Order.findAll({
            where: {
                status: 'Completed',
                orderDate: {
                    [Op.between]: [new Date(fromDate), new Date(toDate + 'T23:59:59')]
                }
            }
        });

        // Calculate product statistics
        const productStats = products.map(product => { 
            const soldQuantity = orders.reduce((total, order) => {
                const orderItem = order.details.find(item => {item.productId === product.productId});
                return total  + (orderItem ? orderItem.amount : 0);
            }, 0);

            const totalRevenue = soldQuantity * product.salePrice;

            return {
                productId: product.productId,
                name: product.productName,
                salePrice: product.salePrice,
                stock: product.stock,
                soldQuantity: soldQuantity,
                totalRevenue: totalRevenue
            };
        });

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Product Report');

        // Add headers
        worksheet.columns = [
            { header: 'Mã sản phẩm', key: 'productId', width: 15 },
            { header: 'Tên sản phẩm', key: 'name', width: 30 },
            { header: 'Giá bán', key: 'salePrice', width: 15 },
            { header: 'Số lượng tồn kho', key: 'stock', width: 15 },
            { header: 'Số lượng đã bán', key: 'soldQuantity', width: 15 },
            { header: 'Tổng doanh thu', key: 'totalRevenue', width: 20 }
        ];

        // Add rows
        productStats.forEach(product => {
            worksheet.addRow({
                productId: product.productId,
                name: product.name,
                salePrice: product.salePrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
                stock: product.stock,
                soldQuantity: product.soldQuantity,
                totalRevenue: product.totalRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
            });
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=product-report-${fromDate}-to-${toDate}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting product report:', error);
        res.status(500).send('Internal Server Error');
    }
}; 