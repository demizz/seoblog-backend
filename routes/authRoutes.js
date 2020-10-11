const express = require('express');
const router = express.Router();
const { runValidation } = require('../utils/validator/index');
const {
	UserAuthValidation,
	forgetPassword,
	resetPassword,
} = require('../utils/validator/authentication');
const authController = require('../controllers/authController');
router.post(
	'/register',

	authController.register
);
router.route('/login').post(authController.login);
router.route('/signout').get(authController.signout);
router
	.route('/forgetPassword')
	.post(forgetPassword, runValidation, authController.forgetPassword);
router
	.route('/resetPassword')
	.post(resetPassword, runValidation, authController.resetPassword);
router.route('/google-login').post(authController.googleLogin);
router
	.route('/secret')
	.get(authController.requireLogin, authController.read, authController.secret);

module.exports = router;
