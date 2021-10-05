const cron = require('node-schedule');
const cronitor = require('cronitor')(process.env.API_CRONITOR);
const monitor = new cronitor.Monitor('Discord Heartbeat');

module.exports = (config, client, chalk) => {
	cron.scheduleJob('* * * * *', function() {
		console.log(chalk.green('CRON INFO'), 'Sending Heartbeat...');
		monitor.ping({ message: 'Alive' });
		monitor.ok({ message: 'Status: OK' });
	});
};