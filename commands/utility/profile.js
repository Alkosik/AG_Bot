const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const chalk = require("chalk");

const snooze = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    "MongoDB connection estabilished. - /profile"
  );
});

const { getAverageColor } = require("fast-average-color-node");

function generateProgressBar(currentValue, maxValue) {
  const barLength = 40;
  // const percentage = Math.floor((currentValue / maxValue) * 100);
  const progress = Math.floor((barLength * currentValue) / maxValue);
  const progressBar = `${"█".repeat(progress)}${"░".repeat(
    barLength - progress
  )}`;

  return `${progressBar}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Check your profile. (or someone else's)")
    .addUserOption((option) =>
      option
        .setName("person")
        .setDescription("someone else's profile")
        .setRequired(false)
    ),
  async execute(interaction) {
    let person = interaction.options.getMember("person");
    if (!person) {
      person = interaction.member;
    }
    await interaction.deferReply();
    const database = mongoClient.db("discord");
    const users = database.collection("users");
    const query = { _id: person.id };
    const userObj = await users.findOne(query);

    const nextLvl = userObj.level * 1000;

    // const top = topRows.findIndex(row => row.id == person.id) + 1;
    snooze(1500).then(() => {
      if (!userObj) {
        interaction.editReply("404");
      } else {
        getAverageColor(person.user.avatarURL({ dynamic: true })).then(
          (color) => {
            const ProfileEmbed = new EmbedBuilder()
              .setColor(color.hex)
              .setAuthor({
                name: `${person.user.username}`,
                iconURL: person.user.avatarURL({ dynamic: true }),
              })
              // .setTitle(`${person.user.username}#${person.user.discriminator}`)
              .addFields(
                {
                  name: "Level",
                  value: userObj.level.toLocaleString(),
                  inline: true,
                },
                {
                  name: "Xp",
                  value: userObj.xp.toLocaleString(),
                  inline: true,
                },
                {
                  name: "Messages",
                  value: userObj.messages.toLocaleString(),
                  inline: true,
                },
                {
                  name: "Progress",
                  value: generateProgressBar(userObj.xp, nextLvl),
                }
              )
              // .setThumbnail(person.user.avatarURL({ dynamic: true }))
              .setTimestamp()
              .setFooter({
                text: "G-MEH",
                iconURL: "https://i.imgur.com/KCMddI7.png",
              });

            interaction.editReply({ embeds: [ProfileEmbed] });
          }
        );
      }
    });
  },
};
