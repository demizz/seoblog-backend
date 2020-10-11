const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const httpError = require('../utils/httpError');
const { promisify } = require('util');
const fs = require('fs');
const formidable = require('formidable');
const { OAuth2Client } = require('google-auth-library');
const shortid = require('shortid');

const jwt = require('jsonwebtoken');
const shortId = require('shortid');
const Email = require('../utils/email');
exports.signup = catchAsync(async (req, res, next) => {
	const { email, name, password, role } = req.body;
	if (!email || !name || !password) {
		return next(new httpError('please provide all the required data', 400));
	}
	const existUser = await User.findOne({ email });
	if (existUser && existUser.email === email) {
		return next(new httpError('this User already register try to login', 400));
	}
	const username = shortId.generate();
	const profile = `${process.env.CLIENT_URL}/profile/${username}`;
	const newUser = await User.create({
		email,
		password,
		name,
		profile,
		username,
		role,
	});
	if (!newUser) {
		return next(new httpError('fail to create a new user', 400));
	}
	res.status(201).json({
		status: 'success',
		result: newUser,
	});
});
exports.register = catchAsync(async (req, res, next) => {
	let form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.parse(req, async (err, fields, files) => {
		if (err) {
			return next(new httpError('could not parse data from formdata', 400));
		}
		if (!fields.name) {
			return next(new httpError('name is required', 422));
		}
		if (!fields.password) {
			return next(new httpError('name is required', 422));
		}
		if (!fields.email) {
			return next(new httpError('name is required', 422));
		}
		const existUser = await User.findOne({ email: fields.email });
		if (existUser) {
			return next(
				new httpError('this User already register try to login', 400)
			);
		}
		const { name, password, email } = fields;
		const username = shortId.generate();
		const profile = `${process.env.CLIENT_URL}/profile/${username}`;
		let photo;
		if (files.photo) {
			photo = {
				data: fs.readFileSync(files.photo.path),
				contentType: files.photo.contentType,
			};
		}
		const user = await User.create({
			name,
			password,
			email,
			profile,
			photo,
			username,
		});
		if (!user) {
			return next(new httpError('could not create this user', 400));
		}
		res.status(201).json({
			status: 'success',
			result: user,
		});
	});
});

exports.login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;
	const existUser = await User.findOne({ email });
	if (!existUser) {
		return next(new httpError('this email is not register', 422));
	}
	const samePassword = await existUser.comparePassword(
		password,
		existUser.password
	);
	if (!samePassword) {
		return next(new httpError('user password or email are rong', 422));
	}
	const token = jwt.sign({ id: existUser._id }, process.env.SECRET, {
		expiresIn: process.env.EXPIRES_IN,
	});
	res.cookie('jwt', token, {
		expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
		httpOnly: true,
	});
	res.status(200).json({
		status: 'success',
		result: {
			user: existUser,
			token,
		},
	});
});

exports.signout = catchAsync(async (req, res, next) => {
	res.cookie('jwt', 'loggout', {
		expires: new Date(Date.now() + 10 * 1000),
	});
	res.status(200).json({
		status: 'success',
	});
});

exports.requireLogin = catchAsync(async (req, res, next) => {
	let token;
	if (
		req.headers.authentication &&
		req.headers.authentication.startsWith('Bearer ')
	) {
		token = req.headers.authentication.split(' ')[1];
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}
	if (!token) {
		return next(new httpError('you are not logged in', 422));
	}

	const { id } = await jwt.verify(token, process.env.SECRET);
	const user = await User.findById(id);
	console.log({ id, user });
	if (!user) {
		return next(new httpError('this token is no more exist', 422));
	}
	req.user = user;
	next();
});

exports.secret = catchAsync(async (req, res, next) => {
	res.status(200).json({
		status: 'success',
		result: req.user,
	});
});

exports.isAdmin = catchAsync(async (req, res, next) => {
	const id = req.user._id;
	const currentUser = await User.findById(id);
	if (!currentUser || currentUser.role !== 1) {
		return next(
			new httpError('sorry !!!This route is only for admin user', 422)
		);
	}
	next();
});

exports.read = catchAsync(async (req, res, next) => {
	const id = req.user._id;
	const currentUser = await User.findById(id).select('-password');
	if (!currentUser) {
		return next(new httpError('fail to find this user', 400));
	}
	res.status(200).json({
		status: 'success',
		result: currentUser,
	});
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
	const email = req.body.email;
	console.log(email);
	const user = await User.findOne({ email });
	if (!user) {
		return next(new httpError('this user is not registered', 400));
	}
	const newToken = jwt.sign({ _id: user._id }, process.env.JWT_RESET_TOKEN, {
		expiresIn: process.env.RESET_TOKEN_EXPIRESIN,
	});
	const updatedUser = await User.findOneAndUpdate(
		{ email },
		{ resetPasswordLink: newToken },
		{
			runValidator: true,
		}
	);
	console.log({ newToken });
	try {
		const url = `${process.env.CLIENT_URL}/user/auth/password/reset/${newToken}`;
		console.log(url);
		await new Email(user, url).sendResetPasswordToken();
	} catch (err) {
		return next(new httpError('fail to send the email'));
	}
	res.status(200).json({
		status: 'success',
		result: {
			message: 'link send to your email',
			url: `${process.env.CLIENT_URL}/user/auth/password/reset/${newToken}`,
		},
	});
});

exports.resetPassword = catchAsync(async (req, res, next) => {
	const { resetPasswordLink, newPassword } = req.body;
	console.log({ resetPasswordLink, newPassword });

	const { id } = await promisify(jwt.verify)(
		resetPasswordLink,
		process.env.JWT_RESET_TOKEN
	);

	console.log(id);
	const user = await User.findOne({ resetPasswordLink });
	console.log(user);
	if (!user || user._id !== id) {
		return next(new httpError('the token in not valid', 422));
	}
	user.password = newPassword;
	user.resetPasswordLink = undefined;
	user.save();
	res.status(200).json({
		status: 'success',
		result: {
			message: 'password updated successufully',
		},
	});
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = catchAsync(async (req, res, next) => {
	const idToken = req.body.tokenId;
	const verify = await client.verifyIdToken({
		idToken,
		audience: process.env.GOOGLE_CLIENT_ID,
	});
	console.log({ verify });
	if (!verify) {
		return next(new httpError('authentication failed', 422));
	}
	const { email_verified, name, email, jti } = verify.payload;
	if (email_verified) {
		const user = await User.findOne({ email });
		if (!user) {
			return next(new httpError('fail to found the user', 404));
		}
		const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_TOKEN, {
			exipresIn: process.env.TOKEN_EXPIRESIN,
		});
		res.status(201).json({
			status: 'success',
			result: {
				token,
				user,
			},
		});
	} else {
		return next(new httpError('Google login failed', 400));
		// let username = shorid.generate();
		// let profile = `${process.env.CLIENT_URL}/profile/${username}`;
		// let password = jti;

		// const newUser = await User.Create({ email, password, profile, username });
	}
});
