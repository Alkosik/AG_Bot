const {
	SlashCommandBuilder,
} = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('refetch')
		.setDescription('Refetches the member roles, and assignes them.'),
	async execute(interaction) {
		if (!interaction.member.roles.cache.some(r => r.name === 'Owners')) {
			await interaction.reply('Co ty kurwa chcesz zrobic powiedz ty mi');
		}
		await interaction.deferReply('Refetching...');

		const guild = interaction.client.guilds.cache.get('943590896820162591');

		const targetRoleName = 'Member';
		const targetRoleId = '943630872987467776';

		let assignCount = 0;

		// eslint-disable-next-line prefer-const
		let usersArray = [];


		const users = await interaction.guild.members.fetch();
		await users.map(user => {
			if (user.bot) return;
			usersArray.push(user);
			console.log(user.username + ' mapped.');
		});
		for (let j = 0; j < usersArray.length; j++) {
			console.log('Role assigning has begun for ' + usersArray[j].username + '...');
			const member = await guild.members.cache.get(usersArray[j].id);
			if (!member) {
				console.log('Member not found.');
				continue;
			}
			console.log('Member fetched: ' + member.displayName + '.');
			if (member.roles.cache.some(r => r.name === targetRoleName)) {
				console.log('Member already has the role. ' + member.displayName + '.');
			} else {
				member.roles.add(guild.roles.cache.find(r => r.id === targetRoleId));
				console.log(member.displayName + ` has been added to the ${targetRoleName} role.`);
				assignCount++;
			}
		}

		await interaction.followUp('Refetched.' + `. Roles assigned: ${targetRoleName} - ` + assignCount + '.');
	},
};