const chalk = require('chalk');
const config = require('../config.json');

module.exports = {
	name: 'messageReactionRemove',
	async execute(reaction, user, client) {
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (error) {
				console.error(chalk.redBright('EVENT ERROR'), 'Something went wrong when fetching the message:', error);
				return;
			}
		}


		if (reaction.message.channelId === '943621480095313930' && reaction.message.id === '943626841724452884') {
			const guild = client.guilds.cache.get(config.vstGuildId);
			const member = guild.members.cache.get(user.id);

			if (reaction.emoji.name === 'gs_microphone') {
				member.roles.remove(guild.roles.cache.find(r => r.id === '943787009250586634'));
				console.log(chalk.green('EVENT'), `Removed role rapper from ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'gs_keyboard') {
				member.roles.remove(guild.roles.cache.find(r => r.id === '943787088610996244'));
				console.log(chalk.green('EVENT'), `Removed role producer from ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'gs_microphone_notes') {
				member.roles.remove(guild.roles.cache.find(r => r.id === '943839499425820782'));
				console.log(chalk.green('EVENT'), `Removed role singer from ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'gs_level') {
				member.roles.remove(guild.roles.cache.find(r => r.id === '943840586824286239'));
				console.log(chalk.green('EVENT'), `Removed role engineer from ${user.username}#${user.discriminator}`);
			}
		}
	},
};