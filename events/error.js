const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');

module.exports = {
	name: 'error',
	execute(error, client, connection) {
		let title;
		const testChannelId = '879456954232209508';
		console.log(chalk.red('ERROR'), `An error has been encountered: ${error}`);
		console.log(error);
		if (String(error.message).includes('Database')) {
			title = 'Database Error';
		} else if (String(error.message).includes('Cannot enqueue Query after fatal error')) {
			title = 'Fatal error detected... Reconnection attempt in progress';
			reconnect();
		} else { title = 'Error'; }
		const errEmbed = new MessageEmbed()
			.setTitle(title)
			.setDescription('```' + error + '```')
			.setColor('RED')
			.setFooter('Gang Słoni 2.0', 'https://i.imgur.com/JRl8WjV.png');
		client.channels.cache.get(testChannelId).send({ embeds: [errEmbed] });

		function reconnect() {
			connection.createConnection({
				host: process.env.DB_HOST,
				user: process.env.DB_USER,
				password: process.env.DB_PASS,
				database: 'www5056_gsmaindb',
			}).then(() => {
				client.channels.cache.get(testChannelId).send('**Database connection reestablished**');
			});
		}
	},
};
