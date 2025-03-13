const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const Chat = sequelize.define('Chat', {
    chatRoomId: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false
    },
    userPhone: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT, // NVARCHAR(MAX)
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
    tableName: 'Chat',
    timestamps: false
});

module.exports = Chat;