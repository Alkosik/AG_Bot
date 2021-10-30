module.exports = {
	apps : [{
		script: 'index.js',
		watch: '.',
	}, {
		script: './modules/webhookHandler.js',
		watch: ['./modules/webhookHandler.js'],
	}],

	deploy : {
		production : {
			user : 'SSH_USERNAME',
			host : 'SSH_HOSTMACHINE',
			ref  : 'origin/master',
			repo : 'GIT_REPOSITORY',
			path : 'DESTINATION_PATH',
			'pre-deploy-local': '',
			'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
			'pre-setup': '',
		},
	},
};