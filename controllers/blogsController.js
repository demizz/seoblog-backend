const catchAsync = require('../utils/catchAsync');
const Blog = require('../models/blogModel');
const fs = require('fs');
const httpError = require('../utils/httpError');
const slugify = require('slugify');
const formidable = require('formidable');
const stripHtml = require('string-strip-html');
const _ = require('lodash');
const Category = require('../models/categoryModel');
const Tag = require('../models/tagModel');
exports.create = catchAsync(async (req, res, next) => {
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
		if (!fields.body || fields.body.length === 0 ) {
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

exports.allBlogs = catchAsync(async (req, res, next) => {
	const allBlogs = await Blog.find()
		.populate('categories', '_id name slug')
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name username')
		.select(
			'_id title  slug excerpt categories tags postedBy createdAt updatedAt'
		);
	if (!allBlogs) {
		return next(new httpError('fail to fetch all Blogs', 400));
	}
	res.status(200).json({
		status: 'success',
		result: allBlogs,
	});
});
exports.updateBlog = catchAsync(async (req, res, next) => {
	const slug = req.params.slug.toLowerCase();
	const prevBlog = await Blog.findOne({ slug });
	if (!prevBlog) {
		return next(new httpError('this blog dont exist', 404));
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
	const blogToDelete = await Blog.findOneAndDelete({ slug });

	if (!blogToDelete) {
		return next(new httpError('fail to find this blog', 400));
	}
	res.status(200).json({
		status: 'success',
		result: blogToDelete,
	});
});

exports.getOneBlog = catchAsync(async (req, res, next) => {
	const slug = req.params.slug.toLowerCase();

	console.log(slug);
	const oneBlog = await Blog.findOne({ slug })
		.populate('categories', '_id name slug')
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name username')
		.select(
			'_id title body slug mtitle mdesc categories tags postedBy createdAt updatedAt'
		);
	if (!oneBlog) {
		return next(new httpError('fail to find this blog', 400));
	}
	res.status(200).json({
		status: 'success',
		result: oneBlog,
	});
});
exports.allBlogsWithCategoriesAndTags = catchAsync(async (req, res, next) => {
	let limit = req.body.limit ? parseInt(req.body.limit) : 10;
	let skip = req.body.skip ? parseInt(req.body.skip) : 0;
	let blogs;
	let categories;
	let tags;
	const Blogs = await Blog.find()
		.populate('categories', '_id name slug')
		.populate('tags', '_id name slug')
		.populate('postedBy', '_id name username profile')
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit)
		.select('-photo');

	if (!Blogs) {
		return next(new httpError('fail to fetch all Blogs', 400));
	}
	blogs = Blogs;
	console.log(blogs);
	const findCategories = await Category.find();
	if (!findCategories) {
		return next(new httpError('fail to fetch Categories', 400));
	}
	categories = findCategories;

	const findTags = await Tag.find();
	if (!findTags) {
		return next(new httpError('fail to fetch Tags', 400));
	}
	tags = findTags;
	console.log(categories);
	console.log(tags);
	res.status(200).json({
		status: 'success',
		result: {
			blogs,
			categories,
			tags,
			size: blogs.length,
		},
	});
});
exports.getPhoto = catchAsync(async (req, res, next) => {
	const slug = req.params.slug;
	const doc = await Blog.findOne({ slug }).select('photo');
	if (!doc) {
		return next(new httpError('fail to find this blog', 400));
	}
	if (doc.photo.data) {
		res.set('ContentType', doc.photo.contentType);
		return res.send(doc.photo.data);
	}
});
exports.listRelated = catchAsync(async (req, res, next) => {
	let limit = req.body.limit ? parseInt(req.body.limit) : 3;
	console.log({ body: req.body });
	const { _id, categories } = req.body;
	const array = categories.map((item, i) => {
		return item._id;
	});
	console.log(array);
	const findBlog = await Blog.find({
		_id: { $ne: _id },
		categories: { $in: array },
	})
		.limit(limit)
		.populate('postedBy', '_id name profile');
	if (!findBlog) {
		return next(new httpError('fail to find the related list', 400));
	}
	res.status(200).json({
		status: 'success',
		result: findBlog,
	});
});
exports.search = catchAsync(async (req, res, next) => {
	const { search } = req.query;
	console.log({ search });
	if (search) {
		const data = await Blog.find({
			$or: [
				{ title: { $regex: search, $options: 'i' } },
				{ body: { $regex: search, $options: 'i' } },
			],
		}).select('-photo -body');
		if (!data) {
			return next(httpError('fail to find the seraching blog', 400));
		}
		res.status(200).json({
			status: 'success',
			result: data,
		});
	}
});
