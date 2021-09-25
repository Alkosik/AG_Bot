// const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');
const config = require('../config.json');

const mysql = require('mysql');

const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});

connection.connect(function(err) {
	console.log(chalk.green('DB INFO'), 'Connecting to database...');
	if (err) throw err;
	console.log(chalk.green('DB INFO'), 'Database connection established');
});

module.exports = {
	name: 'guildMemberAdd',
	execute(member, client) {
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