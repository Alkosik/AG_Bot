const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { getLyrics, getSong } = require('genius-lyrics-api');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lyrics')
		.setDescription('Gets the lyrics of a song.')
		.addStringOption(option =>
			option.setName('piosenka')
				.setDescription('Piosenka, ktorej chcesz zobaczyc tekst.')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		const songName = interaction.options.getString('piosenka');

		const options = {
			apiKey: process.env.GENIUS_API,
			title: songName,
			artist: 'Ariana Grande',
			optimizeQuery: true,
		};

		getSong(options).then((song) => {
			const lyricsEmbed = new MessageEmbed()
				.setAuthor(String(song.title))
				.setThumbnail(song.albumArt)
				.setDescription(String(song.lyrics))
				.setColor('#B612E8');

			interaction.editReply({ embeds: [lyricsEmbed] });
		});
	},
};
