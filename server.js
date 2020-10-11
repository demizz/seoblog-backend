const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');
dotenv.config({ path: './.env' });
const DB = process.env.DATABASE.replace(
	'<password>',
	process.env.DATABASE_PASSWORD
);

mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useFindAndModify: true,
		useCreateIndex: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('connection to database successfully');
	});

const port = process.env.PORT || 8000;
app.listen(port, () => {
	console.log(`server running at port ${port}`);
});
