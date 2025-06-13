const { DataTypes } = require('sequelize');
const { getSequelize } = require('../configs/database');
const sequelize = getSequelize();

const BlogGroup = sequelize.define('BlogGroup', {
  blogGroupId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  groupName: {
    type: DataTypes.STRING(50),
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
  tableName: 'BlogGroup',
  timestamps: true
});

module.exports = BlogGroup;
