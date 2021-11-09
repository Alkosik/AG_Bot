const cron = require('node-schedule');
const cronitor = require('cronitor')(process.env.API_CRONITOR);
const monitor = new cronitor.Monitor('Stats Collector');
const { MessageEmbed } = require('discord.js');

const mysql = require('mysql');
const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});

module.exports = (config, client, chalk) => {
	cron.scheduleJob('0 0 * * *', async function() {
		console.log(chalk.green('CRON INFO'), 'Initiated Stats Collection and Cleanup');
		client.channels.cache.get(config.testChannelId).send('Initated Stats Collection and Cleanup');

		const date = new Date();
		const formattedDate = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();

		const guild = client.guilds.cache.get('510941195267080214');

		let messages;

		console.log(chalk.green('STATS CRON INFO'), `Reseting msgCount, Saving date: ${formattedDate}, memCount: ${guild.memberCount}`);

		connection.query('SELECT * FROM stats', function(err, rows) {

			messages = rows[0].messages;

			if (err) {
				client.channels.cache.get(config.testChannelId).send('**A database error detected**');
				throw err;
			}
			connection.query(`UPDATE stats SET date = '${formattedDate}', members = ${guild.memberCount}, messages = 0, vc_participation = 0`, function(err) {
				if (err) throw err;
			});

			const statsEmbed = new MessageEmbed()
				.setAuthor('Overview')
				.setColor('#ffffff')
				.setFooter('Gang Słoni 2.0', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.addFields(
					{ name: 'Message Count', value: `${messages} -> (0)`, inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'Members', value: `${guild.memberCount}`, inline: true },
					{ name: 'Date', value: `${formattedDate}`, inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'VC Part', value: 'NULL', inline: true },
				// { name: 'Winratio', value: roundedWr.toLocaleString() + '%', inline: true },
				);

			client.channels.cache.get(config.testChannelId).send('Stats Collection and Cleanup tasks finished **successfully**');
			client.channels.cache.get(config.testChannelId).send({ embeds: [statsEmbed] });
		});
		monitor.ping({ message: 'Stats Collected' });
	});
};