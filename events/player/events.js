module.exports.registerPlayerEvents = (player) => {

	player.on('error', (queue, error) => {
		console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
		queue.metadata.send(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
	});
	player.on('connectionError', (queue, error) => {
		console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
		queue.metadata.send(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
	});

	player.on('trackStart', (queue, track) => {
		queue.metadata.send(`Teraz leci: **${track.title}** na kanale **${queue.connection.channel.name}**!`);
	});

	player.on('trackAdd', (queue, track) => {
		queue.metadata.send(`Dodano do kolejki: **${track.title}**`);
	});

	player.on('botDisconnect', (queue) => {
		queue.metadata.send('Manual disconnect detected - Clearing queue...');
	});

	player.on('channelEmpty', (queue) => {
		queue.metadata.send('Empty vc detected - Leaving...');
	});

	player.on('queueEnd', (queue) => {
		queue.metadata.send('Kolejka zakończona');
	});

};