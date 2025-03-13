const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const BlogGroup = sequelize.define('BlogGroup', {
    blogGroupId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    groupName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Active'
    },
    deletedAt: {
        type: DataTypes.DATE,
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
    }
}, {
    tableName: 'BlogGroup',
    timestamps: false
});

module.exports = BlogGroup;