const { ActionRowBuilder, SelectMenuBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('assign')
		.setDescription('Used to manage server moderators.')
		.addUserOption(option =>
			option.setName('osoba')
				.setDescription('Osoba do dodania/usunięcia')
				.setRequired(true)),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			return interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}
		await interaction.deferReply({ ephemeral: true });

		const person = interaction.options.getMember('osoba');

		let sqlQuery;

		// eslint-disable-next-line no-shadow
		interaction.client.on('interactionCreate', async interaction => {
			if (!interaction.isSelectMenu()) return;

			if (interaction.customId === 'role') {
				// await interaction.update({ content: 'jebac alberta kurwe', components: [] });
				if (interaction.values == 'admin') {
					await interaction.update({ content: 'Wybrales: Admin', components: [], ephemeral: true });
					sqlQuery = `UPDATE account SET moderation = 2 WHERE id = '${person.user.id}'`;
				} else if (interaction.values == 'mod') {
					await interaction.update({ content: 'Wybrales: Mod', components: [], ephemeral: true });
					sqlQuery = `UPDATE account SET moderation = 1 WHERE id = '${person.user.id}'`;
				} else if (interaction.values == 'removal') {
					await interaction.update({ content: 'Wybrales: Pierdol sie', components: [], ephemeral: true });
					sqlQuery = `UPDATE account SET moderation = 0 WHERE id = '${person.user.id}'`;
				} else {
					return;
				}

				return sqlQuery;
			}


		});

		const selectMenu = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId('role')
					.setPlaceholder('Wybierz role')
					.addOptions([
						{
							label: 'Admin',
							description: 'Administrator',
							value: 'admin',
						},
						{
							label: 'Mod',
							description: 'Moderator',
							value: 'mod',
						},
						{
							label: 'Usun',
							description: 'Usuń status moderacji',
							value: 'removal',
						},
					]),
			);

		await interaction.editReply({ content: 'Wybierz role do nadania', components: [selectMenu], ephemeral: true });
	},
};
