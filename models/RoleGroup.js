const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const RoleGroup = sequelize.define('RoleGroup', {
    roleGroupId: {
        type: DataTypes.STRING(255), // Matches NVARCHAR(255) in Java
        primaryKey: true,
        allowNull: false
    },
    roleGroupName: {
        type: DataTypes.STRING(255), // Matches roleGroupName in Java
        allowNull: true
    },
    description: {
        type: DataTypes.STRING, // No length specified in Java, default STRING
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50), // Matches length=50 in Java
        allowNull: true,
        defaultValue: 'Active' // Matches columnDefinition DEFAULT 'Active'
    },
    deletedAt: {
        type: DataTypes.DATE, // Matches Timestamp in Java (DATETIMEOFFSET in SQL Server)
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE, // Matches Timestamp
        allowNull: true,
        defaultValue: Sequelize.fn('GETDATE') // SQL Server native function
    },
    updatedAt: {
        type: DataTypes.DATE, // Matches Timestamp
        allowNull: true,
        defaultValue: Sequelize.fn('GETDATE') // SQL Server native function
    },
    deleted: {
        type: DataTypes.BOOLEAN, // Matches boolean in Java
        allowNull: false,
        defaultValue: false
    },
    permissions: {
        type: DataTypes.VIRTUAL, // Virtual field to hold permissions, like products in Cart
        defaultValue: []
    }
}, {
    tableName: 'RoleGroup',
    timestamps: false, // Managed manually via createdAt/updatedAt
    hooks: {
        afterCreate: async (roleGroup, options) => {
            if (roleGroup.permissions.length > 0) {
                const permissionsData = roleGroup.permissions.map(permissionName => ({
                    roleGroupId: roleGroup.roleGroupId,
                    permissionName
                }));
                await RoleGroupPermissions.bulkCreate(permissionsData, { transaction: options.transaction });
            }
        },
        beforeUpdate: async (roleGroup, options) => {
            if (roleGroup.changed('permissions')) {
                await RoleGroupPermissions.destroy({
                    where: { roleGroupId: roleGroup.roleGroupId },
                    transaction: options.transaction
                });
                if (roleGroup.permissions.length > 0) {
                    const permissionsData = roleGroup.permissions.map(permissionName => ({
                        roleGroupId: roleGroup.roleGroupId,
                        permissionName
                    }));
                    await RoleGroupPermissions.bulkCreate(permissionsData, { transaction: options.transaction });
                }
            }
        },
        afterFind: async (roleGroups, options) => {
            const roleGroupsArray = Array.isArray(roleGroups) ? roleGroups : [roleGroups];
            for (const roleGroup of roleGroupsArray) {
                if (roleGroup && roleGroup.roleGroupId) {
                    const permissions = await RoleGroupPermissions.findAll({
                        where: { roleGroupId: roleGroup.roleGroupId },
                        transaction: options?.transaction
                    });
                    roleGroup.permissions = permissions.map(p => p.permissionName);
                }
            }
        }
    }
});

const RoleGroupPermissions = sequelize.define('RoleGroupPermissions', {
    roleGroupId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        primaryKey: true,
        references: {
            model: RoleGroup,
            key: 'roleGroupId'
        }
    },
    permissionName: {
        type: DataTypes.STRING(255), // Arbitrary length for permission names
        allowNull: false,
        primaryKey: true
    }
}, {
    tableName: 'RoleGroupPermissions',
    timestamps: false
});

// Relationships
RoleGroup.hasMany(RoleGroupPermissions, { foreignKey: 'roleGroupId' });
RoleGroupPermissions.belongsTo(RoleGroup, { foreignKey: 'roleGroupId' });

module.exports = { RoleGroup, RoleGroupPermissions };