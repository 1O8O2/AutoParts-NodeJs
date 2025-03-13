const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const Customer = sequelize.define('Customer', {
    cartId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
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
        
    }
}, {
    tableName: 'Customer',
    timestamps: false
});

module.exports = Customer;