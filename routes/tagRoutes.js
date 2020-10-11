const express = require('express');
const router = express.Router();
const { runValidation } = require('../utils/validator/index');
const { tagValidation } = require('../utils/validator/tag');
const authController = require('../controllers/authController');
const tagController = require('../controllers/tagController');
router.post(
	'/newTag',
	tagValidation,
	runValidation,
	authController.requireLogin,
	authController.isAdmin,

	tagController.newTag
);
router.get(
	'/allTags',

	tagController.allTags
);
router.get('/:slug', tagController.getOneTag);
router.delete(
	'/:slug',
	authController.requireLogin,
	authController.isAdmin,

	tagController.deleteOneTag
);

module.exports = router;
