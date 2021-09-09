const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rr')
		.setDescription('Russian roulette.'),
	async execute(interaction) {
		return interaction.reply('Ruletka zostala chwilowo wylaczona.');
		const result = Math.random() * (4 - 1) + 1;
		const player = interaction.member;
		let reply;

		switch (Math.floor(result)) {
		case 1:
			if (player.kickable) {
				player.ban();
				reply = 'Banicja';
			} else {
				return interaction.reply('kurwo nie mam permisji');
			}
			break;
		case 2:
			if (player.kickable) {
				player.kick();
				reply = 'Kop na klate';
			} else {
				return interaction.reply('kurwo nie mam permisji');
			}
			break;
		case 3:
			if (!player.voice) {
				return interaction.reply('kurwo nie ma cie na kanale');
			} else {
				player.voice.setMute(true);
				reply = 'Wyciszenie';
			}
			break;
		case 4:
			if (!player.voice) {
				return interaction.reply('kurwo nie ma cie na kanale');
			} else {
				player.voice.setDeaf(true);
				reply = 'Ogluszenie';
			}
			break;
		}
		console.log(Math.floor(result));
		await interaction.reply(reply);
	},
};
