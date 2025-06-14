const { DataTypes } = require('sequelize');
const { getSequelize } = require('../configs/database');
const sequelize = getSequelize();
const Product = require('./Product');

const OrderDetail = sequelize.define('OrderDetail', {
  orderId: {
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
  productName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unitPrice: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false
  }
}, {
  tableName: 'OrderDetail',
  timestamps: false
});

// Define relationship with Product
OrderDetail.belongsTo(Product, { foreignKey: 'productId', targetKey: 'productId' });

module.exports = OrderDetail;
