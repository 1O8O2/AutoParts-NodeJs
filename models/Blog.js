const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const BlogGroup = require('./BlogGroup');

const Blog = sequelize.define('Blog', {
    blogId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    blogGroupId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT, // NVARCHAR(MAX)
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.STRING,
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
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updatedBy: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'Blog',
    timestamps: false
});

module.exports = Blog;