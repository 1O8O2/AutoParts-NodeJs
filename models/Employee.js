const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const Employee = sequelize.define('Employee', {
    citizenId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: true
    },
    birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatar: {
        type: DataTypes.TEXT, // NVARCHAR(MAX)
        allowNull: true
    },
    educationLevel: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true
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
    tableName: 'Employee',
    timestamps: false
});

module.exports = Employee;