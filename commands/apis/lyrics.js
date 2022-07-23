const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const Genius = require('genius-lyrics');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const GeniusClient = new Genius.Client(process.env.API_GENIUS);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lyrics')
		.setDescription('Gets the lyrics of a song. (Genius)')
		.addStringOption(option =>
			option.setName('song')
				.setDescription('Name of the song')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();
		const songName = interaction.options.getString('song');

		const searches = await GeniusClient.songs.search(songName);
		const song = searches[0];
		const lyrics = await song.lyrics();

		const lyricsEmbed = new EmbedBuilder()
			.setAuthor({ name: `${song.artist.name}`, iconURL: song.artist.thumbnail, url: song.artist.url })
			.setTitle(song.title)
			.setURL(song.url)
			.setThumbnail(song.thumbnail)
			.setDescription(lyrics)
			.setColor('#B612E8')
			.setFooter({ text: 'Gang Słoni', iconURL: 'https://i.imgur.com/JRl8WjV.png' });

		interaction.editReply({ embeds: [lyricsEmbed] });
	},
};
