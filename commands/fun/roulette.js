const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rr')
		.setDescription('Russian roulette.'),
	async execute(interaction) {
		const result = Math.random() * (4 - 1) + 1;
		const player = interaction.member;

		switch (Math.floor(result)) {
		case 1:
			if (player.kickable) {
				player.ban();
			} else {
				return interaction.reply('kurwo nie mam permisji');
			}
			break;
		case 2:
			if (player.kickable) {
				player.kick();
			} else {
				return interaction.reply('kurwo nie mam permisji');
			}
			break;
		case 3:
			if (!player.voice) {
				return interaction.reply('kurwo nie ma cie na kanale');
			} else {
				player.voice.setMute(true);
			}
			break;
		case 4:
			if (!player.voice) {
				return interaction.reply('kurwo nie ma cie na kanale');
			} else {
				player.voice.setDeaf(true);
			}
			break;
		}
		console.log(Math.floor(result));
		await interaction.reply(String(Math.floor(result)));
	},
};