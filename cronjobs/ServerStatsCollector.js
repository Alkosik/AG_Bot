const cron = require('node-schedule');

module.exports = (config, client, chalk, connection) => {
	cron.scheduleJob('0 0 * * *', async function() {
		console.log(chalk.green('CRON INFO'), 'Collecting Server Stats...');
		client.channels.cache.get(config.testChannelId).send('Initated Server Stats and Info Collection');
		const guilds = await client.guilds.cache.map(guild => guild.id);
		// console.log(guilds);
		for (const guild of guilds) {
			console.log(chalk.green('CRON INFO'), `Collecting stats for ${guild}`);
			client.channels.cache.get(config.testChannelId).send(`Collecting stats for ${guild}`);
			const guildObj = client.guilds.cache.get(guild);
			const guild_id = guildObj.id;
			const guild_name = guildObj.name;
			const guild_icon = guildObj.iconURL();
			const guild_ownerObj = await guildObj.fetchOwner();
			const guild_owner = guild_ownerObj.user.tag;
			const guild_owner_id = guildObj.ownerId;
			const guild_member_count = guildObj.memberCount;
			const guild_member_count_human = guildObj.memberCount.toLocaleString();
			const guild_description = guildObj.description || '"No description provided."';
			connection.query(`SELECT * FROM server WHERE id = ${guild}`, function(err, rows) {
				if (err) {
					client.emit('error', err);
					throw err;
				}
				if (rows.length === 0) {
					connection.query(`INSERT INTO server (id, name, icon_url, owner, owner_id, member_count, member_count_human, description) VALUES (${guild_id}, '${guild_name}', '${guild_icon}', '${guild_owner}', ${guild_owner_id}, ${guild_member_count}, ${guild_member_count_human}, ${guild_description})`, function(err) {
						if (err) {
							client.emit('error', err);
							throw err;
						}
					});
				} else {
					connection.query(`UPDATE server SET name = "${guild_name}", icon_url = "${guild_icon}", owner = "${guild_owner}", owner_id = ${guild_owner_id}, member_count = ${guild_member_count}, member_count_human = ${guild_member_count_human}, description = ${guild_description} WHERE id = ${guild}`, function(err) {
						if (err) {
							client.emit('error', err);
							throw err;
						}
					});
				}
			});
			console.log(chalk.green('CRON INFO'), `Stats collected for ${guild}`);
			client.channels.cache.get(config.testChannelId).send(`Stats collected for ${guild}`);
		}
	});
};