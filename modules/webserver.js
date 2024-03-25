const chalk = require("chalk");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  console.log(
    chalk.greenBright("WEBSERVER INIT INFO"),
    `Current environment: ${process.env.NODE_ENV}`
  );
}

const { ApolloServer } = require("apollo-server-express");
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
} = require("apollo-server-core");

const index = require("../index.js");

const config = index.config;
const client = index.client;

const schema = require("./schema");

const express = require("express");
const app = express();
const http = require("http");
const httpServer = http.createServer(app);
const server = new ApolloServer({
  typeDefs: schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginLandingPageDisabled(),
  ],
});
const request = require("request");
const bodyParser = require("body-parser");

const cors = require("cors");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const { RiotAPI, PlatformId } = require("@fightmegg/riot-api");
const rAPI = new RiotAPI(process.env.API_RIOT);
const { MongoClient, ServerApiVersion } = require("mongodb");
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

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function startServer() {
  await server.start();

  server.applyMiddleware({ app });

  const port = process.env.PORT || 3000;

  await new Promise((resolve) => httpServer.listen({ port: port }, resolve));

  console.log(
    chalk.green("WEBSERVER INIT INFO"),
    `Server listening at http://localhost:${port}`
  );
  console.log(
    chalk.green("GRAPHQL INIT INFO"),
    `GraphQL listening at http://localhost:${port}${server.graphqlPath}`
  );
}

startServer();

app.get("/", (req, res) => {
  return res.status(200).sendFile("./api.html", { root: __dirname });
});

app.post("/", (req, res) => {
  return res.send("POST HTTP method registered");
});

app.put("/", (req, res) => {
  return res.send("PUT HTTP method registered");
});

app.delete("/", (req, res) => {
  return res.send("DELETE HTTP method registered");
});

app.post("/kofi", async (req, res) => {
  console.log(chalk.greenBright("KO-FI INFO"), "New webhook received");
  const data = await req.body.data;

  console.log(data.verification_token);

  const verification_token = data.verification_token;
  const message_id = data.message_id;
  const timestamp = data.timestamp;
  const type = data.type;
  const name = data.from_name;
  const email = data.email;
  const tier = data.tier_name;

  if (verification_token != process.env.KOFI_TOKEN) {
    console.log(chalk.redBright("KO-FI ERROR"), "Unauthorized");
    return res.status(401).send("Unauthorized");
  }

  if (type !== "Subscription") {
    console.log(chalk.redBright("KO-FI ERROR"), "Not a subscription");
    return res.status(400).send("Not a subscription");
  } else {
    console.log(chalk.greenBright("KO-FI INFO"), "Subscription received");
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      await prisma.user.create({
        data: {
          email: email,
        },
      });
    }

    await prisma.subscription.create({
      data: {
        message_id: message_id,
        timestamp: timestamp,
        tier: tier,
        name: name,
        User: {
          connect: {
            email: email,
          },
        },
      },
    });

    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        subscription_active: true,
      },
    });

    return res.status(200).send("Subscription registered");
  }
});

app.post("/webhook", async (req, res) => {
  const Payload = req.body;
  let embed_name;
  let webhook_response;
  res.sendStatus(200);

  if (req.get("heroku-webhook-hmac-sha256")) {
    if (Payload.action == "create") {
      embed_name = `Build creation - ${Payload.data.app.name}`;
      webhook_response = `A new buld was created for **${Payload.data.app.name}** on behalf of **${Payload.data.user.email}** with the ID **${Payload.data.id}**`;
    } else if (
      Payload.action == "update" &&
      Payload.data.status == "succeeded"
    ) {
      embed_name = `Build success - ${Payload.data.app.name}`;
      if (Payload.data.release?.version) {
        webhook_response = `Last build of **${Payload.data.app.name}** finished with status **${Payload.data.status}**, creating release version **${Payload.data.release.version}**`;
      } else {
        webhook_response = `Last build of **${Payload.data.app.name}** finished with status **${Payload.data.status}**`;
      }
    } else {
      embed_name = "Build failure";
      webhook_response = "The build **failed**, just like you.";
    }
  } else if (req.get("X-Snipcart-RequestToken")) {
    if (Payload.eventName == "order.completed") {
      embed_name = "Order received";
      webhook_response = `Order received from **${Payload.content.user.billingAddressName}** with email **${Payload.content.user.email}** \nPayment: **${Payload.content.paymentStatus}**`;
    } else {
      return;
    }
  } else if (req.get("x-amz-sns-topic-arn")) {
    embed_name = "SNS Alert";
    webhook_response =
      "SNS Alert received - One of the alarms has been triggered";
  } else if (!req.get("heroku-webhook-hmac-sha256")) {
    if (Payload.monitor) {
      embed_name = "Monitor notification";
      webhook_response = `A monitor with the ID **${Payload.id}** and name **${Payload.monitor}** sent **${Payload.type}**. Description: ${Payload.description}`;
    } else {
      return;
    }
  }

  const options = {
    method: "POST",
    url: `https://discord.com/api/webhooks/${process.env.WEBHOOK_URL}`,
    headers: {
      "Content-type": "application/json",
    },
    // Format JSON DATA
    body: JSON.stringify({
      embeds: [
        {
          color: "11801317",
          title: embed_name,
          description: webhook_response,
          footer: {
            text: "Gang Słoni",
            icon_url: "https://i.imgur.com/JRl8WjV.png",
          },
        },
      ],
    }),
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    if (response.body.statusCode == 200)
      console.log(chalk.greenBright("WEBSERVER INFO"), "Webhook: successfull");
    if (response.body.statusCode == 204)
      console.log(chalk.greenBright("WEBSERVER INFO"), "Wenhook: No content");
  });
});

