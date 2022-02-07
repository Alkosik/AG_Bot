const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guilds')
		.setDescription('Prints out guilds the bot is in.'),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			await interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}

		const guilds = await interaction.client.guilds.cache.map(guild => guild.id);

		let guilds_string;

		for (const guild of guilds) {
			const guild_obj = await interaction.client.guilds.cache.get(guild);

			guilds_string += `${guild_obj.name} (${guild_obj.id})\n`;
		}
		await interaction.reply(guilds_string);
	},
};
