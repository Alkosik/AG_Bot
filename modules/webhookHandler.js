const express = require('express');
const app = express();
const request = require('request');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/webhook', async (req, res) => {
	const Payload = req.body;
	// Respond To Heroku Webhook
	res.sendStatus(200);

	const options = {
		method: 'POST',
		url:
       `https://discord.com/api/webhooks/${process.env.WEBHOOK_URL}`,
		headers: {
			'Content-type': 'application/json',
		},
		// Format JSON DATA
		body: JSON.stringify({
			content: `Webhook test ${Payload.data.app.name} was just triggered`,
		}),
	};
	request(options, function(error, response) {
		if (error) throw new Error(error);
		console.log(response);
	});
});
app.listen(3000, () => console.log('Webhook Handler is running on port 3000'));