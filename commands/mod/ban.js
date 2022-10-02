const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
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
		// const ban_user = interaction.options.getUser('osoba');
		const reason = interaction.options.getString('powód');
		let member_username;
		let member_id;

		const promise = new Promise(function(resolve, reject) {
			if (ban_member.roles.cache.find(r => r.id === config.adminRoleId) || ban_member.roles.cache.find(r => r.id === config.modRoleId)) {
				reject(reply = '**Członek administracji nie może zostać zbanowany**');
			} else if (!interaction.member.roles.cache.find(r => r.id === config.adminRoleId)) {
				reject(reply = '**Nie masz permisji do banowania - [Admin]**');
			} else if (ban_member.id === interaction.member.id) {
				reject(reply = '**Nie możesz zbanować sam siebie**');
			} else if (!ban_member.kickable) {
				reject(reply = '**Nie możesz zbanować tej osoby**');
			} else if (ban_member.user.bot) {
				reject(reply = '**Nie możesz zbanować bota**');
			} else if (!ban_member) {
				reject(reply = '**Tej osoby nie ma na tym serwerze, lub nie podałeś żadnej osoby**');
			}
			member_username = ban_member.user.username;
			member_id = ban_member.id;
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
			// if (!reason) {
			// 	reply = `**${value.user.username}** został zbanowany.`;
			// 	ban_user.send('Zostałeś zbanowany na Gangu Słoni.');
			// } else {
			// 	reply = `**${value.user.username}** został zbanowany za ${reason}`;
			// 	ban_user.send(`Zostałeś zbanowany na Gangu Słoni za ${reason}.`);
			// }
			LogEvent();
			color = 'GREEN';
			value.ban().catch(() => null);
		});

		await snooze(1000);

		const replyEmbed = new EmbedBuilder()
			.setDescription(reply)
			.setColor(color);

		function LogEvent() {
			const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'logs');
			const logEmbed = new EmbedBuilder()
				.setAuthor({ name: 'Ban Log', iconURL: 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png' })
				.setColor('#4d33de')
				.setThumbnail(interaction.user.displayAvatarURL({
					dynamic: true,
				}))
				.setFooter({ text: interaction.guild.name, iconURL: 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png' })
				.addFields(
					{ name: '**Banned**', value: member_username, inline: true },
					{ name: 'Banned By', value: interaction.user.username, inline: true },
					{ name: 'Date', value: interaction.createdAt.toLocaleString(), inline: false },
					{ name: 'ID', value: member_id },
					{ name: 'Reason', value: reason || 'No Reason' },
				)
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
