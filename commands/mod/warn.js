const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('no kurwa musisz byc debilem zeby nie wiedziec.')
		.addUserOption(option =>
			option.setName('osoba')
				.setDescription('Osoba do zwarnowania')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('powód')
				.setDescription('Powód warna')
				.setRequired(false)),
	async execute(interaction) {
		const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

		let reply;
		let color;
		let isEphemeral;

		const warn_member = interaction.options.getMember('osoba');
		const warn_user = interaction.options.getUser('osoba');
		const reason = interaction.options.getString('powód');

		const promise = new Promise(function(resolve, reject) {
			if (warn_member.roles.cache.find(r => r.id === config.adminRoleId) || warn_member.roles.cache.find(r => r.id === config.modRoleId)) {
				reject(reply = '**Członek administracji nie może zostać zwarnowany**');
			} else if (!interaction.member.roles.cache.find(r => r.id === config.adminRoleId) && !interaction.member.roles.cache.find(r => r.id === config.modRoleId)) {
				reject(reply = '**Nie masz permisji do warnowania - [Admin/Mod]**');
			} else if (warn_member.id === interaction.member.id) {
				reject(reply = '**Nie możesz zwarnować sam siebie**');
			} else if (!warn_member.kickable) {
				reject(reply = '**Nie możesz zwarnować tej osoby**');
			} else if (warn_member.user.bot) {
				reject(reply = '**Nie możesz zwarnować bota**');
			}
			resolve(warn_member);
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
				reply = `**${value.user.username}** otrzymał ostrzeżenie.`;
				warn_user.send('Otrzymałeś ostrzeżenie na Gangu Słoni.');
			} else {
				reply = `**${value.user.username}** otrzymał ostrzeżenie za ${reason}`;
				warn_user.send(`Otrzymałeś ostrzeżenie na Gangu Słoni za ${reason}`);
			}
			color = 'GREEN';
			value.kick().catch(() => null);
		});

		await snooze(1000);

		const replyEmbed = new MessageEmbed()
			.setDescription(reply)
			.setColor(color);
		await interaction.reply({ embeds: [replyEmbed], ephemeral: isEphemeral });
	},
};
