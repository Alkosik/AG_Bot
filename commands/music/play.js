const { SlashCommandBuilder } = require('@discordjs/builders');
const { Player } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Plays a song.')
		.addStringOption(option =>
			option.setName('nazwa')
				.setDescription('Nazwa piosenki')
				.setRequired(true)),
	async execute(interaction) {
		const player = new Player(interaction.client);

		player.on('trackStart', (queue, track) => queue.metadata.channel.send(`Teraz leci **${track.title}**`));
		if (!interaction.member.voice.channelId) return await interaction.reply({ content: 'Nie znajdujesz się na kanale głosowym', ephemeral: true });
		if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) return await interaction.reply({ content: 'Nie znajdujesz się w moim kanale głosowym', ephemeral: true });
		console.log(player.queues);
		const query = interaction.options.get('nazwa').value;
		const queue = player.createQueue(interaction.guild, {
			metadata: {
				channel: interaction.channel,
			},
		});

		try {
			if (!queue.connection) await queue.connect(interaction.member.voice.channel);
		} catch {
			console.log(interaction);
			void player.deleteQueue(interaction.guild.id);
			return await interaction.reply({ content: 'Nie udało się dołączyć na twój kanał', ephemeral: true });
		}

		await interaction.deferReply();
		const track = await player.search(query, {
			requestedBy: interaction.user,
		}).then(x => x.tracks[0]);
		if (!track) return await interaction.editReply({ content: `Piosenka **${query}** nie znaleziona` });

		queue.addTrack(track);
		interaction.followUp(String(queue.tracks));

		if (!queue.playing || queue.playing == false) {
			await queue.play();
		}
		return await interaction.followUp({ content: `Ładowanie **${track.title}**` });
	},
};
