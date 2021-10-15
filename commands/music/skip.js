const { SlashCommandBuilder } = require('@discordjs/builders');
// const { Player } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skips a song.'),
	async execute(interaction) {
		await interaction.defer();
		if (interaction.channel.id != '510941382454673408' && interaction.channel.id != '879456954232209508') {
			return await interaction.reply('Ta interakcja moze byc uzywana tylko na kanale od muzyki');
		}
		const player = interaction.client.player;
		const queue = player.getQueue(interaction.guildID);

		if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await interaction.reply({ content: 'Nie znajdujesz się w moim kanale głosowym', ephemeral: true });

		const currentTrack = queue.current;
		const success = queue.skip();

		return void interaction.sendFollowUp({
			content: success ? `✅ | Skipnięto **${currentTrack}**!` : 'D:',
		});
	},
};
