const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database').getSequelize();
const { RoleGroup } = require('./RoleGroup');

// This file exists for compatibility with existing code
// The actual model is defined in RoleGroup.js and exported as part of { RoleGroup, RoleGroupPermissions }
// This file just re-exports that model

const RoleGroupPermissions = sequelize.models.RoleGroupPermissions || sequelize.define('RoleGroupPermissions', {
  roleGroupId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    references: {
      model: RoleGroup,
      key: 'roleGroupId'
    }
  },
  permissionName: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false
  }
}, {
  tableName: 'RoleGroupPermissions',
  timestamps: false
});

module.exports = RoleGroupPermissions;
