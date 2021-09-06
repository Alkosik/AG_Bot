const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');

module.exports = {
	name: 'client',
	execute(client, error) {
		const testChannelId = '879456954232209508';
		console.log(chalk.red('ERROR'), `An error has been encountered: ${error}`);
		const errEmbed = new MessageEmbed()
			.setTitle('Error')
			.setDescription(error)
			.setColor('RED');
		client.channels.cache.get(testChannelId).send({ embeds: [errEmbed] });
	},
};