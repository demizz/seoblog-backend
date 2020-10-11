const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const httpError = require('../utils/httpError');
const Blog = require('../models/blogModel');
const Category = require('../models/categoryModel');
const slugify = require('slugify');

const Tag = require('../models/tagModel');
const fs = require('fs');
const formidable = require('formidable');

exports.publicProfile = catchAsync(async (req, res, next) => {
	let { username } = req.params;
	console.log(username);
	let user;
	let blogs;
	user = await User.findOne({ username }).select('-photo -password');
	if (!user) {
		return next(new httpError('fail to found this user', 400));
	}
	blogs = await Blog.find({ postedBy: user._id })
		.populate('categories', '_id name slug')
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name')
		.limit(10)
		.select('_id title slug body postedBy createdAt updatedAt');
	if (!blogs) {
		return next(new httpError('fail to found this user is blogs', 400));
	}
	console.log(user);
	console.log(blogs);
	res.status(200).json({
		status: 'success',
		result: {
			user,
			blogs,
		},
	});
});
exports.getProfile = catchAsync(async (req, res, next) => {
	const user = req.user;
	user = await User.findById({ _id: user._id }).select('-photo -password');

	res.status(200).json({
		status: 'success',
		result: {
			user,
		},
	});
});
exports.getAllBlogsForOneUser = catchAsync(async (req, res, next) => {
	const { username } = req.params;
	const currentUser = await User.findOne({ username });
	if (!currentUser) {
		return next(new httpError('fail to find the current user', 400));
	}
	const userId = currentUser._id;
	console.log({ userId });
	const listblogs = await Blog.find({ postedBy: userId })
		.populate('categories', '_id name slug')
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name username slug')
		.select('_id title postedBy slug createdAt updatedAt');
	if (!listblogs) {
		return next(
			new httpError('fail to find the list of blogs for the current user', 400)
		);
	}
	console.log({ listblogs });
	res.status(200).json({
		status: 'success',
		result: listblogs,
	});
});
exports.getPhoto = catchAsync(async (req, res, next) => {
	const username = req.params.username.toLowerCase();
	const user = await User.findOne({ username });
	if (!user) {
		return next(new httpError('user not found', 404));
	}
	if (user.photo.data) {
		res.set('Content-Type', user.photo.contentType);
		res.send(user.photo.data);
	}
});
exports.createBlog = catchAsync(async (req, res, next) => {
	let form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.parse(req, async (err, fields, files) => {
		if (err) {
			return next(new httpError('Image could not upload', 400));
		}
		if (!files.photo) {
			return next(new httpError('image is required', 400));
		}
		if (files.photo.size > 1000000) {
			return next(new httpError('Image size not supported', 400));
		}
		if (!fields.title || fields.title.length === 0) {
			return next(new httpError('title is requied required'));
		}
		if (!fields.body || fields.body.length === 0) {
			return next(new httpError('body is required'));
		}
		if (!fields.categories || fields.categories.length === 0) {
			return next(new httpError('categoires is required'));
		}
		if (!fields.tags || fields.tags.length === 0) {
			return next(new httpError('tags is required'));
		}
		const { title, body, categories, tags } = fields;
		const slug = slugify(title).toLowerCase();
		const mtitle = `${title}| ${process.env.APP_NAME}`;
		const mdesc = body.substring(0, 160);
		const postedBy = req.user._id;
		const arrayCategories = categories && categories.split(',');
		const arrayTags = tags && tags.split(',');
		console.log({
			title,
			body,
			arrayCategories,
			arrayTags,
			slug,
			mtitle,
			mdesc,
			postedBy,
		});
		const newBlog = await Blog.create({
			title,
			body,

			slug,
			mtitle,
			mdesc: mdesc.result,
			postedBy,
			photo: {
				data: fs.readFileSync(files.photo.path),
				contentType: files.photo.type,
			},
		});

		if (!newBlog) {
			return next(new httpError('fail to create new blog', 400));
		}

		const updateBlog = await Blog.findByIdAndUpdate(
			{ _id: newBlog._id },
			{ $push: { categories: arrayCategories } },
			{ new: true }
		);
		if (!updateBlog) {
			return next(new httpError('fail to update the blog', 400));
		}
		const updateBlog2 = await Blog.findByIdAndUpdate(
			{ _id: newBlog._id },
			{ $push: { tags: arrayTags } },
			{ new: true }
		);
		if (!updateBlog2) {
			return next(new httpError('fail to update the blog', 400));
		}
		const blog = await Blog.findById(updateBlog2._id);
		if (!blog) {
			return next(new httpError('no blog', 400));
		}
		res.status(201).json({
			status: 'success',
			result: blog,
		});
	});
});
exports.updateBlog = catchAsync(async (req, res, next) => {
	const slug = req.params.slug.toLowerCase();
	console.log({ slug });
	const blog = await Blog.findOne({ slug });
	if (!blog) {
		return next(new httpError('fail to find this blog', 400));
	}
	if (blog.postedBy._id.toString() !== req.user._id.toString()) {
		return next(new htttpError('you are not the create of the blog ', 422));
	}

	let form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.parse(req, async (err, fields, files) => {
		if (err) {
			return next(new httpError('Image could not upload', 400));
		}

		if (files.photo && files.photo.size > 1000000) {
			return next(new httpError('Image size not supported', 400));
		}
		if (!fields.title || fields.title.length === 0) {
			return next(new httpError('title is requied required'));
		}
		if (!fields.body || fields.body.length === 0 || fields.body.length > 160) {
			return next(new httpError('body is required'));
		}
		// if (!fields.categories || fields.categories.length === 0) {
		// 	return next(new httpError('categoires is required'));
		// }
		// if (!fields.tags || fields.tags.length === 0) {
		// 	return next(new httpError('tags is required'));
		// }
		const { title, body, categories, tags } = fields;

		const mtitle = `${title}| ${process.env.APP_NAME}`;
		const mdesc = stripHtml(body.substring(0, 160));
		const postedBy = req.user._id;
		const arrayCategories = categories && categories.split(',');
		const arrayTags = tags && tags.split(',');
		console.log({
			title,
			body,
			arrayCategories,
			arrayTags,
			slug,
			mtitle,
			mdesc,
			postedBy,
		});
		const photo = files.photo
			? {
					data: fs.readFileSync(files.photo.path),
					contentType: files.photo.type,
			  }
			: {};
		const updatedBlog = await Blog.findOneAndUpdate(
			{ slug },
			{
				title,
				body,
				categories: arrayCategories,
				tags: arrayTags,
				mtitle,
				mdesc: mdesc.result,
				postedBy,
				photo,
			},

			{ new: true }
		);

		if (!updatedBlog) {
			return next(new httpError('fail to update this blog', 400));
		}

		// const updatecategories = await Blog.findOneAndUpdate(
		// 	{ slug },
		// 	{ $push: { categories: arrayCategories } },
		// 	{ new: true }
		// );
		// if (!updatecategories) {
		// 	return next(new httpError('fail to update the blog', 400));
		// }
		// const updateTags = await Blog.findOneAndUpdate(
		// 	{ slug },
		// 	{ $push: { tags: arrayTags } },
		// 	{ new: true, runValidators: true }
		// );
		// if (!updateTags) {
		// 	return next(new httpError('fail to update the blog', 400));
		// }

		res.status(201).json({
			status: 'success',
			result: updatedBlog,
		});
	});
});
exports.deleteBlog = catchAsync(async (req, res, next) => {
	const slug = req.params.slug.toLowerCase();
	console.log(slug);
	const blog = await Blog.findOne({ slug });
	if (!blog) {
		return next(new httpError('fail to find this blog', 400));
	}
	if (blog.postedBy._id.toString() !== req.user._id.toString()) {
		return next(new htttpError('you are not the create of the blog ', 422));
	}
	const blogToDelete = await Blog.findOneAndDelete({ slug });

	if (!blogToDelete) {
		return next(new httpError('fail to find this blog', 400));
	}
	res.status(200).json({
		status: 'success',
		result: blogToDelete,
	});
});

exports.updateProfile = catchAsync(async (req, res, next) => {
	let form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.parse(req, async (err, fields, files) => {
		if (err) {
			return next(new httpError('could not upload the image', 400));
		}
		if (!fields.name) {
			return next(new httpError('name is require', 400));
		}
		if (files.photo) {
			if (files.photo.size > 100000) {
				return next(
					new httpError('image size could not be gratter than 1mb', 400)
				);
			}
		}
		if (fields.password && fields.password.length < 6) {
			return next(new httpError('password should be min 6 character'));
		}
		const name = fiedls.name;
		const photo = {
			data: fs.readFileSync(files.photo.path),
			contentType: files.photo.contentType,
		};
		const updatedUser = await User.findByIdAndUpdate(
			{ _id: user._id },
			{
				name,
				photo,
			},
			{
				new: true,
				runValidators: true,
			}
		);
		if (!updatedUser) {
			return next(new httpError('fail to update the user', 400));
		}
		res.status(200).json({
			status: 'success',
			result: updatedUser,
		});
	});
});
