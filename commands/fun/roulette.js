const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rr')
		.setDescription('Russian roulette but with a friend.')
		.addUserOption(option =>
			option.setName('partner')
				.setDescription('Partner do duo')
				.setRequired(true)),
	async execute(interaction) {

		// Emoji
		const gunLeft = interaction.client.emojis.cache.find(emoji => emoji.name === 'gun');
		const gunRight = interaction.client.emojis.cache.find(emoji => emoji.name === 'gunright');

		// Player 1
		const player = interaction.member;

		// Player 2
		const duoPlayer = interaction.options.getMember('partner');

		// RR result
		const result = Math.random() * (15 - 1) + 1;

		if (duoPlayer.user.id == player.id) {
			return interaction.reply('Nie możesz grać sam ze sobą.');
		}


		// Invitation
		const filter = i => i.customId === 'rraccept' && i.user.id === duoPlayer.user.id;
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

		const inviteRow = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('rraccept')
					.setLabel('Akceptuj')
					.setStyle('DANGER')
					.setEmoji(gunLeft),
			);

		await interaction.reply({ content: `${duoPlayer}, Zostałeś zaproszony do zagrania w ruletkę z ${player.user.username}`, components: [inviteRow] });

		// const accpetEmbed = new MessageEmbed()
		// 	.setTitle('Zaproszenie zaakceptowane.')
		// 	.setColor('GREEN');
		await collector.on('collect', async i => {
			if (i.customId === 'rraccept') {
				await interaction.editReply({ content: 'Zaproszenie zaakceptowane.', components: [] });
			}
			StartGame();
		});

		async function StartGame() {
			let stepped = true;
			await wait(1000);
			await interaction.editReply('Rozpoczynanie gry.');
			await wait(1000);
			await interaction.editReply('Rozpoczynanie gry..');
			await wait(1000);
			await interaction.editReply('Rozpoczynanie gry...');
			await wait(1000);
			for (let step = 0; step < result; step++) {
				await wait(200);
				if (stepped == true) {
					await interaction.editReply(`${player} ${gunLeft} ${duoPlayer}`);
					stepped = false;
				} else {
					await interaction.editReply(`${player} ${gunRight} ${duoPlayer}`);
					stepped = true;
				}
			}
			if (stepped == false) {
				await interaction.followUp(`${duoPlayer} wygrał. Kickowanie ${player}.`);
				if (!player.kickable) {
					await interaction.followUp('jebac was');
				} else {
					player.send('https://discord.gg/7XcYkDU');
					player.kick();
				}
			} else {
				await interaction.followUp(`${player} wygrał. Kickownie ${duoPlayer}`);
				if (!duoPlayer.kickable) {
					await interaction.followUp('jebac was');
				} else {
					duoPlayer.send('https://discord.gg/7XcYkDU');
					duoPlayer.kick();
				}
			}
		}
		// await interaction.reply({ content: `Zostałeś zaproszony do zagrania w ruletkę z ${player.user.username}`, components: [inviteRow] });
	},
};
