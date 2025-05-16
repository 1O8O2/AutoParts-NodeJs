const Order = require('../../models/Order');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const moment = require("moment");

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
        // Calculate statistics
        const totalOrders = orders.length;
        const completedOrders = orders.filter(order => order.status === 'Completed').length;
        const cancelledOrders = orders.filter(order => order.status === 'Cancelled').length;
        const totalRevenue = orders
            .filter(order => order.status === 'Completed')
            .reduce((sum, order) => sum + (order.totalCost || 0), 0);


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

        // Tính doanh thu từ các đơn đã hoàn thành
        const completedRevenue = orders
            .filter(order => order.status === 'Completed')
            .reduce((sum, order) => sum + (order.totalCost || 0), 0);

        // Excel Workbook setup
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Order Report');

        // Cột
        worksheet.columns = [
            { header: 'Mã đơn hàng', key: 'orderId', width: 15 },
            { header: 'Ngày đặt', key: 'orderDate', width: 20 },
            { header: 'Khách hàng', key: 'userEmail', width: 30 },
            { header: 'Tổng tiền', key: 'totalAmount', width: 20 },
            { header: 'Trạng thái', key: 'status', width: 15 }
        ];

        // Tiêu đề báo cáo
        worksheet.mergeCells('A1:E1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `BÁO CÁO ĐƠN HÀNG từ ${moment(fromDate).format("DD/MM/YYYY")} đến ${moment(toDate).format("DD/MM/YYYY")}`;
        titleCell.font = { bold: true, size: 16 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Dòng tổng doanh thu
        worksheet.addRow([]);
        worksheet.addRow(['Tổng doanh thu (đơn hoàn thành):', completedRevenue]);
        worksheet.getCell('B3').numFmt = '#,##0 "VNĐ"';

        // Header row (tự động format)
        worksheet.addRow([]);
        worksheet.addRow(worksheet.columns.map(col => col.header));
        const headerRow = worksheet.lastRow;
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };

        // Dữ liệu
        orders.forEach(order => {
            let status = ""; 
            if (order.status == "Pending")
                status = "Chờ xác nhận"
            else if (order.status == "Processing")
                status = "Chờ xử lý"
            else if (order.status == "Shipping")
                status = "Đang giao" 
            else if (order.status == "Completed")
                status = "Đã hoàn thành"
            else if (order.status == "Cancelled")
                status = "Đã hủy"
            const row = worksheet.addRow({
                orderId: order.orderId || '',
                orderDate: order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : '',
                userEmail: order.userEmail || '',
                totalAmount: order.totalCost || 0,
                status: status || ''
            });

            // Định dạng tiền tệ
            row.getCell('totalAmount').numFmt = '#,##0 "VNĐ"';
        });

        // Header xuất file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=order-report-${fromDate}-to-${toDate}.xlsx`);

        // Xuất file
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting order report:', error);
        res.status(500).send('Internal Server Error');
    }
};
