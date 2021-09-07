// const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');

module.exports = {
	name: 'guildMemberAdd',
	execute(member, client) {
		console.log(chalk.green('INFO'), 'A new member has joined the server.');

		const guild = client.guilds.cache.get('510941195267080214');
		const memberCountChannel = client.channels.cache.get('726734001347231784');
		const memCount = guild.memberCount;
		memberCountChannel.setName(`Ludzie: ${memCount} 👤`);
	},
};