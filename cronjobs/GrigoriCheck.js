const cron = require('node-schedule');

const { RiotAPI, PlatformId } = require('@fightmegg/riot-api');
const { MessageEmbed } = require('discord.js');
const _ = require('lodash');

let oldGameId;

module.exports = (config, client, chalk) => {
	const channelId = config.mainChannelId;
	let spectatorError;
	cron.scheduleJob('*/3 * * * *', function() {
		(async () => {
			console.log(chalk.green('CRON INFO'), 'Initiating Grigori Check.');

			const rAPI = new RiotAPI(process.env.API_RIOT);

			const summoner = await rAPI.summoner.getBySummonerName({
				region: PlatformId.EUW1,
				summonerName: 'JhinNoArms',
			});

			const spectator = await rAPI.spectator.getBySummonerId({
				region: PlatformId.EUW1,
				summonerId: summoner.id,
			}).catch((err) => {
				spectatorError = err;
			});

			if (spectatorError.status) {
				return console.log(chalk.green('CRON INFO'), 'Grigori is not currently playing.');
			}

			const ranked = await rAPI.league.getEntriesBySummonerId({
				region: PlatformId.EUW1,
				summonerId: summoner.id,
			});

			const filtered = _.filter(ranked, { queueType: 'RANKED_SOLO_5x5' });
			const currentRank = `${filtered[0].tier} ${filtered[0].rank} ${filtered[0].leaguePoints}LP`;

			const winratio = filtered[0].wins / (filtered[0].wins + filtered[0].losses);
			const roundedWr = Math.round((winratio + Number.EPSILON) * 100) / 100 * 100;

			const iconLink = `http://ddragon.leagueoflegends.com/cdn/11.18.1/img/profileicon/${summoner.profileIconId}.png`;

			const players = spectator.participants;
			const filteredPlayers = _.filter(players, { summonerId: summoner.id });

			if (spectator.gameId == oldGameId) {
				return console.log(chalk.green('CRON INFO'), 'Grigori is still playing the same game.');
			}

			const statsEmbed = new MessageEmbed()
				.setAuthor('GRZEGORZ ZACZAL NOWA GRE')
				.setColor('#ffffff')
				.setThumbnail(iconLink)
				.setFooter('Gang Słoni 2.0', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.addFields(
					{ name: 'Postac', value: filteredPlayers.championId.toLocaleString(), inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'Ranga', value: currentRank, inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'Winratio', value: roundedWr.toLocaleString() + '%', inline: true },
				);

			client.channels.cache.get(channelId).send({ embeds: [statsEmbed] });
		})();
	});
};