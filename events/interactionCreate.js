const chalk = require('chalk');

module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		console.log(chalk.green('INFO'), `${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
	},
};