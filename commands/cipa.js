const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cipa')
		.setDescription('Prawdziwa cipa.'),
	async execute(interaction) {
		const cipaEmbed = new MessageEmbed()
			.setTitle('Ale cipa')
			.setImage('https://i.imgur.com/qs17Hey.jpg');
		await interaction.reply({ embeds: [cipaEmbed] });
	},
};
