const express = require('express');
const router = express.Router();
const { runValidation } = require('../utils/validator/index');
const { tagValidation } = require('../utils/validator/tag');
const authController = require('../controllers/authController');
const blogsController = require('../controllers/blogsController');

router
	.route('/create')
	.post(
		authController.requireLogin,
		authController.isAdmin,
		blogsController.create
	);
router.route('/allBlogs').get(blogsController.allBlogs);
router.route('/search').get(blogsController.search);
router
	.route('/blogs-categories-tags')
	.post(blogsController.allBlogsWithCategoriesAndTags);
router.route('/listRelated').post(blogsController.listRelated);
router.route('/:slug').get(blogsController.getOneBlog);
router.route('/:slug').delete(
	authController.requireLogin,

	blogsController.deleteBlog
);
router.route('/:slug').put(
	authController.requireLogin,

	blogsController.updateBlog
);
router.route('/photo/:slug').get(blogsController.getPhoto);

module.exports = router;
