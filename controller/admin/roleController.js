const { RoleGroup } = require("../../models/RoleGroup");
const generateId = require("../../helpers/generateId");
const systemConfig = require("../../configs/system");

// [GET] /AutoParts/admin/role
module.exports.index = async (req, res) => {
  try {
    const roleGroups = await RoleGroup.findAll(
      {
        where: {
          deleted: false
        }
      }
    );
    
    res.render('admin/pages/role/roleGroup/index', {
      roleGroups: roleGroups,
      pageTitle: "Nhóm quyền"
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [GET] /AutoParts/admin/role/add
module.exports.add = async (req, res) => {
  try {
    const nextId = await generateId.generateNextRoleGroupId();
    
    res.render('admin/pages/role/roleGroup/add', {
      pageTitle: "Thêm nhóm quyền",
      nextId: nextId
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [POST] /AutoParts/admin/role/add
module.exports.addPost = async (req, res) => {
  try {
    if (!req.body.roleGroupId || !req.body.roleGroupName) {
      req.flash("error", "Thiếu thông tin bắt buộc!");
      return res.redirect('back');
    }

    if (!req.body.status) {
      req.body.status = 'Inactive';
    }

    const roleGroupData = {
      ...req.body,
      createdBy: res.locals.user.dataValues.phone
    };
    
    const isSuccess = await RoleGroup.create(roleGroupData);
    
    if (isSuccess) {
      req.flash("success", "Thêm nhóm quyền thành công!");
      res.redirect(`${systemConfig.prefixAdmin}/role`);
    } else {
      req.flash("error", "Thêm nhóm quyền thất bại!");
      res.redirect('back');
    }
  } catch (err) {
    res.redirect('back');
  }
};

// [GET] /AutoParts/admin/role/edit/:roleGroupId
module.exports.edit = async (req, res) => {
  try {
    const roleGroup = await RoleGroup.findByPk(req.params.roleGroupId);

    res.render('admin/pages/role/roleGroup/edit', {
      pageTitle: "Sửa nhóm quyền",
      roleGroup: roleGroup
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [PATCH] /AutoParts/admin/role/edit/:roleGroupId
module.exports.editPatch = async (req, res) => {
  try {
    if (!req.body.roleGroupId || !req.body.roleGroupName) {
      req.flash("error", "Thiếu thông tin bắt buộc!");
      return res.redirect('back');
    }
    
    if (!req.body.status) {
      req.body.status = 'Inactive';
    }

    const roleGroupData = {
      ...req.body,
      createdBy: res.locals.user.dataValues.phone
    };
    
    const isSuccess = await RoleGroup.update(
      roleGroupData,
      { 
        where: { 
          roleGroupId: req.body.roleGroupId
        } 
      }
    );
    
    if (isSuccess) {
      req.flash("success", "Thay đổi thông tin nhóm quyền thành công!");
      res.redirect(`${systemConfig.prefixAdmin}/role`);
    } else {
      req.flash("error", "Thay đổi thông tin nhóm quyền thất bại!");
      res.redirect('back');
    }
  } catch (err) {
    req.flash("error", err);
    res.redirect('back');
  }
};

// [DELETE] /AutoParts/admin/role/delete/:roleGroupId
module.exports.deleteItem = async (req, res) => {
  try {
    const roleGroupId = req.params.roleGroupId;

    const isSuccess = await RoleGroup.update(
      { deleted: true },
      { 
        where: { 
          roleGroupId: roleGroupId
        } 
      }
    );
    
    if (isSuccess) {
      req.flash("success", "Xóa nhóm quyền thành công!");
      res.redirect(`${systemConfig.prefixAdmin}/role`);
    } else {
      req.flash("error", "Xóa nhóm quyền thất bại!");
      res.redirect('back');
    }
  } catch (err) {
    res.redirect('back');
  }
};

// [PATCH] /AutoParts/admin/role/change-status/:newStatus/:roleGroupId
module.exports.changeStatus = async (req, res) => {
  try {
    const roleGroupId = req.params.roleGroupId;
    const newStatus = req.params.newStatus;
    
    const isSuccess = await RoleGroup.update(
      { status: newStatus },
      { 
        where: { 
          roleGroupId: roleGroupId
        } 
      }
    );
    
    if (isSuccess) {
      res.json({ success: true });
    } else {
      res.redirect('back');
    }
  } catch (err) {
    res.redirect('back');
  }
};

// [GET] /AutoParts/admin/role/permissions
module.exports.permissions = async (req, res) => {
  const roleGroup = await RoleGroup.findAll({
    where: {
      status: 'Active',
      deleted: false
    }
  });

  res.render('admin/pages/role/permission/index', {
    pageTitle: "Phân quyền",
    roleGroup: roleGroup
  });
};

// [PATCH] /AutoParts/admin/role/permissions/update
module.exports.updatePermissions = async (req, res) => {
  try {
      const ids = req.body.roleGroupIds || []; 
      
      for (const id of ids) {
        const key = `permissions[${id}]`; 
        const permissions = req.body[key] || []; 
        
        const roleGroup = await RoleGroup.findByPk(id);
        if (roleGroup) {
          roleGroup.permissions = permissions;
          await roleGroup.save();
        }
      }

      req.flash("success", "Cập nhật quyền thành công!");
      res.redirect(`${systemConfig.prefixAdmin}/role/permissions`);
  } catch (err) {
      console.error('Error:', err);
      req.flash("error", "Cập nhật quyền thất bại!");
      res.status(500).send('Server error');
  }
};

