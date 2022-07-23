const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const config = require('../../config.json');
const chalk = require('chalk');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unmute')
		.setDescription('Odmutowywanie.')
		.addUserOption(option =>
			option.setName('osoba')
				.setDescription('Osoba do odmutowania')
				.setRequired(true)),
	async execute(interaction, connection) {
		const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

		let reply;
		let color;
		let isEphemeral;

		const mute_member = interaction.options.getMember('osoba');
		const mute_user = interaction.options.getUser('osoba');

		const mutedRole = interaction.guild.roles.cache.find(
			(role) => role.name === 'Muted',
		);

		const promise = new Promise(function(resolve, reject) {
			if (!interaction.member.roles.cache.find(r => r.id === config.adminRoleId) && !interaction.member.roles.cache.find(r => r.id === config.modRoleId)) {
				return reject(reply = '**Nie masz permisji do odmutowywania - [Admin/Mod]**');
			}
			if (!mute_member.roles.cache.some(r => r.name === 'Muted')) {
				return reject(reply = '**Ta osoba nie jest zmutowana**');
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
			value.roles.remove(mutedRole);
			connection.query(`SELECT * FROM account WHERE id = ${value.user.id}`, function(err) {
				if (err) {
					interaction.client.emit('error', err);
				}

				connection.query(`UPDATE account SET muted = 0 WHERE id = '${value.user.id}`);
				console.log(chalk.green('DB QUERY'), 'Moderation assignment query sent');
			});
			reply = `**${value.user.username}** został odmutowany.`;
			mute_user.send('Zostałeś odmutowany na Gangu Słoni.');
			color = 'GREEN';
		});

		await snooze(2000);

		const replyEmbed = new EmbedBuilder()
			.setDescription(reply)
			.setColor(color);
		await interaction.reply({ embeds: [replyEmbed], ephemeral: isEphemeral });
	},
};
