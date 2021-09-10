const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rrduo')
		.setDescription('Russian roulette but with a friend.')
		.addUserOption(option =>
			option.setName('partner')
				.setDescription('Partner do duo')
				.setRequired(false))
	async execute(interaction) {

		// Player 1
		const player = interaction.member;
		const playerUser = interaction.user;

		// Player 2
		const duoPlayer = interaction.options.getMember('partner');
		const duoPlayerUser = interaction.options.getUser('partner');
		// return interaction.reply('Ruletka zostala chwilowo wylaczona.');
		const result = Math.random() * (8 - 1) + 1;
		let reply;

		console.log(duoPlayer);

		const inviteRow = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('primary')
					.setLabel('Akceptuj')
					.setStyle('PRIMARY'),
			);

		await interaction.reply({ content: `Zostałeś zaproszony do zagrania w ruletkę z ${player.user.username}`, components: [inviteRow] });
	},
};
