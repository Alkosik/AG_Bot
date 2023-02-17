// dotenv, chalk and snooze
const chalk = require('chalk');
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
	console.log(chalk.greenBright('INFO'), `Current environment: ${process.env.NODE_ENV}`);
}

// Deploy Dependecies
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const clientId = process.env.CLIENT_ID;
// const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;

console.log(chalk.greenBright('CMD_REG INFO'), 'Application commands registration process initiated.');

const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const modCommandFiles = fs.readdirSync('./commands/mod').filter(file => file.endsWith('.js'));
const utilCommandFiles = fs.readdirSync('./commands/utility').filter(file => file.endsWith('.js'));
const funCommandFiles = fs.readdirSync('./commands/fun').filter(file => file.endsWith('.js'));
const apiCommandFiles = fs.readdirSync('./commands/apis').filter(file => file.endsWith('.js'));
const musicCommandFiles = fs.readdirSync('./commands/music').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	console.log(chalk.green('CMD_REG INFO'), 'Registering command: ' + command.data.name);
	commands.push(command.data.toJSON());
	snooze(1000);
}

for (const file of modCommandFiles) {
	const command = require(`./commands/mod/${file}`);
	console.log(chalk.green('CMD_REG INFO'), 'Registering moderation command: ' + command.data.name);
	commands.push(command.data.toJSON());
	snooze(1000);
}

for (const file of utilCommandFiles) {
	const command = require(`./commands/utility/${file}`);
	console.log(chalk.green('CMD_REG INFO'), 'Registering utility command: ' + command.data.name);
	commands.push(command.data.toJSON());
	snooze(1000);
}

for (const file of funCommandFiles) {
	const command = require(`./commands/fun/${file}`);
	console.log(chalk.green('CMD_REG INFO'), 'Registering fun command: ' + command.data.name);
	commands.push(command.data.toJSON());
	snooze(1000);
}

for (const file of apiCommandFiles) {
	const command = require(`./commands/apis/${file}`);
	console.log(chalk.green('CMD_REG INFO'), 'Registering api command: ' + command.data.name);
	commands.push(command.data.toJSON());
	snooze(1000);
}

for (const file of musicCommandFiles) {
	const command = require(`./commands/music/${file}`);
	console.log(chalk.green('CMD_REG INFO'), 'Registering music command: ' + command.data.name);
	commands.push(command.data.toJSON());
	snooze(1000);
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log(chalk.greenBright('CMD_REG INFO'), 'Sending commands to Discord.');
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);


		console.log(chalk.greenBright('CMD_REG INFO'), 'Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();
