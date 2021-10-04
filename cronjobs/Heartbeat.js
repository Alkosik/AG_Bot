const cron = require('node-schedule');

module.exports = (config, client, chalk) => {
	// const main_channel_id = config.mainChannelId;
	cron.scheduleJob('1 1 * * *', function() {
		// test
	});
};