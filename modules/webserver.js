const chalk = require('chalk');

const { MessageEmbed } = require('discord.js');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
	console.log(chalk.greenBright('WEBSERVER INIT INFO'), `Current environment: ${process.env.NODE_ENV}`);
}

const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageDisabled } = require('apollo-server-core');

const index = require('../index.js');

const config = index.config;
const client = index.client;

const schema = require('./schema');
const resolvers = {
	Query: {
		userByID: (_, { id }) => getUserByID(id),
		serverByID: (_, { id }) => getServerByID(id),
	},
};

const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const server = new ApolloServer({
	typeDefs: schema,
	resolvers,
	plugins: [
		ApolloServerPluginDrainHttpServer({ httpServer }),
		ApolloServerPluginLandingPageDisabled(),
	],
});
const request = require('request');
const bodyParser = require('body-parser');

const cors = require('cors');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// #region Database
const mysql = require('mysql');
let connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});

function handleDisconnect() {
	console.log(chalk.green('WEBSERVER DB INFO'), 'Reconnecting to database...');
	connection = mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: 'www5056_gsmaindb',
	});
	console.log(chalk.green('WEBSERVER DB INFO'), 'Reconnected to database.');
}

connection.connect(function(err) {
	console.log(chalk.green('WEBSERVER DB INFO'), 'Estabilishing database connection...');
	if (err) {
		console.log(chalk.red('WEBSERVER DB ERROR'), 'Database connection failed.');
		return client.emit('error', err);
	}
	console.log(chalk.green('WEBSERVER DB INFO'), 'Database connection established');
});

connection.on('error', function(err) {
	console.log(chalk.red('DB ERROR'), err);
	if (err.code === 'PROTOCOL_CONNECTION_LOST') {
		console.log(chalk.redBright('WEBSERVER DB ERROR'), 'Fatal database error - Server closed the connection. Disconnect handling initiated.');
		handleDisconnect();
	} else {
		client.channels.cache.get(config.testChannelId).send('Webserver: **Database connection error encountered**');
		throw err;
	}
});
// #endregion

function getUserByID(id) {
	if (id === 'undefined') return null;
	return new Promise((resolve, reject) => {
		connection.query(`SELECT * FROM account WHERE id = ${id}`, (err, rows) => {
			if (err) {
				console.log(err);
				return reject(err);
			}
			if (rows.length < 1) {
				client.channels.cache.get(config.testChannelId).send('Webserver: **Unauthorized access to dashboard**. User ID: ' + id);
				return resolve(null);
			}
			const results = rows.map(row => ({
				discord_id: row.id,
				username: row.username,
				discriminator: row.discriminator,
				avatar_url: row.avatarURL,
				moderation: row.moderation,
				xp: row.xp,
				level: row.level,
				ganja: row.ganja,
				muted: row.muted,
				warns: row.warns,
				nickname: row.nickname,
			}));
			return resolve(results[0]);
		});
	});
}

function getServerByID(id) {
	if (id === 'undefined') return null;
	return new Promise((resolve, reject) => {
		connection.query(`SELECT * FROM server WHERE id = ${id}`, (err, rows) => {
			if (err) {
				console.log(err);
				return reject(err);
			}
			if (rows.length < 1) {
				client.channels.cache.get(config.testChannelId).send('Webserver: **Possible unauthorized access to dashboard**. Request came with ID: ' + id);
				return resolve(null);
			}
			const results = rows.map(row => ({
				server_id: row.id,
				name: row.name,
				owner: row.owner,
				owner_id: row.owner_id,
				icon_url: row.icon_url,
				description: row.description,
				member_count: row.member_count,
				member_count_human: row.member_count_human,
				message_count: row.message_count,
			}));
			return resolve(results[0]);
		});
	});
}

async function startServer() {
	await server.start();

	server.applyMiddleware({ app });

	const port = process.env.PORT || 3000;

	await new Promise(resolve => httpServer.listen({ port: port }, resolve));

	console.log(chalk.green('WEBSERVER INIT INFO'), `Server listening at http://localhost:${port}`);
	console.log(chalk.green('GRAPHQL INIT INFO'), `GraphQL listening at http://localhost:${port}${server.graphqlPath}`);
}

startServer();

app.get('/', (req, res) => {
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
	res.sendStatus(200);

	if (req.get('heroku-webhook-hmac-sha256')) {
		if (Payload.action == 'create') {
			embed_name = `Build creation - ${Payload.data.app.name}`;
			webhook_response = `A new buld was created for **${Payload.data.app.name}** on behalf of **${Payload.data.user.email}** with the ID **${Payload.data.id}**`;
		} else if (Payload.action == 'update' && Payload.data.status == 'succeeded') {
			embed_name = `Build success - ${Payload.data.app.name}`;
			if (Payload.data.release.version) {
				webhook_response = `Last build of **${Payload.data.app.name}** finished with status **${Payload.data.status}**, creating release version **${Payload.data.release.version}**`;
			} else {
				webhook_response = `Last build of **${Payload.data.app.name}** finished with status **${Payload.data.status}**`;
			}
		} else {
			embed_name = 'Build failure';
			webhook_response = 'The build **failed**, just like you.';
		}
	} else if (req.get('X-Snipcart-RequestToken')) {
		if (Payload.eventName == 'order.completed') {
			embed_name = 'Order received';
			webhook_response = `Order received from **${Payload.content.user.billingAddressName}** with email **${Payload.content.user.email}** \nPayment: **${Payload.content.paymentStatus}**`;
		} else {
			return;
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
			client.emit('error', err);
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
	client.channels.cache.get(config.testChannelId).send(`**DM Sent** - Ariana Grande -> ${user.username}: ${data.message}`);
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
			client.emit('error', err);
			throw err;
		}

		if (rows.length == 0) {
			return res.status(404).send('User not found');
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
			client.emit('error', err);
			throw err;
		}
		res.json(rows);
	});
});

process.on('uncaughtException', (err) => {
	if (String(err.message).includes('Connection lost: The server closed the connection')) {
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