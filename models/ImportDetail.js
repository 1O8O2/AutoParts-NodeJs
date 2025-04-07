const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const Product = require('./Product');

const ImportDetail = sequelize.define('ImportDetail', {
    importId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        references: {
            model: 'Import',
            key: 'importId'
        }
    },
    productId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        references: {
            model: 'Product',
            key: 'productId'
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'ImportDetail',
    timestamps: false
});

// Define associations
ImportDetail.belongsTo(Product, {
    foreignKey: 'productId',
    targetKey: 'productId'
});

module.exports = ImportDetail; 