const Product = require("../../models/Product");
const Brand = require('../../models/Brand');
const ProductGroup = require('../../models/ProductGroup');
const Import = require('../../models/Import');
const ImportDetail = require('../../models/ImportDetail');
const Employee = require('../../models/Employee');

const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const systemConfig = require('../../configs/system');
const { format } = require('date-fns');
const moment = require('moment');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/img/');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Helper function to format date as ddMMyyyy
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}${month}${year}`;
};

// Helper function to generate next import ID
const generateNextImportId = async () => {
    try {
        const currentDate = new Date();
        const dateStr = formatDate(currentDate);
        const prefix = `IMP${dateStr}`;

        // Find the maximum import ID with the current prefix
        const maxImport = await Import.findOne({
            where: {
                importId: {
                    [Op.like]: `${prefix}%`
                }
            },
            order: [['importId', 'DESC']]
        });

        if (!maxImport) {
            return `${prefix}001`;
        }

        const currentNum = parseInt(maxImport.importId.substring(prefix.length));
        return `${prefix}${String(currentNum + 1).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating import ID:', error);
        const currentDate = new Date();
        const dateStr = formatDate(currentDate);
        return `IMP${dateStr}001`;
    }
};

// Helper function to generate next product ID
const generateNextProductId = async () => {
    try {
        const maxProduct = await Product.findOne({
            where: {
                productId: {
                    [Op.like]: 'PROD%'
                }
            },
            order: [['productId', 'DESC']]
        });

        if (!maxProduct) {
            return 'PROD001';
        }

        const currentNum = parseInt(maxProduct.productId.substring(4));
        return `PROD${String(currentNum + 1).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating product ID:', error);
        return 'PROD001';
    }
};

// [GET] /admin/product
module.exports.index = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: {
                deleted: false
            }
        });

        // Process image URLs
        products.forEach(product => {
            if (product.imageUrls) {
                const imgArray = product.imageUrls.split(',');
                product.imageUrl = imgArray[0];
            }
        });

        res.render('admin/pages/product/index', {
            pageTitle: "Sản phẩm",
            products
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [GET] /admin/product/add
module.exports.add = async (req, res) => {
    try {
        const brands = await Brand.findAll({
            where: { deleted: false }
        });
        const productGroups = await ProductGroup.findAll({
            where: { deleted: false }
        });

        // Generate next product ID
        const nextProductId = await generateNextProductId();

        res.render('admin/pages/product/add', {
            pageTitle: "Thêm sản phẩm",
            brands,
            productGroups,
            nextProductId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [POST] /admin/product/add
module.exports.addPost = async (req, res) => {
    try {
        const productData = req.body;
        const imageFiles = req.files;

        // Process image files
        let imageUrls = '';
        if (imageFiles && imageFiles.length > 0) {
            imageUrls = imageFiles.map(file => file.filename).join(',');
        }

        // Set default status if not provided
        if (!productData.status) {
            productData.status = 'Inactive';
        }

        // Create product with image URLs
        const product = await Product.create({
            ...productData,
            imageUrls
        });

        req.flash('success', res.locals.messages.CREATE_PRODUCT_SUCCESS);
        res.redirect(`${systemConfig.prefixAdmin}/product`);
    } catch (err) {
        req.flash('error', res.locals.messages.CREATE_PRODUCT_ERROR);
        res.redirect('back');
    }
};

// [GET] /admin/product/edit
module.exports.edit = async (req, res) => {
    try {
        const product = await Product.findByPk(req.query.productId);
        const brandList = await Brand.findAll({ where: { deleted: false }});
        const productGroupList = await ProductGroup.findAll({ where: { deleted: false }});

        res.render('admin/pages/product/edit', {
            pageTitle: "Sửa sản phẩm",
            product,
            brandList,
            productGroupList
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [POST] /admin/product/edit
module.exports.editPost = async (req, res) => {
    try {
        const productData = req.body;
        const imageFiles = req.files;
        const { confirmDeleteImg } = req.body;

        const product = await Product.findByPk(req.query.productId);

        // Process new image files
        let newImageUrls = '';
        if (imageFiles && imageFiles.length > 0) {
            newImageUrls = imageFiles.map(file => file.filename).join(',');
        }

        // Handle image URLs based on confirmDeleteImg
        if (confirmDeleteImg === 'confirm') {
            productData.imageUrls = newImageUrls || null;
        } else {
            productData.imageUrls = (product.imageUrls ? product.imageUrls + ',' : '') + newImageUrls;
        }

        // Set default status if not provided
        if (!productData.status) {
            productData.status = 'Inactive';
        }

        await product.update(productData);

        req.flash('success', res.locals.messages.UPDATE_PRODUCT_SUCCESS);
        res.redirect(`${systemConfig.prefixAdmin}/product`);
    } catch (err) {
        console.error(err);
        req.flash('error', res.locals.messages.UPDATE_PRODUCT_ERROR);
        res.redirect('back');
    }
};

// [DELETE] /admin/product/delete/:productId
module.exports.delete = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findByPk(productId);
        await product.update({ deleted: true });

        req.flash('success', res.locals.messages.DELETE_PRODUCT_SUCCESS);
        res.redirect(`${systemConfig.prefixAdmin}/product`);
    } catch (err) {
        console.error(err);
        req.flash('error', res.locals.messages.DELETE_PRODUCT_ERROR);
        res.redirect('back');
    }
};

// [GET] /admin/product/detail
module.exports.detail = async (req, res) => {
    try {
        const productId = req.query.productId;
        const product = await Product.findByPk(productId);

        if (!product) {
            req.flash('error', 'Sản phẩm không tồn tại!');
            return res.redirect(`${systemConfig.prefixAdmin}/product`);
        }

        const imgUrls = product.imageUrls ? product.imageUrls.split(',') : [];
        
        const brand = await Brand.findByPk(product.brandId);
        const productGroup = await ProductGroup.findByPk(product.productGroupId);

        res.render('admin/pages/product/detail', {
            pageTitle: "Chi tiết sản phẩm",
            product,
            imgUrls,
            brandName: brand ? brand.brandName : '',
            groupName: productGroup ? productGroup.groupName : '',
            prefixAdmin: systemConfig.prefixAdmin
        });
    } catch (err) {
        console.error(err);
        req.flash('error', res.locals.messages.LOAD_ERROR);
        res.redirect(`${systemConfig.prefixAdmin}/product`);
    }
};

// [POST] /admin/product/changeStatus
module.exports.changeStatus = async (req, res) => {
    try {
        const product = await Product.findByPk(req.body.productId);
        const newStatus = product.status === 'Active' ? 'Inactive' : 'Active';
        await product.update({ status: newStatus });

        res.json({ success: true, newStatus });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// [GET] /admin/product/import
module.exports.import = async (req, res, next) => {
    try {
        const imports = await Import.findAll({
            include: [
                {
                    model: Employee,
                    as: 'Employee'
                },
                {
                    model: ImportDetail,
                    as: 'importDetails'
                }
            ],
            order: [['importDate', 'DESC']]
        });

        res.render('admin/pages/product/import', {
            title: "Quản lý nhập hàng",
            imports: imports
        });
    } catch (error) {
        req.flash('error', res.locals.messages.LOAD_ERROR);
        res.redirect(req.get('Referrer') || '/');
    }
};

// [GET] /admin/product/import/add
module.exports.importAdd = async (req, res) => {
    try {
        const productList = await Product.findAll({ where: { deleted: false }});
        const nextImportId = await generateNextImportId();
        const messages = res.locals.messages;
        const currentDate = moment().format('DD/MM/YYYY');

        res.render('admin/pages/product/import/add', {
            pageTitle: "Thêm phiếu nhập",
            productList,
            nextImportId,
            currentDate,
            messages
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// [POST] /admin/product/import/add
module.exports.importAddPost = async (req, res) => {
    try {
        const importData = req.body;
        importData.employeeEmail = res.locals.user.email;
        
        const importRecord = await Import.create({
            ...importData,
            importDate: new Date()
        });

        const importDetails = [];
        const detailKeys = Object.keys(importData).filter(key => key.startsWith('importDetails['));
        const indices = [...new Set(detailKeys.map(key => key.match(/\[(\d+)\]/)[1]))]; // Lấy các index duy nhất

        for (const index of indices) {
            const detail = {
                id: {
                    importId: importData[`importDetails[${index}].id.importId`],
                    productId: importData[`importDetails[${index}].id.productId`]
                },
                amount: parseInt(importData[`importDetails[${index}].amount`]),
                price: parseFloat(importData[`importDetails[${index}].price`])
            };
            importDetails.push(detail);
        }

        // Process import details and update product stock
        for (const detail of importDetails) {
            await ImportDetail.create({
                importId: importRecord.importId,
                productId: detail.id.productId,
                amount: detail.amount,
                price: detail.price
            });

            const product = await Product.findByPk(detail.id.productId);
            await product.update({
                stock: product.stock + detail.amount
            });
        }

        req.flash('success', res.locals.messages.CREATE_IMPORT_SUCCESS);
        res.redirect(`${systemConfig.prefixAdmin}/product/import`);
    } catch (err) {
        console.error(err);
        req.flash('error', res.locals.messages.CREATE_IMPORT_ERROR);
        res.redirect('back');
    }
};

// [GET] /admin/product/import/detail/:importId
module.exports.importDetail = async (req, res) => {
    try {
        const importRecord = await Import.findByPk(req.params.importId, {
            include: [
                { 
                    model: ImportDetail, 
                    as: 'importDetails',
                    include: [Product] 
                },
                { model: Employee }
            ]
        });
        if (!importRecord) {
            req.flash('error', res.locals.messages.IMPORT_NOT_EXIST);
            return res.redirect(`${systemConfig.prefixAdmin}/product/import`);
        }

        const productList = await Product.findAll({
            where: {
                deleted: false
            }
        });

        res.render('admin/pages/product/import/detail', {
            pageTitle: "Chi tiết phiếu nhập",
            importRecord,
            employeeFullName: importRecord.Employee ? importRecord.Employee.fullName : 'Không xác định',
            productList
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};