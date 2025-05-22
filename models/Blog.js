const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database').getSequelize();
const BlogGroup = require('./BlogGroup');
const Employee = require('./Employee');

const Blog = sequelize.define('Blog', {
  blogId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  blogGroupId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.STRING(255),
    allowNull: false
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
  },
  updatedBy: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'Blog',
  timestamps: true
});

// Relationship with BlogGroup
Blog.belongsTo(BlogGroup, { foreignKey: 'blogGroupId', targetKey: 'blogGroupId' });
BlogGroup.hasMany(Blog, { foreignKey: 'blogGroupId', sourceKey: 'blogGroupId' });

// Relationship with Employee (createdBy)
Blog.belongsTo(Employee, { foreignKey: 'createdBy', targetKey: 'email', as: 'creator' });
// Relationship with Employee (updatedBy)
Blog.belongsTo(Employee, { foreignKey: 'updatedBy', targetKey: 'email', as: 'updater' });

module.exports = Blog;