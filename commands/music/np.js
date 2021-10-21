const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('np')
		.setDescription('Now playing.'),
	async execute(interaction) {
		await interaction.defer();
		if (interaction.channel.id != '510941382454673408' && interaction.channel.id != '879456954232209508') {
			return await interaction.reply('Ta interakcja moze byc uzywana tylko na kanale od muzyki');
		}
		const player = interaction.client.player;
		const queue = player.getQueue(interaction.guild.id);

		if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await interaction.reply({ content: 'Nie znajdujesz się w moim kanale głosowym', ephemeral: true });

		if (!queue || !queue.playing) return void interaction.reply({ content: 'Nic nie leci lbie jebany' });
		const progress = queue.createProgressBar();
		const perc = queue.getPlayerTimestamp();

		return void interaction.reply({
			embeds: [
				{
					title: 'Tera leci',
					description: `**${queue.current.title}** (\`${perc.progress == 'Infinity' ? 'Live' : perc.progress + '%'}\`)`,
					fields: [
						{
							name: '\u200b',
							value: progress.replace(/ 0:00/g, ' ◉ LIVE'),
						},
					],
					color: 0xffffff,
				},
			],
		});
	},
};
