const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database').getSequelize();
const Account = require('./Account');

const Employee = sequelize.define('Employee', {
  email: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
    references: {
      model: Account,
      key: 'email'
    }
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  educationLevel: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  citizenId: {
    type: DataTypes.STRING(12),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
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
  tableName: 'Employee',
  timestamps: true
});

// Define relationship with Account
Employee.belongsTo(Account, { foreignKey: 'email', targetKey: 'email' });
Account.hasOne(Employee, { foreignKey: 'email', sourceKey: 'email' });

module.exports = Employee;