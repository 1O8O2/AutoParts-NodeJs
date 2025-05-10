const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');

const Discount = sequelize.define('Discount', {
  discountId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  discountDesc: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  discountAmount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  minimumAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  applyStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  applyEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Active',
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
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Discount',
  timestamps: true
});

// Get discounts available for a customer (not used by the customer)
Discount.getByCustomer = async (email) => {
  try {

      const sql = `
          SELECT d.* FROM [dbo].[Discount] d
          LEFT JOIN [dbo].[UsedDiscount] ud
          ON d.discountId = ud.discountId AND ud.email = :email
          WHERE ud.discountId IS NULL
          AND d.status = 'Active'
          AND d.usageLimit > 0
          AND d.deleted = 0
      `;

      const discounts = await Discount.sequelize.query(sql, {
          replacements: { email },
          type: sequelize.QueryTypes.SELECT,
          model: Discount, // Map results to Discount model
          mapToModel: true // Ensure results are instances of Discount
      });

      return discounts;
  } catch (error) {
      console.error('Error in getByCustomer:', error);

  }
};


Discount.setUsedDiscount = async(email, discountId) =>
{
    try {
        const sql = `
            INSERT INTO [dbo].[UsedDiscount] (email, discountId)
            VALUES (:email, :discountId)
        `;
        await Discount.sequelize.query(sql, {
            replacements: { email, discountId },
            type: sequelize.QueryTypes.INSERT
        });
    } catch (error) {
        console.error('Error in setUsedDiscount:', error);
    }

}


Discount.deleteDiscountUsed = async (discountId, email) => {
  try {
    const sql = `
      DELETE FROM [dbo].[UsedDiscount]
      WHERE discountId = :discountId AND email = :email
    `;
    await Discount.sequelize.query(sql, {
      replacements: { discountId, email },
      type: sequelize.QueryTypes.DELETE,
    });
  } catch (error) {
    console.error('Error in deleteDiscountUsed:', error);
    return false;
  }
};

Discount.updateDiscountUsed = async (oldDiscountId, email, newDiscountId) => {
  try {
    const sql = `
      UPDATE [dbo].[UsedDiscount]
      SET discountId = :newDiscountId
      WHERE discountId = :oldDiscountId AND email = :email
    `;
    await Discount.sequelize.query(sql, {
      replacements: { newDiscountId, oldDiscountId, email },
      type: sequelize.QueryTypes.UPDATE,
    });
  } catch (error) {
    console.error('Error in updateDiscountUsed:', error);
    return false;
  }
};


module.exports = Discount;

