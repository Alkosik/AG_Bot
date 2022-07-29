const { EmbedBuilder } = require('discord.js');
const chalk = require('chalk');

const { handleDisconnect } = require('../index.js');

module.exports = {
	name: 'error',
	execute(error, client) {
		let title;
		const testChannelId = '879456954232209508';
		console.log(chalk.red('ERROR'), `An error has been encountered: ${error}`);
		console.log(error);
		if (String(error.message).includes('Database')) {
			title = 'Database Error';
		} else if (String(error.message).includes('Cannot enqueue Query after fatal error')) {
			title = 'Fatal error detected... Reconnection attempt in progress';
			handleDisconnect;
		} else { title = 'Error'; }
		const errEmbed = new EmbedBuilder()
			.setTitle(title)
			.setDescription('```' + error + '```')
			.setColor('#ff0000')
			.setFooter({ text: 'Gang Słoni', iconURL: 'https://i.imgur.com/JRl8WjV.png' });
		client.channels.cache.get(testChannelId).send({ embeds: [errEmbed] });
	},
};