app.post("/bmac", async (req, res) => {
  res.sendStatus(200);
  const Payload = req.body;
  const data = Payload.data;

  const database = mongoClient.db("main");
  const users = database.collection("users");

  if (Payload.type == "membership.started") {
    console.log(
      chalk.greenBright("NEW MEMBER UPDATE INFO"),
      "Updating flags for " + data.supporter_email
    );
    try {
      const user = await users.findOne({
        email: data.supporter_email.toLowerCase(),
      });
      if (user) {
        users.updateOne(
          { email: data.supporter_email.toLowerCase() },
          {
            $set: {
              flags: "premium",
              subscription: {
                id: data.id,
                psp_id: data.psp_id,
                name: data.supporter_name,
                status: data.status,
                start_date: data.started_at,
                current_period_end: data.current_period_end,
                current_period_start: data.current_period_start,
              },
            },
          }
        );
      } else {
        users.insertOne({
          email: data.supporter_email.toLowerCase(),
          flags: "premium",
          subscription: {
            id: data.id,
            psp_id: data.psp_id,
            name: data.supporter_name,
            status: data.status,
            start_date: data.started_at,
            current_period_end: data.current_period_end,
            current_period_start: data.current_period_start,
          },
        });
      }
    } catch (err) {
      console.log(
        chalk.redBright("NEW MEMBER UPDATE FAIL"),
        "Updating flags for " + element.payer_email + " failed"
      );
      console.error(err);
    }
  } else if (Payload.type == "membership.updated") {
    console.log(
      chalk.greenBright("MEMBER UPDATE INFO"),
      "Updating flags for " + data.supporter_email
    );
    try {
      users.updateOne(
        { email: data.supporter_email },
        {
          $set: {
            subscription: {
              id: data.id,
              psp_id: data.psp_id,
              name: data.supporter_name,
              status: data.status,
              start_date: data.started_at,
              current_period_end: data.current_period_end,
              current_period_start: data.current_period_start,
              canceled_at: data.canceled_at,
              cancel_at_period_end: data.cancel_at_period_end,
            },
          },
        }
      );
    } catch (err) {
      console.log(
        chalk.redBright("MEMBER UPDATE FAIL"),
        "Updating flags for " + element.payer_email + " failed"
      );
      console.error(err);
    }
  } else if (Payload.type == "membership.cancelled") {
    console.log(
      chalk.greenBright("MEMBER UPDATE INFO"),
      "Updating flags for " + data.supporter_email
    );
    try {
      users.updateOne(
        { email: data.supporter_email },
        {
          $set: {
            flags: "none",
            subscription: {
              id: data.id,
              psp_id: data.psp_id,
              name: data.supporter_name,
              status: data.status,
              canceled: data.canceled,
              start_date: data.started_at,
              current_period_end: data.current_period_end,
              current_period_start: data.current_period_start,
              canceled_at: data.canceled_at,
              cancel_at_period_end: data.cancel_at_period_end,
            },
          },
        }
      );
    } catch (err) {
      console.log(
        chalk.redBright("MEMBER UPDATE FAIL"),
        "Updating flags for " + element.payer_email + " failed"
      );
      console.error(err);
    }
  }
});

