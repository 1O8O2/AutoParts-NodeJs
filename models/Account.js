const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const { RoleGroup } = require('./RoleGroup'); 

const Account = sequelize.define('Account', {
    phone: {
        type: DataTypes.STRING(10),
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
        type: DataTypes.STRING(255), 
        allowNull: true, 
        references: {
            model: 'RoleGroup', 
            key: 'roleGroupId'
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
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    tableName: 'Account',
    timestamps: false,
    schema: 'dbo'
});

Account.belongsTo(RoleGroup, { foreignKey: 'permission' }); 
RoleGroup.hasMany(Account, { foreignKey: 'permission' });  

module.exports = Account;