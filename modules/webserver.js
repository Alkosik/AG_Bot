const chalk = require('chalk');

const { MessageEmbed } = require('discord.js');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
	console.log(chalk.greenBright('WEBSERVER INIT INFO'), `Current environment: ${process.env.NODE_ENV}`);
}

const index = require('../index.js');

const config = index.config;
const client = index.client;

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const request = require('request');
const bodyParser = require('body-parser');

const cors = require('cors');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const mysql = require('mysql');
let connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});

function handleDisconnect() {
	console.log(chalk.green('WEBSERVER DB INFO'), 'Reconnecting to database...');
	client.channels.cache.get(config.testChannelId).send('Webserver: Reconnecting to database...');
	connection = mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: 'www5056_gsmaindb',
	});
	console.log(chalk.green('WEBSERVER DB INFO'), 'Reconnected to database.');
	client.channels.cache.get(config.testChannelId).send('Webserver: Reconnected to database.');
}

connection.connect(function(err) {
	console.log(chalk.green('WEBSERVER DB INFO'), 'Estabilishing database connection...');
	if (err) throw err;
	console.log(chalk.green('WEBSERVER DB INFO'), 'Database connection established');
});

connection.on('error', function(err) {
	console.log(chalk.red('DB ERROR'), err);
	if (err.code === 'PROTOCOL_CONNECTION_LOST') {
		client.channels.cache.get(config.testChannelId).send('Webserver: **Fatal database error** - Server closed the connection. Disconnect handling initiated.');
		handleDisconnect();
	} else {
		client.channels.cache.get(config.testChannelId).send('Webserver: **Database connection error encountered**');
		throw err;
	}
});

server.listen(process.env.PORT || 3000, () => {
	console.log(chalk.greenBright('WEBSERVER INIT INFO'), 'Server listening on port: ' + process.env.PORT || 3000);
});

app.get('/', (req, res) => {
	// return res.send('You have reached the Gang Słoni API. This is probably an error, please return to the main site: http://gangsloni.com');
	return res.status(200).sendFile('./api.html', { root: __dirname });
});

app.post('/', (req, res) => {
	return res.send('POST HTTP method registered');
});

app.put('/', (req, res) => {
	return res.send('PUT HTTP method registered');
});

app.delete('/', (req, res) => {
	return res.send('DELETE HTTP method registered');
});

app.post('/webhook', async (req, res) => {
	const Payload = req.body;
	let embed_name;
	let webhook_response;
	// Respond To Heroku Webhook
	res.sendStatus(200);

	if (req.get('heroku-webhook-hmac-sha256')) {
		if (Payload.action == 'create') {
			embed_name = 'Build creation';
			webhook_response = `A new buld was created for **${Payload.data.app.name}** on behalf of **${Payload.data.user.email}** with the ID **${Payload.data.id}**`;
		} else if (Payload.action == 'update' && Payload.data.status == 'succeeded' && Payload.data.release.version != undefined) {
			embed_name = 'Build follow-up';
			webhook_response = `Last build of **${Payload.data.app.name}** finished with status **${Payload.data.status}**, creating release version **${Payload.data.release.version}**`;
		} else {
			embed_name = 'Build failure';
			webhook_response = 'The build **failed**, just like you.';
		}
	} else if (!req.get('heroku-webhook-hmac-sha256')) {
		if (Payload.monitor) {
			embed_name = 'Monitor notification';
			webhook_response = `A monitor with the ID **${Payload.id}** and name **${Payload.monitor}** sent **${Payload.type}**. Description: ${Payload.description}`;
		} else {
			return;
		}
	}

	const options = {
		method: 'POST',
		url:
       `https://discord.com/api/webhooks/${process.env.WEBHOOK_URL}`,
		headers: {
			'Content-type': 'application/json',
		},
		// Format JSON DATA
		body: JSON.stringify({
			'embeds': [{
				'color': '11801317',
				'title': embed_name,
				'description': webhook_response,
				'footer': {
					'text': 'Gang Słoni 2.0',
					'icon_url': 'https://i.imgur.com/JRl8WjV.png',
				},
			}],
		}),
	};
	request(options, function(error, response) {
		if (error) throw new Error(error);
		if (response.body.statusCode == 200) console.log(chalk.greenBright('WEBSERVER INFO'), 'Webhook: successfull');
		if (response.body.statusCode == 204) console.log(chalk.greenBright('WEBSERVER INFO'), 'Wenhook: No content');
	});
});

