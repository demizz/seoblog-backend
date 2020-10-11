const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, 'A category must have a name'],
			max: 32,
		},
		slug: {
			type: String,
			unique: true,
			index: true,
		},
	},
	{ timestamps: true }
);
const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
