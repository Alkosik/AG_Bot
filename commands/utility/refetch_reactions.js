const {
	SlashCommandBuilder,
} = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('refetchreactions')
		.setDescription('Refetches the reaction messages, and assignes roles.'),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === 'Owners')) {
			await interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}
		await interaction.deferReply('Refetching...');

		const guild = interaction.client.guilds.cache.get('943590896820162591');
		const targetMessages = [
			// '943626841724452884',
			// '943862977528995850',
			'945438888254668811',
		];

		const targetEmojiName = 'gs_bell_i';
		const targetRoleName = 'Community Updates';
		const targetRoleId = '945444182661685278';

		let assignCount = 0;

		for (let i = 0; i < targetMessages.length; i++) {
			await interaction.editReply('Fetching reactions for message ID ' + targetMessages[i] + '...');
			// eslint-disable-next-line prefer-const
			let reactedUsers = [];


			const message = await guild.channels.cache.get('943621480095313930').messages.fetch(targetMessages[i]);
			const reactions = message.reactions.cache.find(emoji => emoji.emoji.name == targetEmojiName);
			const users = await reactions.users.fetch();
			await users.map(user => {
				if (user.bot) return;
				reactedUsers.push(user);
				console.log(user.username + ' mapped.');
			});
			for (let j = 0; j < reactedUsers.length; j++) {
				console.log('Role assigning has begun for ' + reactedUsers[j].username + '...');
				console.log(reactedUsers[j].id);
				const member = await guild.members.cache.get(reactedUsers[j].id);
				if (!member) {
					console.log('Member not found.');
					continue;
				}
				console.log('Member fetched. ' + member.displayName + '.');
				if (member.roles.cache.some(r => r.name === targetRoleName)) {
					console.log('Member already has the role. ' + member.displayName + '.');
				} else {
					member.roles.add(guild.roles.cache.find(r => r.id === targetRoleId));
					console.log(member.displayName + ` has been added to the ${targetRoleName} role.`);
					assignCount++;
				}
			}
			// for (let j = 0; j < reactions.length; j++) {
			// 	const users = await reactions[j].users.fetch();
			// 	console.log(users.array());
			// }
		}

		await interaction.followUp('Refetched. Target message(s): ' + targetMessages.join(', ') + `. Roles assigned: ${targetRoleName} - ` + assignCount + '.');
	},
};