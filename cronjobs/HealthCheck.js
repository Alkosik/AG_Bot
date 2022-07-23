const cron = require('node-schedule');

const { EmbedBuilder } = require('discord.js');

const errorCount = 0;

let title;

module.exports = (config, client, chalk) => {
	const channelId = config.testChannelId;
	cron.scheduleJob('0 0 * * *', function() {
		(async () => {
			console.log(chalk.green('CRON INFO'), 'Initiating Health Check.');

			if (errorCount > 0) {
				title = 'Functional';
			} else {
				title = 'Needs attention';
			}

			const statusEmbed = new EmbedBuilder()
				.setAuthor('Runtime Health Check')
				.setTitle(title)
				.setColor('#00e031')
				.setFooter('Gang Słoni 2.0', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.addFields(
					{ name: 'Errors', value: errorCount, inline: true },
				);

			client.channels.cache.get(channelId).send({ embeds: [statusEmbed] });
			console.log(chalk.green('CRON INFO'), 'Health Check finished successfully.');
		})();
	});
};