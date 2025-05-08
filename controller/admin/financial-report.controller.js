const Order = require('../../models/Order');
const Product = require('../../models/Product');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');

// [GET] /admin/financial-report
module.exports.index = async (req, res) => {
    try {
        const fromDate = req.query.fromDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const toDate = req.query.toDate || new Date().toISOString().split('T')[0];

        console.log('Date Range:', { fromDate, toDate });

        // Get completed orders within date range
        const orders = await Order.findAll({
            where: {
                status: 'Completed',
                orderDate: {
                    [Op.between]: [new Date(fromDate), new Date(toDate + 'T23:59:59')]
                }
            }
        });

        // Calculate revenue
        const totalRevenue = orders.reduce((sum, order) => {
            const orderRevenue = order.details.reduce((detailSum, detail) => {
                return detailSum + (detail.unitPrice * detail.amount);
            }, 0);
            return sum + orderRevenue;
        }, 0);

        console.log('Total Revenue:', totalRevenue);

        // Calculate costs
        const costDetails = [
            {
                type: 'Giá vốn hàng bán',
                amount: orders.reduce((sum, order) => {
                    const orderCost = order.details.reduce((detailSum, detail) => {
                        const itemCost = (detail.unitPrice || 0) * detail.amount;
                        console.log(`Order ${order.orderId}, Item ${detail.productId} cost:`, itemCost);
                        return detailSum + itemCost;
                    }, 0);
                    console.log(`Order ${order.orderId} total cost:`, orderCost);
                    return sum + orderCost;
                }, 0)
            },
            {
                type: 'Chi phí vận chuyển',
                amount: orders.reduce((sum, order) => {
                    const shippingFee = order.totalCost || 0;
                    console.log(`Order ${order.orderId} shipping fee:`, shippingFee);
                    return sum + shippingFee;
                }, 0)
            },
            {
                type: 'Chi phí khác',
                amount: 0 // Add other costs if needed
            }
        ];

        console.log('Cost Details:', costDetails);

        const totalCost = costDetails.reduce((sum, cost) => {
            console.log(`${cost.type}:`, cost.amount);
            return sum + cost.amount;
        }, 0);

        console.log('Total Cost:', totalCost);

        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

        console.log('Profit:', profit);
        console.log('Profit Margin:', profitMargin + '%');

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
                const orderRevenue = order.details.reduce((detailSum, detail) => {
                    return detailSum + (detail.unitPrice * detail.amount);
                }, 0);
                console.log(`Daily Revenue - ${dateStr}, Order ${order.orderId}:`, orderRevenue);
                return sum + orderRevenue;
            }, 0);
            revenueData.push(dailyRevenue);

            // Calculate daily costs
            const dailyCost = dailyOrders.reduce((sum, order) => {
                const orderCost = order.details.reduce((detailSum, detail) => {
                    const itemCost = (detail.unitPrice || 0) * detail.amount;
                    console.log(`Daily Cost - ${dateStr}, Order ${order.orderId}, Item ${detail.productId}:`, itemCost);
                    return detailSum + itemCost;
                }, 0);
                const shippingFee = order.totalCost || 0;
                console.log(`Daily Cost - ${dateStr}, Order ${order.orderId} total:`, orderCost + shippingFee);
                return sum + orderCost + shippingFee;
            }, 0);
            costData.push(dailyCost);

            currentDate.setDate(currentDate.getDate() + 1);
        }


        res.render('admin/pages/financial-report', {
            pageTitle: 'Báo cáo tài chính',
            totalRevenue: totalRevenue,
            totalCost: totalCost,
            profit: profit,
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

        // Calculate revenue
        const totalRevenue = orders.reduce((sum, order) => {
            return sum + order.details.reduce((detailSum, detail) => {
                return detailSum + (detail.unitPrice * detail.amount);
            }, 0);
        }, 0);

        // Calculate costs
        const costDetails = [
            {
                type: 'Giá vốn hàng bán',
                amount: orders.reduce((sum, order) => {
                    return sum + order.details.reduce((detailSum, detail) => {
                        return detailSum + ((detail.unitPrice || 0) * detail.amount);
                    }, 0);
                }, 0)
            },
            {
                type: 'Chi phí vận chuyển',
                amount: orders.reduce((sum, order) => sum + (order.totalCost || 0), 0)
            },
            {
                type: 'Chi phí khác',
                amount: 0 // Add other costs if needed
            }
        ];

        const totalCost = costDetails.reduce((sum, cost) => sum + cost.amount, 0);
        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Financial Report');

        // Add headers
        worksheet.columns = [
            { header: 'Chỉ tiêu', key: 'type', width: 30 },
            { header: 'Số tiền', key: 'amount', width: 20 }
        ];

        // Add summary rows
        worksheet.addRow({ type: 'Tổng doanh thu', amount: totalRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) });
        worksheet.addRow({ type: 'Tổng chi phí', amount: totalCost.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) });
        worksheet.addRow({ type: 'Lợi nhuận', amount: profit.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) });
        worksheet.addRow({ type: 'Tỷ suất lợi nhuận', amount: `${profitMargin}%` });

        // Add empty row
        worksheet.addRow({});

        // Add cost details
        worksheet.addRow({ type: 'Chi tiết chi phí', amount: '' });
        costDetails.forEach(cost => {
            worksheet.addRow({
                type: cost.type,
                amount: cost.amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
            });
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=financial-report-${fromDate}-to-${toDate}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting financial report:', error);
        res.status(500).send('Internal Server Error');
    }
}; 