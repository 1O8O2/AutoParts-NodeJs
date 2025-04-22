const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

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
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('GETDATE') // Correct usage of Sequelize
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('GETDATE') // Correct usage of Sequelize
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

// Sync is typically done in app.js, not here, but for testing:
(async () => {
    try {
        await Account.sync({ force: false });
        console.log('Account model synced');
    } catch (error) {
        console.error('Error syncing Account model:', error);
    }
})();

module.exports = Account;