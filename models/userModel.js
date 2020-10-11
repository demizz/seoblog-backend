const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			trim: true,
			required: true,
			maxlength: 32,
			unique: [true, 'a username must be unique'],
			index: true,
			lowercase: true,
		},
		name: {
			type: String,
			trim: true,
			required: [true, 'A user have a user'],
			maxlength: 32,
		},
		email: {
			type: String,
			trim: true,
			required: [true, 'A user must have a email'],
			unique: [true, 'A user must have an email'],
			lowercase: true,
			validate: [validator.isEmail, 'please provide a valid address email'],
		},
		profile: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: [true, 'A user must have a password'],
		},
		salt: {
			type: String,
		},
		about: {
			type: String,
		},
		role: {
			type: Number,
			trim: true,
			default: 0,
		},
		photo: {
			data: Buffer,
			contentType: String,
		},
		resetPasswordLink: {
			data: String,
			default: '',
		},
	},
	{ timestamps: true }
);
// userSchema.virtual('password').set(function(password){
// 	this._password=password;
// 	this.salt=this.makeSalt();
// 	this.hashed_password=this.encryptPassword(password )

// }).get(function(){
// 	return this._password
// })
// userSchema.methods={encryptPassword:function(password){
// 	if(!password)return;
// 	try{
// 		retrun
// 	}
// }}
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		return next();
	}

	this.password = await bcrypt.hash(this.password, 12);

	next();
});
userSchema.methods.comparePassword = async function (
	password,
	dataBasePassword
) {
	const compare = await bcrypt.compare(password, dataBasePassword);
	return compare;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
