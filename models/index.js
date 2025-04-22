const Account = require('./Account');
const Blog = require('./Blog');
const BlogGroup = require('./BlogGroup');
const Brand = require('./Brand');
const { Cart, ProductsInCart } = require('./Cart');
const Chat = require('./Chat');
const Customer = require('./Customer');
const Discount = require('./Discount');
const Employee = require('./Employee');
const GeneralSettings = require('./GeneralSettings');
const Import = require('./Import');
const ImportDetail = require('./ImportDetail');
const Order = require('./Order');
const OrderDetail = require('./OrderDetail');
const Product = require('./Product');
const ProductGroup = require('./ProductGroup');
const RoleGroup = require('./RoleGroup');
const RoleGroupPermissions = require('./RoleGroupPermissions');

// Account associations
Account.hasOne(Customer, { foreignKey: 'email' });
Account.hasOne(Employee, { foreignKey: 'email' });
Account.hasMany(Chat, { foreignKey: 'userEmail' });
Account.belongsTo(RoleGroup, { foreignKey: 'permission' });

// BlogGroup associations
BlogGroup.hasMany(Blog, { foreignKey: 'blogGroupId' });

// Blog associations
Blog.belongsTo(BlogGroup, { foreignKey: 'blogGroupId' });
Blog.belongsTo(Employee, { foreignKey: 'createdBy', as: 'Creator' });
Blog.belongsTo(Employee, { foreignKey: 'updatedBy', as: 'Updater' });

// Brand associations
Brand.hasMany(Product, { foreignKey: 'brandId' });

// Cart associations
Cart.hasMany(ProductsInCart, { foreignKey: 'cartId' });
Cart.belongsToMany(Product, { through: ProductsInCart, foreignKey: 'cartId' });

// ProductsInCart associations
ProductsInCart.belongsTo(Cart, { foreignKey: 'cartId' });
ProductsInCart.belongsTo(Product, { foreignKey: 'productId' });

// Customer associations
Customer.belongsTo(Account, { foreignKey: 'email' });
Customer.belongsTo(Cart, { foreignKey: 'cartId' });
Customer.hasMany(Order, { foreignKey: 'userEmail' });

// Discount associations
Discount.hasMany(Order, { foreignKey: 'discountId' });

// Employee associations
Employee.belongsTo(Account, { foreignKey: 'email' });
Employee.hasMany(Blog, { foreignKey: 'createdBy' });
Employee.hasMany(Blog, { foreignKey: 'updatedBy' });
Employee.hasMany(Import, { foreignKey: 'employeeEmail' });
Employee.hasMany(Order, { foreignKey: 'confirmedBy' });
Employee.hasMany(Order, { foreignKey: 'updatedBy' });
Employee.hasMany(Product, { foreignKey: 'createdBy' });
Employee.hasMany(Product, { foreignKey: 'updatedBy' });

// Import associations
Import.belongsTo(Employee, { foreignKey: 'employeeEmail' });
Import.hasMany(ImportDetail, { foreignKey: 'importId' });

// ImportDetail associations
ImportDetail.belongsTo(Import, { foreignKey: 'importId' });
ImportDetail.belongsTo(Product, { foreignKey: 'productId' });

// Order associations
Order.belongsTo(Customer, { foreignKey: 'userEmail' });
Order.belongsTo(Discount, { foreignKey: 'discountId' });
Order.belongsTo(Employee, { foreignKey: 'confirmedBy' });
Order.belongsTo(Employee, { foreignKey: 'updatedBy' });
Order.hasMany(OrderDetail, { foreignKey: 'orderId' });

// OrderDetail associations
OrderDetail.belongsTo(Order, { foreignKey: 'orderId' });
OrderDetail.belongsTo(Product, { foreignKey: 'productId' });

// Product associations
Product.belongsTo(Brand, { foreignKey: 'brandId' });
Product.belongsTo(ProductGroup, { foreignKey: 'productGroupId' });
Product.hasMany(ImportDetail, { foreignKey: 'productId' });
Product.hasMany(OrderDetail, { foreignKey: 'productId' });
Product.hasMany(ProductsInCart, { foreignKey: 'productId' });
Product.belongsToMany(Cart, { through: ProductsInCart, foreignKey: 'productId' });
Product.belongsTo(Employee, { foreignKey: 'createdBy' });
Product.belongsTo(Employee, { foreignKey: 'updatedBy' });

// ProductGroup associations
ProductGroup.hasMany(Product, { foreignKey: 'productGroupId' });
ProductGroup.hasMany(ProductGroup, { foreignKey: 'parentGroupId', as: 'ChildGroups' });
ProductGroup.belongsTo(ProductGroup, { foreignKey: 'parentGroupId', as: 'ParentGroup' });

// RoleGroup associations
RoleGroup.hasMany(Account, { foreignKey: 'permission' });
RoleGroup.hasMany(RoleGroupPermissions, { foreignKey: 'roleGroupId' });

// RoleGroupPermissions associations
RoleGroupPermissions.belongsTo(RoleGroup, { foreignKey: 'roleGroupId' });

module.exports = {
  Account,
  Blog,
  BlogGroup,
  Brand,
  Cart,
  ProductsInCart,
  Chat,
  Customer,
  Discount,
  Employee,
  GeneralSettings,
  Import,
  ImportDetail,
  Order,
  OrderDetail,
  Product,
  ProductGroup,
  RoleGroup,
  RoleGroupPermissions
};
