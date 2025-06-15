const db = require('../configs/database');         
const sequelize = db.getSequelize();               
const { QueryTypes } = require('sequelize');

module.exports.generateNextBlogId = async () => {
    try {
        const [result] = await sequelize.query(
            "SELECT MAX(blogId) AS maxId FROM Blog WHERE blogId LIKE 'BLOG%'",
            { type: QueryTypes.SELECT }
        );

        const maxId = result?.maxId;
        if (!maxId) return 'BLOG001';

        const currentNum = parseInt(maxId.substring(4), 10);
        return `BLOG${String(currentNum + 1).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating blogId:', error);
        return 'BLOG001';
    }
};
module.exports.generateNextDiscountId = async () => {
    try {
        const [result] = await sequelize.query(
            "SELECT MAX(discountId) AS maxId FROM Discount WHERE discountId LIKE 'DIS%'",
            { type: QueryTypes.SELECT }
        );

        const maxId = result?.maxId;
        if (!maxId) return 'DIS001';

        const currentNum = parseInt(maxId.substring(3), 10);
        return `DIS${String(currentNum + 1).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating discountId:', error);
        return 'DIS001';
    }
};

module.exports.generateNextOrderId = async () => {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `ORD${year}${month}${day}${hours}${minutes}${seconds}`;
    } catch (error) {
        console.error('Error generating orderId:', error);
        return 'ORD000000000000';
    }
};

module.exports.generateNextRoleGroupId = async () => {
    try {
        const [rows] = await sequelize.query(
            "SELECT MAX(roleGroupId) AS maxId FROM RoleGroup WHERE roleGroupId LIKE 'RG%'",
            { type: QueryTypes.SELECT }
        );

        const maxId = rows?.maxId;
        console.log(maxId)

        if (!maxId) {
            return 'RG001';
        }

        const currentNum = parseInt(maxId.substring(2), 10);
        return `RG${String(currentNum + 1).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating next roleGroupId:', error);
        return 'RG001';
    }
}
