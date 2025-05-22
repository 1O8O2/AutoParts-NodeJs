const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database').getSequelize();
const Account = require('./Account');
const { Cart } = require('./Cart');

const Customer = sequelize.define('Customer', {
  email: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
    references: {
      model: Account,
      key: 'email'
    }
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  cartId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    references: {
      model: Cart,
      key: 'cartId'
    }
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.fn('GETDATE')
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.fn('GETDATE')
  }
}, {
  tableName: 'Customer',
  timestamps: true
});

// Define relationships
Customer.belongsTo(Account, { foreignKey: 'email', targetKey: 'email' });
Account.hasOne(Customer, { foreignKey: 'email', sourceKey: 'email' });

Customer.belongsTo(Cart, { foreignKey: 'cartId', targetKey: 'cartId' });
Cart.hasMany(Customer, { foreignKey: 'cartId', sourceKey: 'cartId' });

module.exports = Customer;