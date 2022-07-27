const cron = require('node-schedule');
const cronitor = require('cronitor')(process.env.API_CRONITOR);
const monitor = new cronitor.Monitor('Discord Heartbeat');

module.exports = (config, client, chalk) => {
	console.log(chalk.green('CRON INFO'), 'Heartbeat monitor starting');
	cron.scheduleJob('* * * * *', function() {
		monitor.ping({ message: 'Alive' });
	});
};