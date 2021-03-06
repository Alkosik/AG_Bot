const cron = require('node-schedule');
const cronitor = require('cronitor')(process.env.API_CRONITOR);
const monitor = new cronitor.Monitor('Stream Check', '* * * * *');
const { ApiClient } = require('@twurple/api');
const { ClientCredentialsAuthProvider } = require('@twurple/auth');

const { EmbedBuilder } = require('discord.js');

module.exports = (config, client, chalk) => {
	cron.scheduleJob('* * * * *', async function() {
		const clientId = process.env.API_TWITCH_ID;
		const clientSecret = process.env.API_TWITCH_SECRET;
		// const tokenData = JSON.parse(await fs.promises.readFile('./tokens.json'));

		const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);

		const apiClient = new ApiClient({ authProvider });
		// console.log(chalk.green('CRON INFO'), 'Checking...');
		async function isStreamLive(userName) {
			const user = await apiClient.users.getUserByName(userName);
			if (!user) {
				return false;
			}
			return await user.getStream() !== null;
		}

		if (await isStreamLive('grigori_rzannikov')) {
			const user = await apiClient.users.getUserByName('grigori_rzannikov');
			const stream = await user.getStream();

			const streamEmbed = new EmbedBuilder()
				.setAuthor('Strim jest kurwa - grigori_rzannikov')
				.setColor('#ffffff')
				.setTimestamp()
				.setThumbnail(stream.getThumbnailUrl(128, 128))
				.setDescription('https://www.twitch.tv/grigori_rzannikov')
				.setTitle(stream.title)
				.setFooter({ text: 'Gang Słoni', iconURL: 'https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png' });
			client.channels.cache.get(config.announceChannelId).send({ embeds: [streamEmbed] });
			console.log(chalk.green('CRON INFO'), 'Grigori is live!');
		} else {
			return;
		}
		monitor.ping({ message: 'Streams Checked' });
	});
};