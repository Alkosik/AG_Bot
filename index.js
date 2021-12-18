// + Init
const fs = require('fs');
const chalk = require('chalk');
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
const config = require('./config.json');
exports.config = config;
// const admin = require('firebase-admin');

// + Discord
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const myIntents = new Intents();
myIntents.add([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS]);
const client = new Client({ intents: myIntents });
exports.client = client;
const { joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');

// + Webserver
// eslint-disable-next-line no-unused-vars
const webserver = require('./modules/webserver.js');

// + Firebase
// const serviceAccount = require('./gang-sloni-app-firebase-adminsdk-obr28-0c7efef094.json');

// + Environment
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
	console.log(chalk.greenBright('INIT INFO'), `Current environment: ${process.env.NODE_ENV}`);
}

// + Other
const mysql = require('mysql');
const { Player } = require('discord-player', {
	ytdlOptions: {
		quality: 'highestaudio',
		highWaterMark: 1 << 25,
	},
});

// + Other non-packages
let currently_playing = false;
const { registerPlayerEvents } = require('./events/player/events');
client.player = new Player(client);

let connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: 'www5056_gsmaindb',
});

function handleDisconnect() {
	console.log(chalk.green('DB INFO'), 'Reconnecting to database...');
	client.channels.cache.get(config.testChannelId).send('Reconnecting to database...');
	connection = mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: 'www5056_gsmaindb',
	});
	console.log(chalk.green('DB INFO'), 'Reconnected to database.');
	client.channels.cache.get(config.testChannelId).send('Reconnected to database.');
}

// * Collections
client.commands = new Collection();

connection.connect(function(err) {
	console.log(chalk.green('DB INFO'), 'Estabilishing database connection...');
	if (err) throw err;
	console.log(chalk.green('DB INFO'), 'Database connection established');
});

connection.on('error', function(err) {
	console.log(chalk.red('DB ERROR'), err);
	if (err.code === 'PROTOCOL_CONNECTION_LOST') {
		client.channels.cache.get(config.testChannelId).send('**Fatal database error** - Server closed the connection. Disconnect handling initiated.');
		handleDisconnect();
	} else {
		client.channels.cache.get(config.testChannelId).send('**Database connection error encountered**');
		throw err;
	}
});


// #region Command Handler
console.log(chalk.green('INIT INFO'), 'Started commands initialization');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const modCommandFiles = fs.readdirSync('./commands/mod').filter(file => file.endsWith('.js'));
const utilCommandFiles = fs.readdirSync('./commands/utility').filter(file => file.endsWith('.js'));
const funCommandFiles = fs.readdirSync('./commands/fun').filter(file => file.endsWith('.js'));
const apiCommandFiles = fs.readdirSync('./commands/apis').filter(file => file.endsWith('.js'));
const musicCommandFiles = fs.readdirSync('./commands/music').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

for (const file of modCommandFiles) {
	const command = require(`./commands/mod/${file}`);
	client.commands.set(command.data.name, command);
}

for (const file of utilCommandFiles) {
	const command = require(`./commands/utility/${file}`);
	client.commands.set(command.data.name, command);
}

for (const file of funCommandFiles) {
	const command = require(`./commands/fun/${file}`);
	client.commands.set(command.data.name, command);
}

for (const file of apiCommandFiles) {
	const command = require(`./commands/apis/${file}`);
	client.commands.set(command.data.name, command);
}

for (const file of musicCommandFiles) {
	const command = require(`./commands/music/${file}`);
	client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (config.commandsDisabled == true && interaction.commandName != 'disablecommands') return interaction.reply('Interakcje zostały wyłączone na czas testów.');
	if (!command) return;

	try {
		await command.execute(interaction, connection);
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
console.log(chalk.green('INIT INFO'), 'Started events initialization');
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client, connection));
	}
}
// #endregion

// #region Cron Handler
console.log(chalk.green('INIT INFO'), 'Started cron jobs initialization');
const cronFiles = fs.readdirSync('./cronjobs').filter(file => file.endsWith('.js'));

for (const file of cronFiles) {
	const cron = `./cronjobs/${file}`;
	const newCron = cron.slice(0, -3);
	require(String(newCron))(config, client, chalk, connection);
	console.log(chalk.green('CRON INFO'), 'Loaded ' + file.slice(0, -3));
}
// #endregion

client.login(process.env.TOKEN);

// Voice
client.on('voiceStateUpdate', (oldState, newState) => {
	function getRandomInt(max) {
		return Math.floor(Math.random() * max);
	}
	const channel = client.channels.cache.get('790343982877900820');
	if (newState.channelId === '790343982877900820' && newState.id != '883767138433765386' && currently_playing == false) {
		console.log(chalk.green('VOICE INFO'), 'Connecting to voice channel.');
		const voiceConnection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		});
		console.log(chalk.green('VOICE INFO'), 'Succesfully connected to voice channel.');

		const audioPlayer = createAudioPlayer();
		let resource;
		if (getRandomInt(2) == 1) {
			resource = createAudioResource('./3435.mp3');
		} else {
			resource = createAudioResource('./cwel.mp3');
		}

		// eslint-disable-next-line no-unused-vars
		const subscription = voiceConnection.subscribe(audioPlayer);

		voiceConnection.on(VoiceConnectionStatus.Ready, () => {
			console.log(chalk.green('VOICE INFO'), 'The connection has entered the Ready state.');
			audioPlayer.play(resource);
			currently_playing = true;
			console.log(chalk.green('VOICE INFO'), 'Started playing.');
		});
	// eslint-disable-next-line no-empty
	} else if (currently_playing == true && oldState.channelId === '790343982877900820' && channel.members.size == 1) {
		const voiceConnection = getVoiceConnection(channel.guild.id);
		voiceConnection.destroy();
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
					console.error(chalk.red('ERROR'), 'Failed to delete the warn message during link removal: ', error);
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

// Discord Player
registerPlayerEvents(client.player);