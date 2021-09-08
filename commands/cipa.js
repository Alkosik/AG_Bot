const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cipa')
		.setDescription('Prawdziwa cipa.'),
	async execute(interaction) {
		const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

		const cipaEmbed = new MessageEmbed()
			.setTitle('Ale cipa')
			.setImage('https://i.imgur.com/qs17Hey.jpg');
			// .setImage('https://i.imgur.com/97TNrHe.jpg');
		await interaction.deferReply();
		snooze(1000);
		await interaction.editReply({ embeds: [cipaEmbed] });
	},
};
