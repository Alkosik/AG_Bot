const { SlashCommandBuilder } = require('@discordjs/builders');
const chalk = require('chalk');
const mysql = require('mysql');

const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});

connection.connect(function(err) {
	console.log(chalk.green('DB INFO'), 'Connecting to database...');
	if (err) throw err;
	console.log(chalk.green('DB INFO'), 'Database connection established');
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ganja')
		.setDescription('Used to manage the ganja set.')
		.addUserOption(option =>
			option.setName('osoba')
				.setDescription('Osoba do dodania/usunięcia')
				.setRequired(true)),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === '♚Słonie♚')) {
			return interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}
		await interaction.deferReply();

		const person = interaction.options.getMember('osoba');

		connection.query(`SELECT * FROM account WHERE id = ${person.user.id}`, function(err, rows) {
			if (rows[0].length < 1) {
				interaction.editReply('404');
			} else if (rows[0].ganja == 0) {
				connection.query(`UPDATE account SET ganja = 1 WHERE id = '${person.user.id}'`);
				person.roles.add(person.guild.roles.cache.find(r => r.id === '817530671609544706'));
				interaction.editReply('Added');
			} else {
				person.roles.remove(person.guild.roles.cache.find(r => r.id === '817530671609544706'));
				connection.query(`UPDATE account SET ganja = 0 WHERE id = '${person.user.id}'`);
				interaction.editReply('Removed');
			}
		});
	},
};
