const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');
const chalk = require('chalk');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mute')
		.setDescription('Mutowanie.')
		.addUserOption(option =>
			option.setName('osoba')
				.setDescription('Osoba do zmutowania')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('powód')
				.setDescription('Powód muta')
				.setRequired(false)),
	async execute(interaction, connection) {
		const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

		let reply;
		let color;
		let isEphemeral;

		const mute_member = interaction.options.getMember('osoba');
		const mute_user = interaction.options.getUser('osoba');
		const reason = interaction.options.getString('powód');

		const mutedRole = interaction.guild.roles.cache.find(
			(role) => role.name === 'Muted',
		);

		const promise = new Promise(function(resolve, reject) {
			if (mute_member.roles.cache.find(r => r.id === config.adminRoleId) || mute_member.roles.cache.find(r => r.id === config.modRoleId)) {
				reject(reply = '**Członek administracji nie może zostać zmutowany**');
			}
			if (!interaction.member.roles.cache.find(r => r.id === config.adminRoleId) && !interaction.member.roles.cache.find(r => r.id === config.modRoleId)) {
				reject(reply = '**Nie masz permisji do mutowania - [Admin/Mod]**');
			}
			if (mute_member.id === interaction.member.id) {
				reject(reply = '**Nie możesz zmutować sam siebie**');
			}
			if (mute_member.user.bot) {
				reject(reply = '**Nie możesz zmutować bota**');
			}
			if (!mutedRole) {
				reject(reply = '**Nie znaleziono roli**');
			}
			resolve(mute_member);
		}).catch(() => {
			color = 'RED';
			isEphemeral = true;
		});

		process.on('unhandledRejection', () => {
			color = 'RED';
		});

		promise.then((value) => {
			isEphemeral = false;
			if (!reason) {
				reply = `**${value.user.username}** został zmutowany.`;
				mute_user.send('Zostałeś zmutowany na Gangu Słoni.');
			} else {
				reply = `**${value.user.username}** został zmutowany za ${reason}`;
				mute_user.send(`Zostałeś zmutowany na Gangu Słoni za ${reason}`);
			}
			color = 'GREEN';
			value.roles.add(mutedRole);
			connection.query(`SELECT * FROM account WHERE id = ${value.user.id}`, function(err) {
				if (err) {
					interaction.client.emit('error', err);
				}

				connection.query(`UPDATE account SET muted = 1 WHERE id = '${value.user.id}`);
				console.log(chalk.green('DB QUERY'), 'Moderation assignment query sent');
			});
		});

		await snooze(1000);

		const replyEmbed = new MessageEmbed()
			.setDescription(reply)
			.setColor(color);
		await interaction.reply({ embeds: [replyEmbed], ephemeral: isEphemeral });
	},
};