// API or sum idk
app.get("/fetchMembers", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const options = {
    method: "GET",
    url: "https://developers.buymeacoffee.com/api/v1/subscriptions?status=active",
    headers: {
      "Content-type": "application/json",
      Authorization:
        "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5MTI5ZDIwMC1kYTdkLTRjY2MtOWQzZC01ODA0MTU0ZTgyMjYiLCJqdGkiOiIwNGE3ZGNlNTkyNWZkZWI4NDg4OGE3Mjg5ZjFkMDMwMTliM2FlNTVjMTA4NmQ1NjY0YjI0YzY0M2U3MjU3NTMwNjI4ZGJiNTRjMmQyZGI2NSIsImlhdCI6MTY3MjQwMjMyMSwibmJmIjoxNjcyNDAyMzIxLCJleHAiOjE2ODgxMjcxMjEsInN1YiI6IjIxODc4MzgiLCJzY29wZXMiOlsicmVhZC1vbmx5Il19.ST91EpUSgKdFvQnDPSWlE9qxRSisk8IKTYqlAmiZValV-UjJ0MI2glpBWxYnZro2nCqfQVW2ndmM_REGwxWFVVoM0RJ5aaBuFMJ1tS9JN2QgR3RKQXBrO9-N4pWXNMwFm6C5cH0t9jJqHu5X73aNO2UwnCUUnSgYHbEeVtGsqP-KiKgsYpBDmtWRhirAv3ulQt4_ZjuN7r1WGEUU5qDKSVfu4AqSMX4vBBPMkEqO4KVAlKzyyNWSNKkmeFCYdnzuwfYxyy8C_qGYZQ06KywUjD5UP9VSswPFegJNku8A-cxVdq5KA8T5-wLtKC2I_Eq_-_0gFfbJw69t5plTNYRNPi5mCgpls-gYV4JDVWfFh-EM8WiauPDOL49FBSrJ_KRzl1elYD5RPfCtJaYbyHVGt_OSSRIPkFKc1cr3ypbkzvtJ0t2QBj-La9xvEzjbSmrdsDD4jOcWPT-J7pipNeUnn7wxzNyUclrHBf7gpvyDxYxARbdQWmaFMcIVpQfcq5gVz87xlxGXtvidSuO8buNvpDpTQm4bbNBgXpw0IFrF34sytCeOfsDjWKJ3MeNPs7Hv9qiSJ0MsX-CBBWM4MP8Fx4xMv86G1EoqRKTiotisEPiZeKSZa62QjaHVw2n6sXJ4VDMyv0YOqTmJIyKzgXG8wINJjm_0Mqxl5t-JYBkKTjs",
    },
  };
  request(options, function (error, r_response) {
    if (error) throw new Error(error);
    console.log(r_response);
    const json = JSON.parse(r_response.body);
    const page_count = json.last_page;
    // eslint-disable-next-line prefer-const
    let data = json.data;
    for (let i = 0; i < page_count; i++) {
      const soptions = {
        method: "GET",
        url: `https://developers.buymeacoffee.com/api/v1/subscriptions?status=active?page=${i}`,
        headers: {
          "Content-type": "application/json",
          Authorization:
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5MTI5ZDIwMC1kYTdkLTRjY2MtOWQzZC01ODA0MTU0ZTgyMjYiLCJqdGkiOiIwNGE3ZGNlNTkyNWZkZWI4NDg4OGE3Mjg5ZjFkMDMwMTliM2FlNTVjMTA4NmQ1NjY0YjI0YzY0M2U3MjU3NTMwNjI4ZGJiNTRjMmQyZGI2NSIsImlhdCI6MTY3MjQwMjMyMSwibmJmIjoxNjcyNDAyMzIxLCJleHAiOjE2ODgxMjcxMjEsInN1YiI6IjIxODc4MzgiLCJzY29wZXMiOlsicmVhZC1vbmx5Il19.ST91EpUSgKdFvQnDPSWlE9qxRSisk8IKTYqlAmiZValV-UjJ0MI2glpBWxYnZro2nCqfQVW2ndmM_REGwxWFVVoM0RJ5aaBuFMJ1tS9JN2QgR3RKQXBrO9-N4pWXNMwFm6C5cH0t9jJqHu5X73aNO2UwnCUUnSgYHbEeVtGsqP-KiKgsYpBDmtWRhirAv3ulQt4_ZjuN7r1WGEUU5qDKSVfu4AqSMX4vBBPMkEqO4KVAlKzyyNWSNKkmeFCYdnzuwfYxyy8C_qGYZQ06KywUjD5UP9VSswPFegJNku8A-cxVdq5KA8T5-wLtKC2I_Eq_-_0gFfbJw69t5plTNYRNPi5mCgpls-gYV4JDVWfFh-EM8WiauPDOL49FBSrJ_KRzl1elYD5RPfCtJaYbyHVGt_OSSRIPkFKc1cr3ypbkzvtJ0t2QBj-La9xvEzjbSmrdsDD4jOcWPT-J7pipNeUnn7wxzNyUclrHBf7gpvyDxYxARbdQWmaFMcIVpQfcq5gVz87xlxGXtvidSuO8buNvpDpTQm4bbNBgXpw0IFrF34sytCeOfsDjWKJ3MeNPs7Hv9qiSJ0MsX-CBBWM4MP8Fx4xMv86G1EoqRKTiotisEPiZeKSZa62QjaHVw2n6sXJ4VDMyv0YOqTmJIyKzgXG8wINJjm_0Mqxl5t-JYBkKTjs",
        },
      };
      console.log("Fetching page " + i);
      request(soptions, function (serror, resp) {
        if (serror) throw new Error(serror);
        data.push(resp.body.data);
      });
    }
    return res.json(data);
  });
});

