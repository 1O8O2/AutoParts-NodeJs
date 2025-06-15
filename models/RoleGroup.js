const { Sequelize, DataTypes } = require('sequelize');
const { getSequelize } = require('../configs/database');
const sequelize = getSequelize();

const RoleGroup = sequelize.define('RoleGroup', {
    roleGroupId: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false
    },
    roleGroupName: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'Active'
    },
    deletedAt: {
        type: DataTypes.DATE,
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
        allowNull: true,
        defaultValue: false
    },
    permissions: {
        type: DataTypes.VIRTUAL, // Virtual field to hold permissions
        get() {
            return this._permissions || [];
        },
        set(value) {
            this._permissions = value;
        }
    }
}, {
    tableName: 'RoleGroup',
    timestamps: true,
    hooks: {
        afterCreate: async (roleGroup, options) => {
            if (roleGroup._permissions && roleGroup._permissions.length > 0) {
                const permissionsData = roleGroup._permissions.map(permissionName => ({
                    roleGroupId: roleGroup.roleGroupId,
                    permissionName
                }));
                await RoleGroupPermissions.bulkCreate(permissionsData, { transaction: options.transaction });
            }
        },
        beforeUpdate: async (roleGroup, options) => {
            if (roleGroup._permissions !== undefined) {
                await RoleGroupPermissions.destroy({
                    where: { roleGroupId: roleGroup.roleGroupId },
                    transaction: options.transaction
                });
                if (roleGroup._permissions && roleGroup._permissions.length > 0) {
                    const permissionsData = roleGroup._permissions.map(permissionName => ({
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
        type: DataTypes.STRING(50),
        allowNull: false,
        primaryKey: true,
        references: {
            model: RoleGroup,
            key: 'roleGroupId'
        }
    },
    permissionName: {
        type: DataTypes.STRING(255),
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
