const chalk = require('chalk');

const index = require('../index.js');

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const request = require('request');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

server.listen(process.env.PORT, () => {
	console.log(chalk.greenBright('WEBSERVER INFO'), 'Server listening on port: ' + process.env.PORT);
});

app.post('/webhook', async (req, res) => {
	const Payload = req.body;
	let webhook_response;
	// Respond To Heroku Webhook
	res.sendStatus(200);

	if (Payload.action == 'create') {
		webhook_response = `A new buld was created for **${Payload.data.app.name}** on behalf of **${Payload.data.user.email}** with the ID **${Payload.data.id}**`;
	} else if (Payload.action == 'update' && Payload.data.status == 'succeeded') {
		webhook_response = `Last build of **${Payload.data.app.name}** finished with status **${Payload.data.status}**, creating release version **${Payload.data.release.version}**`;
	} else {
		webhook_response = 'You fucked something up B) - The build probably failed or something idk im not handling this cya bltch';
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
			// content: `A new build/release for **${Payload.data.app.name}** detected`,
			content: webhook_response,
		}),
	};
	request(options, function(error, response) {
		if (error) throw new Error(error);
		console.log(response);
	});
});

// API
app.get('/memCount', (req, res) => {
	console.log(chalk.greenBright('WEBSERVER INFO'), 'Connection detected');
	const guild = index.client.guilds.cache.get('510941195267080214');
	const memCount = guild.memberCount;
	res.json(memCount);
});