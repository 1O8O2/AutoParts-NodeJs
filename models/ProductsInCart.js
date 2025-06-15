const { DataTypes } = require('sequelize');
const { getSequelize } = require('../configs/database');
const sequelize = getSequelize();
const { Cart } = require('./Cart');
const Product = require('./Product');

// This file exists for compatibility with existing code
// The actual model is defined in Cart.js and exported as part of { Cart, ProductsInCart }
// This file just re-exports that model

const ProductsInCart = sequelize.models.ProductsInCart || sequelize.define('ProductsInCart', {
  cartId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    references: {
      model: Cart,
      key: 'cartId'
    }
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
  amount: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'ProductsInCart',
  timestamps: false
});

module.exports = ProductsInCart;
