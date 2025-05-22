const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database').getSequelize();

const Brand = sequelize.define('Brand', {
  brandId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  brandName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Active',
    allowNull: true
  },
  deletedAt: {
    type: DataTypes.DATE,
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
  }
}, {
  tableName: 'Brand',
  timestamps: true
});

module.exports = Brand;