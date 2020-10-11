const express = require('express');
const router = express.Router();
const { runValidation } = require('../utils/validator/index');
const { UserAuthValidation } = require('../utils/validator/authentication');
const authController = require('../controllers/authController');
const usersController = require('../controllers/usersController');

router
	.route('/profile')
	.get(authController.requireLogin, usersController.getProfile);
router.route('/:username').get(usersController.publicProfile);
router.put(
	'/user/update',
	authController.requireLogin,
	usersController.updateProfile
);
router.post(
	'/blog/create',
	authController.requireLogin,
	usersController.createBlog
);
router.put(
	'/blog/:slug',
	authController.requireLogin,
	usersController.updateBlog
);
router.delete(
	'blog/:slug',
	authController.requireLogin,
	usersController.deleteBlog
);
router.route('/photo/:username').get(usersController.getPhoto);
router.get('/:username/blogs', usersController.getAllBlogsForOneUser);

module.exports = router;
