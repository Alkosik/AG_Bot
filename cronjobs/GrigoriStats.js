const cron = require('node-schedule');

const { RiotAPI, RiotAPITypes, PlatformId } = require('@fightmegg/riot-api');
const { MessageEmbed } = require('discord.js');
const _ = require('lodash');

const Rconfig = RiotAPITypes.Config = {
	debug: false,
};

function romanToArabic(roman) {
	if (roman == null) {return -1;}
	let totalValue = 0,
		value = 0,
		prev = 0;

	for (let i = 0;i < roman.length;i++) {
		const current = char_to_int(roman.charAt(i));
		if (current > prev) {
			// Undo the addition that was done, turn it into subtraction
			totalValue -= 2 * value;
		}
		if (current !== prev) {
			value = 0;
		}
		value += current;
		totalValue += current;
		prev = current;
	}
	return totalValue;
}

function char_to_int(character) {
	switch (character) {
	case 'I': return 1;
	case 'V': return 5;
	case 'X': return 10;
	case 'L': return 50;
	case 'C': return 100;
	case 'D': return 500;
	case 'M': return 1000;
	default: return -1;
	}
}

module.exports = (config, client, chalk, connection) => {
	const channelId = config.mainChannelId;
	cron.scheduleJob('0 0 * * *', function() {
		(async () => {
			console.log(chalk.green('CRON INFO'), 'Initiating Grigori\'s Stats.');

			// const date = new Date();
			// const formattedDate = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();

			const rAPI = new RiotAPI(process.env.API_RIOT, Rconfig);

			const summoner = await rAPI.summoner.getBySummonerName({
				region: PlatformId.EUW1,
				summonerName: 'Gredzy',
			});

			const ranked = await rAPI.league.getEntriesBySummonerId({
				region: PlatformId.EUW1,
				summonerId: summoner.id,
			});

			const filtered = _.filter(ranked, { queueType: 'RANKED_SOLO_5x5' });
			const currentTier = filtered[0].tier;
			const currentRank = filtered[0].rank;
			const currentLP = filtered[0].leaguePoints;

			const gameCount = filtered[0].wins + filtered[0].losses;

			const winratio = filtered[0].wins / (filtered[0].wins + filtered[0].losses);
			const roundedWr = Math.round((winratio + Number.EPSILON) * 100) / 100 * 100;

			const iconLink = `http://ddragon.leagueoflegends.com/cdn/11.22.1/img/profileicon/${summoner.profileIconId}.png`;

			connection.query('SELECT * FROM stats', function(err, rows) {
				if (err) throw err;
				const oldGameCount = rows[0].gredzy_gamecount;

				console.log(iconLink);
				const statsEmbed = new MessageEmbed()
					.setAuthor('Staty Grzegorza na dziś')
					.setColor('#ffffff')
					.setThumbnail(iconLink)
					.setFooter('Gang Słoni 2.0', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
					.addFields(
						{ name: 'Poziom', value: summoner.summonerLevel.toLocaleString(), inline: true },
						{ name: '\u200B', value: '\u200B', inline: true },
						{ name: 'Gry w sezonie/dzis', value: `${gameCount.toLocaleString()} / ${gameCount - oldGameCount}`, inline: true },
						{ name: 'Ranga', value: `${currentTier} ${currentRank} ${currentLP}LP`, inline: true },
						{ name: '\u200B', value: '\u200B', inline: true },
						{ name: 'Winratio', value: roundedWr.toLocaleString() + '%', inline: true },
					);

				client.channels.cache.get(channelId).send({ embeds: [statsEmbed] });
				//  WHERE date = ${formattedDate}
				connection.query(`UPDATE stats SET gredzy_tier = '${currentTier}', gredzy_rank = ${romanToArabic(currentRank)}, gredzy_lp = ${currentLP}, gredzy_gamecount = ${gameCount}`, function(err) {
					if (err) throw err;
				});
				console.log(chalk.green('CRON INFO'), 'Grigori\'s stats finished successfully.');
			});
		})();
	});
};