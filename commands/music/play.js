const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a song.')
		.addStringOption(option =>
			option.setName('nazwa')
				.setDescription('Nazwa piosenki')
				.setRequired(true)),
	async execute(interaction) {
		if (interaction.channel.id != '510941382454673408' && interaction.channel.id != '879456954232209508') {
			return await interaction.reply('Ta interakcja moze byc uzywana tylko na kanale od muzyki');
		}

		const player = interaction.client.player;

		const queue = await interaction.client.player.createQueue(interaction.guild, {
			metadata: interaction.channel,
		});

		if (!interaction.member.voice.channelId) return await interaction.reply({ content: 'Nie znajdujesz się na kanale głosowym', ephemeral: true });
		if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await interaction.reply({ content: 'Nie znajdujesz się w moim kanale głosowym', ephemeral: true });
		const query = interaction.options.get('nazwa').value;

		try {
			if (!queue.connection) await queue.connect(interaction.member.voice.channel);
		} catch {
			void player.deleteQueue(interaction.guild.id);
			return await interaction.reply({ content: 'Nie udało się dołączyć na twój kanał', ephemeral: true });
		}

		await interaction.deferReply();
		const track = await player.search(query, {
			requestedBy: interaction.user,
		}).then(x => x.tracks[0]);
		if (!track) return await interaction.editReply({ content: `Piosenka **${query}** nie znaleziona` });

		queue.addTrack(track);

		if (!queue.playing || queue.playing == false) {
			await queue.play();
		}
		return await interaction.followUp({ content: `Pobieranie **${track.title}**` });
	},
};
