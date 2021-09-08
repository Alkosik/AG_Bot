const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');

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
			if (ban_member.roles.cache.some(role => role.name === config.adminRoleName)) {
				reject(reply = '**Członek administracji nie może zostać zbanowany**');
			}
			if (!interaction.member.roles.cache.has(role => role.name === config.adminRoleName)) {
				reject(reply = '**Nie masz permisji do banowania - [Administracja]**');
			}
			snooze(500);
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
				.setAuthor('Ban Log', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.setColor('#4d33de')
				.setThumbnail(interaction.user.displayAvatarURL({
					dynamic: true,
				}))
				.setFooter(interaction.guild.name, 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.addFields(
					{ name: '**Banned**', value: ban_member.user.username, inline: true },
					{ name: 'Banned By', value: interaction.user.username, inline: true },
					{ name: 'Date', value: interaction.createdAt.toLocaleString(), inline: false },
				)
				.addField('**ID**', ban_member.id)
				.addField('**Reason**', `${reason || '**No Reason**'}`)
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
