const chalk = require('chalk');
const config = require('../config.json');

module.exports = {
	name: 'messageReactionAdd',
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
				member.roles.add(guild.roles.cache.find(r => r.id === '943787009250586634'));
				console.log(chalk.green('EVENT'), `Added role rapper to ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'gs_keyboard') {
				member.roles.add(guild.roles.cache.find(r => r.id === '943787088610996244'));
				console.log(chalk.green('EVENT'), `Added role producer to ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'gs_microphone_notes') {
				member.roles.add(guild.roles.cache.find(r => r.id === '943839499425820782'));
				console.log(chalk.green('EVENT'), `Added role singer to ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'gs_level') {
				member.roles.add(guild.roles.cache.find(r => r.id === '943840586824286239'));
				console.log(chalk.green('EVENT'), `Added role engineer to ${user.username}#${user.discriminator}`);
			} else {
				reaction.remove(user);
			}
		} else if (reaction.message.channelId === '943621480095313930' && reaction.message.id === '943862977528995850') {
			const guild = client.guilds.cache.get(config.vstGuildId);
			const member = guild.members.cache.get(user.id);

			if (reaction.emoji.name === 'Ableton') {
				member.roles.add(guild.roles.cache.find(r => r.id === '943860812592869447'));
				console.log(chalk.green('EVENT'), `Added role Ableton to ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'FLStudio') {
				member.roles.add(guild.roles.cache.find(r => r.id === '943861083851092039'));
				console.log(chalk.green('EVENT'), `Added role FL Studio to ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'Cubase') {
				member.roles.add(guild.roles.cache.find(r => r.id === '943861188553490452'));
				console.log(chalk.green('EVENT'), `Added role Cubase to ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'Reaper') {
				member.roles.add(guild.roles.cache.find(r => r.id === '943861583459790858'));
				console.log(chalk.green('EVENT'), `Added role Reaper to ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'ProTools') {
				member.roles.add(guild.roles.cache.find(r => r.id === '943862202505527346'));
				console.log(chalk.green('EVENT'), `Added role Pro Tools to ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'Logic') {
				member.roles.add(guild.roles.cache.find(r => r.id === '1001570780599029883'));
				console.log(chalk.green('EVENT'), `Added role Logic Pro to ${user.username}#${user.discriminator}`);
			} else {
				reaction.remove(user);
			}
		} else if (reaction.message.channelId === '943621480095313930' && reaction.message.id === '945438888254668811') {
			const guild = client.guilds.cache.get(config.vstGuildId);
			const member = guild.members.cache.get(user.id);

			if (reaction.emoji.name === 'gs_bell') {
				member.roles.add(guild.roles.cache.find(r => r.id === '945438334983999488'));
				console.log(chalk.green('EVENT'), `Added role Updates to ${user.username}#${user.discriminator}`);
			} else if (reaction.emoji.name === 'gs_bell_i') {
				member.roles.add(guild.roles.cache.find(r => r.id === '945444182661685278'));
				console.log(chalk.green('EVENT'), `Added role Notifications to ${user.username}#${user.discriminator}`);
			} else {
				reaction.remove(user);
			}
		}
	},
};