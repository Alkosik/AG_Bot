const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('hotuwa')
		.setDescription('Prawdziwa hotuwa.'),
	async execute(interaction) {
		const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

		const hotEmbed = new EmbedBuilder()
			.setTitle('Ale hotuwa')
			.setColor('#ff005d')
			.setImage('https://i.imgur.com/97TNrHe.jpg');
		await interaction.deferReply();
		snooze(1000);
		await interaction.editReply({ embeds: [hotEmbed] });
	},
};
