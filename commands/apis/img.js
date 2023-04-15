const {
  EmbedBuilder,
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");

const FormData = require("form-data");
const axios = require("axios");

const got = require("got");
const concat = require("concat-stream");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("img")
    .setDescription("Generate an Image.")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("Image prompt").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reference")
        .setDescription("Reference image URL")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("strength")
        .setDescription("Strength of the img2img changes (0.0 - 1.0)")
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt");
    const ref_url = interaction.options.getString("reference");
    const strength = interaction.options.getString("strength");

    const strengthCheck = strength > 1 || strength < 0;

    if (strengthCheck) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("Strength must be between 0.0 and 1.0")
        .setColor("#c229e3")
        .setFooter({
          text: "Gang Słoni",
          iconURL: "https://i.imgur.com/JRl8WjV.png",
        })
        .setTimestamp();

      interaction.editReply({ embeds: [embed] });
    }

    if (ref_url) {
      const ref_img = await axios.get(ref_url, { responseType: "arraybuffer" });
      const refBuffer = Buffer.from(ref_img.data);

      const data = new FormData();
      data.append("prompt", prompt);
      data.append("init_image", refBuffer, "file.png");
      data.append("strength", strength || "0.5");

      data.pipe(
        concat({ encoding: "buffer" }, (buf) => {
          const options = {
            method: "POST",
            url: "https://dezgo.p.rapidapi.com/image2image",
            headers: {
              "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
              "X-RapidAPI-Host": "dezgo.p.rapidapi.com",
              ...data.getHeaders(),
            },
            data: buf,
            responseType: "arraybuffer",
          };

          axios
            .request(options)
            .then(function (response) {
              const buffer = Buffer.from(response.data);

              const file = new AttachmentBuilder(buffer, { name: "image.png" });

              const embed = new EmbedBuilder()
                .setTitle("Image")
                .setDescription(
                  `Preset: Reference Image (${
                    strength || "0.5"
                  }) | Prompt: ${prompt} | Reference: ${ref_url}`
                )
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
        })
      );
    } else {
      const encodedParams = new URLSearchParams();
      encodedParams.append("model", "epic_diffusion_1_1");
      encodedParams.append(
        "negative_prompt",
        "ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, blurry, bad anatomy, blurred, watermark, grainy, signature, cut off, draft"
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
    }
  },
};
