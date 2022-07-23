const chalk = require('chalk');

const { EmbedBuilder } = require('discord.js');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
	console.log(chalk.greenBright('WEBSERVER INIT INFO'), `Current environment: ${process.env.NODE_ENV}`);
}

const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageDisabled } = require('apollo-server-core');

const webserver = require('./webserver.js');

(async () => {
	const app = await webserver.app;

	console.log('LOLRATE INIT INFO', 'Connected to main webserver, initiating...');

	app.get('/search', (req, res) => {
		res.send('Hello World!');
	});
})();