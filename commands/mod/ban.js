const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Banowanie.')
		.addUserOption(option =>
			option.setName('osoba')
				.setDescription('Osoba do zbanowania')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('powód')
				.setDescription('Powód bana')
				.setRequired(true)),
	async execute(interaction) {
		const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

		let reply;
		let color;
		let isEphemeral;

		const ban_member = interaction.options.getMember('osoba');
		const ban_user = interaction.options.getUser('osoba');
		const reason = interaction.options.getString('powód');

		const promise = new Promise(function(resolve, reject) {
			if (ban_member.roles.cache.some(r => r.name === 'Administracja')) {
				reject(reply = '**Członek administracji nie może zostać zbanowany**');
			}
			if (!interaction.member.roles.cache.some(r => r.name === 'Administracja')) {
				reject(reply = '**Nie masz permisji do banowania - [Administracja]**');
			}
			if (ban_member.id === interaction.member.id) {
				reject(reply = '**Nie możesz zbanować sam siebie**');
			}
			if (!ban_member.kickable) {
				reject(reply = '**Nie możesz zbanować tej osoby**');
			}
			if (ban_member.user.bot) {
				reject(reply = '**Nie możesz zbanować bota**');
			}
			resolve(ban_member);
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
				reply = `**${value.user.username}** został zbanowany.`;
				ban_user.send('Zostałeś zbanowany na Gangu Słoni.');
			} else {
				reply = `**${value.user.username}** został zbanowany za ${reason}`;
				ban_user.send(`Zostałeś zbanowany na Gangu Słoni za ${reason}.`);
			}
			color = 'GREEN';
			value.ban().catch(() => null);
		});

		await snooze(1000);

		const replyEmbed = new MessageEmbed()
			.setDescription(reply)
			.setColor(color);
		await interaction.reply({ embeds: [replyEmbed], ephemeral: isEphemeral });
	},
};
