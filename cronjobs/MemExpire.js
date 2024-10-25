const cron = require("node-schedule");

const request = require("request");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

module.exports = (config, client, chalk) => {
  console.log(chalk.green("CRON INFO"), "Member Expire initiating");
  if (false)
    return console.log(
      chalk.yellow("CRON PAUSED"),
      "Manually disabled. (CRON: Member Check)"
    );
  cron.scheduleJob("0 */1 * * *", async function () {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    let thirtyDaysAgo = new Date(Date.now() - 2592000000);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 7);
    console.log(chalk.green("CRON INFO"), "Member Expire starting");
    const expired_subscriptions = await prisma.subscription.findMany({
      where: {
        active: true,
        timestamp: {
          lt: thirtyDaysAgo,
        },
      },
    });
    console.log(
      chalk.green("CRON INFO"),
      "Found " + expired_subscriptions.length + " expired subscriptions"
    );
    for (const subscription of expired_subscriptions) {
      console.log(
        chalk.greenBright("MEMBER EXPIRE INFO"),
        "Expiring subscription for " + subscription.email
      );
      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          active: false,
        },
      });
      await prisma.user.update({
        where: {
          id: subscription.userId,
        },
        data: {
          subscription_active: false,
        },
      });
    }
  });
};
