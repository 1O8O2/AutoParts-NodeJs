const Product = require("../../models/Product");
const Order = require('../../models/Order');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const moment = require('moment');

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

        const products = await Product.findAll({ where: { deleted: false } });

        const orders = await Order.findAll({
            where: {
                status: 'Completed',
                orderDate: {
                    [Op.between]: [new Date(fromDate), new Date(toDate + 'T23:59:59')]
                }
            }
        });

        const productStats = [];
        let totalRevenue = 0;
        let totalSold = 0;

        products.forEach(product => {
            const soldQuantity = orders.reduce((total, order) => {
                const orderItem = order.details.find(item => item.productId === product.productId);
                return total + (orderItem ? orderItem.amount : 0);
            }, 0);
            const revenue = soldQuantity * product.salePrice;
            totalRevenue += revenue;
            totalSold += soldQuantity;

            productStats.push({
                productId: product.productId,
                name: product.productName,
                salePrice: product.salePrice,
                stock: product.stock,
                soldQuantity,
                totalRevenue: revenue
            });
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Product Report');
        const currencyFormat = '#,##0 "VNĐ";-#,##0 "VNĐ"';

        // Add title and date range with enhanced formatting
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'BÁO CÁO SẢN PHẨM';
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        worksheet.mergeCells('A2:F2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Từ ngày: ${moment(fromDate).format('DD/MM/YYYY')} đến ngày: ${moment(toDate).format('DD/MM/YYYY')}`;
        dateCell.font = { size: 12, bold: true };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Add empty row for spacing
        worksheet.addRow([]);

        // Bắt đầu từ dòng 4 để không ghi đè dòng 1 và 2
        worksheet.getRow(4).values = ['Tóm tắt'];
        worksheet.getRow(5).values = ['Tổng số lượng đã bán', totalSold];
        worksheet.getRow(6).values = ['Tổng số lượng tồn kho', products.reduce((sum, p) => sum + p.stock, 0)];
        worksheet.getRow(7).values = ['Tổng doanh thu', totalRevenue];
        worksheet.getCell('B7').numFmt = currencyFormat;

        // Bảng dữ liệu bắt đầu từ dòng 9
        worksheet.getRow(8).values = [];
        worksheet.columns = [
            { header: 'Mã sản phẩm', key: 'productId', width: 20 },
            { header: 'Tên sản phẩm', key: 'name', width: 40 },
            { header: 'Giá bán', key: 'salePrice', width: 20, style: { alignment: { horizontal: 'right' } } },
            { header: 'Số lượng tồn kho', key: 'stock', width: 20, style: { alignment: { horizontal: 'center' } } },
            { header: 'Số lượng đã bán', key: 'soldQuantity', width: 20, style: { alignment: { horizontal: 'center' } } },
            { header: 'Tổng doanh thu', key: 'totalRevenue', width: 25, style: { alignment: { horizontal: 'right' } } }
        ];

        // Thêm dòng header
        worksheet.addRow(worksheet.columns.map(col => col.header));

        // Data Rows
        productStats.forEach(p => {
            const row = worksheet.addRow({
                productId: p.productId,
                name: p.name,
                salePrice: p.salePrice,
                stock: p.stock,
                soldQuantity: p.soldQuantity,
                totalRevenue: p.totalRevenue
            });
        
            // Định dạng số tiền
            ['salePrice', 'totalRevenue'].forEach(key => {
                const cell = row.getCell(key);
                if (typeof cell.value === 'number') {
                    cell.numFmt = currencyFormat;
                }
            });
        });
        
        // Set download headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=product-report-${fromDate}-to-${toDate}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting product report:', error);
        res.status(500).send('Internal Server Error');
    }
};