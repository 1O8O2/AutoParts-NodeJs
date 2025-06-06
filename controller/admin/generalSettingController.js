const GeneralSetting = require("../../models/GeneralSettings");



// [GET] /AutoParts/admin/generalSetting
module.exports.index = async (req, res) => {
  try {
    const generalSetting = await GeneralSetting.findOne(
      {
        where: {
          deleted: false
        }
      }
    );

    res.render('admin/pages/generalSetting/index', {
      pageTitle: "Thông số chung",
      generalSetting: generalSetting || {}
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [POST] /AutoParts/admin/generalSetting/update
module.exports.update = async (req, res) => {
  try {
    const settingData = {
      websiteName: req.body.websiteName || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      address: req.body.address || '',
      copyright: req.body.copyright || '',
      logo: req.file ? `${req.file.filename}` : req.body.existingLogo || ''
    };

    // Cập nhật hoặc tạo mới bản ghi
    const [setting, created] = await GeneralSetting.upsert(settingData, {
        where: { deleted: false }
    });

    req.flash('success', "Cập nhật các thông số chung thành công!");
    console.log('General settings updated:', setting);
    res.redirect("back");
  } catch (err) {
    console.error('Error:', err);
    req.flash('error', "Cập nhật các thông số chung thất bại!");
    console.error('Error updating general settings:', err);
    res.redirect("back");
  }
};