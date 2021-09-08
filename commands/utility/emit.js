const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('emit')
		.setDescription('Emits an event.'),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			await interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}
		await interaction.reply('Twoja stara');
	},
};
