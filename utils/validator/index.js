const httpError = require('../httpError');
const { validationResult } = require('express-validator');
exports.runValidation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const err = errors.array()[0].msg;
		return next(new httpError(`validation fail error : ${err}`, 422));
		// res.status(422).json({
		// 	error: err,
		// });
	}
	next();
};
