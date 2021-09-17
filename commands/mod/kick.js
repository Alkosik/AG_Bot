const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Wyrzucanie z serwera.')
		.addUserOption(option =>
			option.setName('osoba')
				.setDescription('Osoba do wyrzucenia')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('powód')
				.setDescription('Powód wyrzucenia')
				.setRequired(false)),
	async execute(interaction) {
		const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

		let reply;
		let color;
		let isEphemeral;

		const kick_member = interaction.options.getMember('osoba');
		const kick_user = interaction.options.getUser('osoba');
		const reason = interaction.options.getString('powód');

		const promise = new Promise(function(resolve, reject) {
			if (kick_member.roles.cache.find(r => r.id === config.adminRoleId)) {
				reject(reply = '**Członek administracji nie może zostać wyrzucony**');
			} else if (!interaction.member.roles.cache.find(r => r.id === config.adminRoleId) && !interaction.member.roles.cache.find(r => r.id === config.modRoleId)) {
				reject(reply = '**Nie masz permisji do kickowania - [Admin/Mod]**');
			} else if (kick_member.id === interaction.member.id) {
				reject(reply = '**Nie możesz wyrzucić sam siebie**');
			} else if (!kick_member.kickable) {
				reject(reply = '**Nie możesz wyrzucić tej osoby**');
			} else if (kick_member.user.bot) {
				reject(reply = '**Nie możesz wyrzucić bota**');
			}
			resolve(kick_member);
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
				reply = `**${value.user.username}** został wyrzucony.`;
				kick_user.send('Zostałeś wyrzucony z Gangu Słoni.');
			} else {
				reply = `**${value.user.username}** został wyrzucony za ${reason}`;
				kick_user.send(`Zostałeś wyrzucony z Gangu Słoni za ${reason}`);
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
