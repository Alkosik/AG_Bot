const cron = require('node-schedule');
// const cronitor = require('cronitor')(process.env.API_CRONITOR);
// const monitor = new cronitor.Monitor('Discord Heartbeat');

const { ApiClient } = require('@twurple/api');
const { ClientCredentialsAuthProvider } = require('@twurple/auth');

module.exports = (config, client, chalk) => {
	cron.scheduleJob('*/2 * * * *', async function() {
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
			client.channels.cache.get(config.announceChannelId).send('Grigori ma strima! https://www.twitch.tv/grigori_rzannikov');
			console.log(chalk.green('CRON INFO'), 'Grigori is live!');
		} else {
			return;
			// console.log(chalk.red('CRON INFO'), 'Grigori is not live!');
		}
	});
};