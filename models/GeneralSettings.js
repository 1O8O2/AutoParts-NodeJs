const { Sequelize, DataTypes } = require('sequelize');
const { getSequelize } = require('../configs/database');
const sequelize = getSequelize();

const GeneralSettings = sequelize.define('GeneralSettings', {
  websiteName: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  copyright: {
    type: DataTypes.STRING(255),
    allowNull: true
  },  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.fn('GETDATE')
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.fn('GETDATE')
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
  tableName: 'GeneralSettings',
  timestamps: true
});

module.exports = GeneralSettings;
