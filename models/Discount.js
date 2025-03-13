const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const Discount = sequelize.define('Discount', {
    discountId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    discountDesc: {
        type: DataTypes.STRING,
        allowNull: true
    },
    discountAmount: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    minimumAmount: {
        type: DataTypes.DECIMAL(15, 2), // Maps to BigDecimal
        allowNull: true
    },
    usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    applyStartDate: {
        type: DataTypes.DATEONLY, // DATE without time
        allowNull: true
    },
    applyEndDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'Discount',
    timestamps: false
});

module.exports = Discount;