const ProductGroup = require('../../models/ProductGroup');
const { Op } = require('sequelize');
const systemConfig = require('../../configs/system');

// Helper function to generate next product group ID
const generateNextProductGroupId = async () => {
    try {
        const maxGroup = await ProductGroup.findOne({
            where: {
                productGroupId: {
                    [Op.like]: 'GRP%'
                }
            },
            order: [['productGroupId', 'DESC']]
        });

        if (!maxGroup) {
            return 'GRP001';
        }

        const currentNum = parseInt(maxGroup.productGroupId.substring(3));
        return `GRP${String(currentNum + 1).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating product group ID:', error);
        return 'GRP001';
    }
};

module.exports.index = async (req, res) => {
    try {
        const productGroups = await ProductGroup.findAll({
            where: {
                deleted: false
            }
        });

        res.render('admin/pages/productGroup/index', {
            pageTitle: "Danh mục sản phẩm",
            productGroups,
            prefixAdmin: systemConfig.prefixAdmin
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Có lỗi xảy ra khi tải danh sách danh mục sản phẩm');
        res.redirect(req.get('Referrer') || '/');
    }
};

module.exports.add = async (req, res) => {
    try {
        const nextGroupId = await generateNextProductGroupId();
        res.render('admin/pages/productGroup/add', {
            pageTitle: "Thêm danh mục sản phẩm",
            nextGroupId,
            prefixAdmin: systemConfig.prefixAdmin
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Có lỗi xảy ra khi tải trang thêm danh mục');
        res.redirect(req.get('Referrer') || '/');
    }
};

module.exports.addPost = async (req, res) => {
    try {
        const { groupName, status } = req.body;

        // Check if group name already exists
        const existingGroup = await ProductGroup.findOne({
            where: {
                groupName: {
                    [Op.like]: groupName
                },
                deleted: false
            }
        });

        if (existingGroup) {
            req.flash('error', 'Tên danh mục đã tồn tại!');
            return res.redirect(req.get('Referrer') || '/');
        }

        // Create new product group
        await ProductGroup.create({
            productGroupId: req.body.productGroupId,
            groupName,
            status: status || 'Inactive',
            deleted: false
        });

        req.flash('success', 'Thêm danh mục sản phẩm thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/productGroup`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Thêm danh mục sản phẩm thất bại!');
        res.redirect(req.get('Referrer') || '/');
    }
};

module.exports.delete = async (req, res) => {
    try {
        const group = await ProductGroup.findByPk(req.query.productGroupId);
        if (group) {
            await group.update({ deleted: true });
            req.flash('success', 'Xóa danh mục sản phẩm thành công!');
        } else {
            req.flash('error', 'Không tìm thấy danh mục sản phẩm!');
        }
        res.redirect(`${systemConfig.prefixAdmin}/productGroup`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Xóa danh mục sản phẩm thất bại!');
        res.redirect(`${systemConfig.prefixAdmin}/productGroup`);
    }
};

module.exports.changeStatus = async (req, res) => {
    try {
        const group = await ProductGroup.findByPk(req.body.groupId);
        if (group) {
            const newStatus = group.status === 'Active' ? 'Inactive' : 'Active';
            await group.update({ status: newStatus });
            
            res.json({ 
                success: true,
                message: `Đã ${newStatus === 'Active' ? 'kích hoạt' : 'tắt'} danh mục sản phẩm thành công!`,
                newStatus: newStatus
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Không tìm thấy danh mục sản phẩm' 
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            error: 'Có lỗi xảy ra khi thay đổi trạng thái' 
        });
    }
}; 