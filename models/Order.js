const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const OrderDetail = require('./OrderDetail');
const Discount = require('./Discount');
const Customer = require('./Customer');
const Employee = require('./Employee');

const Order = sequelize.define('Order', {
    orderId: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false
    },
    discountId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        references: {
            model: Discount,
            key: 'discountId'
        }
    },
    userEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        references: {
            model: Customer,
            key: 'email'
        }
    },
    shipAddress: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    shippingType: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    totalCost: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true
    },
    orderDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.fn('GETDATE')
    },
    confirmedBy: {
        type: DataTypes.STRING(255),
        allowNull: true,
        references: {
            model: Employee,
            key: 'email'
        }
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'Wait for confirmation',
        allowNull: true
    },
    deletedAt: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('GETDATE')
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('GETDATE')
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true
    },
    updatedBy: {
        type: DataTypes.STRING(255),
        allowNull: true,
        references: {
            model: Employee,
            key: 'email'
        }
    }
}, {
    tableName: 'Order',
    timestamps: true,
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

// Define relationships
Order.hasMany(OrderDetail, { foreignKey: 'orderId', sourceKey: 'orderId' });
OrderDetail.belongsTo(Order, { foreignKey: 'orderId', targetKey: 'orderId' });

Order.belongsTo(Discount, { foreignKey: 'discountId', targetKey: 'discountId' });
Order.belongsTo(Customer, { foreignKey: 'userEmail', targetKey: 'email' });
Order.belongsTo(Employee, { foreignKey: 'confirmedBy', targetKey: 'email', as: 'confirmer' });
Order.belongsTo(Employee, { foreignKey: 'updatedBy', targetKey: 'email', as: 'updater' });

module.exports = Order;