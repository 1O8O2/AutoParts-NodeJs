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
const { RoleGroup, RoleGroupPermissions } = require('./RoleGroup');

// Account associations
Account.hasOne(Customer, { foreignKey: 'email', sourceKey: 'email' });
Account.hasOne(Employee, { foreignKey: 'email', sourceKey: 'email' });
Account.hasMany(Chat, { foreignKey: 'userEmail', sourceKey: 'email' });
Account.belongsTo(RoleGroup, { foreignKey: 'permission', targetKey: 'roleGroupId' });

// BlogGroup associations
BlogGroup.hasMany(Blog, { foreignKey: 'blogGroupId', sourceKey: 'blogGroupId' });

// Blog associations
Blog.belongsTo(BlogGroup, { foreignKey: 'blogGroupId', targetKey: 'blogGroupId' });
Blog.belongsTo(Employee, { foreignKey: 'createdBy', targetKey: 'email', as: 'creator' });
Blog.belongsTo(Employee, { foreignKey: 'updatedBy', targetKey: 'email', as: 'updater' });

// Brand associations
Brand.hasMany(Product, { foreignKey: 'brandId', sourceKey: 'brandId' });

// Cart associations
Cart.hasMany(ProductsInCart, { foreignKey: 'cartId', sourceKey: 'cartId' });
Cart.belongsToMany(Product, { through: ProductsInCart, foreignKey: 'cartId', otherKey: 'productId' });
Cart.hasMany(Customer, { foreignKey: 'cartId', sourceKey: 'cartId' });

// ProductsInCart associations
ProductsInCart.belongsTo(Cart, { foreignKey: 'cartId' });
ProductsInCart.belongsTo(Product, { foreignKey: 'productId' });

// Customer associations
Customer.belongsTo(Account, { foreignKey: 'email', targetKey: 'email' });
Customer.belongsTo(Cart, { foreignKey: 'cartId', targetKey: 'cartId' });
Customer.hasMany(Order, { foreignKey: 'userEmail', sourceKey: 'email' });

// Discount associations
Discount.hasMany(Order, { foreignKey: 'discountId', sourceKey: 'discountId' });

// Employee associations
Employee.belongsTo(Account, { foreignKey: 'email', targetKey: 'email' });
Employee.hasMany(Blog, { foreignKey: 'createdBy', sourceKey: 'email', as: 'createdBlogs' });
Employee.hasMany(Blog, { foreignKey: 'updatedBy', sourceKey: 'email', as: 'updatedBlogs' });
Employee.hasMany(Import, { foreignKey: 'employeeEmail', sourceKey: 'email' });
Employee.hasMany(Order, { foreignKey: 'confirmedBy', sourceKey: 'email', as: 'confirmedOrders' });
Employee.hasMany(Order, { foreignKey: 'updatedBy', sourceKey: 'email', as: 'updatedOrders' });
Employee.hasMany(Product, { foreignKey: 'createdBy', sourceKey: 'email', as: 'createdProducts' });
Employee.hasMany(Product, { foreignKey: 'updatedBy', sourceKey: 'email', as: 'updatedProducts' });

// Import associations
Import.belongsTo(Employee, { foreignKey: 'employeeEmail', targetKey: 'email' });
Import.hasMany(ImportDetail, { foreignKey: 'importId', sourceKey: 'importId' });

// ImportDetail associations
ImportDetail.belongsTo(Import, { foreignKey: 'importId', targetKey: 'importId' });
ImportDetail.belongsTo(Product, { foreignKey: 'productId', targetKey: 'productId' });

// Order associations
Order.belongsTo(Customer, { foreignKey: 'userEmail', targetKey: 'email' });
Order.belongsTo(Discount, { foreignKey: 'discountId', targetKey: 'discountId' });
Order.belongsTo(Employee, { foreignKey: 'confirmedBy', targetKey: 'email', as: 'confirmer' });
Order.belongsTo(Employee, { foreignKey: 'updatedBy', targetKey: 'email', as: 'updater' });
Order.hasMany(OrderDetail, { foreignKey: 'orderId', sourceKey: 'orderId' });

// OrderDetail associations
OrderDetail.belongsTo(Order, { foreignKey: 'orderId', targetKey: 'orderId' });
OrderDetail.belongsTo(Product, { foreignKey: 'productId', targetKey: 'productId' });

// Product associations
Product.belongsTo(Brand, { foreignKey: 'brandId', targetKey: 'brandId' });
Product.belongsTo(ProductGroup, { foreignKey: 'productGroupId', targetKey: 'productGroupId' });
Product.belongsTo(Employee, { foreignKey: 'createdBy', targetKey: 'email', as: 'creator' });
Product.belongsTo(Employee, { foreignKey: 'updatedBy', targetKey: 'email', as: 'updater' });
Product.hasMany(ImportDetail, { foreignKey: 'productId', sourceKey: 'productId' });
Product.hasMany(OrderDetail, { foreignKey: 'productId', sourceKey: 'productId' });
Product.hasMany(ProductsInCart, { foreignKey: 'productId', sourceKey: 'productId' });
Product.belongsToMany(Cart, { through: ProductsInCart, foreignKey: 'productId', otherKey: 'cartId' });

// ProductGroup associations
ProductGroup.hasMany(Product, { foreignKey: 'productGroupId', sourceKey: 'productGroupId' });
ProductGroup.hasMany(ProductGroup, { foreignKey: 'parentGroupId', sourceKey: 'productGroupId', as: 'childGroups' });
ProductGroup.belongsTo(ProductGroup, { foreignKey: 'parentGroupId', targetKey: 'productGroupId', as: 'parentGroup' });

// RoleGroup associations
RoleGroup.hasMany(Account, { foreignKey: 'permission', sourceKey: 'roleGroupId' });
RoleGroup.hasMany(RoleGroupPermissions, { foreignKey: 'roleGroupId', sourceKey: 'roleGroupId' });

// RoleGroupPermissions associations
RoleGroupPermissions.belongsTo(RoleGroup, { foreignKey: 'roleGroupId', targetKey: 'roleGroupId' });

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
