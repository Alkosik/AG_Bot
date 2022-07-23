const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cipa')
		.setDescription('Prawdziwa cipa.'),
	async execute(interaction) {
		const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

		const cipaEmbed = new EmbedBuilder()
			.setTitle('Ale cipa')
			.setImage('https://i.imgur.com/qs17Hey.jpg');
		await interaction.deferReply();
		snooze(1000);
		await interaction.editReply({ embeds: [cipaEmbed] });
	},
};
