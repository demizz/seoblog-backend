const catchAsync = require('../utils/catchAsync');
const Category = require('../models/categoryModel');
const httpError = require('../utils/httpError');
const slugify = require('slugify');
exports.newCategory = catchAsync(async (req, res, next) => {
	const { name } = req.body;
	let slug = slugify(name).toLowerCase();
	const newCategory = await Category.create({ name, slug });
	if (!newCategory) {
		return next(new httpError('fail to create new category', 400));
	}
	res.status(201).json({
		status: 'success',
		result: newCategory,
	});
});
exports.allCategories = catchAsync(async (req, res, next) => {
	const allCategories = await Category.find();
	if (!allCategories) {
		return next(new httpError('fail to find all categories', 400));
	}
	res.status(200).json({
		status: 'success',
		result: allCategories,
	});
});
exports.getOneCategory = catchAsync(async (req, res, next) => {
	const { slug } = req.params;
	const oneCategory = await Category.findOne({ slug });
	if (!oneCategory) {
		return next(new httpError('fail to find this category', 400));
	}
	res.status(200).json({
		status: 'success',
		result: oneCategory,
	});
});
exports.deleteOneCategory = catchAsync(async (req, res, next) => {
	const { slug } = req.params;
	const oneCategory = await Category.findOneAndDelete({ slug });
	if (!oneCategory) {
		return next(new httpError('fail to delete this category', 400));
	}
	res.status(200).json({
		status: 'success',
		result: oneCategory,
	});
});
