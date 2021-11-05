const cron = require('node-schedule');

const { RiotAPI, RiotAPITypes, PlatformId } = require('@fightmegg/riot-api');
const { MessageEmbed } = require('discord.js');
const _ = require('lodash');

const Rconfig = RiotAPITypes.Config = {
	debug: false,
};

module.exports = (config, client, chalk) => {
	const channelId = config.mainChannelId;
	cron.scheduleJob('0 0 * * *', function() {
		(async () => {
			console.log(chalk.green('CRON INFO'), 'Initiating Grigori\'s Stats.');

			const rAPI = new RiotAPI(process.env.API_RIOT, Rconfig);

			const summoner = await rAPI.summoner.getBySummonerName({
				region: PlatformId.EUW1,
				summonerName: 'Gredzy',
			});
			// console.log(summoner);

			// const match = await rAPI.matchV5.getIdsbyPuuid({
			// 	cluster: PlatformId.EUROPE,
			// 	puuid: summoner.puuid,
			// });
			// console.log(match);

			const ranked = await rAPI.league.getEntriesBySummonerId({
				region: PlatformId.EUW1,
				summonerId: summoner.id,
			});
			// console.log(ranked);

			const filtered = _.filter(ranked, { queueType: 'RANKED_SOLO_5x5' });
			const currentRank = `${filtered[0].tier} ${filtered[0].rank} ${filtered[0].leaguePoints}LP`;

			const gameCount = filtered[0].wins + filtered[0].losses;

			const winratio = filtered[0].wins / (filtered[0].wins + filtered[0].losses);
			const roundedWr = Math.round((winratio + Number.EPSILON) * 100) / 100 * 100;

			const iconLink = `http://ddragon.leagueoflegends.com/cdn/11.22.1/img/profileicon/${summoner.profileIconId}.png`;

			console.log(iconLink);
			const statsEmbed = new MessageEmbed()
				.setAuthor('Staty Grzegorza na dziś')
				.setColor('#ffffff')
				.setThumbnail(iconLink)
				.setFooter('Gang Słoni 2.0', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.addFields(
					{ name: 'Poziom', value: summoner.summonerLevel.toLocaleString(), inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'Gry w sezonie', value: gameCount.toLocaleString(), inline: true },
					{ name: 'Ranga', value: currentRank, inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'Winratio', value: roundedWr.toLocaleString() + '%', inline: true },
				);

			client.channels.cache.get(channelId).send({ embeds: [statsEmbed] });
		})();
	});
};