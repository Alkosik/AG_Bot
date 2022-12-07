const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const config = require('../../config.json');
const chalk = require('chalk');

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
		let warnCount;

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
			LogEvent();
			if (!reason) {
				reply = `**${value.user.username}** otrzymał ostrzeżenie.`;
				warn_user.send('Otrzymałeś ostrzeżenie na Gangu Słoni.');
			} else {
				reply = `**${value.user.username}** otrzymał ostrzeżenie za ${reason}`;
				warn_user.send(`Otrzymałeś ostrzeżenie na Gangu Słoni za ${reason}`);
			}
			color = 'GREEN';
		});

		await snooze(1000);

		const replyEmbed = new EmbedBuilder()
			.setDescription(reply)
			.setColor(color);
		await interaction.reply({ embeds: [replyEmbed], ephemeral: isEphemeral });

		await snooze(5000);

		if (warnCount >= 3) {
			warn_member.kick().catch(() => null);
			await interaction.editReply({ content: `${warn_member.user.username} został wyrzucony za posiadanie 3 ostrzeżeń.` });
		}

		function LogEvent() {
			const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'logs');
			const logEmbed = new EmbedBuilder()
				.setAuthor('Warn Log', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.setColor('#4d33de')
				.setThumbnail(interaction.user.displayAvatarURL({
					dynamic: true,
				}))
				.setFooter(interaction.guild.name, 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.addFields(
					{ name: '**Warned**', value: warn_member.user.username, inline: true },
					{ name: 'Warned By', value: interaction.user.username, inline: true },
					{ name: 'Date', value: interaction.createdAt.toLocaleString(), inline: false },
				)
				.addField('**ID**', warn_member.id)
				.addField('**Reason**', `${reason || '**No Reason**'}`)
				.setTimestamp();
			if (!logChannel) {
				console.log('log channel not found');
				return;
			}
			logChannel.send({ embeds: [logEmbed] });
		}
	},
};
