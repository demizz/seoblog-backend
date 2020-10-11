const nodeMailer = require('nodemailer');
module.exports = class Email {
	constructor(user, url) {
		this.to = user.email;
		this.firstname = user.name;
		this.url = url;
		this.from = 'no-replay@seoblog.com';
	}
	newTransporter() {
		return nodeMailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD,
			},
		});
	}

	async send(template, subject) {
		const mailOptions = {
			to: this.to,
			from: this.from,
			subject,
			html: template,
		};
		await this.newTransporter().sendMail(mailOptions);
	}
	async sendResetPasswordToken() {
		await this.send(
			`<h3><a href=${this.url}>link to reset Password</a></h3>`,
			'link to reset password'
		);
	}
};
