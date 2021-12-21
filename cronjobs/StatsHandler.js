const cron = require('node-schedule');
const cronitor = require('cronitor')(process.env.API_CRONITOR);
const monitor = new cronitor.Monitor('Stats Collector');
const { MessageEmbed } = require('discord.js');
const wait = require('util').promisify(setTimeout);

module.exports = (config, client, chalk, connection) => {
	async function takePerms() {
		console.log(chalk.green('CRON INFO'), 'Role cd initiated');
		const guild = client.guilds.cache.get('510941195267080214');
		const member = guild.members.cache.get('430140838345965595');
		const role = guild.roles.cache.get('511228419951034388');
		await member.roles.remove(role);
		console.log(chalk.green('CRON INFO'), 'Role taken');
		wait(15000);
		await member.roles.add(role);
		console.log(chalk.green('CRON INFO'), 'Role given back');
	}

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
			connection.query(`INSERT INTO stats (date, members, messages, vc_participation) VALUES ('${formattedDate}', ${guild.memberCount}, 0, 0)`, function(err) {
				if (err) throw err;
			});
			// Remove entries older than a month
			connection.query('DELETE FROM stats WHERE date < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)', function(err) {
				if (err) throw err;
			});

			const statsEmbed = new MessageEmbed()
				.setAuthor('Overview')
				.setColor('#ffffff')
				.setFooter('Gang Słoni 2.0', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.addFields(
					{ name: 'Message Count', value: `${messages}`, inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'Members', value: `${guild.memberCount}`, inline: true },
					{ name: 'Date', value: `${formattedDate}`, inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
					{ name: 'VC Part', value: 'NULL', inline: true },
				// { name: 'Winratio', value: roundedWr.toLocaleString() + '%', inline: true },
				);

			client.channels.cache.get(config.testChannelId).send('Stats Collection and Cleanup tasks finished **successfully**');
			client.channels.cache.get(config.testChannelId).send({ embeds: [statsEmbed] });
			console.log(chalk.green('CRON INFO'), 'Stats Collection and Cleanup finished successfully.');
		});
		monitor.ping({ message: 'Stats Collected' });
		takePerms();
	});
};