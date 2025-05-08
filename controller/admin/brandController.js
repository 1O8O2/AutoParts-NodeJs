const Brand = require('../../models/Brand');
const { Op } = require('sequelize');
const systemConfig = require('../../configs/system');

// Helper function to generate next brand ID
const generateNextBrandId = async () => {
    try {
        const maxBrand = await Brand.findOne({
            where: {
                brandId: {
                    [Op.like]: 'BRAND%'
                }
            },
            order: [['brandId', 'DESC']]
        });

        if (!maxBrand) {
            return 'BRAND000';
        }

        const currentNum = parseInt(maxBrand.brandId.substring(6));
        return `BRAND${String(currentNum + 1).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating brand ID:', error);
        return 'BRAND000';
    }
};

module.exports.index = async (req, res) => {
    try {
        const brands = await Brand.findAll({
            where: {
                deleted: false
            }
        });

        res.render('admin/pages/brand/index', {
            pageTitle: "Quản lý thương hiệu",
            brands,
            prefixAdmin: systemConfig.prefixAdmin
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Có lỗi xảy ra khi tải danh sách thương hiệu');
        res.redirect(req.get('Referrer') || '/');
    }
};

module.exports.add = async (req, res) => {
    try {
        const nextBrandId = await generateNextBrandId();
        res.render('admin/pages/brand/add', {
            pageTitle: "Thêm thương hiệu",
            nextBrandId,
            prefixAdmin: systemConfig.prefixAdmin
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Có lỗi xảy ra khi tải trang thêm thương hiệu');
        res.redirect(req.get('Referrer') || '/');
    }
};

module.exports.addPost = async (req, res) => {
    try {
        const { brandName, status } = req.body;

        // Check if brand name already exists
        const existingBrand = await Brand.findOne({
            where: {
                brandName: {
                    [Op.like]: brandName
                },
                deleted: false
            }
        });

        if (existingBrand) {
            req.flash('error', 'Tên thương hiệu đã tồn tại!');
            return res.redirect(req.get('Referrer') || '/');
        }

        // Create new brand
        await Brand.create({
            brandId: req.body.brandId,
            brandName,
            status: status || 'Inactive',
            deleted: false
        });

        req.flash('success', 'Thêm thương hiệu thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/brand`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Thêm thương hiệu thất bại!');
        res.redirect(req.get('Referrer') || '/');
    }
};

module.exports.edit = async (req, res) => {
    try {
        const brand = await Brand.findOne({
            where: {
                brandId: req.query.brandId,
                deleted: false
            }
        });

        if (!brand) {
            req.flash('error', 'Không tìm thấy thương hiệu!');
            return res.redirect(`${systemConfig.prefixAdmin}/brand`);
        }

        res.render('admin/pages/brand/edit', {
            pageTitle: "Chỉnh sửa thương hiệu",
            brand,
            prefixAdmin: systemConfig.prefixAdmin
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Có lỗi xảy ra khi tải trang chỉnh sửa');
        res.redirect(req.get('Referrer') || '/');
    }
};

module.exports.editPatch = async (req, res) => {
    try {
        const { brandName, status, brandId } = req.body;
        const brand = await Brand.findOne({
            where: {
                brandId: brandId,
                deleted: false
            }
        });

        if (!brand) {
            req.flash('error', 'Không tìm thấy thương hiệu!');
            return res.redirect(`${systemConfig.prefixAdmin}/brand`);
        }

        // Check if new brand name already exists (excluding current brand)
        if (brandName) {
            const existingBrand = await Brand.findOne({
                where: {
                    brandName: {
                        [Op.like]: brandName
                    },
                    brandId: {
                        [Op.ne]: brandId
                    },
                    deleted: false
                }
            });

            if (existingBrand) {
                req.flash('error', 'Tên thương hiệu đã tồn tại!');
                return res.redirect(req.get('Referrer') || '/');
            }
        }

        await brand.update({
            brandName: brandName || brand.brandName,
            status: status || brand.status
        });

        req.flash('success', 'Cập nhật thương hiệu thành công!');
        res.redirect(`${systemConfig.prefixAdmin}/brand`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Cập nhật thương hiệu thất bại!');
        res.redirect(req.get('Referrer') || '/');
    }
};

module.exports.delete = async (req, res) => {
    try {
        const brand = await Brand.findOne({
            where: {
                brandId: req.query.brandId,
                deleted: false
            }
        });

        if (brand) {
            await brand.update({ 
                deleted: true,
                deletedAt: new Date()
            });
            req.flash('success', 'Xóa thương hiệu thành công!');
        } else {
            req.flash('error', 'Không tìm thấy thương hiệu!');
        }
        res.redirect(`${systemConfig.prefixAdmin}/brand`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Xóa thương hiệu thất bại!');
        res.redirect(`${systemConfig.prefixAdmin}/brand`);
    }
};

module.exports.changeStatus = async (req, res) => {
    try {
        const brand = await Brand.findOne({
            where: {
                brandId: req.body.brandId,
                deleted: false
            }
        });

        if (brand) {
            const newStatus = brand.status === 'Active' ? 'Inactive' : 'Active';
            await brand.update({ status: newStatus });
            
            res.json({ 
                success: true,
                message: `Đã ${newStatus === 'Active' ? 'kích hoạt' : 'tắt'} thương hiệu thành công!`,
                newStatus: newStatus
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Không tìm thấy thương hiệu' 
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