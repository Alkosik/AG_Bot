// + Init
const fs = require('fs');
const chalk = require('chalk');
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
const config = require('./config.json');

// + Discord
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const myIntents = new Intents();
myIntents.add([Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MEMBERS]);
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
const mysql = require('mysql');

// + Other non-packages
let currently_playing = false;

const connection = mysql.createConnection({
	host: process.env.HOST,
	user: process.env.USER,
	password: process.env.PASSWORD,
	database: 'www5056_gsmaindb',
});

// * Collections
client.commands = new Collection();

connection.connect(function(err) {
	console.log(chalk.green('INIT INFO'), 'Connecting to db...');
	if (err) throw err;
	console.log(chalk.green('INIT INFO'), 'Database connection established');
});


// #region Command Handler
console.log(chalk.green('INIT INFO'), 'Started commands initialization');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const modCommandFiles = fs.readdirSync('./commands/mod').filter(file => file.endsWith('.js'));
const utilCommandFiles = fs.readdirSync('./commands/utility').filter(file => file.endsWith('.js'));
const funCommandFiles = fs.readdirSync('./commands/fun').filter(file => file.endsWith('.js'));
const apiCommandFiles = fs.readdirSync('./commands/apis').filter(file => file.endsWith('.js'));

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

for (const file of apiCommandFiles) {
	const command = require(`./commands/apis/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (config.commandsDisabled == true && interaction.commandName != 'disablecommands') return interaction.reply('Interakcje zostały wyłączone na czas testów.');
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
	require(String(newCron))(config, client, chalk);
	console.log(chalk.green('CRON INFO'), 'Loaded ' + file.slice(0, -3));
}
// #endregion

client.login(process.env.TOKEN);

// Voice
client.on('voiceStateUpdate', (oldState, newState) => {
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
		const resource = createAudioResource('./3435.mp3');

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
					console.error(chalk.red('ERROR'), 'Failed to delete the warn message during link removal:', error);
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