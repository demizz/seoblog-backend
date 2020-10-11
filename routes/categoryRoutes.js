const express = require('express');
const router = express.Router();
const { runValidation } = require('../utils/validator/index');
const { categoryValidation } = require('../utils/validator/category');
const authController = require('../controllers/authController');
const categoryController = require('../controllers/categoryController');
router.post(
	'/newCategory',
	categoryValidation,
	runValidation,
	authController.requireLogin,
	authController.isAdmin,

	categoryController.newCategory
);
router.get(
	'/allCategories',

	categoryController.allCategories
);
router.get('/:slug', categoryController.getOneCategory);
router.delete(
	'/:slug',
	authController.requireLogin,
	authController.isAdmin,

	categoryController.deleteOneCategory
);

module.exports = router;
