const { EmbedBuilder } = require('discord.js');
const chalk = require('chalk');

module.exports = {
	name: 'shardError',
	execute(error, client) {
		const testChannelId = '879456954232209508';
		console.log(chalk.red('SHARD ERROR'), `A shard error has been encountered: ${error}`);
		const errEmbed = new EmbedBuilder()
			.setTitle('Shard Error Detected')
			.setColor('RED');
		client.channels.cache.get(testChannelId).send({ embeds: [errEmbed] });
	},
};