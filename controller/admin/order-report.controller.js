const Order = require('../../models/Order');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');

// [GET] /admin/order-report
module.exports.index = async (req, res) => {
    try {
        const fromDate = req.query.fromDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const toDate = req.query.toDate || new Date().toISOString().split('T')[0];
        const status = req.query.status || '';

        // Build where clause
        const whereClause = {
            orderDate: {
                [Op.between]: [new Date(fromDate), new Date(toDate + 'T23:59:59')]
            }
        };

        if (status) {
            whereClause.status = status;
        }

        // Get orders
        const orders = await Order.findAll({
            where: whereClause,
            order: [['orderDate', 'DESC']]
        });

        // Calculate statistics
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const completedOrders = orders.filter(order => order.status === 'Completed').length;
        const cancelledOrders = orders.filter(order => order.status === 'Cancelled').length;

        res.render('admin/pages/order-report', {
            pageTitle: 'Báo cáo đơn hàng',
            orders: orders,
            totalOrders: totalOrders,
            totalRevenue: totalRevenue,
            completedOrders: completedOrders,
            cancelledOrders: cancelledOrders,
            fromDate: fromDate,
            toDate: toDate,
            status: status
        });
    } catch (error) {
        console.error('Error in order report:', error);
        res.status(500).send('Internal Server Error');
    }
};

// [GET] /admin/order-report/export
module.exports.exportReport = async (req, res) => {
    try {
        const fromDate = req.query.fromDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        const toDate = req.query.toDate || new Date().toISOString().split('T')[0];
        const status = req.query.status || '';

        // Build where clause
        const whereClause = {
            orderDate: {
                [Op.between]: [new Date(fromDate), new Date(toDate + 'T23:59:59')]
            }
        };

        if (status) {
            whereClause.status = status;
        }

        // Get orders
        const orders = await Order.findAll({
            where: whereClause,
            order: [['orderDate', 'DESC']]
        });

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Order Report');

        // Add headers
        worksheet.columns = [
            { header: 'Mã đơn hàng', key: 'orderId', width: 15 },
            { header: 'Ngày đặt', key: 'orderDate', width: 20 },
            { header: 'Khách hàng', key: 'userEmail', width: 30 },
            { header: 'Tổng tiền', key: 'totalAmount', width: 20 },
            { header: 'Trạng thái', key: 'status', width: 15 }
        ];

        // Add rows
        orders.forEach(order => {
            worksheet.addRow({
                orderId: order.orderId || '',
                orderDate: order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : '',
                userEmail: order.userEmail || '',
                totalAmount: (order.totalAmount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
                status: order.status || ''
            });
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=order-report-${fromDate}-to-${toDate}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting order report:', error);
        res.status(500).send('Internal Server Error');
    }
}; 