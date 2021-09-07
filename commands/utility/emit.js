const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('emit')
		.setDescription('Emits an event.'),
	async execute(interaction) {
		await interaction.reply('Twoja stara');
	},
};
