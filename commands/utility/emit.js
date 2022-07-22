const { SlashCommandBuilder, Options } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('emit')
		.setDescription('Emits an event.')
		.addOption(option => options: [
				name: 'event',
				description: 'Event',
				required: true,
				type: ApplicationCommandOptionType.String,
			],
				// .addChoice('memAdd', 'guildMemberAdd')
				// .addChoice('memRemove', 'guildMemberRemove')
				// .addChoice('interactionCreate', 'interactionCreate')),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			await interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}

		const eventName = interaction.options.getString('event');
		interaction.client.emit(eventName);
		await interaction.reply('Emitted.');
	},
};
