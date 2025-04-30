const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const { RoleGroup } = require('./RoleGroup'); 

const Account = sequelize.define('Account', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    token: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    permission: { 
        type: DataTypes.STRING(50), 
        allowNull: false
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'Active',
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
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true
    }
}, {
    tableName: 'Account',
    timestamps: true
});

// Define relationship with RoleGroup
Account.belongsTo(RoleGroup, { foreignKey: 'permission', targetKey: 'roleGroupId' });
RoleGroup.hasMany(Account, { foreignKey: 'permission', sourceKey: 'roleGroupId' });

module.exports = Account;