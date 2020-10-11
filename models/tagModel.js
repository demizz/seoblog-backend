const mongoose = require('mongoose');
const tagSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: [true, 'A Tag must have a name'],
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
const Tag = mongoose.model('Tag', tagSchema);
module.exports = Tag;
