const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');

module.exports = {
	name: 'shardError',
	execute(client, error) {
		const testChannelId = '879456954232209508';
		console.log(chalk.red('SHARD ERROR'), `A shard error has been encountered: ${error}`);
		const errEmbed = new MessageEmbed()
			.setTitle('Shard Error Detected')
			.setColor('RED');
		client.channels.cache.get(testChannelId).send({ embeds: [errEmbed] });
	},
};