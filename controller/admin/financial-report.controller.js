const Order = require('../../models/Order');
const Product = require('../../models/Product');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const moment = require("moment");

// [GET] /admin/financial-report
module.exports.index = async (req, res) => {
    try {
        const fromDate = req.query.fromDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const toDate = req.query.toDate || new Date().toISOString().split('T')[0];

        // Get completed orders within date range
        const orders = await Order.findAll({
            where: {
                status: 'Completed',
                orderDate: {
                    [Op.between]: [new Date(fromDate), new Date(toDate + 'T23:59:59')]
                }
            }
        });

        const productIds = [
            ...new Set(
                orders.flatMap(ord => 
                    ord.details.map(detail => detail.productId)
                )
            )
        ];
        const productOrders = await Product.findAll({
            attributes: ['productId', 'costPrice'],
            required: true,
            where: {
                productId: {
                    [Op.in]: productIds
                }
            }
        })

        // Calculate revenue
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalCost, 0);
        const totalCostPrice = orders.reduce((sum, order) => {
            const orderCost = order.details.reduce((detailSum, detail) => {
                const costPrice = productOrders.find(pro => detail.productId == pro.productId).costPrice;
                const itemCost = costPrice * detail.amount;
                return detailSum + itemCost;
            }, 0);
            return sum + orderCost;
        }, 0);

        // Calculate costs
        const costDetails = [
            {
                type: 'Giá vốn hàng bán',
                amount: parseInt(totalCostPrice)
            },
            {
                type: 'Tổng doanh thu đơn hàng',
                amount: parseInt(totalRevenue)
            },
            {
                type: 'Chi phí khác',
                amount: 0 // Add other costs if needed
            }
        ];


        const totalCost = costDetails.reduce((sum, cost) => {
            return sum + cost.amount;
        }, 0);

        const profit = totalRevenue - totalCostPrice;
        const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

        // Prepare chart data
        const days = [];
        const revenueData = [];
        const costData = [];
        let currentDate = new Date(fromDate);
        const endDate = new Date(toDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            days.push(dateStr);

            // Calculate daily revenue
            const dailyOrders = orders.filter(order => {
                if (!order.orderDate) return false;
                const orderDate = new Date(order.orderDate);
                return orderDate.toISOString().split('T')[0] === dateStr;
            });

            const dailyRevenue = dailyOrders.reduce((sum, order) => {
                return sum + order.totalCost;
            }, 0);
            revenueData.push(dailyRevenue);

            // Calculate daily costs
            const dailyCost = dailyOrders.reduce((sum, order) => {
                const orderCost = order.details.reduce((detailSum, detail) => {
                    const costPrice = productOrders.find(pro => detail.productId == pro.productId).costPrice;
                    const itemCost = costPrice * detail.amount;
                    return detailSum + itemCost;
                }, 0);
                return sum + orderCost;
            }, 0);
            costData.push(dailyCost);

            currentDate.setDate(currentDate.getDate() + 1);
        }


        res.render('admin/pages/financial-report', {
            pageTitle: 'Báo cáo tài chính',
            totalRevenue: parseInt(totalRevenue),
            totalCost: parseInt(totalCost),
            profit: parseInt(profit),
            profitMargin: profitMargin,
            costDetails: costDetails,
            labels: days,
            revenueData: revenueData,
            costData: costData,
            fromDate: fromDate,
            toDate: toDate
        });
    } catch (error) {
        console.error('Error in financial report:', error);
        res.status(500).send('Internal Server Error');
    }
};

