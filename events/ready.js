const chalk = require('chalk');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(chalk.greenBright('INFO'), 'Connected to Discord as ' + client.user.tag);
	},
};