app.get("/memCount", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  console.log(
    chalk.greenBright("WEBSERVER INFO"),
    "Connection detected - memCount"
  );
  const guild = client.guilds.cache.get("510941195267080214");
  const memCount = guild.memberCount;
  res.json(memCount);
});

app.post("/checkBooster", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  console.log(
    chalk.greenBright("WEBSERVER INFO"),
    "Connection detected - checkBooster"
  );

  const guild = client.guilds.cache.get("943590896820162591");
  const member = guild.members.cache.get(req.body.id);

  if (!member) {
    res.status(404).send("Member not found");
  }

  if (member.roles.cache.has("988714918041767956")) {
    res.json(true);
  } else {
    res.json(false);
  }
});

app.get("/stream", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const stream = index.stream;
  res.json(stream);
});

app.post("/sendMessage", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const data = req.body;

  client.channels.cache.get(data.id).send(data.message);

  res.send(
    `Message registered. Content: ${data.message} | Channel ID: ${data.id}`
  );
});

app.post("/sendDM", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const data = req.body;

  const user = client.users.cache.get(data.id);
  user.send(data.message);

  res.send(
    `Direct Message registered. Content: ${data.message} | User ID: ${data.id} | Username: ${user.username}`
  );
  client.channels.cache
    .get(config.testChannelId)
    .send(`**DM Sent** - Ariana Grande -> ${user.username}: ${data.message}`);
});

// ---------------
//	 LEAGUE RATE
// ---------------

