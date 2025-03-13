const express = require('express');
const router = express.Router();

const controller = require('../../controller/BlogController');

router.get('/', controller.showBlogs);
router.get('/detail', controller.showBlogDetail);


module.exports = router;