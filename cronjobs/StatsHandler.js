const cron = require('node-schedule');
const cronitor = require('cronitor')(process.env.API_CRONITOR);
const monitor = new cronitor.Monitor('Stats Collector');

const mysql = require('mysql');
const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});

module.exports = (config, client, chalk) => {
	cron.scheduleJob('0 0 * * *', function() {
		console.log(chalk.green('CRON INFO'), 'Initiated collection of stats');
		monitor.ping({ message: 'Stats Collected' });
		client.channels.cache.get(config.testChannelId).send('<@430140838345965595>, haha u dumb twat. Initated STATS Procedure');
		// Reset messages count
		connection.query('SELECT * FROM stats', function(err) {
			if (err) {
				client.channels.cache.get(config.testChannelId).send('**A database error detected**');
				throw err;
			}
			connection.query('UPDATE stats SET messages = 0', function(err) {
				if (err) throw err;
			});
		});

		client.channels.cache.get(config.testChannelId).send('STATS Procedure finished **successfully**');
	});
};