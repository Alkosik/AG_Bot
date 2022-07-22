const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('emit')
		.setDescription('Emits an event.')
		.addStringOption(option =>
			option.setName('event')
				.setDescription('Event')
				.setRequired(true)
				.addChoices(
					{ name: 'memAdd', value: 'guildMemberAdd' },
					{ name: 'memRemove', value: 'guildMemberRemove' },
					{ name: 'interactionCreate', value: 'interactionCreate' },
				)),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			await interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}

		const eventName = interaction.options.getString('event');
		interaction.client.emit(eventName);
		await interaction.reply('Emitted.');
	},
};
