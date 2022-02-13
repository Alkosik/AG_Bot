const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');
const config = require('../config.json');
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

const talkedRecently = new Set();


const date = new Date();
const formattedDate = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();

module.exports = {
	name: 'messageCreate',
	async execute(message, client, connection) {
		if (message.channel.type == 'DM') {
			if (message.author.bot) return;
			return client.channels.cache.get(config.testChannelId).send('**DM Recieved** - ' + message.author.username + ': ' + message.content);
		}
		if (message.channel.id == config.testChannelId) return;
		connection.query(`SELECT * FROM stats WHERE date = '${formattedDate}'`, function(err, rows) {
			if (err) {
				client.emit('error', err);
				throw err;
			}

			let msgCount;

			if (rows.length < 1) {
				msgCount = 1;
			} else {
				msgCount = rows[0].messages;
			}
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
					client.emit('error', err);
					throw err;
				}

				let sqlQuery;
				let originalXp;
				let updatedXp;

				const escapedUsername = connection.escape(message.author.username);
				let escapedNickname;
				const escapedAvatarURL = connection.escape(message.author.displayAvatarURL({ dynamic: true }));

				if (message.author.nickname != undefined) {
					escapedNickname = connection.escape(message.member.nickname);
				} else {
					escapedNickname = escapedUsername;
				}

				// New user
				if (rows.length < 1) {
					updatedXp = generateXp();
					console.log(chalk.green('DB INFO'), `Registering new user: ${message.author.username} - ${message.author.id}`);
					sqlQuery = `INSERT INTO account (username, nickname, id, xp, avatarURL, discriminator, message_count) VALUES (${escapedUsername}, ${escapedNickname || 'N/A'}, ${message.author.id}, ${updatedXp}, ${escapedAvatarURL}, '${message.author.discriminator}', 1)`;
				} else {
					originalXp = rows[0].xp;
					updatedXp = originalXp + generateXp();
					sqlQuery = `UPDATE account SET xp = ${updatedXp}, username = ${escapedUsername}, nickname = ${escapedNickname || 'N/A'}, avatarURL = ${escapedAvatarURL}, discriminator = '${message.author.discriminator}' WHERE id = '${message.author.id}'`;

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

				connection.query(`UPDATE account SET message_count = ${rows[0].message_count + 1} WHERE id = ${message.author.id}`, function(err) {
					if (err) throw err;
				});

				connection.query(`SELECT * FROM server WHERE id = ${message.guildId}`, function(err, server_rows) {
					if (err) throw err;
					if (server_rows.length < 1) return;
					connection.query(`UPDATE server SET message_count = ${server_rows[0].message_count + 1} WHERE id = ${message.guildId}`, function(err) {
						if (err) throw err;
					});
				});
			});
		}
	},
};