const Employee = require('../../models/employee');
const Account = require('../../models/account');
const {RoleGroup,RoleGroupPermissions} = require('../../models/RoleGroup');

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
        const empPhone = req.query.empPhone;
        const employee = await Employee.findOne({
            where: { phone: empPhone, deleted: false }
        });
        
        if (!employee) {
            return res.status(404).send("Employee not found");
        }

        res.render('admin/pages/employee/detail', {
            pageTitle: "Chi tiết nhân viên",
            employee: employee
        });
    } catch (error) {
        console.error("Error fetching employee details:", error);
        res.redirect('back');
    }
};

module.exports.add = async (req, res) => {
    try {
        const roleGroups = await RoleGroup.findAll();
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

        // Create new employee
        const newEmployee = await Employee.create(employeeData);

        // Create associated account
        const accountData = {
            phone: employeeData.phone,
            password: "1111", // Default password
            permission: employeeData.permission,
            status: employeeData.status,
            createdAt: new Date(),
            updatedAt: new Date(),
            deleted: false
        };
        await Account.create(accountData);

        res.redirect('/admin/employee');
    } catch (error) {
        console.error("Error adding employee:", error);
        res.redirect('back');
    }
};

module.exports.edit = async (req, res) => {
    try {
        const empPhone = req.query.empPhone;
        const employee = await Employee.findOne({
            where: { phone: empPhone, deleted: false }
        });
        const roleGroups = await RoleGroup.findAll();

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
            where: { phone: employeeData.phone }
        });

        // Update associated account
        await Account.update(
            {
                permission: employeeData.permission,
                status: employeeData.status,
                updatedAt: new Date()
            },
            {
                where: {phone: employeeData.phone }
            }
        );

        res.redirect('/admin/employee');
    } catch (error) {
        console.error("Error updating employee:", error);
        res.redirect('back');
    }
};

module.exports.changeStatus = async (req, res) => {
    try {
        const empPhone = req.body.empPhone;
        const employee = await Employee.findOne({
            where: { phone: empPhone, deleted: false }
        });

        if (!employee) {
            return res.status(404).send("Employee not found");
        }

        const newStatus = employee.status === "Active" ? "Inactive" : "Active";
        await Employee.update(
            { status: newStatus },
            { where: { phone: empPhone } }
        );

        // Update account status
        await Account.update(
            { status: newStatus },
            { where: { phone: empPhone } }
        );

        res.redirect('/admin/employee');
    } catch (error) {
        console.error("Error changing employee status:", error);
        res.redirect('back');
    }
}; 