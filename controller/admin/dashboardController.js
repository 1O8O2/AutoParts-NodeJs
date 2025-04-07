const Account = require("../../models/Account");
const Employee = require("../../models/Employee");
const Order = require("../../models/Order");
const OrderDetail = require("../../models/OrderDetail");
const Product = require("../../models/Product");
const { Op, literal } = require('sequelize');

// [GET] /AutoParts/admin/statistic
module.exports.statistic = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Set to start of day

    // Get date range from query parameters or use defaults (today and yesterday)
    let fromDate = req.query.fromDate ? new Date(req.query.fromDate) : yesterday;
    let toDate = req.query.toDate ? new Date(req.query.toDate) : today;

    // Ensure fromDate starts at beginning of day and toDate ends at end of day
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    // Format dates for SQL Server
    const formatDateForSQL = (date) => {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    // Get completed orders within date range
    const orders = await Order.findAll({
      where: {
        status: 'Completed',
        deleted: false,
        orderDate: {
          [Op.between]: [
            literal(`CAST('${formatDateForSQL(fromDate)}' AS DATETIME)`),
            literal(`CAST('${formatDateForSQL(toDate)}' AS DATETIME)`)
          ]
        }
      },
      include: [{
        model: OrderDetail
      }]
    });

    // Calculate total income for the period
    let totalIncome = 0;
    const products = new Map();

    for (const order of orders) {
      totalIncome += parseFloat(order.totalCost || 0);

      // Track products
      for (const detail of order.OrderDetails) {
        if (!products.has(detail.productId)) {
          const product = await Product.findByPk(detail.productId);
          if (product) {
            products.set(detail.productId, {
              product: {
                ...product.toJSON(),
                price: parseFloat(product.price || 0),
                stock: parseInt(product.stock || 0)
              },
              amount: parseInt(detail.amount || 0)
            });
          }
        } else {
          // Add to existing product amount
          const existingProduct = products.get(detail.productId);
          existingProduct.amount += parseInt(detail.amount || 0);
        }
      }
    }

    // Get total products sold in the period
    const totalProducts = orders.reduce((sum, order) => {
      return sum + order.OrderDetails.reduce((detailSum, detail) => {
        return detailSum + parseInt(detail.amount || 0);
      }, 0);
    }, 0);

    // Get new orders (pending) within date range
    const newOrders = await Order.findAll({
      where: {
        status: 'Pending',
        deleted: false,
        orderDate: {
          [Op.between]: [
            literal(`CAST('${formatDateForSQL(fromDate)}' AS DATETIME)`),
            literal(`CAST('${formatDateForSQL(toDate)}' AS DATETIME)`)
          ]
        }
      }
    });

    // Get accounts created within date range
    const accounts = await Account.findAll({
      where: {
        deleted: false,
        createdAt: {
          [Op.between]: [
            literal(`CAST('${formatDateForSQL(fromDate)}' AS DATETIME)`),
            literal(`CAST('${formatDateForSQL(toDate)}' AS DATETIME)`)
          ]
        }
      }
    });

    // Format dates for the view
    const formattedFromDate = fromDate.toISOString().split('T')[0];
    const formattedToDate = toDate.toISOString().split('T')[0];

    // Get daily income data for the chart
    const dailyIncome = [];
    const labels = [];
    
    // Create array of dates between fromDate and toDate
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      const dateStr = currentDate.toISOString().split('T')[0];
      labels.push(dateStr);
      
      // Filter orders for this date
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate.toISOString().split('T')[0] === dateStr;
      });

      // Sum income for this date
      const dayIncome = dayOrders.reduce((sum, order) => sum + parseFloat(order.totalCost || 0), 0);
      dailyIncome.push(dayIncome);
    }

    res.render('admin/pages/statistic', {
      pageTitle: "Thống kê",
      totalIncome: parseFloat(totalIncome || 0),
      totalProducts,
      newOrders,
      accounts,
      products: Array.from(products.values()),
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      dailyIncome,
      labels
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// [GET] /AutoParts/admin/dashboard/profile
module.exports.profile = async (req, res) => {
  try {
    res.render('admin/pages/account/profile', {
      pageTitle: "Trang chi tiết tài khoản"
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [POST] /AutoParts/admin/dashboard/profile/edit/:userPhone
module.exports.editProfile = async (req, res) => {
  try {
    const userPhone = req.params.userPhone;

    await Employee.update(
      req.body,
      { 
        where: { 
            phone: userPhone
        } 
      }
    );

    req.flash('success', "Thay đổi thông tin thành công!");
    res.redirect("back");
  } catch (err) {
    req.flash('error', "Thay đổi thông tin thất bại!");
    res.status(500).send('Server error');
  }
};