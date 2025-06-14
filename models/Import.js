const { Sequelize, DataTypes } = require('sequelize');
const { getSequelize } = require('../configs/database');
const sequelize = getSequelize();
const ImportDetail = require('./ImportDetail');
const Employee = require('./Employee');

const Import = sequelize.define('Import', {
    importId: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false
    },
    employeeEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
            model: Employee,
            key: 'email'
        }
    },
    importDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    importCost: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true
    }
}, {
    tableName: 'Import',
    timestamps: false
});

// Define associations
Import.belongsTo(Employee, {
    foreignKey: 'employeeEmail',
    targetKey: 'email'
});

Import.hasMany(ImportDetail, {
    foreignKey: 'importId',
    sourceKey: 'importId',
    as: 'importDetails'
});

module.exports = Import;
