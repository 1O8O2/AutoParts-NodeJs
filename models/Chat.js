const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const Account = require('./Account');

const Chat = sequelize.define('Chat', {
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
    primaryKey: true,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Active',
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
  tableName: 'Chat',
  timestamps: true
});

// Define relationship with Account
Chat.belongsTo(Account, { foreignKey: 'userEmail', targetKey: 'email' });
Account.hasMany(Chat, { foreignKey: 'userEmail', sourceKey: 'email' });

module.exports = Chat;