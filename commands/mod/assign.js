const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const chalk = require('chalk');
const mysql = require('mysql');

const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});

connection.connect(function(err) {
	console.log(chalk.green('DB INFO'), 'assign: Connecting to database...');
	if (err) throw err;
	console.log(chalk.green('DB INFO'), 'assign: Database connection established');
});

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
					await interaction.update({ content: 'Wybranles: Admin', components: [], ephemeral: true });
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

				connection.query(`SELECT * FROM account WHERE id = ${person.user.id}`, function(err, rows) {
					if (rows[0].length < 1) {
						return interaction.editReply('404');
					}

					connection.query(sqlQuery);
					console.log(chalk.green('DB QUERY'), 'Moderation assignment query sent');
				});
			}


		});

		const selectMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
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
