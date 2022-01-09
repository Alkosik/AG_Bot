const cron = require('node-schedule');
const cronitor = require('cronitor')(process.env.API_CRONITOR);
const monitor = new cronitor.Monitor('Albert Reminder', '3 3 * * *');

module.exports = (config, client, chalk) => {
	const main_channel_id = config.mainChannelId;
	cron.scheduleJob('3 3 * * *', function() {
		(async () => {
			console.log(chalk.green('CRON INFO'), 'Initiating Albert\'s Reminder.');
			const janus = client.emojis.cache.find(emoji => emoji.name === 'JanusChamp');
			const pepo_love = client.emojis.cache.find(emoji => emoji.name === 'peepoLove');

			const mood = Math.random() * (20 - 1) + 1;
			const moodFloored = Math.floor(mood);

			if (moodFloored >= 10) {
				client.channels.cache.get(main_channel_id).send(`<@430140838345965595>, kocham cie ${pepo_love}`);
			} else if (moodFloored < 4) {
				client.channels.cache.get(main_channel_id).send(`<@430140838345965595>, kocham cie ${pepo_love} ~ Kacperek`);
			} else {
				client.channels.cache.get(main_channel_id).send(`<@430140838345965595>, nienawidze cie ${janus}`);
			}
			console.log(chalk.green('CRON INFO'), 'Albert\'s Reminder finished successfully.');
		})();
	});
	monitor.ping({ message: 'Reminder message sent' });
};