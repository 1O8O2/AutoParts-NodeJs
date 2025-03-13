const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const Brand = sequelize.define('Brand', {
    brandId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    brandName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'Active'
    },
    deletedAt: {
        type: DataTypes.DATE,
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
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'Brand',
    timestamps: false
});

module.exports = Brand;