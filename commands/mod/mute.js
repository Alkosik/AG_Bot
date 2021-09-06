const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

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
	async execute(interaction) {
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
			if (mute_member.roles.cache.some(r => r.name === 'Administracja')) {
				reject(reply = '**Członek administracji nie może zostać zmutowany**');
			}
			if (!interaction.member.roles.cache.some(r => r.name === 'Administracja')) {
				reject(reply = '**Nie masz permisji do mutowania - [Administracja]**');
			}
			if (mute_member.id === interaction.member.id) {
				reject(reply = '**Nie możesz zmutować sam siebie**');
			}
			// if (!mute_member.kickable) {
			// 	reject(reply = '**Nie możesz zmutować tej osoby**');
			// }
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
		});

		await snooze(1000);

		const replyEmbed = new MessageEmbed()
			.setDescription(reply)
			.setColor(color);
		await interaction.reply({ embeds: [replyEmbed], ephemeral: isEphemeral });
	},
};
