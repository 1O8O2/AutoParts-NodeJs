const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const OrderDetail = sequelize.define('OrderDetail', {
    orderId: {
        type: DataTypes.STRING,
        primaryKey: true, // Part of composite primary key
        allowNull: false
    },
    productId: {
        type: DataTypes.STRING,
        primaryKey: true, // Part of composite primary key
        allowNull: false
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unitPrice: {
        type: DataTypes.DECIMAL(15, 2), // Maps to BigDecimal
        allowNull: true
    }
}, {
    tableName: 'OrderDetail',
    timestamps: false,

});

module.exports = OrderDetail;