const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const blogsRoutes = require('./routes/blogsRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const tagRoutes = require('./routes/tagRoutes');
const usersRoutes = require('./routes/usersRoutes');
const httpError = require('./utils/httpError');

const app = express();

app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// if (process.env.NODE_ENV === 'developement') {
// 	console.log(process.env.CLIENT_URL);
// 	app.use(cors({ origin: `${process.env.CLIENT_URL}` }));
// }
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/blogs', blogsRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/tag', tagRoutes);
app.use('*', (req, res, next) => {
	return next(new httpError('this route is not defined', 404));
});
app.use((err, req, res, next) => {
	res.status(err.code || 500).json({
		message: err.message || 'unknow error',
	});
});

module.exports = app;
