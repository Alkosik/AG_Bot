// const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');
const config = require('../config.json');

module.exports = {
	name: 'guildMemberAdd',
	execute(member, client, connection) {
		console.log(chalk.green('INFO'), 'A new member has joined the server.');

		const guild = client.guilds.cache.get('510941195267080214');
		const memberCountChannel = client.channels.cache.get('726734001347231784');
		const memCount = guild.memberCount;
		memberCountChannel.setName(`Ludzie: ${memCount} 👤`);

		connection.query(`SELECT * FROM account WHERE id = ${member.user.id}`, function(err, rows) {
			if (err) throw err;

			// Ganja role
			if (rows[0].ganja == 1) {
				member.roles.add(member.guild.roles.cache.find(r => r.id === '817530671609544706'));
			}

			// Moderation roles
			if (rows[0].moderation > 0) {
				// Mod
				if (rows[0].moderation == 1) member.roles.add(member.guild.roles.cache.find(r => r.id === '888419873439510578'));
				// Admin
				if (rows[0].moderation == 2) member.roles.add(member.guild.roles.cache.find(r => r.id === '888419344432922644'));
			}

			// Muted role
			if (rows[0].muted == 1) {
				member.roles.add(member.guild.roles.cache.find(r => r.id === '513774056198242305'));
			}

			// Level Roles
			if (rows[0].level >= 100) {
				const role = member.guild.roles.cache.find(r => r.id === config.level6RoleId);
				member.roles.add(role);
			} else if (rows[0].level >= 50) {
				const role = member.guild.roles.cache.find(r => r.id === config.level5RoleId);
				member.roles.add(role);
			} else if (rows[0].level >= 30) {
				const role = member.guild.roles.cache.find(r => r.id === config.level4RoleId);
				member.roles.add(role);
			} else if (rows[0].level >= 15) {
				const role = member.guild.roles.cache.find(r => r.id === config.level3RoleId);
				member.roles.add(role);
			} else if (rows[0].level >= 5) {
				const role = member.guild.roles.cache.find(r => r.id === config.level2RoleId);
				member.roles.add(role);
			} else if (rows[0].level >= 1) {
				const role = member.guild.roles.cache.find(r => r.id === config.level1RoleId);
				member.roles.add(role);
			}
		});
	},
};