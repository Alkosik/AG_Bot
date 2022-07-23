const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profil')
		.setDescription('Sprawdz swój profil. (albo kogos idc)')
		.addUserOption(option =>
			option.setName('osoba')
				.setDescription('czyjs profil jak chcesz idc')
				.setRequired(false)),
	async execute(interaction, connection) {
		let person = interaction.options.getMember('osoba');
		if (!person) {
			person = interaction.member;
		}
		await interaction.deferReply();

		connection.query(`SELECT * FROM account WHERE id = ${person.id}`, function(err, rows) {
			if (err) {
				interaction.client.emit('error', err);
			}

			connection.query('SELECT * FROM account ORDER BY xp DESC', function(err, topRows) {
				if (err) {
					return interaction.client.emit('error', err);
				}

				const top = topRows.findIndex(row => row.id == person.id) + 1;

				if (rows[0].length < 1) {
					interaction.editReply('404');
				} else {
					const ProfileEmbed = new EmbedBuilder()
						.setColor('#B412E5')
						.setTitle(`${person.user.username}#${person.user.discriminator}`)
						.addFields(
							{ name: 'Poziom', value: rows[0].level.toLocaleString(), inline: true },
							{ name: 'Xp', value: rows[0].xp.toLocaleString(), inline: true },
							{ name: 'Ranking', value: 'Top ' + top, inline: true },
							{ name: '​', value: '​', inline: true },
							{ name: 'Warny', value: rows[0].warns.toLocaleString(), inline: true },
							{ name: 'Ganja', value: rows[0].ganja ? 'Tak' : 'Nie', inline: true },
						)
						.setThumbnail(person.user.avatarURL({ dynamic: true }))
						.setTimestamp()
						.setFooter('Gang Słoni 2.0', 'https://i.imgur.com/JRl8WjV.png');

					interaction.editReply({ embeds: [ProfileEmbed] });
				}
			});
		});
	},
};
