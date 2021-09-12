const { SlashCommandBuilder } = require('@discordjs/builders');
const { DDragon, Pyke } = require('pyke');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lol')
		.setDescription('Riot API.')
		.addStringOption(option =>
			option.setName('nick')
				.setDescription('Nick sprawdzanej osoby (EUNE)')
				.setRequired(true)),
	async execute(interaction) {
		const nick = interaction.options.getString('nick');
		const pyke = new Pyke(process.env.RIOT_API, 10);

		const reldata = pyke.summoner.getBySummonerName(nick, 'eune').then(data => {
			console.log(data);
		}).catch(console.error);
		await interaction.reply(`Nick: ${reldata.name}, Poziom: ${reldata.summonerLevel}`);
	},
};
