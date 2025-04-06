// const generalSetting = require("../../models/")


// [GET] /AutoParts/admin/generalSetting
module.exports.index = async (req, res) => {
  try {
    const generalSetting = await GeneralSetting.findAll(
      {
        where: {
          deleted: false
        }
      }
    );
    
    res.render('client/pages/generalSetting/index', {
      generalSetting: generalSetting
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// [POST] /AutoParts/admin/generalSetting/update
module.exports.update = async (req, res) => {
    try {
        await GeneralSetting.destroy({
            where: {}, 
            truncate: false 
        });
        
        await GeneralSetting.create(req.body);

        req.flash('success', "Cập nhật các thông số chung thành công!");
        res.redirect("back");
    } catch (err) {
        req.flash('error', "Cập nhật các thông số chung thất bại!");
        res.status(500).send('Server error');
    }
  };