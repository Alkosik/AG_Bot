const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('refresh')
		.setDescription('Refreshes counts.'),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			await interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}

		const guild = interaction.client.guilds.cache.get('510941195267080214');
		const memberCountChannel = interaction.client.channels.cache.get('726734001347231784');
		const memCount = guild.memberCount;
		memberCountChannel.setName(`Ludzie: ${memCount} 👤`);

		await interaction.reply('Refreshed.');
	},
};
