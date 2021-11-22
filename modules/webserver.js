const chalk = require('chalk');

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mysql = require('mysql');
const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});

server.listen(process.env.PORT || 3000, () => {
	console.log(chalk.greenBright('WEBSERVER INIT INFO'), 'Server listening on port: ' + process.env.PORT || 3000);
});

app.get('/', (req, res) => {
	return res.send('You have reached the Gang Słoni API. This is probably an error, please return to the main site: http://gangsloni.pl');
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
	let webhook_response;
	// Respond To Heroku Webhook
	res.sendStatus(200);

	if (req.get('heroku-webhook-hmac-sha256')) {
		if (Payload.action == 'create') {
			webhook_response = `A new buld was created for **${Payload.data.app.name}** on behalf of **${Payload.data.user.email}** with the ID **${Payload.data.id}**`;
		} else if (Payload.action == 'update' && Payload.data.status == 'succeeded') {
			webhook_response = `Last build of **${Payload.data.app.name}** finished with status **${Payload.data.status}**, creating release version **${Payload.data.release.version}**`;
		} else {
			webhook_response = 'The build **failed**, just like you.';
		}
	} else if (!req.get('heroku-webhook-hmac-sha256')) {
		webhook_response = `A monitor with the ID **${Payload.id}** and name **${Payload.monitor}** sent **${Payload.type}**. Description: ${Payload.description}`;
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
			content: webhook_response,
		}),
	};
	request(options, function(error, response) {
		if (error) throw new Error(error);
		console.log(response);
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

	connection.query('SELECT * FROM stats', function(err, rows) {
		if (err) {
			client.channels.cache.get(config.testChannelId).send('**A database error detected**');
			throw err;
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

app.post('/modByID', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization',
	);
	const data = req.body;

	connection.query(`SELECT * FROM account WHERE id = ${data.id}`, function(err, rows) {
		if (err) {
			client.channels.cache.get(config.testChannelId).send('**A database error detected**');
			throw err;
		}

		res.json(rows[0].moderation);
	});
});

process.on('uncaughtException', (err) => {
	console.log('uncaughtException');
	console.log(err);
	client.channels.cache.get(config.testChannelId).send('**Uncaught exception detected. System restarting**');
});