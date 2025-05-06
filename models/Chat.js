const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const Account = require('./Account');
const { v4: uuidv4 } = require('uuid');

const Chat = sequelize.define('Chat', {
  messageId: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: () => uuidv4(),
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: Account,
      key: 'email'
    }
  },
  chatRoomId: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  senderType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'customer' // Options: 'customer', 'employee', 'system'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Unread',
    allowNull: true
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true
  }
}, {
  tableName: 'Chat',
  timestamps: true,
  // No longer need composite primary key since we have messageId
  id: false,
  indexes: [
    {
      name: 'idx_chat_room_id',
      fields: ['chatRoomId']
    },
    {
      name: 'idx_chat_user_email',
      fields: ['userEmail']
    },
    {
      name: 'idx_chat_status',
      fields: ['status']
    }
  ],
  hooks: {
    beforeCreate: (instance) => {
      if (!instance.messageId) {
        instance.messageId = uuidv4();
      }
    },
    beforeUpdate: (instance) => {
      // Remove timezone information from dates to prevent SQL Server conversion errors
      if (instance.createdAt && instance.changed('createdAt')) {
        if (typeof instance.createdAt === 'string') {
          // Format date to SQL Server compatible format
          instance.createdAt = instance.createdAt.split('+')[0].trim();
        }
      }
    },
    beforeBulkUpdate: (options) => {
      // Handle date formatting in bulk updates (e.g., when using update() method)
      if (options.where && options.where.createdAt) {
        if (typeof options.where.createdAt === 'string') {
          options.where.createdAt = options.where.createdAt.split('+')[0].trim();
        }
      }
    }
  }
});

// Define relationship with Account
Chat.belongsTo(Account, { foreignKey: 'userEmail', targetKey: 'email' });
Account.hasMany(Chat, { foreignKey: 'userEmail', sourceKey: 'email' });

module.exports = Chat;