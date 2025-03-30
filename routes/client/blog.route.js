const express = require('express');
const router = express.Router();

const controller = require('../../controller/client/blogController');

router.get('/', controller.showBlogs);
router.get('/detail/:id', controller.showBlogDetail);


module.exports = router;