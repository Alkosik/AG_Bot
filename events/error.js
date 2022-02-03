const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');

module.exports = {
	name: 'error',
	execute(error, client) {
		let title;
		const testChannelId = '879456954232209508';
		console.log(chalk.red('ERROR'), `An error has been encountered: ${error}`);
		console.log(error);
		if (String(error.message).includes('Database')) {
			title = 'Database Error';
		} else { title = 'Error'; }
		const errEmbed = new MessageEmbed()
			.setTitle(title)
			.setDescription('```' + error + '```')
			.setColor('RED')
			.setFooter('Gang Słoni 2.0', 'https://i.imgur.com/JRl8WjV.png');
		client.channels.cache.get(testChannelId).send({ embeds: [errEmbed] });
	},
};