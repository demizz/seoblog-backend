const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			trim: true,
			minlength: 3,
			maxlength: 160,
			required: [true, 'A blog must have a titile'],
		},
		slug: {
			type: String,
			unique: true,
			index: true,
		},
		body: {
			type: {},
			required: [true, 'a blog must have a body'],
			minlength: 200,
			maxlength: 20000000,
		},
		excerpt: {
			type: String,
			maxlength: 1000,
		},
		mtitle: {
			type: String,
		},
		mdesc: {
			type: String,
		},
		photo: {
			data: Buffer,
			contentType: String,
		},
		categories: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Category',
			},
		],
		tags: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Tag',
			},
		],
		postedBy: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true }
);
const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
