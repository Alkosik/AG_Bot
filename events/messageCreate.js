const { EmbedBuilder } = require("discord.js");
const chalk = require("chalk");
const config = require("../config.json");
const snooze = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const talkedRecently = new Set();

const { MongoClient, ServerApiVersion } = require("mongodb");
const e = require("express");
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
    const messages = database.collection("messages");
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

      // Insert to messages (Time-Series Data)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await messages.insertOne({
        date: new Date(),
        _id: message.author.id,
        metadata: {
          channel: message.channelId,
          length: message.content.length,
        },
      });

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

          // Assign lvl role
          const member = message.guild.members.cache.get(message.author.id);
          switch (userObj.level + 1) {
            case 5:
              member.roles.add("1075882616210849882");
              break;
            case 10:
              member.roles.add("1075872324504530975");
              member.roles.remove("1075882616210849882");
              break;
            case 20:
              member.roles.add("1076152193956192407");
              member.roles.remove("1075872324504530975");
              break;
            case 30:
              member.roles.add("1076155866828525578");
              member.roles.remove("1076152193956192407");
              break;
            case 40:
              member.roles.add("1076229190560522381");
              member.roles.remove("1076155866828525578");
              break;
            case 50:
              member.roles.add("1076228333697765416");
              member.roles.remove("1076229190560522381");
              break;
          }

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
