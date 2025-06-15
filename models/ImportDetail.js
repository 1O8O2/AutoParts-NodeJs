const { DataTypes } = require('sequelize');
const { getSequelize } = require('../configs/database');
const sequelize = getSequelize();
const Product = require('./Product');

const ImportDetail = sequelize.define('ImportDetail', {
  importId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  productId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    references: {
      model: Product,
      key: 'productId'
    }
  },
  price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: true
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