app.post("/search", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  let region;
  const data = req.body;

  if (data.name == undefined) {
    return res.status(400).send("No name provided");
  }

  if (data.region == undefined) {
    return res.status(400).send("No region provided");
  } else if (data.region == "eune") {
    region = PlatformId.EUNE1;
  } else if (data.region == "euw") {
    region = PlatformId.EUW1;
  } else if (data.region == "na") {
    region = PlatformId.NA1;
  }

  if (data.fresh === true) {
    updateSummoner();
  }

  const db = mongoClient.db("summoners").collection(data.region);

  async function updateSummoner() {
    const summoner = await rAPI.summoner.getBySummonerName({
      region: region,
      summonerName: data.name,
    });

    console.log(chalk.greenBright("UPDATING SUMMONER"), summoner.name);

    const summonerObj = {
      name: summoner.name,
      id: summoner.id,
      accountId: summoner.accountId,
      puuid: summoner.puuid,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      revisionDate: summoner.revisionDate,
      refreshDate: Date.now(),
    };

    db.updateOne(
      { id: summoner.id },
      { $set: summonerObj },
      { upsert: true },
      (err, result) => {
        if (err) {
          console.log(chalk.redBright("DB ERROR"), err);
          throw err;
        }
        console.log(
          chalk.greenBright("WEBSERVER DB SUCCESS"),
          "Summoner data updated"
        );
        console.log(chalk.greenBright("WEBSERVER DB SUCCESS"), result);
      }
    );
  }

  db.findOne({ name: data.name }, async function (err, result) {
    if (err) return console.log(chalk.redBright("MONGO ERROR"), err);
    if (result == null) {
      client.channels.cache
        .get(config.testChannelId)
        .send("MongoDB 404: Summoner not found, fetching from API");
      const summoner = await rAPI.summoner.getBySummonerName({
        region: region,
        summonerName: data.name,
      });

      const summonerObj = {
        name: summoner.name,
        id: summoner.id,
        accountId: summoner.accountId,
        puuid: summoner.puuid,
        profileIconId: summoner.profileIconId,
        summonerLevel: summoner.summonerLevel,
        revisionDate: summoner.revisionDate,
        refreshDate: Date.now(),
      };

      db.insertOne(summonerObj, function (err) {
        if (err) return console.log(chalk.redBright("WEBSERVER DB ERROR"), err);
        console.log(
          chalk.greenBright("WEBSERVER DB SUCCESS"),
          "Inserted summoner into database"
        );
      });
      return res.json(summonerObj);
    } else {
      if (result.refreshDate + 259200 < Date.now()) {
        console.log(
          chalk.yellowBright("WEBSERVER DB WARNING"),
          "Summoner found in database, but is outdated, fetching from API"
        );
        console.log(chalk.bgGray("OLD REFRESH DATE"), result.refreshDate);
        console.log(chalk.bgGray("CURRENT REFRESH DATE"), Date.now());
        console.log(
          chalk.bgGray("CALCULATED REFRESH DATE"),
          result.refreshDate + 3600000 < Date.now()
        );

        updateSummoner();
      }
      return res.json(result);
    }
  });
});

app.post("/addRating", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  const data = req.body;

  if (data.puuid == undefined) {
    return res.status(400).send("No name provided");
  }
  if (data.region == undefined) {
    return res.status(400).send("No region provided");
  }

  const db = mongoClient.db("rating").collection(data.region);

  db.findOne(
    { puuid: data.puuid, author_puuid: data.author_puuid },
    async function (err, result) {
      if (err) return console.log(chalk.redBright("MONGO ERROR"), err);
      if (result != null) {
        return res.status(400).send("Rating already exists");
      }
    }
  );

  const ratingObj = {
    puuid: data.puuid,
    author_puuid: data.author_puuid,
    rating: data.rating,
    comment: data.comment ? data.comment : "",
    attachments: data.attachments ? data.attachments : [],
    submitDate: Date.now(),
  };

  db.insertOne(ratingObj, function (err) {
    if (err) return console.log(chalk.redBright("WEBSERVER DB ERROR"), err);
    console.log(
      chalk.greenBright("WEBSERVER DB SUCCESS"),
      "Inserted rating into database"
    );
    return res.status(200).send("Rating added");
  });
});

app.post("/verifyIcon", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  let region;
  const data = req.body;

  if (data.summonerName == undefined) {
    return res.status(400).send("No name provided");
  }

  if (data.summonerRegion == undefined) {
    return res.status(400).send("No region provided");
  } else if (data.summonerRegion == "eune") {
    region = PlatformId.EUNE1;
  } else if (data.summonerRegion == "euw") {
    region = PlatformId.EUW1;
  } else if (data.summonerRegion == "na") {
    region = PlatformId.NA1;
  }

  if (data.desiredIconId == undefined) {
    return res.status(400).send("No desired icon ID provided");
  }

  const summoner = await rAPI.summoner.getBySummonerName({
    region: region,
    summonerName: data.summonerName,
  });
  if (summoner.profileIconId == data.desiredIconId) {
    return res.status(200).send("Icon verified");
  } else {
    return res
      .status(400)
      .send(
        "Icon not verified. Got " +
          summoner.profileIconId +
          ", expected " +
          data.desiredIconId
      );
  }
});

// Youtube
const Notifier = require("@daangamesdg/youtube-notifications");

const notifier = new Notifier({
  hubCallback: "https://api.gangsloni.com/youtube/callback",
  middleware: true,
  secret: "gangsloni",
  path: "/youtube",
});

notifier.on("notified", (data) => {
  console.log(chalk.green("YOUTUBE INFO"), "New video: " + data.video.title);
  console.log(chalk.green("YOUTUBE INFO"), "Channel: " + data.channel.name);
  const guild = client.guilds.cache.get("943590896820162591");
  const channel = guild.channels.cache.get("943604581265461279");
  channel.send(data.video.link);
});

notifier.subscribe("mewobeats_");
