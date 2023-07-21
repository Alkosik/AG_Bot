const cron = require("node-schedule");

const { MongoClient, ServerApiVersion } = require("mongodb");

const request = require("request");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

module.exports = (config, client, chalk) => {
  console.log(chalk.green("CRON INFO"), "Member Check initiating");
  if (true)
    return console.log(
      chalk.yellow("CRON PAUSED"),
      "Manually disabled. (CRON: Member Check)"
    );
  cron.scheduleJob("*/5 * * * *", function () {
    console.log(chalk.green("CRON INFO"), "Member Check starting");
    const mongoClient = new MongoClient(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
    });
    mongoClient.connect((err) => {
      if (err) return console.log(chalk.redBright("WEBSERVER DB ERROR"), err);
      console.log(
        chalk.greenBright("WEBSERVER INIT INFO"),
        "MongoDB connection estabilished."
      );
    });
    console.log(chalk.green("CRON INFO"), "Getting latest members...");

    const database = mongoClient.db("main");
    const users = database.collection("users");

    const options = {
      method: "GET",
      url: "https://developers.buymeacoffee.com/api/v1/subscriptions?status=active",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${process.env.BMAC_KEY}`,
      },
    };

    request(options, async function (error, r_response) {
      if (error) throw new Error(error);
      const json = JSON.parse(r_response.body);
      let current_iteration = 0;
      for (const element of json.data) {
        current_iteration++;
        console.log(
          chalk.greenBright("MEMBER UPDATE INFO"),
          "Updating flags for " + element.payer_email
        );
        const query = { email: element.payer_email.toLowerCase() };
        try {
          await users.updateOne(query, {
            $set: {
              flags: "premium",
              subscription: {
                id: element.subscription_id,
                name: element.payer_name,
              },
            },
          });
        } catch (update_error) {
          console.log(
            chalk.redBright("MEMBER UPDATE FAIL"),
            "Updating flags for " + element.payer_email + " failed"
          );
        }
      }
      if (current_iteration >= json.data.length) {
        mongoClient.close();
        return console.log(chalk.green("CRON INFO"), "Member Check finished");
      }
    });
  });
};
