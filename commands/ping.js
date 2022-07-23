const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Typical bot testing command.'),
	async execute(interaction) {
		await interaction.reply('Twoja stara');
	},
};
