// const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');

module.exports = {
	name: 'guildMemberRemove',
	execute(member, client) {
		console.log(chalk.green('INFO'), 'A member has left the server.');

		const guild = client.guilds.cache.get('510941195267080214');
		const memberCountChannel = client.channels.cache.get('726734001347231784');
		const memCount = guild.memberCount;
		memberCountChannel.setName(`Ludzie: ${memCount} 👤`);

		const channel = member.guild.channels.cache.find(ch => ch.id === '511224486545326100');
		if (!channel) return;

		channel.send(`**${member.displayName}** opuścił serwer, albo został wyrzucony ;(`);
	},
};