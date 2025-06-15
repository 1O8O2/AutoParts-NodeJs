const Employee = require('../../models/Employee');
const Account = require('../../models/Account');
const {RoleGroup,RoleGroupPermissions} = require('../../models/RoleGroup');

const systemConfig = require('../../configs/system');
const generateToken = require('../../helpers/generateToken');
const md5 = require('md5');

module.exports.index = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            where: { deleted: false }
        });
        res.render('admin/pages/employee/index', {
            pageTitle: "Quản lý nhân viên",
            employees: employees
        });
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.redirect('back');
    }
};

module.exports.detail = async (req, res) => {
    try {
        const empEmail = req.query.empEmail;
        const employee = await Employee.findOne({
            where: { 
                email: empEmail, deleted: false
            },
            include: [
                {
                    model: Account,
                    attributes: ['permission'],
                    where: { deleted: false },
                    required: true
                }
            ]
        });
        const roleGroups = await RoleGroup.findAll({
            where: { deleted: false }
        });
        
        if (!employee) {
            return res.status(404).send("Employee not found");
        }

        res.render('admin/pages/employee/detail', {
            pageTitle: "Chi tiết nhân viên",
            employee: employee,
            roleGroups: roleGroups
        });
    } catch (error) {
        console.error("Error fetching employee details:", error);
        res.redirect('back');
    }
};

module.exports.add = async (req, res) => {
    try {
        const roleGroups = await RoleGroup.findAll({
            where: {
                deleted: false,
                status: "Active"
            }
        });
        res.render('admin/pages/employee/add', {
            pageTitle: "Thêm nhân viên",
            roleGroups: roleGroups
        });
    } catch (error) {
        console.error("Error loading add employee page:", error);
        res.redirect('back');
    }
};

module.exports.addPost = async (req, res) => {
    try {
        const employeeData = req.body;
        employeeData.status = employeeData.status || "Inactive"; 
        employeeData.deleted = false;

        // Create associated account
        const accountData = {
            email: employeeData.email,
            password: md5("1111"), // Default password
            permission: employeeData.permission,
            token: generateToken.generateRandomString(24),
            status: employeeData.status,
            deleted: false
        };
        await Account.create(accountData);

        // Create new employee
        const newEmployee = await Employee.create(employeeData);
        
        req.flash('success', 'Thêm nhân viên thành công');
        res.redirect(`${systemConfig.prefixAdmin}/employee`);
    } catch (error) {
        console.error("Error adding employee:", error);
        req.flash('error', 'Thêm nhân viên thất bại');
        res.redirect('back');
    }
};

module.exports.edit = async (req, res) => {
    try {
        const empEmail = req.query.empEmail;
        const employee = await Employee.findOne({
            where: { 
                email: empEmail, deleted: false 
            },
            include: [
                {
                    model: Account,
                    attributes: ['permission'],
                    where: { deleted: false },
                    required: true
                }
            ]
        });
        const roleGroups = await RoleGroup.findAll({
            where: {
                deleted: false,
                status: "Active"
            }
        });

        if (!employee) {
            return res.status(404).send("Employee not found");
        }

        res.render('admin/pages/employee/edit', {
            pageTitle: "Chỉnh sửa nhân viên",
            employee: employee,
            roleGroups: roleGroups
        });
    } catch (error) {
        console.error("Error loading edit employee page:", error);
        res.redirect('back');
    }
};

module.exports.editPatch = async (req, res) => {
    try {
        const employeeData = req.body;
        employeeData.status = employeeData.status || "Inactive";

        await Employee.update(employeeData, {
            where: { email: employeeData.email }
        });

        // Update associated account
        await Account.update(
            {
                permission: employeeData.permission,
                status: employeeData.status,
                updatedAt: new Date()
            },
            {
                where: {email: employeeData.email }
            }
        );

        req.flash('success', 'Chỉnh sửa thông tin nhân viên thành công');
        res.redirect(`${systemConfig.prefixAdmin}/employee`);
    } catch (error) {
        console.error("Error updating employee:", error);
        req.flash('error', 'Chỉnh sửa thông tin nhân viên thất bại');
        res.redirect('back');
    }
};

module.exports.changeStatus = async (req, res) => {
    try {
        const empEmail = req.body.empEmail;
        const employee = await Employee.findOne({
            where: { email: empEmail, deleted: false }
        });

        if (!employee) {
            return res.status(404).send("Employee not found");
        }

        const newStatus = employee.status === "Active" ? "Inactive" : "Active";
        await Employee.update(
            { status: newStatus },
            { where: { email: empEmail } }
        );

        // Update account status
        await Account.update(
            { status: newStatus },
            { where: { email: empEmail } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error changing employee status:", error);
        res.redirect('back');
    }
}; 