// API or sum idk
app.get('/memCount', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	);
	console.log(chalk.greenBright('WEBSERVER INFO'), 'Connection detected - memCount');
	const guild = client.guilds.cache.get('510941195267080214');
	const memCount = guild.memberCount;
	res.json(memCount);
});

app.get('/onlineMemCount', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	);
	console.log(chalk.greenBright('WEBSERVER INFO'), 'Connection detected - onlineMemCount');
	const guild = client.guilds.cache.get('510941195267080214');
	const onlineMembers = guild.members.cache.filter(member => !member.user.bot);
	// console.log(onlineMembers);
	res.json(onlineMembers);
});

app.get('/messageCount', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	);
	console.log(chalk.greenBright('WEBSERVER INFO'), 'Connection detected - messageCount');

	const date = new Date();
	const formattedDate = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();

	connection.query(`SELECT * FROM stats WHERE date = '${formattedDate}'`, function(err, rows) {
		if (err) {
			client.channels.cache.get(config.testChannelId).send('**A database error detected**');
			throw err;
		} else if (rows.length == 0) {
			client.channels.cache.get(config.testChannelId).send('**Missing requried data, forcing new entry**');
			return connection.query(`INSERT INTO stats (date, messages) VALUES ('${formattedDate}', '1')`, function(err) {
				if (err) {
					client.channels.cache.get(config.testChannelId).send('**Force write failed**');
					throw err;
				}
			});
		}

		res.json(rows[0].messages);
	});
});

app.post('/sendMessage', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	);
	const data = req.body;

	client.channels.cache.get(data.id).send(data.message);

	res.send(`Message registered. Content: ${data.message} | Channel ID: ${data.id}`);
});

app.post('/sendDM', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	);
	const data = req.body;

	const user = client.users.cache.get(data.id);
	user.send(data.message);

	res.send(`Direct Message registered. Content: ${data.message} | User ID: ${data.id} | Username: ${user.username}`);
});

app.post('/userByID', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	);
	const data = req.body;

	if (data.id == undefined) {
		return res.status(400).send('No ID provided');
	}

	connection.query(`SELECT * FROM account WHERE id = ${data.id}`, function(err, rows) {
		if (err) {
			client.channels.cache.get(config.testChannelId).send('**A database error detected**');
			throw err;
		}

		if (rows.length == 0) {
			return res.status(404).send('No user found');
		} else {
			return res.json(rows[0]);
		}
	});
});

app.get('/adminList', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	);

	connection.query('SELECT * FROM account WHERE moderation != 0', function(err, rows) {
		if (err) {
			client.channels.cache.get(config.testChannelId).send('**A database error detected**');
			throw err;
		}
		console.log(rows);
		res.json(rows);
	});
});

process.on('uncaughtException', (err) => {
	if (err.message.includes('Connection lost: The server closed the connection')) {
		console.log(chalk.redBright('WEBSERVER DB ERROR'), 'Connection lost: The server closed the connection');
		handleDisconnect();
	}
	console.log(chalk.redBright('UNCAUGHT EXCEPTION'));
	console.error(err);
	const exceptionEmbed = new MessageEmbed()
		.setTitle('Uncaught Exception')
		.setColor('#ff0000')
		.setDescription('```' + String(err.message) + '```');
	client.channels.cache.get(config.testChannelId).send({ embeds: [exceptionEmbed] });
});