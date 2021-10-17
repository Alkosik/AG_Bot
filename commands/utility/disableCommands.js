const { SlashCommandBuilder } = require('@discordjs/builders');
const chalk = require('chalk');
const fs = require('fs');
const configName = '../../config.json';
const configFile = require(configName);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('disablecommands')
		.setDescription('Disables the use of commands.'),
	async execute(interaction) {
		let reply = undefined;

		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			return interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}

		if (configFile.commandsDisabled == false) {
			configFile.commandsDisabled = true;
			reply = 'Interactions disabled';
		} else {
			configFile.commandsDisabled = false;
			reply = 'Interactions enabled';
		}

		fs.writeFile(configName, JSON.stringify(configFile), function writeJSON(err) {
			if (err) return console.log(err);
			console.log(chalk.yellow('CRITICAL INFO'), 'Writing to ' + configName);
			console.log(chalk.yellow('CRITICAL INFO'), 'Changing commands state');
		});

		await interaction.reply(reply);
	},
};
