const { check } = require('express-validator');
exports.UserAuthValidation = [
	check('name').not().isEmpty().withMessage('name is require'),
	check('email').isEmail().withMessage('it Must be a valid email'),
	check('password')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters logn'),
];
exports.forgetPassword = [
	check('email').isEmail().withMessage('it is not a valid email'),
];
exports.resetPassword = [
	check('newPassword')
		.isLength({ min: 6 })
		.withMessage('passsword must be at least 6 character'),
];