// [GET] /admin/financial-report/export
module.exports.exportReport = async (req, res) => {
    try {
        const fromDate = req.query.fromDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const toDate = req.query.toDate || new Date().toISOString().split('T')[0];

        // Get completed orders within date range
        const orders = await Order.findAll({
            where: {
                status: 'Completed',
                orderDate: {
                    [Op.between]: [new Date(fromDate), new Date(toDate + 'T23:59:59')]
                }
            }
        });

        const productIds = [
            ...new Set(
                orders.flatMap(ord => ord.details.map(detail => detail.productId))
            )
        ];

        const productOrders = await Product.findAll({
            attributes: ['productId', 'productName', 'costPrice'],
            where: {
                productId: { [Op.in]: productIds }
            }
        });

        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
        const totalCostPrice = orders.reduce((sum, order) => {
            const orderCost = order.details.reduce((detailSum, detail) => {
                const product = productOrders.find(pro => detail.productId === pro.productId);
                const costPrice = product ? product.costPrice : 0;
                return detailSum + (costPrice * (detail.amount || 0));
            }, 0);
            return sum + orderCost;
        }, 0);

        const profit = totalRevenue - totalCostPrice;
        const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

        // ExcelJS workbook
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Financial Report');

        // Define columns once at the top
        worksheet.columns = [
            { key: 'orderId', header: 'Mã Đơn Hàng', width: 15 },
            { key: 'orderDate', header: 'Ngày Đặt Hàng', width: 15 },
            { key: 'totalCost', header: 'Tổng Tiền Đơn', width: 15 },
            { key: 'status', header: 'Trạng Thái', width: 15 },
            { key: 'productId', header: 'Mã Sản Phẩm', width: 15 },
            { key: 'productName', header: 'Tên Sản Phẩm', width: 30 },
            { key: 'quantity', header: 'Số Lượng', width: 10 },
            { key: 'unitPrice', header: 'Đơn Giá', width: 15 },
            { key: 'costPrice', header: 'Giá Vốn', width: 15 },
            { key: 'totalItemCost', header: 'Tổng Giá Vốn SP', width: 15 }
        ];

        const currencyFormat = '#,##0 "VNĐ";-#,##0 "VNĐ"';

        // Title row
        worksheet.mergeCells('A1:J1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Báo Cáo Tài Chính từ ${moment(fromDate).format("DD/MM/YYYY")} đến ${moment(toDate).format("DD/MM/YYYY")}`;
        titleCell.font = { bold: true, size: 16 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Summary Section
        worksheet.addRow([]);
        worksheet.addRow(['Tóm Tắt Tài Chính']);
        worksheet.addRow(['Tổng doanh thu', totalRevenue]);
        worksheet.addRow(['Tổng chi phí', totalCostPrice]);
        worksheet.addRow(['Lợi nhuận', profit]);
        worksheet.addRow(['Tỷ suất lợi nhuận', `${profitMargin}%`]);

        // Apply number format for currency in summary
        for (let i = 3; i <= 5; i++) {
            const cell = worksheet.getCell(`B${i + 1}`);
            if (typeof cell.value === 'number') {
                cell.numFmt = currencyFormat;
            }
        }

        worksheet.addRow([]);
        worksheet.addRow(['Chi Tiết Đơn Hàng']);

        // Add header row for details
        worksheet.addRow(worksheet.columns.map(col => col.header));

        // Populate data rows
        orders.forEach(order => {
            const orderId = order.orderId || 'N/A';
            const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : '';
            const totalCost = order.totalCost || 0;
            const status = order.status === 'Completed' ? 'Hoàn thành' : '';

            if (order.details && order.details.length > 0) {
                order.details.forEach((detail, idx) => {
                    const product = productOrders.find(p => p.productId === detail.productId) || {};
                    const dataRow = {
                        orderId: idx === 0 ? orderId : '',
                        orderDate: idx === 0 ? orderDate : '',
                        totalCost: idx === 0 ? totalCost : '',
                        status: idx === 0 ? status : '',
                        productId: detail.productId || '',
                        productName: product.productName || detail.productName || '',
                        quantity: detail.amount || 0,
                        unitPrice: detail.unitPrice || 0,
                        costPrice: product.costPrice || 0,
                        totalItemCost: (detail.amount || 0) * (product.costPrice || 0)
                    };

                    const row = worksheet.addRow(dataRow);

                    // Format currency cells
                    ['totalCost', 'unitPrice', 'costPrice', 'totalItemCost'].forEach(key => {
                        const cell = row.getCell(key);
                        if (typeof cell.value === 'number') {
                            cell.numFmt = currencyFormat;
                        }
                    });
                });
            }
        });

        // Set headers for download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=financial-report-${fromDate}-to-${toDate}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting financial report:', error);
        res.status(500).send('Internal Server Error');
    }
};
