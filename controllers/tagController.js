const catchAsync = require('../utils/catchAsync');
const Tag = require('../models/tagModel');
const httpError = require('../utils/httpError');
const slugify = require('slugify');
exports.newTag = catchAsync(async (req, res, next) => {
	const { name } = req.body;
	let slug = slugify(name).toLowerCase();
	const newtag = await Tag.create({ name, slug });
	if (!newtag) {
		return next(new httpError('fail to create new tag', 400));
	}
	res.status(201).json({
		status: 'success',
		result: newtag,
	});
});
exports.allTags = catchAsync(async (req, res, next) => {
	const allTags = await Tag.find();
	if (!allTags) {
		return next(new httpError('fail to find all tags', 400));
	}
	res.status(200).json({
		status: 'success',
		result: allTags,
	});
});
exports.getOneTag = catchAsync(async (req, res, next) => {
	const { slug } = req.params;
	const onetag = await Tag.findOne({ slug });
	if (!onetag) {
		return next(new httpError('fail to find this tag', 400));
	}
	res.status(200).json({
		status: 'success',
		result: onetag,
	});
});
exports.deleteOneTag = catchAsync(async (req, res, next) => {
	const { slug } = req.params;
	console.log(slug);
	const onetag = await Tag.findOneAndDelete({ slug });
	if (!onetag) {
		return next(new httpError('fail to delete this tag', 400));
	}
	res.status(200).json({
		status: 'success',
		result: onetag,
	});
});
