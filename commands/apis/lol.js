const { SlashCommandBuilder } = require('@discordjs/builders');
const { RiotAPI, RiotAPITypes, PlatformId } = require('@fightmegg/riot-api');
const wait = require('util').promisify(setTimeout);

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lol')
		.setDescription('Riot API.')
		.addStringOption(option =>
			option.setName('nick')
				.setDescription('Nick sprawdzanej osoby')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('region')
				.setDescription('Region')
				.setRequired(true)
				.addChoice('EUNE', 'EUNE1')
				.addChoice('EUW', 'EUW1')
				.addChoice('NA', 'NA1')),
	async execute(interaction) {
		const nick = interaction.options.getString('nick');
		// const regionChoice = interaction.options.getString('region');

		const rAPI = new RiotAPI('RGAPI-21dc7bae-f291-4823-ac1d-7a4d58f01a56');

		const summoner = await rAPI.summoner.getBySummonerName({
			region: PlatformId.EUNE1,
			summonerName: nick,
		});

		const something = await rAPI.match.getMatchlistByAccount({
			region: PlatformId.EUNE1,
			accountId: summoner.accountId,
		});

		// console.log(something);

		await interaction.reply(`Nick: ${summoner.name}, Poziom: ${summoner.summonerLevel}, Gry w sezonie: ${something.totalGames}`);
	},
};
