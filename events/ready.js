const chalk = require('chalk');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(chalk.greenBright('INIT INFO'), 'Connected to Discord as ' + client.user.tag);

		client.user.setPresence({ activities: [{ name: '34+35', type: 'COMPETING' }], status: 'online' });
		console.log(chalk.greenBright('INIT INFO'), `Activity set to: ${client.user.presence.activities[0].name}`);
	},
};