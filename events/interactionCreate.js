const chalk = require('chalk');

module.exports = {
	name: 'interactionCreate',
	async execute(interaction, client, config) {
		console.log(chalk.green('INFO'), `${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
		if (config.commandsDisabled == true && interaction.commandName != 'disablecommands') return interaction.reply('Interactions are currently disabled.');
		if (interaction.isCommand()) {
			const { commands } = client;
			const { commandName } = interaction;
			const command = commands.get(commandName);
			if (!command) return;
			try {
				await command.execute(interaction, client);
			} catch (error) {
				console.error(error);
				await interaction.reply({
					content: 'An error has occured whilst running this command.',
					ephemeral: true,
				});
			}
		}
	},
};