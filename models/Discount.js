const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const Discount = sequelize.define('Discount', {
  discountId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  discountDesc: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  discountAmount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  minimumAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  applyStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  applyEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Active',
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.fn('GETDATE')
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: sequelize.fn('GETDATE')
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Discount',
  timestamps: true
});

module.exports = Discount;