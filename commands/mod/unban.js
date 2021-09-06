const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('Odbanowanie.')
		.addStringOption(option =>
			option.setName('id')
				.setDescription('ID zbanowanej osoby.')
				.setRequired(true)),
	async execute(interaction) {
		const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

		let reply;
		let color;
		let isEphemeral;

		const banned_id = interaction.options.getString('id');

		const promise = new Promise(function(resolve, reject) {
			if (!interaction.member.roles.cache.some(r => r.name === 'Administracja')) {
				reject(reply = '**Nie masz permisji do odbanowania - [Administracja]**');
			}
			resolve();
		}).catch(() => {
			color = 'RED';
			isEphemeral = true;
		});

		process.on('unhandledRejection', () => {
			color = 'RED';
		});

		promise.then(() => {
			isEphemeral = false;
			reply = `**${banned_id}** został odbanowany.`;
			color = 'GREEN';
			interaction.guild.members.unban(banned_id);
		});

		await snooze(1000);

		const replyEmbed = new MessageEmbed()
			.setDescription(reply)
			.setColor(color);
		await interaction.reply({ embeds: [replyEmbed], ephemeral: isEphemeral });
	},
};
