// + Init
const fs = require('fs');
const chalk = require('chalk');
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
const config = require('./config.json');

// + Discord
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const myIntents = new Intents();
myIntents.add([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]);
const client = new Client({ intents: myIntents });
const { joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');

// + Webserver
const http = require('http');
const server = http.createServer();

// + Environment
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
	console.log(chalk.greenBright('INIT INFO'), `Current environment: ${process.env.NODE_ENV}`);
}

// + Other
const schedule = require('node-schedule');

// + Other non-packages
const main_channel_id = config.mainChannelId;
let currently_playing = false;

// * Collections
client.commands = new Collection();


// #region Command Handler
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const modCommandFiles = fs.readdirSync('./commands/mod').filter(file => file.endsWith('.js'));
const utilCommandFiles = fs.readdirSync('./commands/utility').filter(file => file.endsWith('.js'));
const funCommandFiles = fs.readdirSync('./commands/fun').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

for (const file of modCommandFiles) {
	const command = require(`./commands/mod/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

for (const file of utilCommandFiles) {
	const command = require(`./commands/utility/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

for (const file of funCommandFiles) {
	const command = require(`./commands/fun/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		const errEmbed = new MessageEmbed()
			.setTitle('Error')
			.setColor('RED');
		await interaction.reply({ embeds: [errEmbed], ephemeral: true });
	}
});
// #endregion

// #region Event Handler
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}
// #endregion


client.login(process.env.TOKEN);

// Cron Jobs
// eslint-disable-next-line no-unused-vars
const AlbertReminder = schedule.scheduleJob('1 1 * * *', function() {
	(async () => {
		console.log(chalk.green('CRON INFO'), 'Initiating Albert\'s Reminder.');
		const janus = client.emojis.cache.find(emoji => emoji.name === 'JanusChamp');
		const pepo_love = client.emojis.cache.find(emoji => emoji.name === 'PepoLove');

		const mood = Math.random() * (20 - 1) + 1;
		const moodFloored = Math.floor(mood);
		if (moodFloored >= 10) {
			client.channels.cache.get(main_channel_id).send(`<@430140838345965595>, kocham cie ${pepo_love}`);
		} else if (moodFloored < 3) {
			client.channels.cache.get(main_channel_id).send(`<@430140838345965595>, kocham cie ${pepo_love} ~ Kacperek`);
		} else {
			client.channels.cache.get(main_channel_id).send(`<@430140838345965595>, nienawidze cie ${janus}`);

		}
	})();
});

// Voice
client.on('voiceStateUpdate', (oldState, newState) => {
	const channel = client.channels.cache.get('790343982877900820');
	if (newState.channelId === '790343982877900820' && newState.id != '883767138433765386' && currently_playing == false) {
		console.log(chalk.green('VOICE INFO'), 'Connecting to voice channel.');
		const connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		});
		console.log(chalk.green('VOICE INFO'), 'Succesfully connected to voice channel.');

		const audioPlayer = createAudioPlayer();
		const resource = createAudioResource('./3435.mp3');

		// eslint-disable-next-line no-unused-vars
		const subscription = connection.subscribe(audioPlayer);

		connection.on(VoiceConnectionStatus.Ready, () => {
			console.log(chalk.green('VOICE INFO'), 'The connection has entered the Ready state.');
			audioPlayer.play(resource);
			currently_playing = true;
			console.log(chalk.green('VOICE INFO'), 'Started playing.');
		});
	// eslint-disable-next-line no-empty
	} else if (currently_playing == true && oldState.channelId === '790343982877900820' && channel.members.size == 1) {
		const connection = getVoiceConnection(channel.guild.id);
		connection.destroy();
		console.log(chalk.green('VOICE INFO'), 'Connection closed.');
		currently_playing = false;
	}
});


// messageCreate Event
client.on('messageCreate', async message => {
	// Link detection
	(async () => {
		if (message.content.toLowerCase().includes('discord.gg/' || 'discordapp.com/invite/')) {
			let sentwarnmsg;
			const warnmsg = new MessageEmbed()
				.setThumbnail('https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png')
				.setTitle('Link usunięty.')
				.setDescription('Regulamin Art. 4 §6')
				.setColor('RED');
			message.delete()
				.then(sentwarnmsg = await message.channel.send(warnmsg));
			await snooze(5000);
			sentwarnmsg.delete().catch(error => {
			// Only log the error if it is not an Unknown Message error
				if (error.code !== 10008) {
					console.error('Failed to delete the message:', error);
				}
			});
		}
	})();

	// Other
	if (message.content.toLowerCase().startsWith('she') && message.content.toLowerCase().endsWith('esh') && !message.author.bot) {
		message.reply('Sheesh!');
	}

	if (message.content.toLowerCase().includes('yuh') && !message.author.bot) {
		message.reply('Yuh');
	}
});

// Webserver
server.listen(process.env.PORT, () => {
	console.log(chalk.greenBright('WEB INFO'), 'Server listening on port: ' + process.env.PORT);
});