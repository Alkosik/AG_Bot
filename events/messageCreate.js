const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');
const config = require('../config.json');
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

const talkedRecently = new Set();


const date = new Date();
const formattedDate = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();

module.exports = {
	name: 'messageCreate',
	execute(message, client, connection) {
		connection.query(`SELECT * FROM stats WHERE date = '${formattedDate}'`, function(err, rows) {
			if (err) {
				client.channels.cache.get(config.testChannelId).send('**A database error detected**');
				throw err;
			}

			const msgCount = rows[0].messages;
			// const sqlQuery = `UPDATE stats SET messages = ${msgCount++}`;
			connection.query(`UPDATE stats SET messages = ${msgCount + 1} WHERE date = '${formattedDate}'`, function(err) {
				if (err) throw err;
			});
		});

		function generateXp() {
			return Math.floor(Math.random() * (10 - 5 + 1)) + 5;
		}

		if (!message.author.bot && !talkedRecently.has(message.author.id)) {

			connection.query(`SELECT * FROM account WHERE id = ${message.author.id}`, function(err, rows) {
				if (err) {
					client.channels.cache.get(config.testChannelId).send('**A database error detected**');
					throw err;
				}

				let sqlQuery;
				let originalXp;
				let updatedXp;

				const escapedUsername = connection.escape(message.author.username);
				let escapedNickname = connection.escape(message.member.nickname);
				const escapedAvatarURL = connection.escape(message.author.displayAvatarURL({ dynamic: true }));

				if (escapedNickname == null) {
					escapedNickname = escapedUsername;
				}

				// New user
				if (rows.length < 1) {
					updatedXp = generateXp();
					console.log(chalk.green('DB INFO'), `Registering new user: ${message.author.username} - ${message.author.id}`);
					sqlQuery = `INSERT INTO account (username, nickname, id, xp, avatarURL) VALUES (${escapedUsername}, ${escapedNickname}, ${message.author.id}, ${updatedXp}, ${escapedAvatarURL})`;
				} else {
					originalXp = rows[0].xp;
					updatedXp = originalXp + generateXp();
					sqlQuery = `UPDATE account SET xp = ${updatedXp}, username = ${escapedUsername}, nickname = ${escapedNickname}, avatarURL = ${escapedAvatarURL} WHERE id = '${message.author.id}'`;

					// Leveling up

					const nextLvl = rows[0].level * 1000;

					if (nextLvl <= rows[0].xp) {
						connection.query(`UPDATE account SET level = ${rows[0].level + 1} WHERE id = '${message.author.id}'`);

						// Level up message
						(async () => {
							const lvlup = new MessageEmbed()
								.setFooter('Gang Słoni 2.0', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
								.setDescription(`sheeeesh, ${message.author.username} wbiles poziom ${rows[0].level + 1}`)
								.setColor('#B512E6');
							const lvlupmsg = await message.channel.send({ embeds: [lvlup] });
							await snooze(5000);
							lvlupmsg.delete().catch(error => {
								// Only log the error if it is not an Unknown Message error
								if (error.code !== 10008) {
									console.error('Failed to delete the lvlup message:', error);
								}
							});
						})();

						// Roles
						if (rows[0].level >= 100) {
							const role = message.member.guild.roles.cache.find(r => r.id === config.level6RoleId);
							message.member.roles.add(role);
						} else if (rows[0].level >= 50) {
							const role = message.member.guild.roles.cache.find(r => r.id === config.level5RoleId);
							message.member.roles.add(role);
						} else if (rows[0].level >= 30) {
							const role = message.member.guild.roles.cache.find(r => r.id === config.level4RoleId);
							message.member.roles.add(role);
						} else if (rows[0].level >= 15) {
							const role = message.member.guild.roles.cache.find(r => r.id === config.level3RoleId);
							message.member.roles.add(role);
						} else if (rows[0].level >= 5) {
							const role = message.member.guild.roles.cache.find(r => r.id === config.level2RoleId);
							message.member.roles.add(role);
						} else if (rows[0].level >= 1) {
							const role = message.member.guild.roles.cache.find(r => r.id === config.level1RoleId);
							message.member.roles.add(role);
						}
					}
				}

				if (message.author.id != client.user.id) {
					talkedRecently.add(message.author.id);
					setTimeout(() => {
						talkedRecently.delete(message.author.id);
					}, 20000);
					connection.query(sqlQuery, function(err) {
						if (err) throw err;
					});
				}
			});
		}
	},
};