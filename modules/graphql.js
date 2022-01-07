const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const express = require('express');
const http = require('http');

const chalk = require('chalk');
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
	console.log(chalk.greenBright('GRAPHQL INIT INFO'), `Current environment: ${process.env.NODE_ENV}`);
}

const schema = require('./schema');

const mysql = require('mysql');
const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});
connection.connect(function(err) {
	console.log(chalk.green('GRAPHQL DB INFO'), 'Estabilishing database connection...');
	if (err) {
		console.error(err);
		return console.log(chalk.red('WEBSERVER DB ERROR'), 'Database connection failed.');
	}
	console.log(chalk.green('GRAPHQL DB INFO'), 'Database connection established');
});


async function startApolloServer(typeDefs, resolvers) {
	const app = express();

	const httpServer = http.createServer(app);

	const server = new ApolloServer({
		typeDefs,
		resolvers,
		plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
	});

	await server.start();

	server.applyMiddleware({ app });

	await new Promise(resolve => httpServer.listen({ port: 3000 }, resolve));

	console.log(chalk.green('GRAPHQL INIT INFO'), `Server listening at http://localhost:3000${server.graphqlPath}`);
}

const resolversPass = {
	Query: {
		userByID: (_, { id }) => getUserByID(id),
	},
};

function getUserByID(id) {
	return new Promise((resolve, reject) => {
		connection.query(`SELECT * FROM account WHERE id = ${id}`, (err, rows) => {
			if (err) {
				console.log(err);
				return reject(err);
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

module.exports = startApolloServer(schema, resolversPass);