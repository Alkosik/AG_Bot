const {
  EmbedBuilder,
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const axios = require("axios");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("img")
    .setDescription("Generate an Image.")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("Image prompt").setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt");

    const encodedParams = new URLSearchParams();
    encodedParams.append("model", "epic_diffusion_1_1");
    encodedParams.append(
      "negative_prompt",
      "ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, blurry, bad anatomy, blurred, watermark, grainy, signature, cut off, draft"
    );
    encodedParams.append("upscale", "1");
    encodedParams.append("sampler", "euler_a");
    encodedParams.append("steps", "30");
    encodedParams.append("guidance", "7");
    encodedParams.append("prompt", `music album cover, ${prompt}`);

    const options = {
      method: "POST",
      url: "https://dezgo.p.rapidapi.com/text2image",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "dezgo.p.rapidapi.com",
      },
      data: encodedParams,
      responseType: "arraybuffer",
    };

    axios
      .request(options)
      .then(function (response) {
        const buffer = Buffer.from(response.data);

        const file = new AttachmentBuilder(buffer, { name: "image.png" });

        const embed = new EmbedBuilder()
          .setTitle("Image")
          .setDescription(`Preset: Music Album Cover | Prompt: ${prompt}`)
          .setImage("attachment://image.png")
          .setColor("#c229e3")
          .setFooter({
            text: "Gang Słoni",
            iconURL: "https://i.imgur.com/JRl8WjV.png",
          })
          .setTimestamp();

        interaction.editReply({ embeds: [embed], files: [file] });
      })
      .catch(function (error) {
        console.error(error);
      });
  },
};
