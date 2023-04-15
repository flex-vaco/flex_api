require('dotenv').config();
const mysql = require('mysql2');
const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PSWD,
	database: process.env.DB_NAME
});

connection.connect(function (error) {
	if (!!error) {
		console.log(error);
	} else {
		console.log('Database Connected Successfully..!!');
	}
});

module.exports = connection;