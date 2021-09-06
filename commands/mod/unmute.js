const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unmute')
		.setDescription('Odmutowywanie.')
		.addUserOption(option =>
			option.setName('osoba')
				.setDescription('Osoba do odmutowania')
				.setRequired(true)),
	async execute(interaction) {
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
			if (!interaction.member.roles.cache.some(r => r.name === 'Administracja')) {
				reject(reply = '**Nie masz permisji do odmutowywania - [Administracja]**');
			}
			if (!mute_member.roles.cache.some(r => r.name === 'Muted')) {
				reject(reply = '**Ta osoba nie jest zmutowana**');
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
			reply = `**${value.user.username}** został odmutowany.`;
			mute_user.send('Zostałeś odmutowany na Gangu Słoni.');
			color = 'GREEN';
		});

		await snooze(2000);

		const replyEmbed = new MessageEmbed()
			.setDescription(reply)
			.setColor(color);
		await interaction.reply({ embeds: [replyEmbed], ephemeral: isEphemeral });
	},
};
