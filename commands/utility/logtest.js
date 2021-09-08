const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('logtest')
		.setDescription('Testing the log embed.')
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('reason test')
				.setRequired(false)),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			await interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}
		const reason = interaction.options.getString('reason');

		// const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'logs');
		const logEmbed = new MessageEmbed()
			.setAuthor('Ban Log', 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
			.setColor('#4d33de')
			.setThumbnail(interaction.user.displayAvatarURL({
				dynamic: true,
			}))
			.setFooter(interaction.guild.name, 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
			.addFields(
				{ name: '**Banned**', value: 'ban_member.user.username', inline: true },
				{ name: 'Banned By', value: interaction.user.username, inline: true },
				{ name: 'Date', value: interaction.createdAt.toLocaleString(), inline: false },
			)
			.addField('**ID**', 'ban_member.id')
			.addField('**Reason**', `${reason || '**No Reason**'}`)
			.setTimestamp();
		await interaction.reply({ embeds: [logEmbed] });
	},
};
