const chalk = require('chalk');

module.exports = {
	name: 'interactionCreate',
	async execute(interaction, client, config) {
		console.log(chalk.green('INFO'), `${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
		if (config.commandsDisabled == true && interaction.commandName != 'disablecommands') return interaction.reply('Interactions are currently disabled.');
		if (interaction.isButton()) {
			console.log(chalk.green('INFO'), `${interaction.user.tag} in #${interaction.channel.name} triggered a button interaction.`);
			if (interaction.message.id == '1001056644781838336' && interaction.customId == 'primary') {
				const member = interaction.guild.members.cache.get(interaction.user.id);
				if (member.roles.cache.some(r => r.name === 'Verified')) {
					interaction.reply({ content: 'You are already verified.', ephemeral: true });
					return;
				} else {
					member.roles.add(interaction.guild.roles.cache.find(r => r.name === 'Verified'));
					const user = interaction.client.users.cache.get(interaction.user.id);
					await interaction.reply({ content: 'You have been verified', ephemeral: true });
					user.send('You have been verified.');
					return;
				}
			}
		}
		if (interaction.isChatInputCommand()) {
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