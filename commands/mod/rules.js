const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Lists the rules of the server.")
    .addStringOption((option) =>
      option
        .setName("rule")
        .setDescription("Rule number to display.")
        .setRequired(false)
        .addChoices(
          { name: "1", value: "0" },
          { name: "2", value: "1" },
          { name: "3", value: "2" },
          { name: "4", value: "3" },
          { name: "5", value: "4" },
          { name: "6", value: "5" },
          { name: "7", value: "6" },
          { name: "8", value: "7" },
          { name: "9", value: "8" },
          { name: "10", value: "9" },
          { name: "11", value: "10" },
          { name: "12", value: "11" },
          { name: "13", value: "12" },
          { name: "14", value: "13" },
          { name: "15", value: "14" },
          { name: "16", value: "15" }
        )
    ),
  async execute(interaction) {
    if (
      !interaction.member.roles.cache.some((r) => r.name === "Administrator") &&
      !interaction.member.roles.cache.some((r) => r.name === "Moderator") &&
      !interaction.member.roles.cache.some((r) => r.name === "Staff")
    ) {
      await interaction.reply("Co ty kurwa chcesz zrobic powiedz ty mi");
    }

    const rules = [
      "Respect everyone, regardless if you like them. Don't be vile to people inside or outside of the server.",
      "Use common sense. Don't try to find loopholes and be surprised when you're banned. If you do some dumb shit, we will ban you.",
      "Don't advertise other Discord servers here, other than the ones we're partnered with.",
      "Gore, pornography, and other NSFW content is prohibited on this server. Suggestive memes are allowed.",
      "Use each channel in accordance with its intended use. There is no tolerance to not following this rule.",
      "If you need support, use the ⁠🆘support-guide or the ⁠🆘support chat.",
      "Don't send a lot of small messages right after each other. Do not disrupt chat by spamming.",
      "Don't post software/crack download links without staff approval.",
      "All music or art posted must be yours. No AI or plagiarism.",
      "English only!",
      "If you need assistance, contact the appropriate staff. Don't contact moderators for support or support staff for moderation.",
      "Respect staff. Staff members here to help you, so don't be mean to them unless you want them to be mean to you.",
      "Don't beg for roles.",
      "Follow Discord TOS. Breaking it will get you permabanned",
      "Do not send direct messages to moderators, support, or admins regarding premium membership. Ask @Alkosik about that!",
      "No posting beats",
    ];

    const rule = interaction.options.getString("rule");

    if (rule) {
      const ruleEmbed = new EmbedBuilder()
        .setTitle(`Rule #${Number(rule) + 1}`)
        .setDescription(rules[rule])
        .setColor("#FF0000");
      await interaction.reply({ embeds: [ruleEmbed] });
    } else {
      const descriptionString = rules.map(
        (rule, index) => `**Rule #${index + 1}**\n${rule}`
      );
      const ruleEmbed = new EmbedBuilder()
        .setTitle("G-MEH Rules")
        .setDescription(descriptionString.join("\n\n"))
        .setColor("#FF0000");
      await interaction.reply({ embeds: [ruleEmbed] });
    }
  },
};
