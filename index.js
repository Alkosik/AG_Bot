const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
    console.log(`Current environment: ${process.env.NODE_ENV}`)
}

client.login(process.env.TOKEN);