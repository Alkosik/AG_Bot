// dotenv and chalk
const chalk = require('chalk');
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
	console.log(chalk.greenBright('INFO'), `Current environment: ${process.env.NODE_ENV}`);
}

// Deploy Dependecies
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;


const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const modCommandFiles = fs.readdirSync('./commands/mod').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

for (const file of modCommandFiles) {
	const command = require(`./commands/mod/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log(chalk.greenBright('CMD_REG INFO'), 'Application commands registration process initiated.');
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(chalk.greenBright('CMD_REG INFO'), 'Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();
