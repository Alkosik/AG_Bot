const { MessageEmbed } = require('discord.js');
const chalk = require('chalk');



module.exports = {
	name: 'messageCreate',
	execute(message, mysql) {
		console.log(message.content);
	},
};