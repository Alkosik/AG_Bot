const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guild')
		.setDescription('Prints out info about a guild.')
		.addStringOption(option =>
			option.setName('id')
				.setDescription('Guild ID')
				.setRequired(true)),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			await interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}

		const guild = await interaction.client.guilds.fetch(interaction.options.getString('id'));

		if (!guild) {
			await interaction.reply('404');
			return;
		} else {
			const owner = await guild.members.fetch(guild.ownerId);
			const guilds_string = `${guild.name} (${guild.id})\nMembers: ${guild.memberCount}\nJoined: ${guild.joinedAt}\nCreated: ${guild.createdAt}\nOwner: ${owner.user.username} (${guild.ownerId})`;

			await interaction.reply(guilds_string || 'spierdalaj');
		}
	},
};
