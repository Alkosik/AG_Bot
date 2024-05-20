const { EmbedBuilder } = require("discord.js");
const chalk = require("chalk");
const config = require("../config.json");
const snooze = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const talkedRecently = new Set();

const { MongoClient, ServerApiVersion } = require("mongodb");
const mongoClient = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
mongoClient.connect((err) => {
  if (err) return console.log(chalk.redBright("DB ERROR"), err);
  console.log(
    chalk.greenBright("DB INIT INFO"),
    "MongoDB connection estabilished."
  );
});

module.exports = {
  name: "messageCreate",
  async execute(message, client) {
    const database = mongoClient.db("discord");
    const users = database.collection("users");
    const daily_messages = database.collection("daily_messages");
    if (message.channel.type == "DM") {
      if (message.author.bot) return;
      return client.channels.cache
        .get(config.testChannelId)
        .send(
          "**DM Recieved** - " +
            message.author.username +
            ": " +
            message.content
        );
    }

    // check what guild the message is from
    if (message.guildId != 943590896820162591) return;

    if (
      message.channelId == 1107624002664538162 ||
      message.channelId == 943604581265461279
    ) {
      message.react("👍");
      message.react("👎");
    }

    function generateXp() {
      return Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    }

    function escape(text) {
      return text.replace(/'|\$|\[|\]/g, "\\$&");
    }

    if (!message.author.bot && !talkedRecently.has(message.author.id)) {
      const query = { _id: message.author.id };
      const userObj = await users.findOne(query);

      // Update daily messages (Time-Series Data)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daily_message_query = {
        _id: message.author.id + today.getTime(),
      };

      const daily_message_obj = await daily_messages.findOne(
        daily_message_query
      );

      if (!daily_message_obj) {
        await daily_messages.insertOne({
          _id: message.author.id + today.getTime(),
          messages: 1,
          created: Date.now(),
        });
      } else {
        await daily_messages.updateOne(daily_message_query, {
          $set: {
            messages: daily_message_obj.messages + 1,
          },
        });
      }

      if (!userObj) {
        await users.insertOne({
          _id: message.author.id,
          username: escape(message.author.username),
          discriminator: message.author.discriminator,
          avatar: message.author.avatar,
          xp: generateXp(),
          level: 1,
          messages: 1,
          updated: Date.now(),
          created: Date.now(),
        });
        return console.log(
          chalk.greenBright("DB INFO"),
          "New user created. - " + message.author.username
        );
      } else {
        const originalXp = userObj.xp;
        const newXp = originalXp + generateXp();
        const nextLvl = userObj.level * 1000;

        await users.updateOne(query, {
          $set: {
            username: escape(message.author.username),
            discriminator: message.author.discriminator,
            avatar: message.author.avatar,
            xp: newXp,
            messages: userObj.messages + 1,
            updated: Date.now(),
          },
        });

        if (nextLvl <= newXp) {
          await users.updateOne(query, {
            $set: {
              level: userObj.level + 1,
            },
          });

          // Level up message
          (async () => {
            const lvlup = new EmbedBuilder()
              .setFooter(
                "G-MEH",
                "https://i.ibb.co/rk0Z6Mb/Grupfdgggdrszga-1.png"
              )
              .setDescription(
                `sheeeesh, ${message.author.username} you are now at level ${
                  userObj.level + 1
                }`
              )
              .setColor("#B512E6");
            const lvlupmsg = await message.channel.send({ embeds: [lvlup] });
            await snooze(5000);
            lvlupmsg.delete().catch((error) => {
              // Only log the error if it is not an Unknown Message error
              if (error.code !== 10008) {
                console.error("Failed to delete the lvlup message:", error);
              }
            });
          })();
        }

        if (message.author.id != client.user.id) {
          talkedRecently.add(message.author.id);
          setTimeout(() => {
            talkedRecently.delete(message.author.id);
          }, 15000);
        }
      }
    }
  },
};
