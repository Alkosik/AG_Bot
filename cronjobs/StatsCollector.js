const cron = require('node-schedule');
const cronitor = require('cronitor')(process.env.API_CRONITOR);
const monitor = new cronitor.Monitor('Stats Collector');

module.exports = (config, client, chalk) => {
	cron.scheduleJob('0 0 * * *', function() {
		console.log(chalk.green('CRON INFO'), 'Initiated collection of stats');
		monitor.ping({ message: 'Stats Collected' });
		client.channels.cache.get(config.testChannelId).send('<@430140838345965595>, haha u dumb twat. Initated Stats Collection');
	});
};