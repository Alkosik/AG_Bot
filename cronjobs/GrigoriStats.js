const cron = require('node-schedule');

const { RiotAPI, PlatformId } = require('@fightmegg/riot-api');
const { MessageEmbed } = require('discord.js');
const _ = require('lodash');

module.exports = (config, client, chalk) => {
	const channelId = config.mainChannelId;
	cron.scheduleJob('0 0 * * *', function() {
		(async () => {
			console.log(chalk.green('CRON INFO'), 'Initiating Grigori\'s Stats.');

			const rAPI = new RiotAPI(process.env.API_RIOT);

			const summoner = await rAPI.summoner.getBySummonerName({
				region: PlatformId.EUW1,
				summonerName: 'Gredzy',
			});

			const match = await rAPI.match.getMatchlistByAccount({
				region: PlatformId.EUW1,
				accountId: summoner.accountId,
			});

			const ranked = await rAPI.league.getEntriesBySummonerId({
				region: PlatformId.EUW1,
				summonerId: summoner.id,
			});

			const filtered = _.filter(ranked, { queueType: 'RANKED_SOLO_5x5' });
			const currentRank = `${filtered[0].tier} ${filtered[0].rank} ${filtered[0].leaguePoints}LP`;

			const winratio = filtered[0].wins / (filtered[0].wins + filtered[0].losses);
			const roundedWr = Math.round((winratio + Number.EPSILON) * 100) / 100 * 100;

			const iconLink = `http://ddragon.leagueoflegends.com/cdn/11.18.1/img/profileicon/${summoner.profileIconId}.png`;

			const statsEmbed = new MessageEmbed()
				.setAuthor('Staty Grzegorza na dziś')
				.setColor('#ffffff')
				.setThumbnail(iconLink)
				.setFooter('Gang Słoni 2.0', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.addFields(
					{ name: 'Poziom', value: summoner.summonerLevel.toLocaleString(), inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'Gry w sezonie', value: match.totalGames.toLocaleString(), inline: true },
					{ name: 'Ranga', value: currentRank, inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'Winratio', value: roundedWr.toLocaleString() + '%', inline: true },
				);

			client.channels.cache.get(channelId).send({ embeds: [statsEmbed] });
		})();
	});
};