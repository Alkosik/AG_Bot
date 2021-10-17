const { SlashCommandBuilder } = require('@discordjs/builders');
const { RiotAPI, PlatformId } = require('@fightmegg/riot-api');
const { MessageEmbed } = require('discord.js');
const _ = require('lodash');

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
		await interaction.deferReply();

		const nick = interaction.options.getString('nick');
		const regionChoice = interaction.options.getString('region');
		let region;
		console.log(regionChoice);

		if (regionChoice == 'EUNE1') {
			region = PlatformId.EUNE1;
		} else if (regionChoice == 'EUW1') {
			region = PlatformId.EUW1;
		} else if (regionChoice == 'NA1') {
			region = PlatformId.NA1;
		}

		const rAPI = new RiotAPI(process.env.API_RIOT);

		const summoner = await rAPI.summoner.getBySummonerName({
			region: region,
			summonerName: nick,
		});

		const match = await rAPI.match.getMatchlistByAccount({
			region: region,
			accountId: summoner.accountId,
		});

		const ranked = await rAPI.league.getEntriesBySummonerId({
			region: region,
			summonerId: summoner.id,
		});

		const filtered = _.filter(ranked, { queueType: 'RANKED_SOLO_5x5' });
		const currentRank = `${filtered[0].tier} ${filtered[0].rank} ${filtered[0].leaguePoints}LP`;

		const winratio = filtered[0].wins / (filtered[0].wins + filtered[0].losses);
		const roundedWr = Math.round((winratio + Number.EPSILON) * 100) / 100 * 100;

		console.log('WR:' + roundedWr);

		const iconLink = `http://ddragon.leagueoflegends.com/cdn/10.18.1/img/profileicon/${summoner.profileIconId}.png`;

		const statsEmbed = new MessageEmbed()
			.setAuthor(summoner.name)
			.setColor('#ff0099')
			.setThumbnail(iconLink)
			.setFooter(`Region: ${regionChoice}`)
			.addFields(
				{ name: 'Poziom', value: summoner.summonerLevel.toLocaleString(), inline: true },
				{ name: '\u200B', value: '\u200B', inline: true },
				{ name: 'Gry w sezonie', value: match.totalGames.toLocaleString(), inline: true },
				{ name: 'Ranga', value: currentRank, inline: true },
				{ name: '\u200B', value: '\u200B', inline: true },
				{ name: 'Winratio', value: roundedWr.toLocaleString() + '%', inline: true },
			);

		await interaction.editReply({ embeds: [statsEmbed] });
	},
};
