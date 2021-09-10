const cron = require('node-schedule');

module.exports = (config, client, chalk) => {
	const main_channel_id = config.mainChannelId;
	cron.scheduleJob('1 1 * * *', function() {
		(async () => {
			console.log(chalk.green('CRON INFO'), 'Initiating Albert\'s Reminder.');
			const janus = client.emojis.cache.find(emoji => emoji.name === 'JanusChamp');
			const pepo_love = client.emojis.cache.find(emoji => emoji.name === 'PepoLove');

			const mood = Math.random() * (20 - 1) + 1;
			const moodFloored = Math.floor(mood);
			if (moodFloored >= 10) {
				client.channels.cache.get(main_channel_id).send(`<@430140838345965595>, kocham cie ${pepo_love}`);
			} else if (moodFloored < 3) {
				client.channels.cache.get(main_channel_id).send(`<@430140838345965595>, kocham cie ${pepo_love} ~ Kacperek`);
			} else {
				client.channels.cache.get(main_channel_id).send(`<@430140838345965595>, nienawidze cie ${janus}`);

			}
		})();
	});
};