const cron = require("node-schedule");
const { google } = require("googleapis");
const index = require("../index");

module.exports = (config, client, chalk) => {
  console.log(chalk.green("CRON INFO"), "Live Check starting");
  if (true)
    return console.log(
      chalk.yellow("CRON PAUSED"),
      "Manually disabled. (CRON: Live Check)"
    );
  cron.scheduleJob("*/30 * * * *", function () {
    console.log(chalk.green("CRON INFO"), "Checking for live...");
    // Check if a youtube channel is live
    const youtube = google.youtube({
      version: "v3",
      auth: process.env.API_YOUTUBE_KEY,
    });

    youtube.search.list(
      {
        part: "snippet",
        channelId: "UCXc1c6bs1-pLECw90LYLL4A",
        type: "video",
        eventType: "live",
      },
      (err, data) => {
        if (err) {
          console.log(chalk.red("CRON ERROR"), "Error checking for live:", err);
        } else if (data.data.items[0] == undefined) {
          console.log(chalk.yellow("CRON INFO"), "No live detected");
          index.stream = false;
        } else if (data.data.items[0].snippet.liveBroadcastContent === "live") {
          console.log(chalk.green("CRON INFO"), "Live detected");
          index.stream = true;
        }
      }
    );
  });
};
