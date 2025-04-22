const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const ProductGroup = require('./ProductGroup');
const Brand = require('./Brand');

const Product = sequelize.define('Product', {
    productId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    productGroupId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    brandId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    salePrice: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    costPrice: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imageUrls: {
        type: DataTypes.STRING,
        allowNull: true
    },
    weight: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
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
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.STRING,
        allowNull: false
    },
    updatedBy: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'Product',
    timestamps: false
});

// // Relationships
// Product.belongsTo(ProductGroup, { foreignKey: 'productGroupId', targetKey: 'productGroupId' });
// ProductGroup.hasMany(Product, { foreignKey: 'productGroupId', sourceKey: 'productGroupId' });
// Product.belongsTo(Brand, { foreignKey: 'brandId', targetKey: 'brandId' });
// Brand.hasMany(Product, { foreignKey: 'brandId', sourceKey: 'brandId' });

module.exports = Product;