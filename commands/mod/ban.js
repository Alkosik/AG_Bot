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
			LogEvent();
			color = 'GREEN';
			value.ban().catch(() => null);
		});

		await snooze(1000);

		const replyEmbed = new MessageEmbed()
			.setDescription(reply)
			.setColor(color);

		function LogEvent() {
			const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'logs');
			const logEmbed = new MessageEmbed()
				.setAuthor('Moderation logs', interaction.guild.iconURL())
				.setColor('#4d33de')
				.setThumbnail(ban_member.user.displayAvatarURL({
					dynamic: true,
				}))
				.setFooter(interaction.guild.name, interaction.guild.iconURL())
				.addField('**Moderation**', 'ban')
				.addField('**Banned**', ban_member.user.username)
				.addField('**ID**', `${ban_member.id}`)
				.addField('**Banned By**', interaction.user.username)
				.addField('**Reason**', `${reason || '**No Reason**'}`)
				.addField('**Date**', interaction.createdAt.toLocaleString())
				.setTimestamp();
			if (!logChannel) {
				console.log('log channel not found');
				return;
			}
			logChannel.send({ embeds: [logEmbed] });
		}

		await interaction.deferReply();
		await snooze(1000);
		await interaction.editReply({ embeds: [replyEmbed], ephemeral: isEphemeral });
	},
};
