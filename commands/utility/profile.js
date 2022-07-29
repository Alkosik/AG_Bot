const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const chalk = require('chalk');

const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoClient = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
mongoClient.connect(err => {
	if (err) return console.log(chalk.redBright('DB ERROR'), err);
	console.log(chalk.greenBright('DB INIT INFO'), 'MongoDB connection estabilished. - /profile');
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('Check your profile. (or someone else\'s)')
		.addUserOption(option =>
			option.setName('person')
				.setDescription('someone else\'s profile')
				.setRequired(false)),
	async execute(interaction) {
		let person = interaction.options.getMember('person');
		if (!person) {
			person = interaction.member;
		}
		await interaction.deferReply();
		const database = mongoClient.db('discord');
		const users = database.collection('users');
		const query = { _id: person.id };
		const userObj = await users.findOne(query);

		// const top = topRows.findIndex(row => row.id == person.id) + 1;

		if (!userObj) {
			interaction.editReply('404');
		} else {
			const ProfileEmbed = new EmbedBuilder()
				.setColor('#B412E5')
				.setAuthor({ name: 'Profile', iconURL: 'https://i.imgur.com/JRl8WjV.png' })
				.setTitle(`${person.user.username}#${person.user.discriminator}`)
				.addFields(
					{ name: 'Level', value: userObj.level.toLocaleString(), inline: true },
					{ name: 'Xp', value: userObj.xp.toLocaleString(), inline: true },
					{ name: 'Rank', value: 'Top - Depracted', inline: true },
					{ name: '​', value: '​', inline: true },
					{ name: 'Warns', value: userObj.warns || 'None', inline: true },
					{ name: 'Multiplier', value: userObj.multiplier ? 'Yes' : 'No', inline: true },
				)
				.setThumbnail(person.user.avatarURL({ dynamic: true }))
				.setTimestamp()
				.setFooter({ text: 'Gang Słoni', iconURL: 'https://i.imgur.com/JRl8WjV.png' });

			interaction.editReply({ embeds: [ProfileEmbed] });
		}
	},
};
