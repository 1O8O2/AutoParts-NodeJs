const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const OrderDetail = require('./OrderDetail');

const Order = sequelize.define('Order', {
    orderId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    discountId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    shipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    totalCost: {
        type: DataTypes.DECIMAL(15, 2), // Maps to BigDecimal
        allowNull: true
    },
    orderDate: {
        type: DataTypes.DATEONLY, // Maps to java.sql.Date (no time)
        allowNull: true,
        defaultValue: Sequelize.fn('GETDATE') // SQL Server native function

    },
    confirmedBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    deletedAt: {
        type: DataTypes.DATE, // Maps to Timestamp
        allowNull: true
        
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('GETDATE') // SQL Server native function

    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('GETDATE') // SQL Server native function

    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    details: {
        type: DataTypes.VIRTUAL,
        defaultValue: []
    }
}, {
    tableName: '[Order]', // Match JPA's escaped table name
    timestamps: false,
    hooks: {
        afterFind: async (orders, options) => {
                    const ordersArray = Array.isArray(orders) ? orders : [orders];
                    for (const order of ordersArray) {
                        if (order && order.orderId) {
                            const details = await OrderDetail.findAll({
                                where: { orderId: order.orderId },
                                transaction: options?.transaction
                            });
                            order.details = details;
                        }
                    }
                }
    }
});

Order.generateOrderId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng từ 0-11, cộng 1 và thêm số 0 nếu cần
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `ORD${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Set up the one-to-many relationship
Order.hasMany(OrderDetail, { foreignKey: 'orderId', sourceKey: 'orderId' });
OrderDetail.belongsTo(Order, { foreignKey: 'orderId', targetKey: 'orderId' });

module.exports = Order;